import './style.css';
import * as THREE from 'three';

// ===========================
// MODULE IMPORTS
// ===========================
import { scene, camera, renderer } from './scene.js';
import { world } from './physics.js';
import { createPlayerBody, updateHealthUI } from './player.js';
import { PointerLockControlsCannon } from './controls.js';
import { FIXED_TIME_STEP, MAX_SUB_STEPS } from './constants.js';
import { processShot, updateBullets } from './shooting.js';
import { initObstacles } from './obstacles.js';
import { updateEnemy } from './enemy.js';

// Weapon System
import { WeaponManager } from './weapons/WeaponManager.js';
import { WeaponUI } from './weapons/WeaponUI.js';
import { spawnAmmoPickup, updateAmmoPickups } from './ammoPickup.js';
import { updateGrenades } from './grenade.js';
import { updateRockets } from './rocket.js';
import { startScreenShake, updateScreenShake } from './screenShake.js';
import { initHitmarker } from './hitmarker.js';
import { updateCrosshair } from './crosshair.js';
import { updateMuzzleFlashes } from './muzzleFlash.js';
import './ui/killFeedInstance.js';

// Multiplayer
import { networkManager } from './NetworkManager.js';
import { setNetworkManager } from './shooting.js';
import { getPlayerPosition } from './player.js';

// Setup network manager for shooting
setNetworkManager(networkManager);

// Global camera reference for remote players
window.camera = camera;

// ===========================
// PHYSICS SETUP
// ===========================
// Already initialized in physics.js - world, ground, materials

// ===========================
// OBSTACLES & ENEMY
// ===========================
initObstacles();

initHitmarker();
// ===========================
// PLAYER BODY
// ===========================
const sphereBody = createPlayerBody();
updateHealthUI();
// ===========================
// AMMO PICKUPS
// ===========================
spawnAmmoPickup(new THREE.Vector3(2, 0.5, -5), { weaponId: 'RIFLE', amount: 60 });
spawnAmmoPickup(new THREE.Vector3(-3, 0.5, -8), { weaponId: 'SHOTGUN', amount: 12 });
spawnAmmoPickup(new THREE.Vector3(0, 0.5, -12), { weaponId: null, amount: 30 }); // current weapon

// ===========================
// POINTER LOCK CONTROLS
// ===========================
const controls = new PointerLockControlsCannon(camera, sphereBody);

// ===========================
// WEAPON SYSTEM
// ===========================
const weaponManager = new WeaponManager(camera);
const weaponUI = new WeaponUI();

// Set up weapon callbacks
weaponManager.onShootCallback = (shotData) => {
    processShot(shotData);
};

weaponManager.onWeaponSwitch = (weapon, ammoState) => {
    weaponUI.updateWeaponInfo(weaponManager.getWeaponInfo());
    console.log(`Switched to ${weapon.name}`);
};

weaponManager.onAmmoChange = (ammoState) => {
    weaponUI.updateWeaponInfo(weaponManager.getWeaponInfo());
};

weaponManager.onReloadStart = (reloadTime) => {
    console.log(`Reloading... (${reloadTime}s)`);
};

weaponManager.onReloadEnd = () => {
    weaponUI.hideReload();
    weaponUI.updateWeaponInfo(weaponManager.getWeaponInfo());
};

weaponManager.onCharacterLoaded = (name) => {
    weaponUI.showCharacterLoaded(name);
};

// Initial UI update
weaponUI.updateWeaponInfo(weaponManager.getWeaponInfo());

// ===========================
// MULTIPLAYER CONNECTION
// ===========================
networkManager.connect('http://localhost:3001');

// Sync weapon changes to network
weaponManager.onWeaponSwitch = (weapon, ammoState) => {
    weaponUI.updateWeaponInfo(weaponManager.getWeaponInfo());
    console.log(`Switched to ${weapon.name}`);
    networkManager.changeWeapon(weapon.id);
};

// Set shoot callback - now handled in animate for Auto, and here for Single
controls.onShoot = () => {
    // Only handle initial shot here. 
    // For AUTO mode, continuous shots are handled in the animate loop.
    handleShooting();
};

/**
 * Handle shooting logic based on input and fire mode
 */
function handleShooting() {
    const shot = weaponManager.tryShoot();
    if (shot) {
        startScreenShake(0.08, 0.1);
    }
}

// ===========================
// SCENE SETUP
// ===========================
document.querySelector('#app').appendChild(renderer.domElement);

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===========================
// ANIMATION LOOP
// ===========================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    updateMuzzleFlashes(deltaTime)
    // Get move speed multiplier from current weapon
    const weaponInfo = weaponManager.getHighlightInfo ? weaponManager.getHighlightInfo() : weaponManager.getWeaponInfo();
    controls.moveSpeedMultiplier = weaponInfo.moveSpeedMultiplier || 1.0;

    // Update controls (applies forces to sphere body)
    controls.update(deltaTime);
    // Update crosshair dynamic
    updateCrosshair(deltaTime);
    // Update weapon manager (handles reload, weapon position)
    weaponManager.update(deltaTime);

    // Handle automatic firing
    if (controls.isMouseDown && weaponManager.currentWeapon.fireMode === 'AUTO') {
        handleShooting();
    }

    //Update Grenades
    updateGrenades(deltaTime);
    //Update Rockets
    updateRockets(deltaTime);
    //Screen shake
    updateScreenShake(camera, deltaTime);


    // Update reload UI
    if (weaponManager.isReloading) {
        weaponUI.showReloadProgress(weaponManager.reloadProgress);
    }

    // Step physics world first
    world.step(FIXED_TIME_STEP, deltaTime, MAX_SUB_STEPS);

    // Update bullets using latest physics positions
    updateBullets(deltaTime);

    // Update enemy visual sync
    updateEnemy();
    // Update ammo pickups
    updateAmmoPickups(sphereBody, weaponManager);

    // ===========================
    // MULTIPLAYER UPDATE
    // ===========================
    // Send local player position to network
    const playerPos = getPlayerPosition();
    camera.getWorldDirection(new THREE.Vector3()); // Update direction
    
    networkManager.updateLocalPlayer({
        position: {
            x: playerPos.x,
            y: playerPos.y,
            z: playerPos.z
        },
        rotation: {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z
        },
        bodyRotation: sphereBody.quaternion.y || 0,
        currentWeapon: weaponManager.currentWeapon.id,
        weaponState: {
            isAiming: weaponManager.isAiming || false,
            isShooting: controls.isMouseDown || false
        },
        characterName: weaponManager.characterName || 'messi',
        modelLoaded: weaponManager.model != null
    });
    
    // Update remote players
    networkManager.update(deltaTime);

    // Render scene
    renderer.render(scene, camera);
}

// ===========================
// START
// ===========================
animate();

// Log controls help
console.log('=== FPS Controls ===');
console.log('WASD - Move');
console.log('Space - Jump');
console.log('Left Click - Shoot');
console.log('Right Click - Aim');
console.log('1/2/3/4/5 - Switch Weapon');
console.log('R - Reload');
console.log('====================');
