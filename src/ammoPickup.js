import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';

/**
 * List of active ammo pickups
 */
const ammoPickups = [];

/**
 * Create an ammo pickup box
 * @param {THREE.Vector3} position
 * @param {Object} options
 *  - weaponId: 'RIFLE' | 'SHOTGUN' | null (null = current weapon)
 *  - amount: number
 */
export function spawnAmmoPickup(position, options = {}) {
    const {
        weaponId = null,
        amount = 30
    } = options;

    // ===== VISUAL =====
    const geometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x003300
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    scene.add(mesh);

    // ===== PHYSICS =====
    const shape = new CANNON.Box(new CANNON.Vec3(0.2, 0.15, 0.15));
    const body = new CANNON.Body({
        mass: 0, // static
        shape,
        material: defaultMaterial,
        collisionResponse: false // don't block player
    });

    body.position.set(position.x, position.y, position.z);
    world.addBody(body);

    ammoPickups.push({
        mesh,
        body,
        weaponId,
        amount,
        collected: false
    });
}

/**
 * Update ammo pickups (call every frame)
 * @param {CANNON.Body} playerBody
 * @param {WeaponManager} weaponManager
 */
export function updateAmmoPickups(playerBody, weaponManager) {
    for (let i = ammoPickups.length - 1; i >= 0; i--) {
        const pickup = ammoPickups[i];
        if (pickup.collected) continue;

        // Simple distance check
        const dx = pickup.body.position.x - playerBody.position.x;
        const dy = pickup.body.position.y - playerBody.position.y;
        const dz = pickup.body.position.z - playerBody.position.z;

        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 1.2 * 1.2) {
            // ===== COLLECT =====
            pickup.collected = true;

            // Add ammo
            weaponManager.addAmmo(pickup.weaponId, pickup.amount);

            console.log(
                `[Pickup] +${pickup.amount} ammo for ${pickup.weaponId || 'current weapon'}`
            );

            // Remove from scene & physics
            scene.remove(pickup.mesh);
            world.removeBody(pickup.body);

            pickup.mesh.geometry.dispose();
            pickup.mesh.material.dispose();

            ammoPickups.splice(i, 1);
        } else {
            // Small rotation for visual effect
            pickup.mesh.rotation.y += 0.02;
        }
    }
}
