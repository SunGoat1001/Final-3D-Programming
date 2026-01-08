import * as CANNON from 'cannon-es';
import { world, defaultMaterial } from './physics.js';
import { PLAYER_RADIUS, PLAYER_MASS, PLAYER_START_POSITION } from './constants.js';

/**
 * Create the player physics body as a sphere
 * Following the voxel shooter pattern
 */
export function createPlayerBody() {
    const sphereShape = new CANNON.Sphere(PLAYER_RADIUS);

    const sphereBody = new CANNON.Body({
        mass: PLAYER_MASS,
        material: defaultMaterial,
        linearDamping: 0.9,  // Air resistance
        shape: sphereShape
    });

    sphereBody.position.set(
        PLAYER_START_POSITION.x,
        PLAYER_START_POSITION.y,
        PLAYER_START_POSITION.z
    );

    world.addBody(sphereBody);

    return sphereBody;
}
