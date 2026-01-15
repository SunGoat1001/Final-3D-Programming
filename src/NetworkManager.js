// ===========================
// FIREBASE-BASED NETWORK MANAGER
// Socket.IO logic commented out and replaced with Firebase Realtime Database
// ===========================

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, push, onValue, onChildAdded, onChildRemoved, onChildChanged, remove, onDisconnect } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { RemotePlayerManager } from './RemotePlayerManager.js';
import { takeDamage, respawn } from './player.js';
import { killFeed } from './ui/killFeedInstance.js';
import { SERVER_URL } from './constants.js';

// ===========================
// FIREBASE CONFIGURATION
// ===========================
const firebaseConfig = {
    apiKey: "AIzaSyCKu-4bB17z7dIPjEO9CjNNxJAX-ZQKQlo",
    authDomain: "final-3d-programming.firebaseapp.com",
    databaseURL: "https://final-3d-programming-default-rtdb.firebaseio.com",
    projectId: "final-3d-programming",
    storageBucket: "final-3d-programming.firebasestorage.app",
    messagingSenderId: "383216444461",
    appId: "1:383216444461:web:a48287fb15fb24bd9ec4a4"
};

class NetworkManager {
    constructor() {
        // ===== SOCKET.IO (COMMENTED OUT) =====
        // this.socket = null;

        // ===== FIREBASE SETUP =====
        this.app = null;
        this.auth = null;
        this.db = null;
        this.uid = null;
        this.roomId = null;

        this.connected = false;
        this.playerId = null;
        this.playerTeam = null;
        this.remotePlayerManager = new RemotePlayerManager();
        this.localPlayerData = {
            position: { x: 0, y: 2, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            bodyRotation: 0,
            currentWeapon: 'PISTOL',
            weaponState: {
                isAiming: false,
                isShooting: false
            },
            characterName: 'messi',
            modelLoaded: false
        };

        this.updateInterval = null;
        this.UPDATE_RATE = 1000 / 30; // 30 updates per second
        this.heartbeatInterval = null;
        this.HEARTBEAT_RATE = 1000 / 5; // Heartbeat every 200ms (5 Hz)
        this.PLAYER_TIMEOUT = 5000; // Remove player if no update for 5 seconds

        this.onPlayerKilled = null;
        this.onTookDamage = null;
        this.scoreboardData = [];
        this.teamScores = { red: 0, blue: 0 };
        this.matchEnded = false;

        // Firebase listener unsubscribers
        this.playerListeners = new Map();
        this.connectionListener = null;
        this.timeoutCheckerInterval = null;
    }

    async connect(serverUrl = SERVER_URL) {
        console.log('🔥 Initializing Firebase...');

        try {
            // Initialize Firebase
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getDatabase(this.app);

            // Sign in anonymously
            const userCredential = await signInAnonymously(this.auth);
            this.uid = userCredential.user.uid;
            console.log('✅ Firebase Anonymous Auth Successful:', this.uid);

            // Generate room ID (use first 8 chars of uid or custom room)
            this.roomId = 'default-room'; // You can make this dynamic
            this.playerId = this.uid;

            // Initialize connection
            this.initializeConnection();
        } catch (error) {
            console.error('❌ Firebase Connection Error:', error);
        }
    }

    async initializeConnection() {
        console.log('🎮 Joining room:', this.roomId);

        const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);

        // Initialize player data in Firebase
        const initialPlayerData = {
            ...this.localPlayerData,
            uid: this.uid,
            team: Math.random() > 0.5 ? 'red' : 'blue',
            health: 100,
            lastSeen: Date.now()
        };

        this.playerTeam = initialPlayerData.team;

        try {
            await set(playerRef, initialPlayerData);
            console.log('✅ Player initialized in Firebase');

            // Register onDisconnect to remove player when connection is lost
            // This happens when: tab closes, network drops, crash, etc.
            try {
                await onDisconnect(playerRef).remove();
                console.log('✅ Registered onDisconnect cleanup');
            } catch (error) {
                console.error('❌ Error registering onDisconnect:', error);
            }

            this.connected = true;
            this.showTeamNotification(this.playerTeam);

            // Setup listeners
            this.setupPlayerListeners();
            this.setupConnectionStateListener();
            this.startUpdateLoop();
            this.startHeartbeat();
            this.startTimeoutChecker();
        } catch (error) {
            console.error('❌ Error initializing player:', error);
        }
    }

