import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { getEnemyMesh, hitEnemy } from './enemy.js';
import { camera } from './scene.js';
import { takeDamage, getPlayerPosition } from './player.js';
import { playBazookaExplosion } from './audio.js';
import { getObstaclesMeshes } from './obstacles.js';
import { spawnSmoke, updateSmoke } from './smokeTrail.js';

const rockets = [];

export function spawnRocket(origin, direction, speed = 40, damage = 100) {
    // 1. Visual Rocket
    const rocketGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x111111 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    rocketGroup.add(body);

    // Tip
    const tipGeo = new THREE.ConeGeometry(0.05, 0.1, 8);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = -0.25;
    rocketGroup.add(tip);

    rocketGroup.position.copy(origin);
    rocketGroup.lookAt(origin.clone().add(direction));
    scene.add(rocketGroup);

    // 2. Physics Rocket
    // Use a sphere or small capsule for simplified collision
    const shape = new CANNON.Sphere(0.1);
    const bodyPhysics = new CANNON.Body({
        mass: 0.1,
        shape: shape,
        material: defaultMaterial,
        linearDamping: 0, // No air resistance for rocket
        angularDamping: 0,
        collisionFilterGroup: 2, // Bullets/Rockets group
        collisionFilterMask: 1 | 4 // Collide with world (1) and enemy (4)
    });

    // Rockets usually aren't affected by gravity in games for that "straight flight" feel
    bodyPhysics.velocity.set(
        direction.x * speed,
        direction.y * speed,
        direction.z * speed
    );
    bodyPhysics.position.set(origin.x, origin.y, origin.z);

    // Disable gravity for rocket
    bodyPhysics.type = CANNON.Body.DYNAMIC;

    world.addBody(bodyPhysics);

    rockets.push({
        mesh: rocketGroup,
        body: bodyPhysics,
        life: 5.0, // 5 seconds life
        exploded: false,
        prevPos: bodyPhysics.position.clone(),
        damage: damage
    });
}

export function updateRockets(deltaTime) {
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];

        // Sync visual to physics
        r.mesh.position.copy(r.body.position);
              // Spawn smoke
        spawnSmoke(r.mesh.position);
        // Continuous collision detection using raycast from prev pos to current
        if (!r.exploded) {
            const currPos = r.body.position;
            const prevPos = r.prevPos;
            const delta = new THREE.Vector3(currPos.x - prevPos.x, currPos.y - prevPos.y, currPos.z - prevPos.z);
            const dist = delta.length();

            if (dist > 0.01) {
                const dir = delta.clone().normalize();
                const raycaster = new THREE.Raycaster(new THREE.Vector3(prevPos.x, prevPos.y, prevPos.z), dir, 0, dist + 0.1);

                // Check obstacles
                const obstacles = getObstaclesMeshes();
                const hits = raycaster.intersectObjects(obstacles, false);

                // Check enemy
                const enemy = getEnemyMesh();
                if (enemy) {
                    const enemyHits = raycaster.intersectObject(enemy, false);
                    if (enemyHits.length > 0) {
                        explodeRocket(r, i);
                        continue;
                    }
                }

                if (hits.length > 0) {
                    explodeRocket(r, i);
                    continue;
                }

                // Floor check (y=0)
                if (currPos.y <= 0.1) {
                    explodeRocket(r, i);
                    continue;
                }
            }

            r.prevPos.copy(currPos);
        }

        r.life -= deltaTime;
        if (r.life <= 0 && !r.exploded) {
            explodeRocket(r, i);
        }
    }
     // Update smoke particles
    updateSmoke(deltaTime);
}

function explodeRocket(rocket, index) {
    if (rocket.exploded) return;
    rocket.exploded = true;

    const pos = rocket.body.position;
    const thrPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Sound
    playBazookaExplosion(thrPos);

    // Visual Explosion
    const explosionRadius = 4;
    const geo = new THREE.SphereGeometry(0.1, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8
    });
    const boom = new THREE.Mesh(geo, mat);
    boom.position.copy(thrPos);
    scene.add(boom);

    // Animation of explosion
    const start = performance.now();
    const duration = 400;
    const animateExplosion = () => {
        const elapsed = performance.now() - start;
        const p = elapsed / duration;

        if (p >= 1) {
            scene.remove(boom);
            geo.dispose();
            mat.dispose();
            return;
        }

        const s = p * explosionRadius * 10;
        boom.scale.set(s, s, s);
        boom.material.opacity = 0.8 * (1 - p);
        requestAnimationFrame(animateExplosion);
    };
    animateExplosion();

    // Damage logic
    const radius = explosionRadius;
    const maxDamage = rocket.damage || 120;

    // Damage enemy
    const enemy = getEnemyMesh();
    if (enemy) {
        const d = enemy.position.distanceTo(thrPos);
        if (d < radius) {
            const dmg = maxDamage * (1 - d / radius);
            hitEnemy(dmg);
            console.log(`[Rocket] Hit enemy for ${dmg.toFixed(1)}`);
        }
    }

    // Damage player (Self damage)
    const playerPos = getPlayerPosition();
    const dPlayer = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z).distanceTo(thrPos);
    if (dPlayer < radius) {
        const dmg = (maxDamage * 0.5) * (1 - dPlayer / radius); // Reduced self-damage
        takeDamage(dmg);
        console.log(`[Rocket] Self-hit for ${dmg.toFixed(1)}`);
    }

    // Rocket Cleanup
    scene.remove(rocket.mesh);
    world.removeBody(rocket.body);
    rockets.splice(index, 1);

    console.log('[Rocket] Exploded at', thrPos);
}
