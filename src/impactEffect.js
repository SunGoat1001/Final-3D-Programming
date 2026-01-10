import * as THREE from 'three';
import { scene } from './scene.js';

/**
 * Spawn impact effect at hit point
 * @param {THREE.Vector3} point
 * @param {THREE.Vector3} normal
 * @param {'wall'|'enemy'} type
 */
export function spawnImpactEffect(point, normal, type = 'wall') {
    const count = type === 'enemy' ? 12 : 8;
    const color = type === 'enemy' ? 0xff3333 : 0xffffaa;

    const particles = [];

    for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(type === 'enemy' ? 0.04 : 0.03, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1
        });

        const p = new THREE.Mesh(geo, mat);
        p.position.copy(point);

        const dir = new THREE.Vector3(
            normal.x + (Math.random() - 0.5),
            normal.y + (Math.random() - 0.5),
            normal.z + (Math.random() - 0.5)
        ).normalize();

        p.userData.velocity = dir.multiplyScalar(Math.random() * 2 + 1);

        scene.add(p);
        particles.push(p);
    }

    const start = performance.now();

    function animate() {
        const t = (performance.now() - start) / 400;

        if (t >= 1) {
            particles.forEach(p => {
                scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
            });
            return;
        }

        particles.forEach(p => {
            p.position.add(p.userData.velocity.clone().multiplyScalar(0.03));
            p.userData.velocity.y -= 0.05;
            p.material.opacity = 1 - t;
            p.scale.setScalar(1 - t * 0.5);
        });

        requestAnimationFrame(animate);
    }

    animate();
}
