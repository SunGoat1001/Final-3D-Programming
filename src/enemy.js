import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { killFeed } from './ui/killFeedInstance.js';

let enemyMesh = null;
let enemyBody = null;
let enemyHealth = 100;

// Create enemy on module load
const enemyGeometry = new THREE.BoxGeometry(2, 3, 2);
const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
enemyMesh.position.set(0, 1.5, -20);
enemyMesh.castShadow = true;
scene.add(enemyMesh);

const enemyShape = new CANNON.Box(new CANNON.Vec3(1, 1.5, 1));
enemyBody = new CANNON.Body({
    mass: 50,
    material: defaultMaterial,
    linearDamping: 0.9
});
enemyBody.addShape(enemyShape);
enemyBody.position.copy(enemyMesh.position);
world.addBody(enemyBody);

// Collision listener for bullets
// Removed physics collision-driven damage; damage is applied via raycast in shooting.js

export function updateEnemy() {
    if (enemyMesh && enemyBody) {
        enemyMesh.position.copy(enemyBody.position);
        enemyMesh.quaternion.copy(enemyBody.quaternion);
    }
}

export function hitEnemy(damage, weaponId = 'rifle') {
    if (enemyHealth <= 0) return false;

    enemyHealth -= damage;
    console.log('Enemy hit! Health:', enemyHealth);

    let killed = false;

    if (enemyHealth <= 0) {
        enemyHealth = 0;
        console.log('Enemy defeated!');

        killFeed.addKill('Player', 'Enemy', weaponId);
        killed = true;
    }

    // Flash on hit
    if (enemyMesh) {
        const originalColor = enemyMesh.material.color.getHex();
        enemyMesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            if (enemyMesh && enemyHealth > 0) {
                enemyMesh.material.color.setHex(originalColor);
            }
        }, 50);
    }

    return killed;
}

// ===========================
// GETTERS
// ===========================
export function getEnemyHealth() {
    return enemyHealth;
}

export function getEnemyMesh() {
    return enemyMesh;
}
