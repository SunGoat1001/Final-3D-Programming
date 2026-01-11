import { camera } from './scene.js';

function playSound(src, volume = 1) {
    const s = new Audio(src);
    s.volume = volume;
    s.play();
}

// ===========================
// WEAPON SOUNDS
// ===========================

// Rifle
export function playRifleShot() {
    playSound('sounds/ShootingRifle.mp3', 0.5);
}

export function playRifleReload() {
    playSound('sounds/RifleReloading.mp3', 0.7);
}

// Shotgun
export function playShotgunShot() {
    playSound('sounds/shotgunShooting.mp3', 0.9);
}

export function playShotgunReload() {
    playSound('sounds/ShotgunReloading.mp3', 0.9);
}

// Sword
export function playSwordSwing() {
    playSound('sounds/SwordSlice.mp3', 0.6);
}

// Other
export function playSwitchWeapon() {
    playSound('sounds/SwitchWeapon.mp3', 0.5);
}

export function playGrenadeThrow() {

    playSound('sounds/SwitchWeapon.mp3', 0.6);
}

export function playEmptyClick() {
    playSound('sounds/emptyGunShoot.mp3', 0.5);
}

// Bazooka
export function playBazookaShot() {
    playSound('sounds/bazuka.mp3', 0.8);
}

export function playBazookaExplosion(position) {
    const sound = new Audio('sounds/boom_bazuka.mp3');

    // Simple distance based volume
    const dist = position ? position.distanceTo(camera.position) : 0;
    const maxDist = 50;
    let volume = 1 - (dist / maxDist);
    volume = Math.max(0, Math.min(1, volume));

    sound.volume = volume * 0.8;
    sound.play();
}

export function playBazookaReload() {
    playSound('sounds/bazukaReloading.mp3', 0.8);
}
