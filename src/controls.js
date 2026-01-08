import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { MOUSE_SENSITIVITY, JUMP_VELOCITY, MOVE_FORCE_MULTIPLIER } from './constants.js';

/**
 * PointerLockControlsCannon
 * Based on the voxel shooter example - handles pointer lock, WASD movement, jumping, and mouse look.
 */
export class PointerLockControlsCannon {
    constructor(camera, sphereBody) {
        this.camera = camera;
        this.sphereBody = sphereBody;

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        // Shooting callback
        this.onShoot = null;

        // Euler for camera rotation
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

        // Velocity for input-based movement
        this.inputVelocity = new THREE.Vector3();

        // Contact normal to detect if on ground
        this.contactNormal = new CANNON.Vec3();
        this.upAxis = new CANNON.Vec3(0, 1, 0);

        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
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
        document.addEventListener('pointerlockchange', this.onPointerlockChange);
        document.addEventListener('pointerlockerror', this.onPointerlockError);

        // Click to request pointer lock
        document.body.addEventListener('click', () => {
            if (!this.isLocked()) {
                document.body.requestPointerLock();
            }
        });
    }

    disconnect() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('pointerlockchange', this.onPointerlockChange);
        document.removeEventListener('pointerlockerror', this.onPointerlockError);
    }

    onMouseMove(event) {
        if (!this.isLocked()) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * MOUSE_SENSITIVITY;
        this.euler.x -= movementY * MOUSE_SENSITIVITY;

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
        }
    }

    onMouseDown(event) {
        if (!this.isLocked()) return;

        if (event.button === 0 && this.onShoot) {
            this.onShoot();
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
        if (!this.isLocked()) return;

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

            // Apply force to sphere body (force-based movement)
            const force = new CANNON.Vec3(
                worldVelocity.x * this.sphereBody.mass * MOVE_FORCE_MULTIPLIER,
                0,
                worldVelocity.z * this.sphereBody.mass * MOVE_FORCE_MULTIPLIER
            );
            this.sphereBody.applyForce(force);
        }

        // Sync camera position to sphere body
        this.camera.position.copy(this.sphereBody.position);
    }
}
