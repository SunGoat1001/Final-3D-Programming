import { getAimingState } from './aim.js';

// ===========================
// CROSSHAIR ELEMENT
// ===========================
const crosshair = document.getElementById('crosshair');

// ===========================
// CROSSHAIR UPDATE
// ===========================
export function updateCrosshair() {
    if (getAimingState()) {
        crosshair.classList.add('aiming');
    } else {
        crosshair.classList.remove('aiming');
    }
}
