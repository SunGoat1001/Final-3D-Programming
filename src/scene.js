import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FOV, CAMERA_NEAR, CAMERA_FAR } from './constants.js';

// ===========================
// SCENE SETUP
// ===========================
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 0, 200);

// ===========================
// CAMERA
// ===========================
export const camera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
);
camera.position.set(0, 5, 0);

// ===========================
// RENDERER
// ===========================
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.0;

renderer.physicallyCorrectLights = false;

// ===========================
// LIGHTING
// ===========================
const fillLight = new THREE.HemisphereLight(
    0xffffff,   // sky
    0xcccccc,   // ground
    0.6         // intensity
);
scene.add(fillLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 300;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.0005;
directionalLight.shadow.normalBias = 0.02;
scene.add(directionalLight);

const helper = new THREE.DirectionalLightHelper(directionalLight, 2);
scene.add(helper);

// ===========================
// GROUND
// ===========================
// const groundGeometry = new THREE.PlaneGeometry(100, 100);
// const groundMaterial = new THREE.MeshBasicMaterial({
//     // color: 0x6b8e23,
//     // roughness: 0.8

// });
// const ground = new THREE.Mesh(groundGeometry, groundMaterial);
// ground.rotation.x = -Math.PI / 2;
// ground.receiveShadow = true;
// scene.add(ground);

// ===========================
// MAP MODEL
// ===========================
const loader = new GLTFLoader();
loader.load('models/map.glb', (gltf) => {
    const map = gltf.scene;
    map.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = true;
            // child.material.envMapIntensity = 0.3; 
        }
    });
    map.scale.set(1, 1, 1)
    scene.add(map);
}, undefined, (error) => {
    console.error('Error loading map:', error);
});


// ===========================
// INITIALIZATION
// ===========================
export function initScene() {
    document.querySelector('#app').appendChild(renderer.domElement);
}

// ===========================
// WINDOW RESIZE
// ===========================
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);

// ===========================
// RENDER
// ===========================
export function render() {
    renderer.render(scene, camera);
}
