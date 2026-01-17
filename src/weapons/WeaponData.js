// ===========================
// WEAPON DATA DEFINITIONS
// ===========================
// Chuẩn hóa dữ liệu cho tất cả vũ khí trong game

/**
 * Weapon Types
 */
export const WeaponType = {
    RANGED: 'ranged',
    MELEE: 'melee'
};

/**
 * Base Weapon Data Structure
 * @typedef {Object} WeaponData
 * @property {string} name - Tên vũ khí
 * @property {string} type - Loại vũ khí (ranged/melee)
 * @property {number} damage - Sát thương cơ bản
 * @property {number} damageMax - Sát thương tối đa (random range)
 * @property {number} fireRate - Thời gian giữa các lần bắn (giây)
 * @property {number} maxAmmo - Số đạn tối đa trong băng
 * @property {number} reserveAmmo - Đạn dự trữ ban đầu
 * @property {number} reloadTime - Thời gian nạp đạn (giây)
 * @property {number} moveSpeedMultiplier - Hệ số tốc độ di chuyển
 * @property {number} range - Tầm bắn hiệu quả (mét)
 * @property {number} pellets - Số viên đạn mỗi phát (cho shotgun)
 * @property {number} spread - Độ tản đạn (radian)
 * @property {string} description - Mô tả vũ khí
 */

/**
 * Weapon Definitions
 */
export const WEAPONS = {
    // ===========================
    // RIFLE - Súng trường
    // ===========================
    RIFLE: {
        id: 'rifle',
        name: 'Assault Rifle',
        type: WeaponType.RANGED,


        // Damage
        damage: 25,
        damageMax: 30,

        // Fire Rate
        fireRate: 0.12,          // 0.1-0.15s between shots (~8 rounds/sec)

        // Fire Mode
        fireModes: ['SINGLE', 'AUTO'],
        fireMode: 'SINGLE',

        // Ammo
        maxAmmo: 30,             // 30 rounds per magazine
        reserveAmmo: 90,         // 3 extra magazines
        lowAmmoThreshold: 5,
        // Reload
        reloadTime: 2.5,         // 2-3 seconds

        // Movement
        moveSpeedMultiplier: 0.24,  // Slight slowdown when equipped

        // Ballistics
        range: 100,              // 100 meters effective range
        pellets: 1,              // Single raycast
        spread: 0.01,            // Minimal spread (radians)
        bulletSpeed: 200,        // Fast bullets

        // Visual placeholder
        color: 0x4a4a4a,         // Dark gray
        size: { length: 0.8, height: 0.15, width: 0.08 },

        description: 'Súng trường tấn công với chế độ bắn Đơn và Tự động. Hiệu quả ở mọi khoảng cách.',

        // Positioning
        positionOffset: { x: 0.25, y: -0.15, z: -0.5 },
        adsOffset: { x: 0, y: -0.115, z: -0.5 } // Center aligned
    },

    // ===========================
    // SHOTGUN - Súng hoa cải
    // ===========================
    SHOTGUN: {
        id: 'shotgun',
        name: 'Combat Shotgun',
        type: WeaponType.RANGED,

        // Damage (per pellet)
        damage: 15,
        damageMax: 20,

        // Fire Rate
        fireRate: 0.9,           // 0.8-1.0s between shots (pump action)

        // Ammo
        maxAmmo: 7,              // 6 shells per magazine
        reserveAmmo: 28,         // 4 extra loads
        lowAmmoThreshold: 2,
        // Reload
        reloadTime: 3.0,         // Longer reload due to single shell loading

        // Movement
        moveSpeedMultiplier: 0.17,   // More slowdown (heavier weapon)

        // Ballistics
        range: 20,               // 20 meters effective range
        pellets: 7,              // 6-8 pellets per shot
        spread: 0.15,            // Wide spread (radians)
        bulletSpeed: 120,        // Slower pellets

        // Visual placeholder
        color: 0x654321,         // Brown
        size: { length: 0.9, height: 0.12, width: 0.1 },

        description: 'Shotgun với đa viên đạn mỗi phát bắn. Cực kỳ mạnh ở cự ly gần nhưng yếu ở xa.',

        // Positioning
        positionOffset: { x: 0.25, y: -0.18, z: -0.5 },
        adsOffset: { x: 0, y: -0.14, z: -0.5 }
    },

    // ===========================
    // SWORD - Kiếm
    // ===========================
    SWORD: {
        id: 'sword',
        name: 'Combat Sword',
        type: WeaponType.MELEE,

        // Damage
        damage: 50,
        damageMax: 65,

        // Attack Rate
        fireRate: 0.6,           // Swing speed (attacks per second base)

        // Ammo (N/A for melee)
        maxAmmo: Infinity,       // Unlimited
        reserveAmmo: Infinity,

        // Cooldown between swings
        reloadTime: 0,           // No reload for melee

        // Movement
        moveSpeedMultiplier: 0.3,   // Faster movement with light weapon

        // Range
        range: 3,                // 3 meters melee range
        pellets: 1,              // Single hit
        spread: 0,               // No spread

        // Visual placeholder
        color: 0xc0c0c0,         // Silver
        size: { length: 1.0, height: 0.05, width: 0.15 },

        description: 'Kiếm cận chiến với sát thương cao. Di chuyển nhanh hơn nhưng phải tiếp cận gần mục tiêu.',

        // Positioning
        positionOffset: { x: 0.35, y: -0.2, z: -0.6 },
        rangeOffset: { x: 0.35, y: -0.2, z: -0.5 }, // Same for melee usually
        adsOffset: { x: 0, y: -0.15, z: -0.6 } // Center but melee doesn't really ADS
    },
    // ===========================
    // BAZOOKA
    // ===========================
    BAZOOKA: {
        id: 'bazooka',
        name: 'Bazooka',
        type: WeaponType.RANGED,

        damage: 120,
        damageMax: 160,

        // Fire Mode
        fireModes: ['SINGLE'],
        fireMode: 'SINGLE',

        fireRate: 2.0,

        maxAmmo: 1,
        reserveAmmo: 10,
        lowAmmoThreshold: 1,

        reloadTime: 3.5,

        moveSpeedMultiplier: 0.05, // heavy

        range: 60,
        pellets: 1,
        spread: 0.01,

        bulletSpeed: 50,

        color: 0x333333,
        size: { length: 1.2, height: 0.2, width: 0.2 },

        description: 'Heavy explosive weapon. High damage but slow reload.',

        positionOffset: { x: 0.2, y: -0.2, z: -0.5 },
        adsOffset: { x: 0, y: -0.2, z: -0.5 }
    },

    // ===========================
    // GRENADE
    // ===========================
    GRENADE: {
        id: 'grenade',
        name: 'Grenade',
        type: WeaponType.RANGED,



        damage: 120,
        damageMax: 160,

        fireRate: 0.8,

        maxAmmo: 1,
        reserveAmmo: 5,
        lowAmmoThreshold: 0,

        reloadTime: 1.0,

        moveSpeedMultiplier: 0.3,

        range: 15,
        pellets: 1,
        spread: 0,

        bulletSpeed: 15, // throw force

        color: 0x228822,
        size: { length: 0.2, height: 0.2, width: 0.2 },

        description: 'Explosive grenade. Deals area damage after delay.',
        positionOffset: { x: 0.2, y: -0.1, z: -0.4 },
        adsOffset: { x: 0, y: -0.1, z: -0.4 }
    },


};


