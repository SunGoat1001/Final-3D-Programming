import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class RemotePlayer {
    constructor(data) {
        this.id = data.id;
        this.team = data.team;
        this.health = data.health || 100;
        this.maxHealth = data.maxHealth || 100;
        this.currentWeapon = data.currentWeapon || 'PISTOL';
        // Use team-based character if not specified
        this.characterName = data.characterName || (data.team === 'blue' ? 'messi_character' : 'ronaldo_character');

        // Presence tracking
        this.lastSeen = data.lastSeen || Date.now();

        // Main group
        this.group = new THREE.Group();
        this.group.name = `RemotePlayer_${this.id}`;

        // Character model
        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;

        // Weapon mesh
        this.weaponMesh = null;
        // ADD THIS
        this.weaponHolder = new THREE.Group();
        this.weaponHolder.name = "WeaponHolder";
        this.group.add(this.weaponHolder);
        // Name tag and health bar
        this.nameTag = null;
        this.healthBar = null;

        // Position interpolation - store both current and target for smooth movement
        this.targetPosition = new THREE.Vector3(
            data.position?.x || 0,
            data.position?.y || 0,
            data.position?.z || 0
        );

        // Current position for lerping
        this.currentPosition = this.targetPosition.clone();

        this.targetRotation = data.bodyRotation || 0;
        this.currentRotation = this.targetRotation;

        // Initialize
        this.createPlaceholder();
        this.createNameTag();
        this.createHealthBar();
        this.loadCharacterModel();


        this.loadWeapon(this.currentWeapon);

        // Set initial position
        this.group.position.copy(this.targetPosition);
        this.group.rotation.y = this.targetRotation;
    }

    createPlaceholder() {
        // Create a capsule-like placeholder
        const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.team === 'red' ? 0xff3333 : 0x3333ff,
            emissive: this.team === 'red' ? 0x330000 : 0x000033,
            roughness: 0.7
        });

        this.placeholder = new THREE.Mesh(geometry, material);
        this.placeholder.position.y = 0.9;
        this.placeholder.castShadow = true;
        this.placeholder.receiveShadow = true;
        this.group.add(this.placeholder);
    }
    attachWeaponHolderToHand() {
        if (!this.model || !this.weaponHolder) return;

        let rightHand = null;

        this.model.traverse((o) => {
            if (o.isBone) {
                const n = o.name.toLowerCase();
                if (n.includes("right") && (n.includes("hand") || n.includes("wrist"))) {
                    rightHand = o;
                }
            }
        });

        if (!rightHand) {
            console.warn("❌ Không tìm thấy RightHand bone");
            this.model.add(this.weaponHolder);
            this.weaponHolder.position.set(0.2, 1.2, 0.3);
            return;
        }

        rightHand.add(this.weaponHolder);

        // ⚠️ TUNING CHỖ NÀY
        this.weaponHolder.position.set(0.02, -0.02, 0.05);
        this.weaponHolder.rotation.set(
            -Math.PI / 2,
            0,
            Math.PI
        );

        console.log("✅ Weapon holder attached to RightHand bone");
    }


    createNameTag() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Draw background
        context.fillStyle = this.team === 'red' ? 'rgba(220, 38, 38, 0.8)' : 'rgba(37, 99, 235, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text - display character name
        const displayName = this.characterName.includes('messi') ? 'MESSI' :
            this.characterName.includes('ronaldo') ? 'RONALDO' : 'PLAYER';

        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`[${this.team.toUpperCase()}] ${displayName}`, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.nameTag = new THREE.Sprite(material);
        this.nameTag.scale.set(1.5, 0.375, 1);
        this.nameTag.position.y = 2.5;
        this.group.add(this.nameTag);
    }

    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 16;

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.healthBar = new THREE.Sprite(material);
        this.healthBar.scale.set(1, 0.125, 1);
        this.healthBar.position.y = 2.2;
        this.group.add(this.healthBar);

        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.healthBar) return;

        const canvas = this.healthBar.material.map.image;
        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Health
        const healthPercent = this.health / this.maxHealth;
        const healthWidth = canvas.width * healthPercent;

        context.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
        context.fillRect(0, 0, healthWidth, canvas.height);

        // Border
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.strokeRect(0, 0, canvas.width, canvas.height);

        this.healthBar.material.map.needsUpdate = true;
    }

    async loadCharacterModel() {
        const loader = new GLTFLoader();

        try {
            // Use character name from player data (set by server based on team)
            // Blue team = messi_character, Red team = ronaldo_character
            let name = this.characterName;
            if (name === 'messi') name = 'messi_character';
            if (name === 'ronaldo') name = 'ronaldo_character';

            const modelPath = `models/${name}.glb`;
            console.log(`Loading character model: ${modelPath} for team ${this.team}`);

            const gltf = await loader.loadAsync(modelPath);

            this.weaponHolder.clear();
            this.weaponHolder.add(this.weaponMesh);

            this.weaponMesh.position.set(0, 0, 0);
            this.weaponMesh.rotation.set(0, 0, 0);


            this.model = gltf.scene;

            // Calculate scale
            const box = new THREE.Box3().setFromObject(this.model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            if (maxDim > 0) {
                const targetHeight = 1.8; // Standard player height
                const scale = targetHeight / maxDim;
                this.model.scale.setScalar(scale);
            } else {
                console.warn(`Model ${this.characterName} has 0 size, using default scale 1`);
                this.model.scale.setScalar(1);
            }

            // Position model
            this.model.updateMatrixWorld(true);

            const bbox = new THREE.Box3().setFromObject(this.model);
            const minY = bbox.min.y;

            this.model.position.y += -minY;



            // Setup animations
            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                gltf.animations.forEach(clip => {
                    this.animations[clip.name.toLowerCase()] = clip;
                });

                // Play idle animation by default
                this.playAnimation('idle');
            }

            // Apply team color tint (subtle)
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Add subtle team color tint
                    if (child.material) {
                        const originalColor = child.material.color?.clone() || new THREE.Color(1, 1, 1);
                        const teamTint = this.team === 'red'
                            ? new THREE.Color(1.5, 0.8, 0.8) // Stronger red tint
                            : new THREE.Color(0.8, 0.8, 1.5); // Stronger blue tint
                        child.material.color = originalColor.multiply(teamTint);
                    }
                }
            });

            this.group.add(this.model);

            this.attachWeaponHolderToHand();


            // Remove placeholder ONLY if model loaded successfully
            if (this.placeholder) {
                this.group.remove(this.placeholder);
                this.placeholder = null;
            }
            // Re-attach current weapon after model loaded
            if (this.weaponMesh && this.weaponHolder) {
                this.weaponHolder.clear();
                this.weaponHolder.add(this.weaponMesh);
            }

            console.log(`✅ Loaded model ${this.characterName} for remote player ${this.id}`);
        } catch (error) {
            console.error(`❌ Failed to load character model ${this.characterName}:`, error);
        }
    }

    async loadWeapon(weaponId) {
        const weaponModels = {
            'PISTOL': 'hk_g36', // Using rifle model as placeholder
            'RIFLE': 'hk_g36',
            'SHOTGUN': 'shotgun',
            'SNIPER': 'hk_g36',
            'SWORD': 'sword',
            'GRENADE': 'nade',
            'BAZOOKA': 'golden_bazooka'
        };

        const modelName = weaponModels[weaponId] || 'hk_g36';
        const loader = new GLTFLoader();

        try {
            // Remove old weapon
            if (this.weaponMesh) {
                this.group.remove(this.weaponMesh);
                this.weaponMesh = null;
            }

            const gltf = await loader.loadAsync(`models/${modelName}.glb`);
            this.weaponMesh = gltf.scene;

            // Scale weapon appropriately (IMPORTANT: consistent size)
            const box = new THREE.Box3().setFromObject(this.weaponMesh);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 0.4; // Smaller weapon size
            const scale = targetSize / maxDim;
            this.weaponMesh.scale.setScalar(scale);

            this.weaponMesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Try to attach to hand bone if model exists
            if (this.model) {
                let handBone = null;
                this.model.traverse((child) => {
                    if (child.isBone && (
                        child.name.toLowerCase().includes('hand') ||
                        child.name.toLowerCase().includes('wrist')
                    )) {
                        if (!handBone || child.name.toLowerCase().includes('right')) {
                            handBone = child;
                        }
                    }
                });

                if (handBone) {
                    handBone.add(this.weaponMesh);
                    this.weaponMesh.position.set(0, 0, 0);
                    this.weaponMesh.rotation.set(0, 0, 0);
                } else {
                    // Fallback: attach to model at hand position
                    this.model.add(this.weaponMesh);
                    this.weaponMesh.position.set(0.2, 1.0, 0.3);
                }
            } else {
                // Model not loaded yet, attach to group
                this.group.add(this.weaponMesh);
                this.weaponMesh.position.set(0.3, 1.0, 0.3);
            }

            console.log(`✅ Loaded weapon ${weaponId} for remote player ${this.id}`);
        } catch (error) {
            console.error(`Failed to load weapon for ${this.id}:`, error);
        }
    }

    playAnimation(name) {
        if (!this.mixer || !this.animations[name]) return;

        if (this.currentAnimation) {
            this.currentAnimation.fadeOut(0.2);
        }

        const action = this.mixer.clipAction(this.animations[name]);
        action.reset().fadeIn(0.2).play();
        this.currentAnimation = action;
    }

    update(data) {
        // IMPORTANT: Only update TARGET values, NOT the mesh directly
        // The mesh will be interpolated in updateAnimation() every frame

        // Update lastSeen for presence tracking
        if (data.lastSeen) {
            this.lastSeen = data.lastSeen;
        }

        // Update target position (includes Y axis)
        if (data.position) {
            this.targetPosition.set(
                data.position.x,
                data.position.y,
                data.position.z
            );
            console.log(`🎯 Target position set for ${this.id}:`, this.targetPosition);
        }

        // Update target rotation
        if (data.bodyRotation !== undefined) {
            this.targetRotation = data.bodyRotation;
        }

        // Update weapon
        if (data.currentWeapon && data.currentWeapon !== this.currentWeapon) {
            this.changeWeapon(data.currentWeapon);
        }

        // Update character model if changed
        if (data.characterName && data.characterName !== this.characterName) {
            this.characterName = data.characterName;
            this.loadCharacterModel();
        }
    }

    updateAnimation(deltaTime) {
        // === SMOOTH POSITION INTERPOLATION (every frame) ===
        if (this.group && this.targetPosition) {
            // Lerp towards target position smoothly
            this.group.position.lerp(this.targetPosition, 0.15);
        }

        // === SMOOTH ROTATION INTERPOLATION (every frame) ===
        if (this.group && this.targetRotation !== undefined) {
            const currentRotation = this.group.rotation.y;
            let rotationDiff = this.targetRotation - currentRotation;

            // Normalize rotation difference to [-PI, PI]
            while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
            while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

            // Smooth rotation interpolation
            this.group.rotation.y += rotationDiff * 0.15;
        }

        // Update animations if model is loaded
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Make name tag and health bar face camera
        if (this.nameTag && window.camera) {
            this.nameTag.lookAt(window.camera.position);
        }
        if (this.healthBar && window.camera) {
            this.healthBar.lookAt(window.camera.position);
        }
    }

    changeWeapon(weaponId) {
        this.currentWeapon = weaponId;
        this.loadWeapon(weaponId);
    }

    playShootEffect(data) {
        // Visual feedback for shooting
        console.log(`Remote player ${this.id} shot ${data.weapon}`);
        // You can add muzzle flash here
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
    }

    dispose() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }

        if (this.model) {
            this.model.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        if (this.weaponMesh) {
            this.weaponMesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}
