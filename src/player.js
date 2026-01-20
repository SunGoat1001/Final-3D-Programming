import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { HealthBar } from './ui/HealthBar.js';
import { PLAYER_RADIUS, PLAYER_MASS, PLAYER_START_POSITION, PLAYER_INITIAL_HEALTH } from './constants.js';

let health = PLAYER_INITIAL_HEALTH;
const maxHealth = PLAYER_INITIAL_HEALTH;

let onHealthChangeCallback = null;

const healthBarUI = new HealthBar();
const deathScreen = document.getElementById('death-screen');
const deathButton = deathScreen ? deathScreen.querySelector('p') : null;

let playerBody = null;
let playerMesh = null;
let isDead = false;
let currentSpawnPoint = { ...PLAYER_START_POSITION };

export function setSpawnPoint(pos) {
    currentSpawnPoint = { ...pos };
}

export function setOnHealthChange(callback) {
    onHealthChangeCallback = callback;
}

if (deathButton) {
    deathButton.addEventListener('click', (e) => {
        e.stopPropagation();
        respawn();
    });
}

/**
 * Create the player physics body as a sphere
 * Following the voxel shooter pattern
 */
export function createPlayerBody() {
    const sphereShape = new CANNON.Sphere(PLAYER_RADIUS);

    const sphereBody = new CANNON.Body({
        mass: PLAYER_MASS,
        material: defaultMaterial,
        linearDamping: 0.9,  // Air resistance
        shape: sphereShape
    });

    sphereBody.position.set(
        currentSpawnPoint.x,
        currentSpawnPoint.y,
        currentSpawnPoint.z
    );

    world.addBody(sphereBody);
    playerBody = sphereBody; // Store reference

    // Create Player Mesh (Hitbox for incoming bullets)
    // Using Capsule to represent human standing up
    // Radius 0.5, Height 1.0 (Total ~2.0m tall with end caps)
    const playerGeometry = new THREE.CapsuleGeometry(PLAYER_RADIUS * 0.6, 1.0, 4, 8);
    // Invisible but raycastable
    const playerMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000, // Blue for debug (or invisible)
        // transparent: true,
        // opacity: 0.0, // Invisible
        // wireframe: false
    });
    playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    playerMesh.position.copy(sphereBody.position);
    scene.add(playerMesh);

    return sphereBody;
}

export function updatePlayer() {
    if (playerBody && playerMesh) {
        playerMesh.position.copy(playerBody.position);
        // Keep mesh upright (capsule is vertical Y-axis aligned)
        // Offset Y slightly if needed to match visual ground contact
        // For now, center it on the physics body
        playerMesh.rotation.set(0, 0, 0);
    }
}

export function getPlayerMesh() {
    return playerMesh;
}

export function getHealth() {
    return health;
}

export function getPlayerPosition() {
    return playerBody ? playerBody.position : { x: 0, y: 0, z: 0 };
}

export function takeDamage(amount) {
    if (isDead) return;

    health = Math.max(0, health - amount);
    updateHealthUI();
    if (onHealthChangeCallback) onHealthChangeCallback(health);

    if (health <= 0) {
        die();
    }
}

function die() {
    isDead = true;
    console.log("Player Died");

    // Unlock pointer
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    // Show death screen
    if (deathScreen) {
        deathScreen.style.display = 'flex';
    }
}

export function respawn() {
    if (!playerBody) return;

    // Reset health
    health = PLAYER_INITIAL_HEALTH;
    updateHealthUI();
    if (onHealthChangeCallback) onHealthChangeCallback(health);
    isDead = false;

    // Reset position and velocity
    playerBody.position.set(
        currentSpawnPoint.x,
        currentSpawnPoint.y,
        currentSpawnPoint.z
    );
    playerBody.velocity.set(0, 0, 0);
    playerBody.angularVelocity.set(0, 0, 0);

    // Hide death screen
    if (deathScreen) {
        deathScreen.style.display = 'none';
    }

    // Request pointer lock
    document.body.requestPointerLock();
}

export function updateHealthUI() {
    healthBarUI.update(health, maxHealth);
}

// Initial UI update
updateHealthUI();

