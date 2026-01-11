import * as THREE from 'three';
import { scene } from './scene.js';

const flashes = [];

// Simple texture-less cone flash
const geometry = new THREE.ConeGeometry(0.06, 0.5, 8);
const material = new THREE.MeshBasicMaterial({
    color: 0xffcc55,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
});

export function spawnMuzzleFlash(position, direction, scale = 1) {
    const flash = new THREE.Mesh(geometry, material.clone());

    flash.position.copy(position);

    // Orient forward
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
    );
    flash.quaternion.copy(quat);

    // Random rotate
    flash.rotateY(Math.random() * Math.PI * 2);

    // Random scale
    const s = scale * (0.8 + Math.random() * 0.4);
    flash.scale.set(s, s, s);

    scene.add(flash);

    // Light flash
    const light = new THREE.PointLight(0xffaa33, 2, 3);
    light.position.copy(position);
    scene.add(light);

    flashes.push({
        mesh: flash,
        light: light,
        life: 0.05 // 50ms
    });
}

export function updateMuzzleFlashes(dt) {
    for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= dt;

        if (f.life <= 0) {
            scene.remove(f.mesh);
            scene.remove(f.light);
            f.mesh.geometry.dispose();
            f.mesh.material.dispose();
            flashes.splice(i, 1);
        }
    }
}
