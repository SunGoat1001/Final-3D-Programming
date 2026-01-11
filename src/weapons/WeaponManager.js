import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getControls } from '../controls.js';
import {
    WEAPONS,
    WEAPON_SLOTS,
    DEFAULT_WEAPON,
    getWeaponData,
    getWeaponBySlot,
    calculateDamage,
    isRangedWeapon,
    isMeleeWeapon,
    WeaponType
} from './WeaponData.js';
import { scene } from '../scene.js';
import {
    playRifleShot,
    playRifleReload,
    playShotgunShot,
    playShotgunReload,
    playSwordSwing,
    playSwitchWeapon,
    playGrenadeThrow,
    playEmptyClick
} from '../audio.js';

/**
 * WeaponManager - Quản lý vũ khí của người chơi
 * Xử lý chuyển đổi súng, bắn, nạp đạn
 */
export class WeaponManager {
    constructor(camera) {
        this.camera = camera;

        // Current weapon state
        this.currentWeaponId = DEFAULT_WEAPON;
        this.currentWeapon = getWeaponData(this.currentWeaponId);

        // Ammo tracking for each weapon
        this.ammoState = {};
        this._initializeAmmoState();

        // Weapon meshes (placeholders)
        this.weaponMeshes = {};
        this._createWeaponMeshes();
        this.muzzlePoints = {}; // store local muzzle points per weapon
        // Shooting state
        this.canShoot = true;
        this.lastShootTime = 0;

        // Reload state
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.reloadProgress = 0;

        // Aim Animation State
        this.aimProgress = 0; // 0 = hip, 1 = ads

        // Equip Animation State
        this.isEquipping = false;
        this.equipProgress = 0;
        this.equipDuration = 0.3; // seconds

        // Animation States
        this.shootAnimStartTime = 0;
        this.meleeAnimStartTime = 0;
        this.shootAnimDuration = 0.15; // fast recoil
        this.shootAnimDuration = 0.15; // fast recoil
        this.meleeAnimDuration = 0.4; // sword swing duration

        // Sway State
        this.swayPosition = new THREE.Vector3(0, 0, 0);
        this.swayRotation = new THREE.Euler(0, 0, 0);
        this.SWAY_AMOUNT = 0.02;
        this.SWAY_SMOOTHING = 10.0;
        this.SWAY_ROTATION_AMOUNT = 0.1;



        // Callbacks
        this.onShootCallback = null;
        this.onReloadStart = null;
        this.onReloadEnd = null;
        this.onWeaponSwitch = null;
        this.onAmmoChange = null;
        this.onCharacterLoaded = null;

        // Input bindings
        this._bindInputs();

        // Equip default weapon
        this._equipWeapon(this.currentWeaponId);

        console.log('[WeaponManager] Initialized with', this.currentWeapon.name);
        this._checkLowAmmo();

        // Player Model
        this.playerModel = null;
        this.rightHandBone = null;
        this.leftHandBone = null;
        this.rightArmBone = null;
        this.rightForeArmBone = null;
        this.leftArmBone = null;
        this.leftForeArmBone = null;
        this._loadPlayerModel();
    }

    /**
     * Initialize ammo state for all weapons
     */
    _initializeAmmoState() {
        for (const [id, weapon] of Object.entries(WEAPONS)) {
            this.ammoState[id] = {
                currentAmmo: weapon.maxAmmo,
                reserveAmmo: weapon.reserveAmmo
            };
        }
    }

