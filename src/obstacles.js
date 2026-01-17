import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world, defaultMaterial } from './physics.js';
import { WORLD_SCALE } from './constants.js';

const obstacles = [];

export function initObstacles() {
    // Create barrier
    createObstacle(-4.3, -0.1, 0, 17, 3, 0.35, 0, THREE.MathUtils.degToRad(90), 0);
    createObstacle(4.3, -0.1, 0, 17, 3, 0.35, 0, THREE.MathUtils.degToRad(90), 0);
    createObstacle(-0.03, 8.3, 0, 8, 3, 0.35);
    createObstacle(-0.03, -8.3, 0, 8, 3, 0.35);
    createObstacle(-0.03, -7.84, 0, 5.4, 3, 0.35);
    createObstacle(3.6, -7.82889, 0, 0.6, 3, 0.35);
    createObstacle(-3.88628, -7.32, 0, 0.35, 3, 1.1);
    // Create walll
    createObstacle(3.64092, 5.06983, 0.5, 0.9, 1, 0.1);

    // Create cầu thang
    createObstacle(-3.55903, -4.87136, 0, 0.88, 0.5, 0.4);
    createObstacle(-3.74903, -6.0, 0, 0.32, 0.8, 0.2);
    createObstacle(-3.74903, -5.8, 0, 0.32, 0.7, 0.2);
    createObstacle(-3.74903, -5.6, 0, 0.32, 0.6, 0.2);
    createObstacle(-3.74903, -5.4, 0, 0.32, 0.5, 0.2);
    createObstacle(-3.74903, -5.62136, 0.753078, 1, 0.05, 0.3, 0, THREE.MathUtils.degToRad(270), THREE.MathUtils.degToRad(-25.9));
    createObstacle(-3.26903, -5.62136, 0.233078, 1, 0.05, 0.3, 0, THREE.MathUtils.degToRad(270), THREE.MathUtils.degToRad(27.1));

    // Create ceiling
    createObstacle(1, 0, 1, 6.4, 0.05, 2, 0, 0, THREE.MathUtils.degToRad(180));
    createObstacle(-2.15548, 7.08391, 1, 4.5, 0.05, 1.8, 0, 0, THREE.MathUtils.degToRad(180));
    createObstacle(-0.03, -7.12433, 1, 8, 0.05, 1.8, 0, 0, THREE.MathUtils.degToRad(180));

    // bộ thùng hàng
    createObstacle(-0.76855, 3.08983, 0.78, 1.5, 0.85, 0.05, THREE.MathUtils.degToRad(90));
    createObstacle(-0.76855, 2.70983, 0.38, 1.5, 0.85, 0.05);
    createObstacle(-0.76855, 3.48, 0.38, 1.5, 0.85, 0.05);

    // 4 cột
    createObstacle(0, 7.9, 0.95, 0.3, 3, 0.3);
    createObstacle(0, 6.35594, 0.95, 0.3, 3, 0.3);
    createObstacle(-2.12673, 7.95594, 0.95, 0.3, 3, 0.3);
    createObstacle(-2.12673, 6.35594, 0.95, 0.3, 3, 0.3);

    // large wood boxes
    createObstacle(-2.12264, 5.49594, 0, 0.4, 0.4, 0.4);
    createObstacle(-2.34345, 5.91963, 0.6, 0.4, 0.4, 0.4);
    createObstacle(-1.93234, 5.88714, 0.6, 0.4, 0.4, 0.4);
    createObstacle(-1.94513, 5.91963, 0, 0.4, 0.4, 0.4);
    createObstacle(-2.35979, 5.91963, 0, 0.4, 0.4, 0.4);
    createObstacle(-1.68548, 6.38039, 1.25, 0.4, 0.4, 0.4);
    createObstacle(-3.78631, 6.38039, 1.25, 0.4, 0.4, 0.4);
    createObstacle(-1.68548, 7.79391, 1.25, 0.35, 0.35, 0.35);
    createObstacle(-1.94513, 1.59899, 0, 0.4, 0.4, 0.4);
    createObstacle(-1.80446, 0.985337, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.192376, 0.997791, 0, 0.4, 0.4, 0.4);
    createObstacle(1.74816, 0.959308, 0, 0.4, 0.4, 0.4);
    createObstacle(-1.80446, -0.604778, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.607091, -0.604778, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.648815, 1.1773, 1.25, 0.4, 0.4, 0.4);
    createObstacle(-1.32794, 0.985337, 1.25, 0.4, 0.4, 0.4);
    createObstacle(-1.74335, 0.985337, 1.25, 0.4, 0.4, 0.4);
    createObstacle(-1.7991, -0.698429, 1.25, 0.4, 0.4, 0.4);
    createObstacle(-3.79111, -1.69964, 0, 0.4, 0.4, 0.4);
    createObstacle(-3.34741, -1.69964, 0, 0.4, 0.4, 0.4);
    createObstacle(-3.68065, -1.69964, 0.39786 * 1.5, 0.4, 0.4, 0.4);
    createObstacle(-2.28915, -5.1603, 0, 0.35, 0.4, 0.35);
    createObstacle(1.69599, -6.34232, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.001986, -5.89387, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.001831, -5.89387, 0.39786 * 1.5, 0.4, 0.4, 0.4);
    createObstacle(-0.405826, -6.46859, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.813293, -6.46859, 0, 0.4, 0.4, 0.4);
    createObstacle(-1.7271, -6.46859, 0, 0.4, 0.4, 0.4);
    createObstacle(-0.420204, -6.46859, 0.4 * 1.5, 0.4, 0.4, 0.4);
    createObstacle(-0.827671, -6.46859, 0.4 * 1.5, 0.4, 0.4, 0.4);
    createObstacle(-1.74151, -6.46859, 0.4 * 1.5, 0.4, 0.4, 0.4);
    createObstacle(2.53358, -6.33609, 1.25, 0.4, 0.4, 0.4);
    createObstacle(2.53358, -6.33609, 1.25 * 1.3, 0.4, 0.4, 0.4);
    createObstacle(-1.7347, -6.33525, 1.25 * 1.3, 0.4, 0.4, 0.4);
    createObstacle(-1.7347, -6.33525, 1.25, 0.4, 0.4, 0.4);
    createObstacle(0.405821, -6.35133, 1.25, 0.4, 0.4, 0.4);
    createObstacle(0.405821, -6.35133, 1.25 * 1.3, 0.4, 0.4, 0.4);
    createObstacle(0.810831, -6.35133, 1.25, 0.4, 0.4, 0.4);
    createObstacle(0.810831, -6.35133, 1.25 * 1.3, 0.4, 0.4, 0.4);

    // red
    createObstacle(-3.52855, 4.85, 0.5, 0.9, 0.9, 0.6);
    createObstacle(0.51475, 3.64764, 0, 0.35, 0.25, 0.35);
    createObstacle(3.77097, 7.80309, 0, 0.35, 0.25, 0.35);
    createObstacle(0.402362, 6.40021, 0, 0.35, 0.25, 0.35);
    createObstacle(-0.007024, 7.53925, 0, 0.35, 0.25, 0.35);
    createObstacle(-2.55318, -6.40872, 1.05, 0.35, 0.25, 0.35);
    createObstacle(-1.68548, 7.79391, 1.26, 0.35, 0.25, 0.35);
    createObstacle(2.30259, -4.16989, 0, 0.35, 0.25, 0.35);
    createObstacle(0.007707, -5.51237, 0, 0.35, 0.25, 0.35);
    createObstacle(-2.11699, -6.74814, 0, 0.35, 0.25, 0.35);
    createObstacle(0.693441, 1.18429, 1.2, 0.35, 0.4, 0.35);
    createObstacle(-2.01589, 0.044855, 1.2, 0.35, 0.4, 0.35);
    createObstacle(-2.01589, 0.449488, 1.2, 0.35, 0.4, 0.35);
    createObstacle(-3.37601, 6.36263, 1.2, 0.35, 0.4, 0.35);


    createObstacle(2.03169, 1.655, 0, 0.5, 0.5, 0.5);
    createObstacle(3.74457, 5.43362, 0, 0.5, 0.5, 0.5);
    createObstacle(-1.22959, 6.50582, 1.3, 0.5, 0.5, 0.5);
    createObstacle(2.91284, 0, 1.25, 0.5, 0.5, 0.5);
    createObstacle(2.39303, 0, 1.25, 0.5, 0.5, 0.5);
    createObstacle(1.13263, 1.13101, 1.25, 0.5, 0.5, 0.5);
    createObstacle(2.03169, -1.25, 0, 0.5, 0.5, 0.5);
    createObstacle(3.28352, -2.42351, 0, 0.38, 0.38, 0.38);
    createObstacle(0.455356, -5.86903, 0, 0.5, 0.5, 0.5);
    createObstacle(-2.24637, -4.70349, 0, 0.4, 0.5, 0.4);

    // Cái thùng (giống thùng dầu)
    createObstacle(-0.761102, -6.3548, 1.23, 0.2, 0.3, 0.2);
    createObstacle(-0.537347, -6.3548, 1.23, 0.2, 0.3, 0.2);
    createObstacle(-2.3486, 0.125967, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.88924, 7.89912, 1.23, 0.2, 0.3, 0.2);
    createObstacle(-0.330524, 6.26758, 1.23, 0.2, 0.3, 0.2);
    createObstacle(-3.88522, -2.95837, 0, 0.2, 0.3, 0.2);
    createObstacle(0.560629, -1.11662, 0, 0.2, 0.3, 0.2);
    createObstacle(0.403173, 1.28069, 1.2, 0.18, 0.3, 0.18);

    createObstacle(-0.153038, -0.248487, 1.55, 0.18, 0.3, 0.18);
    createObstacle(-0.153038, -0.468271, 1.55, 0.18, 0.3, 0.18);
    createObstacle(-0.153038, -0.686443, 1.55, 0.18, 0.3, 0.18);
    createObstacle(-0.268058, -0.686443, 1.2, 0.18, 0.3, 0.18);
    createObstacle(-0.268058, -0.468271, 1.2, 0.18, 0.3, 0.18);
    createObstacle(-0.268058, -0.248487, 1.2, 0.18, 0.3, 0.18);
    createObstacle(-0.043407, -0.248487, 1.2, 0.18, 0.3, 0.18);
    createObstacle(-0.043407, -0.468271, 1.2, 0.18, 0.3, 0.18);
    createObstacle(-0.043407, -0.686443, 1.2, 0.18, 0.3, 0.18);

    createObstacle(-1.83346, -4.57801, 0, 0.2, 0.3, 0.2);
    createObstacle(-1.82254, -4.84904, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.89919, -3.77048, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.89919, -3.54346, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.87589, 3.32009, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.87589, 3.56059, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.87589, 3.80046, 0, 0.2, 0.3, 0.2);
    createObstacle(-3.87589, 3.42983, 0.35 * 1.5, 0.2, 0.3, 0.2);
    createObstacle(-3.87589, 3.67519, 0.35 * 1.5, 0.2, 0.3, 0.2);
    createObstacle(-3.89919, -3.65515, 0.35 * 1.5, 0.2, 0.3, 0.2);

    // ván trượng si măng
    createObstacle(3.77669, 2.10401, 0.4, 2.6, 0.08, 0.5, 0, THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(26.1));
    createObstacle(3.77669, 2.10401, 0, 2.6, 0.08, 0.5, 0, THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(26.1));
    createObstacle(3.77669, 2.10401, -0.4, 2.6, 0.08, 0.5, 0, THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(26.1));
    createObstacle(3.77669, -2.10401, 0.4, 2.6, 0.08, 0.5, 0, -THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(26.1));
    createObstacle(3.77669, -2.10401, 0, 2.6, 0.08, 0.5, 0, -THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(26.1));
    createObstacle(3.77669, -2.10401, -0.4, 2.6, 0.08, 0.5, 0, -THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(26.1));

    // ván gỗ trượt
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
    const material = new THREE.MeshStandardMaterial({
        color: "blue"
    });
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