    setupPlayerListeners() {
        console.log('📡 Setting up Firebase listeners...');

        const playersRef = ref(this.db, `rooms/${this.roomId}/players`);

        // Listen for other players joining
        onChildAdded(playersRef, (snapshot) => {
            const playerId = snapshot.key;
            const playerData = snapshot.val();

            if (playerId !== this.uid && !this.playerListeners.has(playerId)) {
                console.log('👤 New player joined:', playerId, playerData);
                this.remotePlayerManager.addPlayer({
                    id: playerId,
                    ...playerData
                });

                // Setup continuous listener for this player's updates using onValue
                // onValue triggers on initial load and every time data changes
                const playerUpdateRef = ref(this.db, `rooms/${this.roomId}/players/${playerId}`);
                const unsubscribe = onValue(playerUpdateRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const updatedData = snapshot.val();
                        console.log(`📤 Player ${playerId} updated:`, updatedData.position);
                        this.remotePlayerManager.updatePlayer({
                            id: playerId,
                            ...updatedData
                        });
                    }
                }, (error) => {
                    console.error(`❌ Error listening to player ${playerId}:`, error);
                });
                this.playerListeners.set(playerId, unsubscribe);
            }
        });

        // Listen for player disconnections
        onChildRemoved(playersRef, (snapshot) => {
            const playerId = snapshot.key;
            if (playerId !== this.uid) {
                console.log('👋 Player left:', playerId);
                this.remotePlayerManager.removePlayer(playerId);

                // Cleanup listener
                const unsubscribe = this.playerListeners.get(playerId);
                if (unsubscribe) {
                    unsubscribe();
                    this.playerListeners.delete(playerId);
                }
            }
        });

        // ===== COMMENTED OUT SOCKET.IO EVENTS =====
        // this.socket.on('killFeed', (data) => { ... });
        // this.socket.on('init', (data) => { ... });
        // this.socket.on('playerJoined', (data) => { ... });
        // this.socket.on('playerMoved', (data) => { ... });
        // etc.
    }

    setupConnectionStateListener() {
        console.log('📡 Listening to Firebase connection state...');

        const connectedRef = ref(this.db, '.info/connected');
        this.connectionListener = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === true) {
                console.log('🟢 Firebase connection established');
            } else {
                console.log('🔴 Firebase connection lost');
            }
        });
    }

    showTeamNotification(team) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 30px 60px;
            background: ${team === 'red' ? 'rgba(220, 38, 38, 0.95)' : 'rgba(37, 99, 235, 0.95)'};
            color: white;
            font-size: 32px;
            font-weight: bold;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 10000;
            text-align: center;
            animation: teamFadeIn 0.5s ease-out;
        `;
        notification.innerHTML = `
            <div>YOU ARE TEAM</div>
            <div style="font-size: 48px; margin-top: 10px;">${team.toUpperCase()}</div>
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes teamFadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    startUpdateLoop() {
        if (this.updateInterval) return;

        this.updateInterval = setInterval(() => {
            if (this.connected && this.db && this.uid) {
                // ===== FIREBASE UPDATE (replaces socket.emit) =====
                const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);
                update(playerRef, {
                    ...this.localPlayerData,
                    lastUpdate: Date.now()
                }).catch(error => {
                    console.error('❌ Error updating player:', error);
                });

                // ===== SOCKET.IO (COMMENTED OUT) =====
                // this.socket.emit('playerUpdate', this.localPlayerData);
            }
        }, this.UPDATE_RATE);
    }

    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    startHeartbeat() {
        console.log('💓 Starting heartbeat...');
        if (this.heartbeatInterval) return;

        this.heartbeatInterval = setInterval(() => {
            if (this.connected && this.db && this.uid) {
                const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);
                update(playerRef, {
                    lastSeen: Date.now()
                }).catch(error => {
                    console.error('❌ Error updating heartbeat:', error);
                });
            }
        }, this.HEARTBEAT_RATE);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    startTimeoutChecker() {
        console.log('⏱️ Starting timeout checker...');
        if (this.timeoutCheckerInterval) return;

        this.timeoutCheckerInterval = setInterval(() => {
            const now = Date.now();
            this.remotePlayerManager.getPlayers().forEach(player => {
                // Get the last update time from the current data
                // We'll track this in the remote player manager
                if (player.lastSeen && now - player.lastSeen > this.PLAYER_TIMEOUT) {
                    console.log(`⏰ Player ${player.id} timed out (no update for ${this.PLAYER_TIMEOUT}ms)`);
                    this.remotePlayerManager.removePlayer(player.id);
                }
            });
        }, this.PLAYER_TIMEOUT);
    }

    stopTimeoutChecker() {
        if (this.timeoutCheckerInterval) {
            clearInterval(this.timeoutCheckerInterval);
            this.timeoutCheckerInterval = null;
        }
    }

    updateLocalPlayer(data) {
        this.localPlayerData = {
            ...this.localPlayerData,
            ...data
        };
    }

    async sendShoot(position, direction, weapon) {
        if (this.connected && this.db && this.uid) {
            try {
                // ===== FIREBASE PUSH (replaces socket.emit 'playerShoot') =====
                const shotsRef = ref(this.db, `rooms/${this.roomId}/shots`);
                await push(shotsRef, {
                    shooterId: this.uid,
                    position,
                    direction,
                    weapon,
                    timestamp: Date.now()
                });

                // ===== SOCKET.IO (COMMENTED OUT) =====
                // this.socket.emit('playerShoot', { position, direction, weapon });
            } catch (error) {
                console.error('❌ Error sending shoot event:', error);
            }
        }
    }

    async sendHitPlayer(targetId, damage) {
        if (this.connected && this.db && this.uid) {
            try {
                // ===== FIREBASE PUSH (replaces socket.emit 'hitPlayer') =====
                const hitsRef = ref(this.db, `rooms/${this.roomId}/hits`);
                await push(hitsRef, {
                    shooterId: this.uid,
                    targetId,
                    damage,
                    timestamp: Date.now()
                });
                console.log(`📍 Sent hit to ${targetId} for ${damage} damage`);

                // ===== SOCKET.IO (COMMENTED OUT) =====
                // this.socket.emit('hitPlayer', { targetId, damage });
            } catch (error) {
                console.error('❌ Error sending hit:', error);
            }
        }
    }

    async changeWeapon(weapon) {
        if (this.connected && this.db && this.uid) {
            try {
                // ===== FIREBASE UPDATE (replaces socket.emit 'weaponChange') =====
                const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);
                await update(playerRef, {
                    currentWeapon: weapon,
                    lastUpdate: Date.now()
                });

                // ===== SOCKET.IO (COMMENTED OUT) =====
                // this.socket.emit('weaponChange', { weapon });
            } catch (error) {
                console.error('❌ Error changing weapon:', error);
            }
        }
    }

    getRemotePlayers() {
        return this.remotePlayerManager.getPlayers();
    }

    update(deltaTime) {
        this.remotePlayerManager.update(deltaTime);
    }

    async disconnect() {
        console.log('🔌 Disconnecting from Firebase...');
        this.stopUpdateLoop();
        this.stopHeartbeat();
        this.stopTimeoutChecker();

        try {
            // ===== FIREBASE CLEANUP =====
            // Unsubscribe from all listeners
            this.playerListeners.forEach(unsubscribe => unsubscribe());
            this.playerListeners.clear();

            // Stop listening to connection state
            if (this.connectionListener) {
                this.connectionListener();
                this.connectionListener = null;
            }

            // Remove player from Firebase
            // Note: onDisconnect() already handles this automatically
            // This is a backup explicit removal
            if (this.db && this.uid) {
                const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);
                await remove(playerRef);
            }

            this.connected = false;
            console.log('✅ Disconnected from Firebase');

            // ===== SOCKET.IO (COMMENTED OUT) =====
            // this.socket.disconnect();
        } catch (error) {
            console.error('❌ Error during disconnect:', error);
        }
    }
}

export const networkManager = new NetworkManager();
