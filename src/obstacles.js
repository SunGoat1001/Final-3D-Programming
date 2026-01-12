import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { WORLD_SCALE } from './constants.js';

const obstacles = [];

export function initObstacles() {
    // Create wall
    createObstacle(-4.4, -0.1, 0, 17, 3, 0.35, 0, THREE.MathUtils.degToRad(90), 0);
    createObstacle(4.4, -0.1, 0, 17, 3, 0.35, 0, THREE.MathUtils.degToRad(90), 0);
    createObstacle(-0.03, 8.2, 0, 8, 3, 0.35);
    createObstacle(-0.03, -8.2, 0, 8, 3, 0.35);
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
    createObstacle(-0.03, -7.12433, 1, 8, 0.05, 2, 0, 0, THREE.MathUtils.degToRad(180));
    // Create some box obstacles
    createObstacle(0.51475, 3.64764, 0, 0.35, 0.25, 0.35);
    createObstacle(1.49515, 7.7, 0.543078, 2.8, 0.08, 0.85, 0, 0, THREE.MathUtils.degToRad(22.1));
    // createObstacle(-15, 0.5, -8, 1, 1, 1, 0x8b4513);
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
