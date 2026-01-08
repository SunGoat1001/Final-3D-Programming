import './style.css';
import * as THREE from 'three';

// ===========================
// MODULE IMPORTS
// ===========================
import { scene, camera, renderer } from './scene.js';
import { world } from './physics.js';
import { createPlayerBody } from './player.js';
import { PointerLockControlsCannon } from './controls.js';
import { FIXED_TIME_STEP, MAX_SUB_STEPS } from './constants.js';
import { shoot, updateBullets } from './shooting.js';
import { initObstacles } from './obstacles.js';
import { updateEnemy } from './enemy.js';

// ===========================
// PHYSICS SETUP
// ===========================
// Already initialized in physics.js - world, ground, materials

// ===========================
// OBSTACLES & ENEMY
// ===========================
initObstacles();

// ===========================
// PLAYER BODY
// ===========================
const sphereBody = createPlayerBody();

// ===========================
// POINTER LOCK CONTROLS
// ===========================
const controls = new PointerLockControlsCannon(camera, sphereBody);

// Set shoot callback
controls.onShoot = () => {
    shoot(camera, sphereBody);
};

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

    // Update controls (applies forces to sphere body)
    controls.update(deltaTime);

    // Step physics world first
    world.step(FIXED_TIME_STEP, deltaTime, MAX_SUB_STEPS);

    // Update bullets using latest physics positions
    updateBullets(deltaTime);

    // Update enemy visual sync
    updateEnemy();

    // Render scene
    renderer.render(scene, camera);
}

// ===========================
// START
// ===========================
animate();
