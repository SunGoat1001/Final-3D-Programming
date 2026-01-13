import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { WORLD_SCALE } from './constants.js';

const obstacles = [];

export function initObstacles() {
    // Create wall
    createObstacle(-4.3, -0.1, 0, 17, 3, 0.35, 0, THREE.MathUtils.degToRad(90), 0);
    createObstacle(4.3, -0.1, 0, 17, 3, 0.35, 0, THREE.MathUtils.degToRad(90), 0);
    createObstacle(-0.03, 8.3, 0, 8, 3, 0.35);
    createObstacle(-0.03, -8.3, 0, 8, 3, 0.35);
    createObstacle(-0.03, -7.84, 0, 5.4, 3, 0.35);
    createObstacle(3.6, -7.82889, 0, 0.6, 3, 0.35);
    createObstacle(-3.88628, -7.32, 0, 0.35, 3, 1.1);
    // Create cầu thang
    createObstacle(-3.55903, -4.87136, 0, 0.88, 0.5, 0.4);
    createObstacle(-3.74903, -6.0, 0, 0.32, 0.8, 0.2);
    createObstacle(-3.74903, -5.8, 0, 0.32, 0.7, 0.2);
    createObstacle(-3.74903, -5.6, 0, 0.32, 0.6, 0.2);
    createObstacle(-3.74903, -5.4, 0, 0.32, 0.5, 0.2);
    createObstacle(-3.74903, -5.62136, 0.753078, 1, 0.05, 0.3, 0, THREE.MathUtils.degToRad(270), THREE.MathUtils.degToRad(-25.9));
    createObstacle(-3.26903, -5.62136, 0.233078, 1, 0.05, 0.3, 0, THREE.MathUtils.degToRad(270), THREE.MathUtils.degToRad(27.1));

    // Create ceiling
    createObstacle(-2.15548, 7.08391, 1, 4.5, 0.05, 1.8, 0, 0, THREE.MathUtils.degToRad(180));
    createObstacle(-0.03, -7.12433, 1, 8, 0.05, 2, 0, 0, THREE.MathUtils.degToRad(180));

    // Create some box obstacles

    // 4 cột
    createObstacle(0, 7.9, 0.95, 0.3, 3, 0.3);
    createObstacle(0, 6.35594, 0.95, 0.3, 3, 0.3);
    createObstacle(-2.12673, 7.95594, 0.95, 0.3, 3, 0.3);
    createObstacle(-2.12673, 6.35594, 0.95, 0.3, 3, 0.3);

    // 5 boxes
    createObstacle(-2.12264, 5.49594, 0, 0.4, 0.4, 0.4);
    createObstacle(-2.34345, 5.91963, 0.6, 0.4, 0.4, 0.4);
    createObstacle(-1.93234, 5.88714, 0.6, 0.4, 0.4, 0.4);
    createObstacle(-1.94513, 5.91963, 0, 0.4, 0.4, 0.4);
    createObstacle(-2.35979, 5.91963, 0, 0.4, 0.4, 0.4);

    createObstacle(-3.52855, 4.85, 0.5, 0.9, 0.9, 0.6);
    createObstacle(0.51475, 3.64764, 0, 0.35, 0.25, 0.35);
    createObstacle(3.77097, 7.80309, 0, 0.35, 0.25, 0.35);
    createObstacle(0.402362, 6.40021, 0, 0.35, 0.25, 0.35);
    createObstacle(-0.007024, 7.53925, 0, 0.35, 0.25, 0.35);
    createObstacle(-2.55318, -6.40872, 1.05, 0.35, 0.25, 0.35);
    createObstacle(2.30259, -4.16989, 0, 0.35, 0.25, 0.35);
    createObstacle(-3.88924, 7.89912, 1.23, 0.2, 0.25, 0.2);
    createObstacle(-1.68548, 7.79391, 1.26, 0.35, 0.25, 0.35);
    createObstacle(-0.558688, 7.89912, 1.2, 0.6, 0.3, 0.2);
    createObstacle(1.49515, 7.7, 0.543078, 2.8, 0.08, 0.85, 0, 0, THREE.MathUtils.degToRad(22.1));
}

function createObstacle(x, z, y, width, height, depth, rotateX = 0, rotateY = 0, rotateZ = 0) {
    // Interpret inputs in unscaled world units; apply WORLD_SCALE internally
    const scaledWidth = width * WORLD_SCALE;
    const scaledHeight = height * WORLD_SCALE;
    const scaledDepth = depth * WORLD_SCALE;

    // Handle Z inversion then scale, and Y auto-centering when y==0
    const scaledX = x * WORLD_SCALE;
    const scaledZ = (-z) * WORLD_SCALE;
    const scaledY = (y === 0 ? (height / 2) : y) * WORLD_SCALE;

    // Three.js mesh
    const geometry = new THREE.BoxGeometry(scaledWidth, scaledHeight, scaledDepth);
    const material = new THREE.MeshStandardMaterial({ color: "blue" });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(scaledX, scaledY, scaledZ);
    mesh.rotation.set(rotateX, rotateY, -rotateZ); // rotations unaffected by scale
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(
        scaledWidth / 2,
        scaledHeight / 2,
        scaledDepth / 2
    ));
    const body = new CANNON.Body({
        mass: 0,
        material: defaultMaterial
    });
    body.addShape(shape);
    body.position.set(scaledX, scaledY, scaledZ);
    body.quaternion.setFromEuler(rotateX, rotateY, -rotateZ); // rotations unaffected by scale
    world.addBody(body);

    obstacles.push({ mesh, body });
}

// ===========================
// GETTERS
// ===========================
export function getObstaclesMeshes() {
    return obstacles.map(o => o.mesh);
}
