import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';

const obstacles = [];

export function initObstacles() {
    // Create some box obstacles
    createObstacle(10, 1, -10, 2, 2, 2, 0x8b4513);
    createObstacle(-10, 1, -10, 2, 2, 2, 0x696969);
    createObstacle(0, 1, -20, 4, 2, 4, 0x8b4513);
    createObstacle(15, 1.5, -5, 3, 3, 3, 0x696969);
    createObstacle(-15, 0.5, -8, 1, 1, 1, 0x8b4513);
}

function createObstacle(x, y, z, width, height, depth, color) {
    // Three.js mesh
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: 0,
        material: defaultMaterial
    });
    body.addShape(shape);
    body.position.set(x, y, z);
    world.addBody(body);

    obstacles.push({ mesh, body });
}

// ===========================
// GETTERS
// ===========================
export function getObstaclesMeshes() {
    return obstacles.map(o => o.mesh);
}
