import * as THREE from 'three';
import { scene, renderer, camera } from './scene.js';
import { getPlayerPosition } from './player.js';
import { getEnemyMesh } from './enemy.js';

// ===========================
// CONFIG
// ===========================
const VIEW_SIZE = 12;
const MAP_PIXEL_SIZE = 220;
const MARGIN = 20;

// ===========================
// MINIMAP CAMERA
// ===========================
const minimapCamera = new THREE.OrthographicCamera(
    -VIEW_SIZE, VIEW_SIZE,
    VIEW_SIZE, -VIEW_SIZE,
    0.1, 300
);
minimapCamera.layers.enable(0);
minimapCamera.layers.enable(2);
minimapCamera.rotation.order = 'YXZ';
minimapCamera.rotation.x = -Math.PI / 2;

// ===========================
// PLAYER ARROW
// ===========================
const playerArrow = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
playerArrow.rotation.x = Math.PI / 2;
playerArrow.layers.set(2);
scene.add(playerArrow);

// ===========================
// ENEMY DOT
// ===========================
const enemyDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
enemyDot.layers.set(2);
enemyDot.rotation.x = -Math.PI / 2;
scene.add(enemyDot);

// ===========================
// FOG OF WAR
// ===========================
const FOG_SIZE = 400;

const fogCanvas = document.createElement('canvas');
fogCanvas.width = 512;
fogCanvas.height = 512;
const fogCtx = fogCanvas.getContext('2d');

// Fill black
fogCtx.fillStyle = 'black';
fogCtx.fillRect(0, 0, 512, 512);

const fogTexture = new THREE.CanvasTexture(fogCanvas);

const fogPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(FOG_SIZE, FOG_SIZE),
    new THREE.MeshBasicMaterial({
        map: fogTexture,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
    })
);
fogPlane.rotation.x = -Math.PI / 2;
fogPlane.position.y = 0.4;
scene.add(fogPlane);

// ===========================
// REVEAL FOG
// ===========================
function revealFog(x, z) {
    const u = ((x + FOG_SIZE / 2) / FOG_SIZE) * 512;
    const v = ((z + FOG_SIZE / 2) / FOG_SIZE) * 512;

    const r = 40;

    const grd = fogCtx.createRadialGradient(u, v, 0, u, v, r);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');

    fogCtx.globalCompositeOperation = 'destination-out';
    fogCtx.fillStyle = grd;
    fogCtx.beginPath();
    fogCtx.arc(u, v, r, 0, Math.PI * 2);
    fogCtx.fill();
    fogCtx.globalCompositeOperation = 'source-over';

    fogTexture.needsUpdate = true;
}

// ===========================
// HIDE CEILING / HIGH OBJECTS
// ===========================
scene.traverse(obj => {
    if (obj.isMesh && obj.position.y > 6) {
        obj.layers.set(1);
    }
});
minimapCamera.layers.enable(0);
minimapCamera.layers.disable(1);

// ===========================
// RENDER MINIMAP
// ===========================
export function renderMinimap() {
    const pos = getPlayerPosition();

    // Follow player
    minimapCamera.position.set(pos.x, 100, pos.z);

    // Rotate minimap with view
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const angle = Math.atan2(dir.x, dir.z);
    minimapCamera.rotation.z = angle;

    // Player arrow
    playerArrow.position.set(pos.x, 0.5, pos.z);
    playerArrow.rotation.z = -angle;

    // Enemy dot
    const enemy = getEnemyMesh();
    if (enemy) {
        enemyDot.visible = true;
        enemyDot.position.set(enemy.position.x, 0.5, enemy.position.z);
    } else {
        enemyDot.visible = false;
    }

    // Update fog
    revealFog(pos.x, pos.z);

    // Render viewport
    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.clearDepth();
    renderer.setScissorTest(true);

    renderer.setScissor(
        MARGIN,
        h - MAP_PIXEL_SIZE - MARGIN,
        MAP_PIXEL_SIZE,
        MAP_PIXEL_SIZE
    );
    renderer.setViewport(
        MARGIN,
        h - MAP_PIXEL_SIZE - MARGIN,
        MAP_PIXEL_SIZE,
        MAP_PIXEL_SIZE
    );

    renderer.render(scene, minimapCamera);
    renderer.setScissorTest(false);
}
