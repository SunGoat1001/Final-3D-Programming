import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { BULLET_SPEED, BULLET_RADIUS } from './constants.js';
import { getObstaclesMeshes } from './obstacles.js';
import { getEnemyMesh, hitEnemy } from './enemy.js';

const bullets = [];

export function shoot(camera, sphereBody) {
    // Get shooting direction from camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Create bullet mesh
    const bulletGeometry = new THREE.SphereGeometry(BULLET_RADIUS, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Position bullet in front of camera
    bulletMesh.position.copy(camera.position);
    bulletMesh.position.add(direction.clone().multiplyScalar(1));
    scene.add(bulletMesh);

    // Create bullet physics body
    const bulletShape = new CANNON.Sphere(BULLET_RADIUS);
    const bulletBody = new CANNON.Body({
        mass: 0.05,
        shape: bulletShape,
        material: defaultMaterial,
        linearDamping: 0.01
    });

    bulletBody.position.copy(bulletMesh.position);

    // Set bullet velocity
    bulletBody.velocity.set(
        direction.x * BULLET_SPEED,
        direction.y * BULLET_SPEED,
        direction.z * BULLET_SPEED
    );

    world.addBody(bulletBody);

    bullets.push({
        mesh: bulletMesh,
        body: bulletBody,
        life: 3000,  // 3 seconds
        prev: bulletBody.position.clone()
    });
}

export function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Segment raycast from previous to current position to catch fast bullets
        const prev = bullet.prev;
        const curr = bullet.body.position;
        const segment = new THREE.Vector3(curr.x - prev.x, curr.y - prev.y, curr.z - prev.z);
        const distance = segment.length();
        if (distance > 0) {
            const dir = segment.clone().normalize();
            const raycaster = new THREE.Raycaster(
                new THREE.Vector3(prev.x, prev.y, prev.z),
                dir,
                0,
                distance
            );

            // Check obstacles first
            const obstacleHits = raycaster.intersectObjects(getObstaclesMeshes(), false);
            if (obstacleHits.length > 0) {
                // Remove bullet on obstacle hit
                scene.remove(bullet.mesh);
                world.removeBody(bullet.body);
                bullets.splice(i, 1);
                continue;
            }

            // Check enemy
            const enemyMesh = getEnemyMesh();
            if (enemyMesh) {
                const enemyHits = raycaster.intersectObject(enemyMesh, false);
                if (enemyHits.length > 0) {
                    hitEnemy(10);
                    scene.remove(bullet.mesh);
                    world.removeBody(bullet.body);
                    bullets.splice(i, 1);
                    continue;
                }
            }
        }

        // Update mesh position to match physics body
        bullet.mesh.position.copy(curr);
        bullet.prev.copy(curr);

        // Decrease life
        bullet.life -= deltaTime * 1000;

        // Remove old bullets
        if (bullet.life <= 0) {
            scene.remove(bullet.mesh);
            world.removeBody(bullet.body);
            bullets.splice(i, 1);
        }
    }
}