/**
 * Weapon Slot Assignments
 * Maps keyboard number keys to weapons
 */
export const WEAPON_SLOTS = {
    1: 'RIFLE',      // Key 1 = Rifle
    2: 'SHOTGUN',    // Key 2 = Shotgun  
    3: 'BAZOOKA',    // Key 3 = Bazooka
    4: 'SWORD',      // Key 4 = Sword
    5: 'GRENADE'     // Key 5 = Grenade
};

/**
 * Default weapon when spawning
 */
export const DEFAULT_WEAPON = 'RIFLE';

/**
 * Get weapon data by ID
 * @param {string} weaponId - The weapon ID (e.g., 'RIFLE')
 * @returns {WeaponData|null} The weapon data or null if not found
 */
export function getWeaponData(weaponId) {
    return WEAPONS[weaponId] || null;
}

/**
 * Get weapon by slot number
 * @param {number} slot - The slot number (1, 2, 3, etc.)
 * @returns {WeaponData|null} The weapon data or null if not found
 */
export function getWeaponBySlot(slot) {
    const weaponId = WEAPON_SLOTS[slot];
    return weaponId ? getWeaponData(weaponId) : null;
}

/**
 * Calculate random damage within weapon's damage range
 * @param {WeaponData} weapon - The weapon data
 * @returns {number} Random damage value
 */
export function calculateDamage(weapon) {
    const range = weapon.damageMax - weapon.damage;
    return weapon.damage + Math.random() * range;
}

/**
 * Check if weapon is ranged
 * @param {WeaponData} weapon - The weapon data
 * @returns {boolean}
 */
export function isRangedWeapon(weapon) {
    return weapon.type === WeaponType.RANGED;
}

/**
 * Check if weapon is melee
 * @param {WeaponData} weapon - The weapon data
 * @returns {boolean}
 */
export function isMeleeWeapon(weapon) {
    return weapon.type === WeaponType.MELEE;
}
