import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { BULLET_RADIUS } from './constants.js';
import { getObstaclesMeshes } from './obstacles.js';
import { getEnemyMesh, hitEnemy } from './enemy.js';
import { isRangedWeapon, isMeleeWeapon } from './weapons/WeaponData.js';
import { throwGrenade } from './grenade.js';
import { showHitmarker } from './hitmarker.js';


const bullets = [];

/**
 * Process shot data from WeaponManager
 * @param {Object} shotData - Shot data containing weapon and shot info
 */
export function processShot(shotData) {
    if (!shotData) return;
if (shotData.weapon.id === 'grenade') {
    const shot = shotData.shots[0];
    throwGrenade(shot.origin, shot.direction, shot.bulletSpeed);
    return;
}

    if (shotData.isRanged) {
        // Process ranged weapon shots (bullets/pellets)
        shotData.shots.forEach(shot => {
            createBullet(shot);
        });
    } else if (shotData.isMelee) {
        // Process melee attack
        processMeleeAttack(shotData);
    }
}

/**
 * Create a bullet from shot data
 * @param {Object} shot - Individual shot data
 */
function createBullet(shot) {
    // Create bullet mesh
    const bulletGeometry = new THREE.SphereGeometry(BULLET_RADIUS, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Position bullet at origin
    bulletMesh.position.copy(shot.origin);
    bulletMesh.position.add(shot.direction.clone().multiplyScalar(1));
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
    const speed = shot.bulletSpeed || 150;
    bulletBody.velocity.set(
        shot.direction.x * speed,
        shot.direction.y * speed,
        shot.direction.z * speed
    );

    world.addBody(bulletBody);

    bullets.push({
        mesh: bulletMesh,
        body: bulletBody,
        life: 3000,  // 3 seconds
        prev: bulletBody.position.clone(),
        damage: shot.damage,
        range: shot.range
    });
}

/**
 * Process melee attack with raycast
 * @param {Object} shotData - Shot data for melee weapon
 */
function processMeleeAttack(shotData) {
    const shot = shotData.shots[0];

    // Create raycaster for melee range
    const raycaster = new THREE.Raycaster(
        shot.origin,
        shot.direction,
        0,
        shot.range
    );

    // Check enemy hit
    const enemyMesh = getEnemyMesh();
    if (enemyMesh) {
        const enemyHits = raycaster.intersectObject(enemyMesh, false);
        if (enemyHits.length > 0) {
            hitEnemy(shot.damage);
            showHitmarker();
            createMeleeHitEffect(enemyHits[0].point);
            console.log(`[Melee] Hit enemy for ${shot.damage.toFixed(1)} damage!`);
        }
    }

    // Create swing effect
    createSwingEffect(shot.origin, shot.direction);
}

/**
 * Create visual effect for melee swing
 * @param {THREE.Vector3} origin - Origin point
 * @param {THREE.Vector3} direction - Swing direction
 */
function createSwingEffect(origin, direction) {
    // Simple arc effect for sword swing
    const arcGeometry = new THREE.TorusGeometry(0.5, 0.02, 8, 16, Math.PI * 0.5);
    const arcMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
    });
    const arc = new THREE.Mesh(arcGeometry, arcMaterial);

    arc.position.copy(origin);
    arc.position.add(direction.clone().multiplyScalar(0.5));
    arc.lookAt(origin.clone().add(direction));

    scene.add(arc);

    // Fade out and remove
    const startTime = performance.now();
    const fadeArc = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / 200; // 200ms duration

        if (progress >= 1) {
            scene.remove(arc);
            arc.geometry.dispose();
            arc.material.dispose();
            return;
        }

        arc.material.opacity = 0.5 * (1 - progress);
        arc.scale.setScalar(1 + progress * 0.5);
        requestAnimationFrame(fadeArc);
    };
    fadeArc();
}

/**
 * Create hit effect at impact point
 * @param {THREE.Vector3} point - Impact point
 */
function createMeleeHitEffect(point) {
    // Create small particle burst
    const particleCount = 8;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.copy(point);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2,
            (Math.random() - 0.5) * 2
        );

        scene.add(particle);
        particles.push(particle);
    }

    // Animate particles
    const startTime = performance.now();
    const animateParticles = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / 300;

        if (progress >= 1) {
            particles.forEach(p => {
                scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
            });
            return;
        }

        particles.forEach(p => {
            p.position.add(p.userData.velocity.clone().multiplyScalar(0.02));
            p.userData.velocity.y -= 0.1; // Gravity
            p.material.opacity = 1 - progress;
            p.scale.setScalar(1 - progress * 0.5);
        });

        requestAnimationFrame(animateParticles);
    };
    animateParticles();
}

/**
 * Legacy shoot function for backward compatibility
 * @param {THREE.Camera} camera - The camera
 * @param {CANNON.Body} sphereBody - The player body
 * @deprecated Use processShot with WeaponManager instead
 */
export function shoot(camera, sphereBody) {
    // Get shooting direction from camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Create default shot
    createBullet({
        origin: camera.position.clone(),
        direction: direction,
        damage: 25, // Default rifle damage
        range: 100,
        bulletSpeed: 150
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
                    // Use bullet's damage value
                    hitEnemy(bullet.damage || 10);
                    showHitmarker();
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
