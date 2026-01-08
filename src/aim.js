import { camera } from './scene.js';
import { setAimState } from './controls.js';
import { NORMAL_FOV, AIM_FOV, FOV_TRANSITION_DURATION } from './constants.js';

// ===========================
// AIMING STATE
// ===========================
let isAiming = false;

export function getAimingState() {
    return isAiming;
}

// ===========================
// FOV ANIMATION
// ===========================
function animateFOV(startFOV, endFOV) {
    const startTime = Date.now();

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / FOV_TRANSITION_DURATION, 1);

        camera.fov = startFOV + (endFOV - startFOV) * progress;
        camera.updateProjectionMatrix();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    update();
}

// ===========================
// AIM CONTROLS
// ===========================
export function startAiming() {
    isAiming = true;
    setAimState(true);
    animateFOV(camera.fov, AIM_FOV);
}

export function stopAiming() {
    isAiming = false;
    setAimState(false);
    animateFOV(camera.fov, NORMAL_FOV);
}
