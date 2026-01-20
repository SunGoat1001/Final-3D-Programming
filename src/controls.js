import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
    MOUSE_SENSITIVITY,
    JUMP_VELOCITY,
    MOVE_FORCE_MULTIPLIER,
    MOVE_TORQUE_MULTIPLIER,
    SPRINT_MULTIPLIER,
    CROUCH_MULTIPLIER,
    STANDING_HEIGHT,
    CROUCHING_HEIGHT,
    CROUCH_SPEED
} from './constants.js';
import { setMoveAmount } from './crosshair.js';
import { playFootstepWalk, playFootstepSprint, stopFootsteps } from './audio.js';

const WALK_STEP_INTERVAL = 0.45;
const SPRINT_STEP_INTERVAL = 0.28;

/**
 * PointerLockControlsCannon
 * Based on the voxel shooter example - handles pointer lock, WASD movement, jumping, and mouse look.
 */
export class PointerLockControlsCannon {
    constructor(camera, sphereBody) {
        _controlsInstance = this;
        this.camera = camera;
        this.sphereBody = sphereBody;

        // Sway state (accumulates mouse movement)
        this.swayDelta = { x: 0, y: 0 };

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.isMouseDown = false;

        // Shooting callback
        this.onShoot = null;

        // Aim state
        this.isAiming = false;

        // Control state
        this.enabled = false; // Disabled by default until game starts

        this.targetFOV = 75;
        this.currentFOV = 75;

        // Move speed multiplier
        this.moveSpeedMultiplier = 1.0;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isThirdPerson = false;
        this.currentCameraYOffset = STANDING_HEIGHT;

        // Euler for camera rotation
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

        // Velocity for input-based movement
        this.inputVelocity = new THREE.Vector3();

        // Footstep sound timer
        this.footstepTimer = 0;
        // Contact normal to detect if on ground
        this.contactNormal = new CANNON.Vec3();
        this.upAxis = new CANNON.Vec3(0, 1, 0);

        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onPointerlockChange = this.onPointerlockChange.bind(this);
        this.onPointerlockError = this.onPointerlockError.bind(this);

        // Setup contact detection for jumping
        this.sphereBody.addEventListener('collide', (event) => {
            const contact = event.contact;

            // Check if we're on the ground (contact normal points up)
            if (contact.bi.id === this.sphereBody.id) {
                contact.ni.negate(this.contactNormal);
            } else {
                this.contactNormal.copy(contact.ni);
            }

            // If contact normal is pointing up, we can jump
            if (this.contactNormal.dot(this.upAxis) > 0.5) {
                this.canJump = true;
            }
        });

        this.connect();
    }

    connect() {
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('pointerlockchange', this.onPointerlockChange);
        document.addEventListener('pointerlockerror', this.onPointerlockError);

        // Click to request pointer lock
        document.body.addEventListener('click', () => {
            if (this.enabled && !this.isLocked()) {
                document.body.requestPointerLock();
            }
        });
    }

