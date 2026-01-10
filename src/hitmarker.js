// src/hitmarker.js

let hitmarkerEl;
let hitSound;

export function initHitmarker() {
    // Create hitmarker UI
    hitmarkerEl = document.createElement('div');
    hitmarkerEl.id = 'hitmarker';
    document.body.appendChild(hitmarkerEl);

    // CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #hitmarker {
            position: fixed;
            left: 50%;
            top: 50%;
            width: 32px;
            height: 32px;
            transform: translate(-50%, -50%) scale(1);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.05s ease, transform 0.05s ease;
            z-index: 9999;
        }
        #hitmarker::before, #hitmarker::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            width: 32px;
            height: 3px;
            background: white;
        }
        #hitmarker::before { transform: translate(-50%, -50%) rotate(45deg); }
        #hitmarker::after { transform: translate(-50%, -50%) rotate(-45deg); }
    `;
    document.head.appendChild(style);

    // Sound
    hitSound = new Audio('./sounds/hitmarker.mp3');
    hitSound.volume = 0.6;
}

export function showHitmarker() {
    if (!hitmarkerEl) return;

    hitmarkerEl.style.opacity = '1';
    hitmarkerEl.style.transform = 'translate(-50%, -50%) scale(1.3)';

    if (hitSound) {
        hitSound.currentTime = 0;
        hitSound.play();
    }

    setTimeout(() => {
        hitmarkerEl.style.opacity = '0';
        hitmarkerEl.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 80);
}
