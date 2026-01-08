import * as CANNON from 'cannon-es';
import { GRAVITY, FIXED_TIME_STEP, MAX_SUB_STEPS } from './constants.js';

// ===========================
// PHYSICS WORLD
// ===========================
export const world = new CANNON.World();
world.gravity.set(0, GRAVITY, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// ===========================
// MATERIALS
// ===========================
export const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.3,
        restitution: 0.3,
    }
);
world.addContactMaterial(defaultContactMaterial);

// ===========================
// GROUND PHYSICS BODY
// ===========================
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
    mass: 0,
    material: defaultMaterial
});
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);
