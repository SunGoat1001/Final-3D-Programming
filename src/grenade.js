import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { getEnemyMesh, hitEnemy } from './enemy.js';

const grenades = [];

export function throwGrenade(origin, direction, power = 15) {
    // Mesh
    const geo = new THREE.SphereGeometry(0.15, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x225522 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    scene.add(mesh);

    // Physics body
    const shape = new CANNON.Sphere(0.15);
    const body = new CANNON.Body({
        mass: 1,
        shape,
        material: defaultMaterial
    });

    body.position.set(origin.x, origin.y, origin.z);

    // Throw impulse
    body.velocity.set(
        direction.x * power,
        direction.y * power + 4,
        direction.z * power
    );

    world.addBody(body);

    grenades.push({
        mesh,
        body,
        timer: 2.5,
        exploded: false
    });
}

export function updateGrenades(deltaTime) {
    for (let i = grenades.length - 1; i >= 0; i--) {
        const g = grenades[i];

        g.mesh.position.copy(g.body.position);
        g.mesh.quaternion.copy(g.body.quaternion);

        g.timer -= deltaTime;
        if (g.timer <= 0 && !g.exploded) {
            explode(g, i);
        }
    }
}

function explode(grenade, index) {
    grenade.exploded = true;

    const pos = grenade.body.position;
    const radius = 6;
    const maxDamage = 150;

    // Visual
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xff5522,
        transparent: true,
        opacity: 0.4
    });
    const boom = new THREE.Mesh(geo, mat);
    boom.position.copy(pos);
    scene.add(boom);

    setTimeout(() => {
        scene.remove(boom);
        boom.geometry.dispose();
        boom.material.dispose();
    }, 200);

    // Damage enemy
    const enemy = getEnemyMesh();
    if (enemy) {
        const d = enemy.position.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z));
        if (d < radius) {
            const dmg = maxDamage * (1 - d / radius);
            hitEnemy(dmg);
            console.log(`[Grenade] Hit enemy for ${dmg.toFixed(1)}`);
        }
    }

    // Cleanup grenade
    scene.remove(grenade.mesh);
    world.removeBody(grenade.body);
    grenades.splice(index, 1);
}
