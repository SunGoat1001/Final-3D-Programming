import { getControls } from './controls.js';


// ===========================
// CROSSHAIR ELEMENT
// ===========================
const crosshair = document.getElementById('crosshair');

// ===========================
// STATE
// ===========================
let currentSpread = 8;
let targetSpread = 8;

let moveFactor = 0;   // 0 → 1
let shootFactor = 0;  // kick khi bắn

// ===========================
// CONFIG
// ===========================
const BASE_SPREAD = 6;
const MOVE_SPREAD = 10;
const SHOOT_SPREAD = 18;
const AIM_SPREAD = 2;

// ===========================
// API cho module khác gọi
// ===========================
export function setMoveAmount(amount01) {
    moveFactor = Math.min(Math.max(amount01, 0), 1);
}

export function addShootKick() {
    shootFactor = 1;
}

// ===========================
// UPDATE
// ===========================
export function updateCrosshair(deltaTime = 0.016) {
    const controls = getControls();
const isAiming = controls ? controls.isAiming : false;


    // decay shoot kick
    shootFactor = Math.max(0, shootFactor - deltaTime * 6);

    targetSpread =
        BASE_SPREAD +
        MOVE_SPREAD * moveFactor +
        SHOOT_SPREAD * shootFactor;

    if (isAiming) {
        targetSpread = AIM_SPREAD + MOVE_SPREAD * moveFactor * 0.2;
        crosshair.classList.add('aiming');
    } else {
        crosshair.classList.remove('aiming');
    }

    // smooth lerp
    currentSpread += (targetSpread - currentSpread) * 0.15;

    crosshair.style.setProperty('--spread', `${currentSpread}px`);
}