    /**
     * Create placeholder weapon meshes and load real 3D models
     */
    _createWeaponMeshes() {
        // Model paths and transform configurations for each weapon
        const modelConfigs = {
            RIFLE: {
                path: 'models/hk_g36.glb',
                position: { x: 0, y: -0.05, z: 0.1 },
                rotation: { x: 0, y: Math.PI, z: 0 },
                scale: { x: 0.08, y: 0.08, z: 0.08 },
                muzzle: { x: 0.05, y: 0.0005, z: -0.9 } 
            },
            SHOTGUN: {
                path: 'models/shotgun.glb',
                position: { x: 0.05, y: -0.25, z: 0.2 },
                rotation: { x: 0, y: Math.PI, z: 0 },
                scale: { x: 0.07, y: 0.07, z: 0.07 },
                muzzle: { x: 0.1, y: 0.03, z: -1.4 }   
            },
            SWORD: {
                path: 'models/sword.glb',
                position: { x: 0.15, y: -0.7, z: -0.3 },
                rotation: { x: -Math.PI / 3, y: Math.PI, z: 0 },
                scale: { x: 0.006, y: 0.006, z: 0.006 }
            },
            GRENADE: {
                path: 'models/nade.glb',
                position: { x: 0, y: -0.05, z: -0.05 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 0.60, y: 0.60, z: 0.60 }
            }
        };

        const loader = new GLTFLoader();

        for (const [id, weapon] of Object.entries(WEAPONS)) {
            // Create placeholder (kept but hidden)
            const group = this._createWeaponPlaceholder(weapon);
            group.visible = false;
            scene.add(group);
            this.weaponMeshes[id] = group;

            // Hide placeholder meshes (keep the group structure)
            group.traverse((child) => {
                if (child.isMesh) {
                    child.visible = false;
                }
            });

            // Load real 3D model
            const config = modelConfigs[id];
            if (config) {
                loader.load(
                    config.path,
                    (gltf) => {
                        const model = gltf.scene;

                        // Apply transform from config
                        model.position.set(config.position.x, config.position.y, config.position.z);
                        model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
                        model.scale.set(config.scale.x, config.scale.y, config.scale.z);

                        // Enable shadows on model meshes
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = false;
                            }
                        });

                        // Add as child to the weapon group
                        group.add(model);
                        // Save muzzle local position for this weapon
                        if (config.muzzle) {
                            this.muzzlePoints[id] = new THREE.Vector3(
                                config.muzzle.x,
                                config.muzzle.y,
                                config.muzzle.z
                            );
                        }


                        console.log(`[WeaponManager] Loaded 3D model for ${weapon.name}`);
                    },
                    undefined,
                    (error) => {
                        console.error(`[WeaponManager] Error loading model for ${weapon.name}:`, error);
                    }
                );
            }
        }
    }

    /**
     * Load the player character model
     */
    _loadPlayerModel() {
        const loader = new GLTFLoader();
        loader.load('models/messi_character.glb', (gltf) => {
            this.playerModel = gltf.scene;
            
            // Adjust scale/position
            // FPS Camera is usually at eye level (1.6m). The model needs to be lowered so eyes match camera.
            // Model origin is usually at feet.
            // SCALE: User reported 0.02 was still too big. 
            // Reducing to 0.015 to better fit the weapon handle.
            this.playerModel.scale.set(0.020, 0.020, 0.020);

            // FPS Camera at 1.6m eye level
            this.playerModel.position.set(0, -1.6, 0); 
            // Rotate to face forward (Camera looks -Z, Model usually faces +Z)
            this.playerModel.rotation.y = Math.PI;

            // Enable shadows
            this.playerModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                }
                // Find Right Arm chain
                if (child.isBone) {
                    const name = child.name.toLowerCase();
                    
                    // Right Arm
                    if (!this.rightArmBone && (name.includes('rightarm') || name.includes('arm_r') || name.includes('mixamorig:rightarm'))) {
                         this.rightArmBone = child;
                    }
                    if (!this.rightForeArmBone && (name.includes('rightforearm') || name.includes('forearm_r') || name.includes('mixamorig:rightforearm'))) {
                         this.rightForeArmBone = child;
                    }

                    // Left Arm
                    if (!this.leftArmBone && (name.includes('leftarm') || name.includes('arm_l') || name.includes('mixamorig:leftarm'))) {
                         this.leftArmBone = child;
                    }
                    if (!this.leftForeArmBone && (name.includes('leftforearm') || name.includes('forearm_l') || name.includes('mixamorig:leftforearm'))) {
                         this.leftForeArmBone = child;
                    }
                }
                
                // Find Right Hand Bone
                if (child.isBone && !this.rightHandBone) {
                   const name = child.name.toLowerCase();
                   if (name.includes('righthand') || name.includes('hand_r') || name.includes('mixamorig:righthand')) {
                       this.rightHandBone = child;
                       console.log(`[WeaponManager] Found Right Hand Bone: ${child.name}`);
                   }
                }
                
                // Find Left Hand Bone
                if (child.isBone && !this.leftHandBone) {
                   const name = child.name.toLowerCase();
                   if (name.includes('lefthand') || name.includes('hand_l') || name.includes('mixamorig:lefthand')) {
                       this.leftHandBone = child;
                       console.log(`[WeaponManager] Found Left Hand Bone: ${child.name}`);
                   }
                }
            });

            if (!this.rightHandBone) console.warn('[WeaponManager] Could not find Right Hand bone!');
            if (!this.leftHandBone) console.warn('[WeaponManager] Could not find Left Hand bone!');
            if (!this.rightArmBone) console.warn('[WeaponManager] Could not find Right Arm bone!');
            if (!this.leftArmBone) console.warn('[WeaponManager] Could not find Left Arm bone!');

            // Add model to SCENE so it casts proper shadows and stays upright
            scene.add(this.playerModel);
            
            console.log('[WeaponManager] Player model loaded');

            // Notify UI
            if (this.onCharacterLoaded) {
                 this.onCharacterLoaded('Messi Character');
            }

        }, undefined, (err) => {
            console.error('[WeaponManager] Error loading player model:', err);
        });
    }

    /**
     * Create a placeholder mesh for a weapon
     * @param {Object} weapon - Weapon data
     * @returns {THREE.Group} Weapon mesh group
     */
    _createWeaponPlaceholder(weapon) {
        const group = new THREE.Group();
        group.name = `weapon_${weapon.id}`;

        if (weapon.type === WeaponType.MELEE) {
            // Sword placeholder - long thin box with handle
            const bladeGeometry = new THREE.BoxGeometry(
                weapon.size.width,
                weapon.size.height,
                weapon.size.length
            );
            const bladeMaterial = new THREE.MeshPhongMaterial({
                color: weapon.color,
                shininess: 100
            });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.z = -0.5;

            // Handle
            const handleGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.2, 8);
            const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x2a1a0a });
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.rotation.x = Math.PI / 2;
            handle.position.z = 0.05;

            group.add(blade);
            group.add(handle);
        } else {
            // Gun placeholder - box with barrel
            const bodyGeometry = new THREE.BoxGeometry(
                weapon.size.width,
                weapon.size.height,
                weapon.size.length * 0.7
            );
            const bodyMaterial = new THREE.MeshPhongMaterial({
                color: weapon.color,
                shininess: 30
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.z = -0.2;

            // Barrel
            const barrelLength = weapon.size.length * 0.4;
            const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.02, barrelLength, 8);
            const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.z = -0.5 - barrelLength / 2;

            // Stock
            const stockGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.15);
            const stockMaterial = new THREE.MeshPhongMaterial({ color: 0x3d2314 });
            const stock = new THREE.Mesh(stockGeometry, stockMaterial);
            stock.position.z = 0.12;
            stock.position.y = -0.03;

            group.add(body);
            group.add(barrel);
            group.add(stock);
        }

        return group;
    }

    /**
     * Bind keyboard inputs for weapon switching and reloading
     */
    _bindInputs() {
        document.addEventListener('keydown', (event) => {
            // Weapon switching with number keys (1, 2, 3, ...)
            const keyNum = parseInt(event.key);
            if (keyNum >= 1 && keyNum <= 9 && WEAPON_SLOTS[keyNum]) {
                this.switchWeapon(keyNum);
            }

            // Reload with R key
            if (event.code === 'KeyR') {
                this.reload();
            }
        });
    }

    /**
     * Switch to a weapon by slot number
     * @param {number} slot - Slot number (1, 2, 3, etc.)
     */
    switchWeapon(slot) {
        const weaponId = WEAPON_SLOTS[slot];
        if (!weaponId || weaponId === this.currentWeaponId) return;

        // Cancel reload if switching weapons
        if (this.isReloading) {
            this._cancelReload();
        }

        this._equipWeapon(weaponId);
    }

    /**
     * Equip a weapon by ID
     * @param {string} weaponId - Weapon ID
     */
    _equipWeapon(weaponId) {
        const weapon = getWeaponData(weaponId);
        playSwitchWeapon();
        if (!weapon) {
            console.error(`[WeaponManager] Unknown weapon: ${weaponId}`);
            return;
        }

        // Hide current weapon mesh
        if (this.weaponMeshes[this.currentWeaponId]) {
            this.weaponMeshes[this.currentWeaponId].visible = false;
        }

        // Update current weapon
        this.currentWeaponId = weaponId;
        this.currentWeapon = weapon;

        // Show new weapon mesh
        if (this.weaponMeshes[weaponId]) {
            this.weaponMeshes[weaponId].visible = true;
        }

        // Reset shooting state
        this.canShoot = true;
        this.lastShootTime = 0;
        this.shootAnimStartTime = 0;
        this.meleeAnimStartTime = 0;

        // Trigger equip animation
        this.isEquipping = true;
        this.equipProgress = 0;

        // Fire callback
        if (this.onWeaponSwitch) {
            this.onWeaponSwitch(weapon, this.getAmmoState());
        }

        console.log(`[WeaponManager] Equipped: ${weapon.name}`);
    }
    _checkLowAmmo() {
    if (!isRangedWeapon(this.currentWeapon)) {
        this.isLowAmmo = false;
        return;
    }

    const ammo = this.ammoState[this.currentWeaponId].currentAmmo;
    const threshold = this.currentWeapon.lowAmmoThreshold ?? 0;

    const newState = ammo <= threshold;

    if (newState !== this.isLowAmmo) {
        this.isLowAmmo = newState;

        // Notify UI
        if (this.onAmmoChange) {
            this.onAmmoChange(this.getAmmoState());
        }
    }
}


    /**
     * Get current ammo state
     * @returns {Object} { currentAmmo, reserveAmmo, maxAmmo }
     */
    getAmmoState() {
        const state = this.ammoState[this.currentWeaponId];
        return {
            currentAmmo: state.currentAmmo,
            reserveAmmo: state.reserveAmmo,
            maxAmmo: this.currentWeapon.maxAmmo
        };
    }

    /**
     * Attempt to shoot the current weapon
     * @returns {Object|null} Shot data or null if can't shoot
     */
    tryShoot() {
        // Can't shoot while reloading
        if (this.isReloading) {
            return null;
        }

        // Check fire rate
        const now = performance.now() / 1000;
        if (now - this.lastShootTime < this.currentWeapon.fireRate) {
            return null;
        }

        // Check ammo (for ranged weapons)
        if (isRangedWeapon(this.currentWeapon)) {
            const ammoState = this.ammoState[this.currentWeaponId];
            if (ammoState.currentAmmo <= 0) {
                playEmptyClick();
                // Auto reload when empty
                this.reload();
                return null;
            }

            // Consume ammo
            ammoState.currentAmmo--;
            this._checkLowAmmo();

            // Fire ammo change callback
            if (this.onAmmoChange) {
                this.onAmmoChange(this.getAmmoState());
            }
        }

        this.lastShootTime = now;

        // Generate shot data
        const shotData = this._generateShotData();

        // Fire shoot callback
        if (this.onShootCallback) {
            this.onShootCallback(shotData);
            // Play shoot sound
            if (this.currentWeapon.id === 'rifle') playRifleShot();
            if (this.currentWeapon.id === 'shotgun') playShotgunShot();
            if (this.currentWeapon.id === 'sword') playSwordSwing();
            if (this.currentWeapon.id === 'grenade') playGrenadeThrow();
        }

        // Trigger animations
        if (isRangedWeapon(this.currentWeapon)) {
            this.shootAnimStartTime = now;
        } else if (isMeleeWeapon(this.currentWeapon)) {
            this.meleeAnimStartTime = now;
        }

        return shotData;
    }

    /**
     * Generate shot data based on current weapon
     * @returns {Object} Shot data with directions, damage, etc.
     */
    _generateShotData() {
        const weapon = this.currentWeapon;
        const shots = [];

        // Get camera direction
        const baseDirection = new THREE.Vector3();
        this.camera.getWorldDirection(baseDirection);

        // Get camera position
        const origin = this.camera.position.clone();

        for (let i = 0; i < weapon.pellets; i++) {
            // Apply spread
            const direction = baseDirection.clone();
            if (weapon.spread > 0) {
                const spreadX = (Math.random() - 0.5) * weapon.spread * 2;
                const spreadY = (Math.random() - 0.5) * weapon.spread * 2;

                // Create rotation for spread
                const euler = new THREE.Euler(spreadY, spreadX, 0, 'YXZ');
                direction.applyEuler(euler);
            }

            // Calculate damage for this pellet
            const damage = calculateDamage(weapon);

            shots.push({
                origin: origin,
                direction: direction.normalize(),
                damage: damage,
                range: weapon.range,
                bulletSpeed: weapon.bulletSpeed
            });
        }

        return {
            weapon: weapon,
            weaponManager: this, 
            shots: shots,
            isRanged: isRangedWeapon(weapon),
            isMelee: isMeleeWeapon(weapon),
            timestamp: performance.now()
        };
    }

    /**
     * Start reloading the current weapon
     */
    reload() {
        // Can't reload melee weapons
        if (isMeleeWeapon(this.currentWeapon)) {
            return;
        }

        // Can't reload if already reloading
        if (this.isReloading) {
            return;
        }

        const ammoState = this.ammoState[this.currentWeaponId];

        // Can't reload if magazine is full
        if (ammoState.currentAmmo >= this.currentWeapon.maxAmmo) {
            return;
        }

        // Can't reload if no reserve ammo
        if (ammoState.reserveAmmo <= 0) {
            console.log('[WeaponManager] No reserve ammo!');
            return;
        }

        // Start reload
        this.isReloading = true;
        // Play reload sound
        if (this.currentWeapon.id === 'rifle') playRifleReload();
        if (this.currentWeapon.id === 'shotgun') playShotgunReload();

        this.reloadStartTime = performance.now();
        this.reloadProgress = 0;

        // Fire callback
        if (this.onReloadStart) {
            this.onReloadStart(this.currentWeapon.reloadTime);
        }

        console.log(`[WeaponManager] Reloading ${this.currentWeapon.name}...`);
    }

    /**
     * Cancel current reload
     */
    _cancelReload() {
        if (!this.isReloading) return;

        this.isReloading = false;
        this.reloadProgress = 0;

        console.log('[WeaponManager] Reload cancelled');
    }

    /**
     * Complete the reload
     */
    _completeReload() {
        const ammoState = this.ammoState[this.currentWeaponId];
        const neededAmmo = this.currentWeapon.maxAmmo - ammoState.currentAmmo;
        const ammoToLoad = Math.min(neededAmmo, ammoState.reserveAmmo);

        ammoState.currentAmmo += ammoToLoad;
        ammoState.reserveAmmo -= ammoToLoad;

        this.isReloading = false;
        this.reloadProgress = 0;

        // Fire callbacks
        if (this.onReloadEnd) {
            this.onReloadEnd();
        }
        if (this.onAmmoChange) {
            this.onAmmoChange(this.getAmmoState());
        }

        console.log(`[WeaponManager] Reload complete! Ammo: ${ammoState.currentAmmo}/${this.currentWeapon.maxAmmo}`);
        this._checkLowAmmo();
    }

    /**
     * Update weapon manager (call every frame)
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        const controls = getControls();
        const isThirdPerson = controls ? controls.isThirdPerson : false;

        // Update Player Model Transform
        if (this.playerModel) {
            if (isThirdPerson && controls && controls.sphereBody) {
                // 3rd Person: Match Physics Body exactly
                this.playerModel.position.copy(controls.sphereBody.position);
                // Align Upper Chest/Neck with Camera height (Sphere Center)
                // Was -1.6 (feet at ground), but model is small now. Raising it up.
                this.playerModel.position.y -= 1.25; 
                
                // Rotation: Match Camera Yaw (Control direction)
                const yaw = controls.euler.y;
                this.playerModel.rotation.set(0, yaw + Math.PI, 0); 
            } else {
                // 1st Person: Offset behind camera to hide body
                // Get camera yaw
                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(this.camera.quaternion);
                
                // Calculate Position: Camera Pos - Scale Offset (Move body behind camera)
                const yaw = euler.y;
                const backOffset = 0.25; // Meters behind camera
                
                const offsetX = Math.sin(yaw) * backOffset;
                const offsetZ = Math.cos(yaw) * backOffset;

                this.playerModel.position.x = this.camera.position.x + offsetX;
                this.playerModel.position.z = this.camera.position.z + offsetZ;
                this.playerModel.position.y = this.camera.position.y - 1.25; 
                
                // Sync Rotation
                this.playerModel.rotation.set(0, yaw + Math.PI, 0); 
            }
            
            // CRITICAL FIX: deeply update the matrix world of the character model
            // immediately after moving it, otherwise the Bone MatrixWorld used for IK
            // will be stale (from previous frame), causing the arms to explode/stretch
            // when calculating World->Local transforms.
            this.playerModel.updateMatrixWorld(true);
        }

        // Update weapon mesh position
        // Pass isThirdPerson flag to helper if needed, or handle it here?
        // Actually _updateWeaponPosition uses this.camera
        // We need to override it if 3rd person.
        this._updateWeaponPosition(deltaTime, isThirdPerson);


        // Update reload progress
        if (this.isReloading) {
            const elapsed = (performance.now() - this.reloadStartTime) / 1000;
            this.reloadProgress = elapsed / this.currentWeapon.reloadTime;

            if (elapsed >= this.currentWeapon.reloadTime) {
                this._completeReload();
            }
        }

        // Update aim progress logic
        this._updateAimState(deltaTime);

        // Update equip progress
        if (this.isEquipping) {
            this.equipProgress += deltaTime / this.equipDuration;
            if (this.equipProgress >= 1) {
                this.equipProgress = 1;
                this.isEquipping = false;
            }
        }

        // 1. Force Arms to "Raised" Position (Fake Shoulder IK)
        // Rotate Upper Arms forward so hands can reach the gun without stretching 2 meters
        if (this.rightArmBone) {
            // Reset rotation to identity first or just set specific angle? 
            // Better to lerp or just set static for now.
            // X-axis: 0 is down, -1.5 is forward/up. 
            // Z-axis: T-pose is 0. 
            // Lowering arm slightly (1.5 -> 1.3) per user request
            this.rightArmBone.rotation.set(1.3, 0, -0.3); // Raise Right Arm roughly forward
            this.rightArmBone.updateMatrixWorld();
        }
        if (this.leftArmBone) {
            this.leftArmBone.rotation.set(1.3, 0, 0.3); // Raise Left Arm roughly forward
            this.leftArmBone.updateMatrixWorld();
        }
        
        // Optional: Bend elbows slightly?
        if (this.rightForeArmBone) {
             this.rightForeArmBone.rotation.set(0.5, 0, 0); // Bend Elbow
             this.rightForeArmBone.updateMatrixWorld();
        }
        if (this.leftForeArmBone) {
             this.leftForeArmBone.rotation.set(0.5, 0, 0); // Bend Elbow
             this.leftForeArmBone.updateMatrixWorld();
        }

        // Snap Hand Bone to Weapon (Fake IK)
        if (this.rightHandBone) {
            const mesh = this.weaponMeshes[this.currentWeaponId];
            if (mesh && mesh.visible) {
                 // We want the HAND to be at the WEAPON HANDLE.
                 // Weapon is positioned by _updateWeaponPosition (Floating).
                 // We force the hand bone to match that position.
                 
                 // 1. Get Weapon World Transform
                 const targetPos = new THREE.Vector3();
                 const targetQuat = new THREE.Quaternion();
                 mesh.getWorldPosition(targetPos);
                 mesh.getWorldQuaternion(targetQuat);

                 // 2. Convert to Hand Bone Parent's Local Space
                 // 2. Apply Right Hand (Handle/Trigger)
                 // User reported Right Hand was at Tip. We need to move it BACK (+Z).
                 // Weapon points -Z. Back is +Z.
                 
                 // Offset for Right Hand relative to Weapon Origin (which seems to be near tip/center)
                 // Adjust this until Right Hand hits the pistol grip.
                 const rhOffset = new THREE.Vector3(0, -0.05, 0.3); // Back 30cm, Down 5cm
                 
                 // Apply rotation to offset
                 const rhOffsetWorld = rhOffset.clone().applyQuaternion(targetQuat);
                 const rhFinalPos = targetPos.clone().add(rhOffsetWorld);

                 // Convert to Hand Bone Parent's Local Space
                 if (this.rightHandBone.parent) {
                      const parent = this.rightHandBone.parent;
                      const parentInv = parent.matrixWorld.clone().invert();
                      
                      const localPos = rhFinalPos.clone().applyMatrix4(parentInv);
                      
                      const parentQuat = new THREE.Quaternion();
                      parent.getWorldQuaternion(parentQuat);
                      const parentInvQuat = parentQuat.clone().invert();
                      
                      const handQuat = targetQuat.clone().premultiply(parentInvQuat); // Local = ParentInv * World
                      
                      // Apply to Bone
                      this.rightHandBone.position.copy(localPos);
                      this.rightHandBone.quaternion.copy(handQuat);
                      
                      // Rotate Hand to align with Gun
                      this.rightHandBone.rotateX(-Math.PI/2);
                 }

                  // 3. Snap Left Hand (Foregrip / Barrel)
                 if (this.leftHandBone && this.leftHandBone.parent) {
                      // Scale Left Hand down slightly per user request
                      this.leftHandBone.scale.set(0.8, 0.8, 0.8);

                      // Determine Left Hand Offset based on weapon type
                      // This offset is relative to the WEAPON ORIGIN (targetPos), NOT the Right Hand.
                      // Right Hand is at +0.3 (Back).
                      // Previous Left Hand was -0.15 (Front).
                      // User wants it "thụt vào trong" (retracted/closer).
                      // Let's move it back to -0.05 (closer to receiver).
                      
                      let lhOffset = new THREE.Vector3(0, -0.05, -0.05); 

                      if (this.currentWeapon.id === 'SHOTGUN') {
                          lhOffset.set(0, -0.1, -0.2); // Pump handle
                      } else if (this.currentWeapon.id === 'SWORD') {
                           lhOffset = null; 
                      } else if (this.currentWeapon.id === 'GRENADE') {
                          lhOffset = null;
                      }

                      if (lhOffset) {
                          // Get World Position of the "Foregrip"
                          const foregripPos = targetPos.clone(); // Start at weapon origin
                          
                          // Apply weapon rotation to the local offset
                          const offsetWorld = lhOffset.clone().applyQuaternion(targetQuat);
                          
                          foregripPos.add(offsetWorld); // Add to world pos

                          // Convert to Left Hand Bone Parent Space
                          const parent = this.leftHandBone.parent;
                          const parentInv = parent.matrixWorld.clone().invert();
                          
                          foregripPos.applyMatrix4(parentInv);

                          // Set Bone Position
                          this.leftHandBone.position.copy(foregripPos);

                           // Orientation: Left hand should grip the barrel.
                           const parentQuat = new THREE.Quaternion();
                           parent.getWorldQuaternion(parentQuat);
                           const parentInvQuat = parentQuat.clone().invert();
                           
                           const handQuat = targetQuat.clone().premultiply(parentInvQuat);
                           this.leftHandBone.quaternion.copy(handQuat);

                           this.leftHandBone.rotateX(-Math.PI/2);
                           // User requested "ngửa ra" (palm up/supinated).
                           // Currently Y = PI (180). Let's try 0 or -PI/2.
                           // Actually, let's try rotating Z axis which is usually wrist twist.
                           this.leftHandBone.rotateY(0); // Resetting Y rotation to see default palm up state 
                      }
                 }
            }
        }
    }

    /**
     * Update aim progress
     * @param {number} deltaTime
     */
    _updateAimState(deltaTime) {
        const controls = getControls();
        const isAiming = controls ? controls.isAiming : false;

        // Speed of aim transition
        const aimSpeed = 8.0;

        if (isAiming) {
            this.aimProgress = Math.min(this.aimProgress + deltaTime * aimSpeed, 1);
        } else {
            this.aimProgress = Math.max(this.aimProgress - deltaTime * aimSpeed, 0);
        }
    }

    /**
     * Update weapon mesh position to follow camera (viewmodel)
     * @param {number} deltaTime
     * @param {boolean} isThirdPerson
     */
    _updateWeaponPosition(deltaTime, isThirdPerson = false) {
        const controls = getControls();
        const mesh = this.weaponMeshes[this.currentWeaponId];
        if (!mesh) return;

        // Get offsets from weapon data or defaults
        const defaultHip = { x: 0.25, y: -0.15, z: -0.5 };
        const baseOffset = this.currentWeapon.positionOffset || defaultHip;
        const adsOffset = this.currentWeapon.adsOffset || { ...defaultHip, x: 0 }; // fallback if missing

        // Determine Reference Frame (Camera vs Virtual Eyes)
        let refPosition, refQuaternion;
        
        if (isThirdPerson && controls && controls.sphereBody) {
             // Virtual Eye Position (where 1st person Cam would be)
             refPosition = controls.sphereBody.position.clone();
             refPosition.y += 0.0; // Eye height relative to center (0.0 matches camera default?)
             // Note: Controls syncs camera.y to sphereBody.y + offset.
             // We want the same Y as the 1st person camera would allow.
             // Usually sphere center is 0. Feet -0.5. Eyes +0.x?
             // Actually controls.currentCameraYOffset handles this.
             refPosition.y += controls.currentCameraYOffset;

             // Rotation matches control Yaw/Pitch
             refQuaternion = this.camera.quaternion.clone(); // Camera rotation is still correct for aim direction
        } else {
             // 1st Person: Use actual camera
             refPosition = this.camera.position.clone();
             refQuaternion = this.camera.quaternion.clone();
        }

        // 1. Base Aim Lerp (Hip <-> ADS)
        const currentLocalOffset = new THREE.Vector3().lerpVectors(
            new THREE.Vector3(baseOffset.x, baseOffset.y, baseOffset.z),
            new THREE.Vector3(adsOffset.x, adsOffset.y, adsOffset.z),
            this.aimProgress
        );

        // 2. Procedural Reload Animation
        // Sequence: Lower -> Tilt -> Return
        let reloadRotation = new THREE.Euler(0, 0, 0);
        let reloadOffset = new THREE.Vector3(0, 0, 0);

        if (this.isReloading) {
            const p = this.reloadProgress; // 0 to 1

            if (p < 0.2) {
                // Phase 1: Lower weapon (0 -> 0.2)
                const t = p / 0.2;
                reloadOffset.y = -0.2 * Math.sin(t * Math.PI * 0.5);
                reloadRotation.x = 0.5 * Math.sin(t * Math.PI * 0.5); // Tilt up
            } else if (p < 0.8) {
                // Phase 2: Hold/Shake (0.2 -> 0.8)
                reloadOffset.y = -0.2;
                reloadRotation.x = 0.5;

                // Detailed shake for inserting actions
                // Just small noise
                reloadRotation.z = Math.sin(p * 20) * 0.05;
                reloadOffset.y += Math.sin(p * 30) * 0.01;
            } else {
                // Phase 3: Return (0.8 -> 1.0)
                const t = (p - 0.8) / 0.2;
                reloadOffset.y = -0.2 * (1 - t);
                reloadRotation.x = 0.5 * (1 - t);
            }
        }

        // 3. Procedural Equip Animation
        // Raise from bottom
        let equipOffset = new THREE.Vector3(0, 0, 0);
        let equipRotation = new THREE.Euler(0, 0, 0);

        if (this.isEquipping || this.equipProgress < 1) {
            // Bezier-ish curve for smooth raising
            const t = 1 - Math.pow(this.equipProgress - 1, 2); // Ease out
            const startY = -0.5;
            const startRotX = 1.0;

            equipOffset.y = startY * (1 - this.equipProgress);
            equipRotation.x = startRotX * (1 - this.equipProgress);
        }

        // 4. Procedural Shoot/Recoil Animation (Ranged)
        let recoilOffset = new THREE.Vector3(0, 0, 0);
        let recoilRotation = new THREE.Euler(0, 0, 0);

        const now = performance.now() / 1000;
        if (isRangedWeapon(this.currentWeapon) && this.shootAnimStartTime > 0) {
            const timeSinceShoot = now - this.shootAnimStartTime;
            if (timeSinceShoot < this.shootAnimDuration) {
                const t = timeSinceShoot / this.shootAnimDuration;

                // Impulse: Fast back, slow return
                // Power curve
                const kick = Math.sin(t * Math.PI) * (1 - t);

                recoilOffset.z = 0.15 * kick; // Kick back
                recoilOffset.y = 0.02 * kick; // Slight up
                recoilRotation.x = 0.2 * kick; // Muzzle climb
            }
        }

        // 5. Procedural Melee Swing Animation (Sword)
        let meleeOffset = new THREE.Vector3(0, 0, 0);
        let meleeRotation = new THREE.Euler(0, 0, 0);

        if (isMeleeWeapon(this.currentWeapon)) {
            // Base Idle Rotation ("Pointing to Sky")
            // Blade is at -Z (Forward). We need Positive X rotation to point it Up (+Y).
            meleeOffset.x = 0.2; // Right side
            meleeOffset.y = -0.3; // Low enough so we see the blade rise
            meleeOffset.z = -0.3; // Forward

            meleeRotation.x = 1.6; // ~90 degrees Up
            meleeRotation.y = -0.3;  // Tilt slightly left (inward)
            meleeRotation.z = -0.1; // Cant

            if (this.meleeAnimStartTime > 0) {
                const timeSinceMelee = now - this.meleeAnimStartTime;
                if (timeSinceMelee < this.meleeAnimDuration) {
                    const t = timeSinceMelee / this.meleeAnimDuration;

                    // Chop Down Animation (From Up to Forward/Down)
                    if (t < 0.2) {
                        // Wind up: Cock back (Point further up/back)
                        const wt = t / 0.2;
                        meleeRotation.x = 1.6 + (0.3 * wt);
                        meleeOffset.y = -0.3 - (0.1 * wt); // Lower slightly to gather power
                    } else if (t < 0.6) {
                        // Swing: Fast chop Down
                        // From 1.9 (Up/Back) to 0.0 (Forward)
                        const st = (t - 0.2) / 0.4;
                        const start = 1.9;
                        const end = 0.2; // Level with horizon
                        meleeRotation.x = start + (end - start) * st;

                        meleeOffset.z = -0.3 - (0.4 * Math.sin(st * Math.PI)); // Reach out
                        meleeOffset.y = -0.3 + (0.1 * st); // Move up slightly as arm extends? or down?
                    } else {
                        // Recovery: Return to Up
                        const rt = (t - 0.6) / 0.4;
                        const start = 0.2;
                        const end = 1.6;
                        // Ease out
                        const ease = 1 - Math.pow(1 - rt, 2);
                        meleeRotation.x = start + (end - start) * ease;
                        meleeOffset.z = -0.3 * (1 - ease) - 0.3;
                    }
                }
            }
        }

        // 6. Weapon Sway
        // Calculate target sway based on mouse movement
        let targetSwayPos = new THREE.Vector3(0, 0, 0);
        let targetSwayRot = new THREE.Euler(0, 0, 0);

        if (controls) {
            const swayDelta = controls.getSwayDelta();
            if (swayDelta) { // Check if method exists
                // Position sway (Gun drags behind movement)
                // Mouse Right (positive X) -> Gun moves Left (negative X)
                // Mouse Up (negative Y) -> Gun moves Down (negative Y)? 
                // Usually Up mouse = negative Y delta. If I look up, gun should drag down?
                // dragging down means negative Y. So deltaY (neg) -> neg Y.
                // scaling:
                const factor = 0.0005; 
                targetSwayPos.x = -swayDelta.x * factor;
                targetSwayPos.y = swayDelta.y * factor; // mouse down (+Y) -> gun down (-Y)? No usually +Y delta is mouse down.
                // Standard: Mouse Down -> +Y delta -> Look Down. Gun should drag Up (+Y).
                // So if deltaY > 0, targetY > 0.

                // Rotation sway
                const rotFactor = 0.002;
                targetSwayRot.y = -swayDelta.x * rotFactor; // Look Right -> Twist Left
                targetSwayRot.x = -swayDelta.y * rotFactor; // Look Down -> Twist Up
            }
        }

        // Scale sway by aim progress (less sway when aiming)
        const aimFactor = 1.0 - this.aimProgress * 0.8; // 20% sway at full aim
        targetSwayPos.multiplyScalar(aimFactor);
        targetSwayRot.x *= aimFactor;
        targetSwayRot.y *= aimFactor;

        // Clamp targets
        const maxSway = 0.1;
        targetSwayPos.x = Math.max(Math.min(targetSwayPos.x, maxSway), -maxSway);
        targetSwayPos.y = Math.max(Math.min(targetSwayPos.y, maxSway), -maxSway);

        // Smoothly interpolate current sway to target (which is 0 if no input, but here input is impulsive)
        // Wait, getSwayDelta returns the frame's delta. If I stop moving, delta is 0.
        // So target becomes 0.
        // We want 'currentSway' to move towards 'targetSway' (which is the input offset).
        // Then if target becomes 0, currentSway moves back to 0.

        // Correct logic:
        // We don't just "set" target. We want the sway to "lag" behind.
        // Actually, typical implementation:
        // target = rawInput * scaler
        // current.lerp(target, smooth)
        
        // But input is per frame. Ideally input should be smooth or we smooth the result.
        
        // Let's rely on Lerp. 
        // Note: deltaTime is in seconds.
        const smoothTime = 8.0 * deltaTime;
        
        // Lerp position
        this.swayPosition.lerp(targetSwayPos, smoothTime);
        
        // Lerp rotation (manual for Euler)
        // We can treat Euler as vector for small angles
        this.swayRotation.x = THREE.MathUtils.lerp(this.swayRotation.x, targetSwayRot.x, smoothTime);
        this.swayRotation.y = THREE.MathUtils.lerp(this.swayRotation.y, targetSwayRot.y, smoothTime);


        // COMBINE TRANSFORMATIONS

        // Apply camera quaternion to align with view
        mesh.quaternion.copy(refQuaternion);

        // Apply local rotations (Equip + Reload + Recoil + Melee + Sway)
        // Note: Order matters. We rotate the mesh "locally" relative to camera
        mesh.rotateX(reloadRotation.x + equipRotation.x + recoilRotation.x + meleeRotation.x + this.swayRotation.x);
        mesh.rotateY(reloadRotation.y + meleeRotation.y + this.swayRotation.y);
        mesh.rotateZ(reloadRotation.z + meleeRotation.z);

        // Combine offsets (Aim + Reload + Equip + Recoil + Melee + Sway)
        // These are strictly local to the camera view
        const finalLocalPosition = currentLocalOffset.clone()
            .add(reloadOffset)
            .add(equipOffset)
            .add(recoilOffset)
            .add(meleeOffset)
            .add(this.swayPosition);

        // Transform local position to world space relative to camera
        const worldOffset = finalLocalPosition.clone();
        worldOffset.applyQuaternion(refQuaternion);

        // Set final position
        mesh.position.copy(refPosition).add(worldOffset);
    }

    /**
     * Get current weapon info for UI
     * @returns {Object} Weapon info
     */
    getWeaponInfo() {
        return {
            name: this.currentWeapon.name,
            type: this.currentWeapon.type,
            ...this.getAmmoState(),
            isReloading: this.isReloading,
            reloadProgress: this.reloadProgress,
            moveSpeedMultiplier: this.currentWeapon.moveSpeedMultiplier
        };
    }

    /**
     * Add ammo to reserve
     * @param {string} weaponId - Weapon ID (or null for current weapon)
     * @param {number} amount - Amount of ammo to add
     */
    addAmmo(weaponId = null, amount = 30) {
        const id = weaponId || this.currentWeaponId;
        if (this.ammoState[id]) {
            this.ammoState[id].reserveAmmo += amount;

            if (this.onAmmoChange && id === this.currentWeaponId) {
                this.onAmmoChange(this.getAmmoState());
            }
        }
    }
     getMuzzleWorldPosition() {
        const mesh = this.weaponMeshes[this.currentWeaponId];
        const local = this.muzzlePoints[this.currentWeaponId];
        if (!mesh || !local) return null;

        const worldPos = local.clone();
        worldPos.applyMatrix4(mesh.matrixWorld);
        return worldPos;
    }

}

export default WeaponManager;
