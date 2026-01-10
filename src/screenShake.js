import * as THREE from 'three';

let shakeTime = 0;
let shakeDuration = 0;
let shakeIntensity = 0;

let originalPosition = new THREE.Vector3();

/**
 * Trigger screen shake
 * @param {number} intensity - độ mạnh (0.05 - 0.3)
 * @param {number} duration - thời gian (giây)
 */
export function startScreenShake(intensity = 0.1, duration = 0.2) {
    shakeIntensity = intensity;
    shakeDuration = duration;
    shakeTime = duration;
}

/**
 * Update screen shake each frame
 * @param {THREE.Camera} camera 
 * @param {number} deltaTime 
 */
export function updateScreenShake(camera, deltaTime) {
    if (shakeTime <= 0) return;

    if (shakeTime === shakeDuration) {
        originalPosition.copy(camera.position);
    }

    shakeTime -= deltaTime;

    const progress = shakeTime / shakeDuration; // 1 -> 0
    const strength = shakeIntensity * progress;

    const offsetX = (Math.random() - 0.5) * strength;
    const offsetY = (Math.random() - 0.5) * strength;
    const offsetZ = (Math.random() - 0.5) * strength;

    camera.position.set(
        originalPosition.x + offsetX,
        originalPosition.y + offsetY,
        originalPosition.z + offsetZ
    );

    // End shake
    if (shakeTime <= 0) {
        camera.position.copy(originalPosition);
        shakeTime = 0;
    }
}
