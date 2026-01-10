import * as THREE from 'three';
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

        // Shooting state
        this.canShoot = true;
        this.lastShootTime = 0;

        // Reload state
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.reloadProgress = 0;

        // Callbacks
        this.onShootCallback = null;
        this.onReloadStart = null;
        this.onReloadEnd = null;
        this.onWeaponSwitch = null;
        this.onAmmoChange = null;

        // Input bindings
        this._bindInputs();

        // Equip default weapon
        this._equipWeapon(this.currentWeaponId);

        console.log('[WeaponManager] Initialized with', this.currentWeapon.name);
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
     * Create placeholder weapon meshes
     */
    _createWeaponMeshes() {
        for (const [id, weapon] of Object.entries(WEAPONS)) {
            const mesh = this._createWeaponPlaceholder(weapon);
            mesh.visible = false;
            scene.add(mesh);
            this.weaponMeshes[id] = mesh;
        }
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

        // Fire callback
        if (this.onWeaponSwitch) {
            this.onWeaponSwitch(weapon, this.getAmmoState());
        }

        console.log(`[WeaponManager] Equipped: ${weapon.name}`);
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
                // Auto reload when empty
                this.reload();
                return null;
            }

            // Consume ammo
            ammoState.currentAmmo--;

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
    }

    /**
     * Update weapon manager (call every frame)
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update weapon mesh position to follow camera
        this._updateWeaponPosition();

        // Update reload progress
        if (this.isReloading) {
            const elapsed = (performance.now() - this.reloadStartTime) / 1000;
            this.reloadProgress = elapsed / this.currentWeapon.reloadTime;

            if (elapsed >= this.currentWeapon.reloadTime) {
                this._completeReload();
            }
        }
    }

    /**
     * Update weapon mesh position to follow camera (viewmodel)
     */
    _updateWeaponPosition() {
        const mesh = this.weaponMeshes[this.currentWeaponId];
        if (!mesh) return;

        // Position weapon in front and to the right of camera
        const offset = new THREE.Vector3(0.25, -0.15, -0.5);
        offset.applyQuaternion(this.camera.quaternion);

        mesh.position.copy(this.camera.position).add(offset);
        mesh.quaternion.copy(this.camera.quaternion);

        // Add bobbing effect based on reload state
        if (this.isReloading) {
            const bobAmount = Math.sin(this.reloadProgress * Math.PI * 2) * 0.05;
            mesh.position.y += bobAmount;
        }
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
}

export default WeaponManager;
