// ===========================
// GAME CONSTANTS
// ===========================

// MULTIPLAYER - Firebase is now used instead of Socket.IO
// Socket.IO Server URL (commented out)
// export const SERVER_URL = "https://gameserver-yarbrup5bq-uc.a.run.app";
export const SERVER_URL = ""; // Not used with Firebase

// World scaling
// Set to >1 to enlarge the entire map & physics world,
// or <1 to shrink. All world-unit inputs remain unscaled
// and are multiplied internally.
export const WORLD_SCALE = 2.5;

// Camera
export const FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// Player - Capsule body configuration
export const PLAYER_RADIUS = 0.8;   // Capsule radius
export const PLAYER_HEIGHT = 1;   // Capsule height
export const PLAYER_MASS = 40;      // Mass in kg
export const PLAYER_START_POSITION = { x: 0, y: 5, z: 0 };
export const START_POSITION = { x: 0, y: 5, z: 0 };
export const SPAWN_RED = { x: 8, y: 2, z: 14 };
export const SPAWN_BLUE = { x: -8, y: 2, z: -14 };
export const MOVE_FORCE_MULTIPLIER = 40;  // Force multiplier for movement
export const PLAYER_INITIAL_HEALTH = 100; // Player starting health

// Controls
export const MOUSE_SENSITIVITY = 0.002;
export const AIM_SENSITIVITY = 0.001;
export const JUMP_VELOCITY = 12;
export const NORMAL_FOV = 75;
export const AIM_FOV = 45;

// Movement States
export const SPRINT_MULTIPLIER = 1.8;
export const CROUCH_MULTIPLIER = 0.5;
export const STANDING_HEIGHT = 0;      // Offset from sphere center
export const CROUCHING_HEIGHT = -0.3; // Offset from sphere center when crouching
export const CROUCH_SPEED = 0.1;      // Transition speed for crouching

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
