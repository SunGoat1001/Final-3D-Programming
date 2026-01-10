/**
 * Weapon System - Main Export
 * Export tất cả các module liên quan đến hệ thống vũ khí
 */

// Weapon Data - Cấu trúc dữ liệu vũ khí
export {
    WEAPONS,
    WEAPON_SLOTS,
    DEFAULT_WEAPON,
    WeaponType,
    getWeaponData,
    getWeaponBySlot,
    calculateDamage,
    isRangedWeapon,
    isMeleeWeapon
} from './WeaponData.js';

// Weapon Manager - Quản lý vũ khí
export { WeaponManager } from './WeaponManager.js';

// Weapon UI - Giao diện vũ khí
export { WeaponUI } from './WeaponUI.js';
