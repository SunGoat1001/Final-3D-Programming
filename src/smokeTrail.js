import * as THREE from 'three';
import { scene } from './scene.js';

const smokeParticles = []; // pool
const maxParticles = 100;

const smokeGeometry = new THREE.PlaneGeometry(0.2, 0.2);
const smokeTexture = new THREE.TextureLoader().load('textures/muzzleFlash.png'); // bạn có thể dùng 1 texture smoke
const smokeMaterial = new THREE.MeshBasicMaterial({
    map: smokeTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
});

export function spawnSmoke(position) {
    let particle;
    if (smokeParticles.length < maxParticles) {
        particle = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
        scene.add(particle);
        smokeParticles.push(particle);
    } else {
        // Reuse oldest particle
        particle = smokeParticles.shift();
        smokeParticles.push(particle);
    }

    particle.position.copy(position);
    particle.scale.set(0.2, 0.2, 0.2);
    particle.rotation.z = Math.random() * Math.PI * 2;
    particle.userData = { life: 1}; // life in seconds
}

export function updateSmoke(deltaTime) {
    smokeParticles.forEach(p => {
        if (!p.userData) return;

        p.userData.life -= deltaTime;
        if (p.userData.life <= 0) {
            p.visible = false;
        } else {
            p.visible = true;
            p.position.y += deltaTime * 0.2; // smoke rises
            const scale = p.userData.life; // fade out by scale
            p.scale.set(scale, scale, scale);
            p.material.opacity = 0.5 * scale;
        }
    });
}