    disconnect() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('pointerlockchange', this.onPointerlockChange);
        document.removeEventListener('pointerlockerror', this.onPointerlockError);
    }

    onMouseMove(event) {
        if (!this.isLocked()) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Accumulate for weapon sway
        this.swayDelta.x += movementX;
        this.swayDelta.y += movementY;

        // Use reduced sensitivity when aiming
        const sensitivity = this.isAiming ? 0.001 : MOUSE_SENSITIVITY;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * sensitivity;
        this.euler.x -= movementY * sensitivity;

        // Clamp pitch
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.camera.quaternion.setFromEuler(this.euler);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.sphereBody.velocity.y = JUMP_VELOCITY;
                }
                this.canJump = false;
                break;
            case 'ShiftLeft':
                this.isSprinting = true;
                break;
            case 'KeyC':
                this.isCrouching = !this.isCrouching;
                break;
            case 'KeyK':
                this.isThirdPerson = !this.isThirdPerson;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
                this.isSprinting = false;
                break;
        }
    }

    onMouseDown(event) {
        if (!this.isLocked()) return;

        if (event.button === 0) {
            this.isMouseDown = true;
            if (this.onShoot) {
                this.onShoot();
            }
        } else if (event.button === 2) {
            // Right click to aim/zoom
            this.isAiming = true;
            this.targetFOV = 45;
        }
    }

    onMouseUp(event) {
        if (event.button === 0) {
            this.isMouseDown = false;
        }

        if (event.button === 2) {
            // Right click released
            this.isAiming = false;
            this.targetFOV = 75;
        }
    }

    onPointerlockChange() {
        const instructions = document.getElementById('instructions');
        if (document.pointerLockElement === document.body) {
            console.log('Pointer locked');
            if (instructions) {
                instructions.style.display = 'none';
            }
        } else {
            console.log('Pointer unlocked');
            if (instructions) {
                instructions.style.display = 'block';
            }
        }
    }

    onPointerlockError() {
        console.error('Pointer lock error');
    }

    isLocked() {
        return document.pointerLockElement === document.body;
    }

    /**
     * Update the controls - applies forces based on input
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.enabled || !this.isLocked()) return;

        // Calculate input velocity based on camera direction (yaw only)
        this.inputVelocity.set(0, 0, 0);

        if (this.moveForward) {
            this.inputVelocity.z += 1;
        }
        if (this.moveBackward) {
            this.inputVelocity.z -= 1;
        }
        if (this.moveLeft) {
            this.inputVelocity.x -= 1;
        }
        if (this.moveRight) {
            this.inputVelocity.x += 1;
        }

        // Normalize input and apply to world space
        if (this.inputVelocity.lengthSq() > 0) {
            this.inputVelocity.normalize();

            // Get camera direction (yaw only, no pitch)
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(this.camera.quaternion);
            const yaw = euler.y;

            // Transform to world space
            const forward = new THREE.Vector3(0, 0, -1);
            const right = new THREE.Vector3(1, 0, 0);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
            right.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

            const worldVelocity = new THREE.Vector3();
            worldVelocity.addScaledVector(forward, this.inputVelocity.z);
            worldVelocity.addScaledVector(right, this.inputVelocity.x);

            // Calculate state multiplier (sprint/crouch)
            let stateMultiplier = 1.0;
            if (this.isCrouching) {
                stateMultiplier = CROUCH_MULTIPLIER;
            } else if (this.isSprinting) {
                stateMultiplier = SPRINT_MULTIPLIER;
            }


            // Apply force to sphere body (force-based movement)
            const finalForceMultiplier = MOVE_FORCE_MULTIPLIER * this.moveSpeedMultiplier * stateMultiplier;
            const force = new CANNON.Vec3(
                worldVelocity.x * this.sphereBody.mass * finalForceMultiplier,
                0,
                worldVelocity.z * this.sphereBody.mass * finalForceMultiplier
            );
            this.sphereBody.applyForce(force);

            // Add a rolling torque so the sphere can drive up slopes instead of sliding
            const torqueDir = new CANNON.Vec3(worldVelocity.x, 0, worldVelocity.z);
            if (torqueDir.lengthSquared()) {
                torqueDir.normalize();
                const torque = new CANNON.Vec3();
                this.upAxis.cross(torqueDir, torque);
                const radius = this.sphereBody.shapes[0]?.radius || 1;
                const torqueStrength = finalForceMultiplier * this.sphereBody.mass * radius * MOVE_TORQUE_MULTIPLIER;
                torque.scale(torqueStrength, torque);
                this.sphereBody.torque.vadd(torque, this.sphereBody.torque);
            }
        }
        // Interpolate FOV for smooth zoom
        const fovDiff = this.targetFOV - this.currentFOV;
        if (Math.abs(fovDiff) > 0.1) {
            this.currentFOV += fovDiff * 0.1;  // Smooth interpolation
            this.camera.fov = this.currentFOV;
            this.camera.updateProjectionMatrix();
        } else if (this.currentFOV !== this.targetFOV) {
            this.currentFOV = this.targetFOV;
            this.camera.fov = this.currentFOV;
            this.camera.updateProjectionMatrix();
        }

        // Interpolate camera height for crouching
        const targetYOffset = this.isCrouching ? CROUCHING_HEIGHT : STANDING_HEIGHT;
        const yDiff = targetYOffset - this.currentCameraYOffset;
        if (Math.abs(yDiff) > 0.01) {
            this.currentCameraYOffset += yDiff * CROUCH_SPEED;
        } else {
            this.currentCameraYOffset = targetYOffset;
        }

        // Sync camera position to sphere body
        if (this.isThirdPerson) {
            // 3rd Person Camera Logic
            const yaw = this.euler.y;
            const pitch = this.euler.x;

            // Offset: Back 3m, Up 1.5m, Right 0.5m (over shoulder)
            const dist = 3.0;

            // Calculate offset vector based on yaw/pitch
            // Simple orbit:
            const offsetX = Math.sin(yaw) * dist;
            const offsetZ = Math.cos(yaw) * dist;
            const offsetY = Math.sin(pitch) * dist * 0.5; // Slight pitch influence

            this.camera.position.x = this.sphereBody.position.x + offsetX;
            this.camera.position.z = this.sphereBody.position.z + offsetZ;
            this.camera.position.y = this.sphereBody.position.y + 2.0 - offsetY; // Look down from above?

            // Actually, standard 3rd person: Camera is BEHIND.
            // If Yaw 0 = Looking -Z.
            // Behind = +Z.
            // So if Yaw=0, we want +Z offset.
            // Math.sin(0) = 0. Math.cos(0) = 1. -> +Z. Correct.

            this.camera.lookAt(
                this.sphereBody.position.x,
                this.sphereBody.position.y + 1.0, // Look at head/chest
                this.sphereBody.position.z
            );
        } else {
            // 1st Person Logic
            this.camera.position.copy(this.sphereBody.position);
            this.camera.position.y += this.currentCameraYOffset;
        }

        // Movement amount for crosshair
        const horizontalSpeed = Math.sqrt(
            this.sphereBody.velocity.x * this.sphereBody.velocity.x +
            this.sphereBody.velocity.z * this.sphereBody.velocity.z
        );

        // Normalize ~ 0 → 1
        const move01 = Math.min(horizontalSpeed / 6, 1);
        setMoveAmount(move01);
        // ================= FOOTSTEP SYSTEM =================

        // Check moving on ground
        const isMoving = horizontalSpeed > 0.2 && this.canJump && !this.isCrouching;

        if (!isMoving) {
            stopFootsteps();
        } else {
            if (this.isSprinting) {
                playFootstepSprint();
            } else {
                playFootstepWalk();
            }
        }


    }

    /**
     * Get accumulated mouse movement for weapon sway and reset it
     * @returns {Object} { x, y }
     */
    getSwayDelta() {
        const delta = { ...this.swayDelta };
        this.swayDelta.x = 0;
        this.swayDelta.y = 0;
        return delta;
    }
}
let _controlsInstance = null;

export function getControls() {
    return _controlsInstance;
}


