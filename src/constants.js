// ===========================
// GAME CONSTANTS
// ===========================

// Camera
export const FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// Player - Sphere body configuration
export const PLAYER_RADIUS = 0.5;  // Sphere radius
export const PLAYER_MASS = 20;       // Mass in kg
export const PLAYER_START_POSITION = { x: 0, y: 5, z: 0 };
export const MOVE_FORCE_MULTIPLIER = 50;  // Force multiplier for movement

// Controls
export const MOUSE_SENSITIVITY = 0.002;
export const JUMP_VELOCITY = 20;

// Physics
export const GRAVITY = -30;
export const FIXED_TIME_STEP = 1 / 60;
export const MAX_SUB_STEPS = 3;

// Shooting
export const BULLET_SPEED = 150;
export const BULLET_LIFETIME = 25; // ms
export const BULLET_DAMAGE = 10;
export const BULLET_RADIUS = 0.1;

// Enemy
export const ENEMY_INITIAL_HEALTH = 100;
export const ENEMY_MASS = 50;

// Animation
export const FOV_TRANSITION_DURATION = 200; // ms

// Colors
export const COLOR_SKY = 0x87ceeb;
export const COLOR_GROUND = 0x6b8e23;
export const COLOR_ENEMY = 0xff0000;
export const COLOR_BULLET = 0xffff00;
export const COLOR_OBSTACLE_WOOD = 0x8b4513;
export const COLOR_OBSTACLE_STONE = 0x696969;
export const COLOR_HIT_EFFECT = 0xffffff;

// Collision Groups (bitmasks)
export const COLLISION_GROUP = {
    DEFAULT: 1 << 0,
    PLAYER: 1 << 1,
    BULLET: 1 << 2,
    OBSTACLE: 1 << 3,
    ENEMY: 1 << 4,
    GROUND: 1 << 5,
};

// Shooting helpers
export const MUZZLE_OFFSET = 0.5; // meters in front of camera to spawn bullets
