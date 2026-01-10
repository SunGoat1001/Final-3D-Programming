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

export function playEmptyClick() {
    playSound('sounds/emptyGunShoot.mp3', 0.5);
}
