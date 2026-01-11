import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { WORLD_SCALE } from './constants.js';

const obstacles = [];

export function initObstacles() {
    // Create wall
    createObstacle(-0.03, -7.84, 0, 5.6, 3, 0.35);

    // Create some box obstacles
    createObstacle(0.51475, 3.64764, 0, 0.45, 0.25, 0.35);
    createObstacle(1.49515, 7.7, 0.543078, 2.8, 0.08, 0.6, 0, 0, THREE.MathUtils.degToRad(22.1));
    createObstacle(2.03169, 1, -20, 4, 2, 4);
    // createObstacle(15, 1.5, -5, 3, 3, 3, 0x696969);
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
