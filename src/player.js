import * as CANNON from 'cannon-es';
import { world, defaultMaterial } from './physics.js';
import { HealthBar } from './ui/HealthBar.js';
import { PLAYER_RADIUS, PLAYER_MASS, PLAYER_START_POSITION, PLAYER_INITIAL_HEALTH } from './constants.js';

let health = PLAYER_INITIAL_HEALTH;
const maxHealth = PLAYER_INITIAL_HEALTH;

const healthBarUI = new HealthBar();
const deathScreen = document.getElementById('death-screen');
const deathButton = deathScreen ? deathScreen.querySelector('p') : null;

let playerBody = null;
let isDead = false;

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
        PLAYER_START_POSITION.x,
        PLAYER_START_POSITION.y,
        PLAYER_START_POSITION.z
    );

    world.addBody(sphereBody);
    playerBody = sphereBody; // Store reference

    return sphereBody;
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
    isDead = false;

    // Reset position and velocity
    playerBody.position.set(
        PLAYER_START_POSITION.x,
        PLAYER_START_POSITION.y,
        PLAYER_START_POSITION.z
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

