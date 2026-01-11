import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';

const obstacles = [];

export function initObstacles() {
    // Create wall
    createObstacle(0, -7.84, 0, 5.6, 3, 0.35);

    // Create some box obstacles
    createObstacle(0.51475, 3.64764, 0, 0.45, 0.25, 0.35);
    createObstacle(1.49515, 7.7, 0.543078, 2.8, 0.08, 0.6, 0, 0, THREE.MathUtils.degToRad(22.1));
    createObstacle(2.03169, 1, -20, 4, 2, 4);
    // createObstacle(15, 1.5, -5, 3, 3, 3, 0x696969);
    // createObstacle(-15, 0.5, -8, 1, 1, 1, 0x8b4513);
}

function createObstacle(x, z, y, width, height, depth, rotateX = 0, rotateY = 0, rotateZ = 0) {
    // Three.js mesh
    z = -z;
    y == 0 ? y = height / 2 : y = y;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: "blue" });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotateX, rotateY, -rotateZ);
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
    body.quaternion.setFromEuler(rotateX, rotateY, -rotateZ); // Apply rotation to Cannon.js body
    world.addBody(body);

    obstacles.push({ mesh, body });
}

// ===========================
// GETTERS
// ===========================
export function getObstaclesMeshes() {
    return obstacles.map(o => o.mesh);
}
