// ===========================
// FIREBASE-BASED NETWORK MANAGER
// Socket.IO logic commented out and replaced with Firebase Realtime Database
// ===========================

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, push, onValue, onChildAdded, onChildRemoved, onChildChanged, remove, onDisconnect } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { RemotePlayerManager } from './RemotePlayerManager.js';
import { takeDamage, respawn } from './player.js';
import { killFeed } from './ui/killFeedInstance.js';

import { killStreakUI } from "./ui/killStreakInstance.js";
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
        this.roomName = null; // Store room name
        this.isHost = false; // Track if local player is host

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
        this.onGameStart = null; // Callback when game starts
        this.onRoomUpdate = null; // Callback when room info changes (players/teams)
        
        this.scoreboardData = [];
        this.teamScores = { red: 0, blue: 0 };
        this.matchEnded = false;
        
        // Callback for slow motion
        this.onSlowMotionTriggered = null;

        // Firebase listener unsubscribers
        this.playerListeners = new Map();
        this.connectionListener = null;
        this.roomStateListener = null;
        this.timeoutCheckerInterval = null;
    }

    // Initialize Firebase Auth only
    async initialize() {
        console.log('🔥 Initializing Firebase...');
        try {
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getDatabase(this.app);

            // Sign in anonymously
            const userCredential = await signInAnonymously(this.auth);
            this.uid = userCredential.user.uid;
            this.playerId = this.uid;
            console.log('✅ Firebase Anonymous Auth Successful:', this.uid);
            return true;
        } catch (error) {
            console.error('❌ Firebase Init Error:', error);
            return false;
        }
    }

    async getRooms() {
        if (!this.db) await this.initialize();
        const roomsRef = ref(this.db, 'rooms');
        
        try {
            const snapshot = await get(roomsRef);
            const rooms = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const data = child.val();
                    const now = Date.now();
                    
                    // 1. INVALID ROOM CHECK
                    // If room has no info or name, it's garbage/legacy data. Delete it.
                    if (!data.info || !data.info.name) {
                        console.log(`🧹 Cleaning up invalid room: ${child.key}`);
                        remove(ref(this.db, `rooms/${child.key}`));
                        return;
                    }

                    // 2. STALE PLAYER CHECK
                    // Filter out players who haven't updated in > 10 seconds (Ghosts)
                    let activePlayers = 0;
                    if (data.players) {
                        for (const [pid, pdata] of Object.entries(data.players)) {
                            // If lastSeen is missing or older than 10s, ignore this player
                            if (pdata.lastSeen && (now - pdata.lastSeen < 10000)) {
                                activePlayers++;
                            } else {
                                // Optional: We could lazily remove this specific player node here too
                                // remove(ref(this.db, `rooms/${child.key}/players/${pid}`));
                            }
                        }
                    }
            // Generate room ID (use first 8 chars of uid or custom room)
            this.roomId = 'room-' + Date.now();
             // You can make this dynamic
            this.playerId = this.uid;

                    // 3. EMPTY ROOM CHECK
                    // If no ACTIVE players, and room is older than 10s (grace period), delete it.
                    if (activePlayers === 0) {
                         const createdAt = data.info.createdAt || 0;
                         if (now - createdAt > 10000) {
                             console.log(`🧹 Cleaning up empty/stale room: ${data.info.name}`);
                             remove(ref(this.db, `rooms/${child.key}`));
                         }
                         return; // Do not add to list
                    }

                    rooms.push({
                        id: child.key,
                        name: data.info.name,
                        playerCount: activePlayers,
                        status: data.info.status || 'waiting',
                        hostId: data.info.hostId
                    });
                });
            }
            return rooms;
        } catch (error) {
            console.error("Error getting rooms:", error);
            return [];
        }
    }

    async createRoom(roomName) {
        if (!this.db) await this.initialize();
        
        const newRoomRef = push(ref(this.db, 'rooms'));
        this.roomId = newRoomRef.key;
        this.roomName = roomName;
        this.isHost = true;

        const roomInfo = {
            name: roomName,
            hostId: this.uid,
            status: 'waiting', // waiting | playing
            createdAt: Date.now()
        };

        await set(ref(this.db, `rooms/${this.roomId}/info`), roomInfo);
        await this.joinRoom(this.roomId, 'red'); // Host defaults to Red? or let them choose
        return this.roomId;
    }

    async joinRoom(roomId, team = 'auto') {
        if (!this.db) await this.initialize();
        this.roomId = roomId;

        this.roomId = roomId;

        // Fetch Room Name
        try {
            const nameSnapshot = await get(ref(this.db, `rooms/${this.roomId}/info/name`));
            if (nameSnapshot.exists()) {
                this.roomName = nameSnapshot.val();
            } else {
                this.roomName = "Unknown Room";
            }
        } catch (e) {
            console.warn("Could not fetch room name", e);
            this.roomName = "Room";
        }

        console.log('🎮 Joining room:', this.roomName, `(${this.roomId})`);
        await this.initializeConnection(team);
    }

    async setTeam(team) {
        if (!this.connected) {
            console.warn("⚠️ Cannot set team, not connected yet.");
            return;
        }
        
        // Disable spamming
        if (this.playerTeam === team) return;

        console.log(`Swapping to team ${team}...`);
        
        // Update local
        this.playerTeam = team;
        this.localPlayerData.characterName = team === 'blue' ? 'messi' : 'ronaldo'; 
        
        const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);
        await update(playerRef, {
            team: team,
            characterName: this.localPlayerData.characterName
        });
        
        // Force UI update locally just in case listener lags
        if (this.onRoomUpdate) this.onRoomUpdate();
    }

    async setStartGame() {
        if (!this.roomId) return;
        console.log("🚀 Host starting game...");
        await update(ref(this.db, `rooms/${this.roomId}/info`), {
            status: 'playing'
        });
    }

    async initializeConnection(selectedTeam = 'auto') {
        const playerRef = ref(this.db, `rooms/${this.roomId}/players/${this.uid}`);
        
        // Determine team if auto (Smart Balancing)
        let team = selectedTeam;
        if (team === 'auto') {
             try {
                 const roomPlayersRef = ref(this.db, `rooms/${this.roomId}/players`);
                 const snapshot = await get(roomPlayersRef);
                 let redCount = 0;
                 let blueCount = 0;
                 
                 if (snapshot.exists()) {
                     snapshot.forEach(child => {
                         const p = child.val();
                         if (child.key !== this.uid) { // Don't count self if already there (reconnect case)
                             if (p.team === 'red') redCount++;
                             else if (p.team === 'blue') blueCount++;
                         }
                     });
                 }
                 
                 if (redCount < blueCount) team = 'red';
                 else if (blueCount < redCount) team = 'blue';
                 else team = Math.random() > 0.5 ? 'red' : 'blue';
                 
                 console.log(`⚖️ Auto-balancing to team: ${team} (Red: ${redCount}, Blue: ${blueCount})`);
             } catch (e) {
                 console.warn("Auto-balance failed, using random", e);
                 team = Math.random() > 0.5 ? 'red' : 'blue';
             }
        }

        // Initialize player data in Firebase
        const initialPlayerData = {
            ...this.localPlayerData,
            uid: this.uid,
            team: team,
            health: 100,
            lastSeen: Date.now()
        };

        this.playerTeam = initialPlayerData.team;

        try {
            await set(playerRef, initialPlayerData);
            this.joinTime = Date.now();
            killStreakUI.reset();

                        // 🔥 CLEAR KILL HISTORY WHEN JOIN
            const killsRef = ref(this.db, `rooms/${this.roomId}/kills`);
            await remove(killsRef);

            // 🔥 MARK JOIN TIME
            this.joinTime = Date.now();

            // 🔥 RESET LOCAL UI
            killStreakUI.reset();

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
            
            // Trigger UI update now that we are connected
            if (this.onRoomUpdate) this.onRoomUpdate();
            this.showTeamNotification(this.playerTeam);
            killStreakUI.reset();

            // Setup listeners
            this.setupPlayerListeners();
            this.setupConnectionStateListener();
            this.setupGameLogicListeners(); // Added logic listener
            this.setupRoomStateListener(); // New listener for game start
            
            this.startUpdateLoop();
            this.startHeartbeat();
            this.startTimeoutChecker();
        } catch (error) {
            console.error('❌ Error initializing player:', error);
        }
    }

    setupRoomStateListener() {
         const infoRef = ref(this.db, `rooms/${this.roomId}/info`);
         this.roomStateListener = onValue(infoRef, (snapshot) => {
              const info = snapshot.val();
              if (info && info.status === 'playing') {
                  if (this.onGameStart) this.onGameStart();
              }
              // Could also emit room info updates (player counts) here
         });
    }

    setupGameLogicListeners() {
        console.log('⚔️ Setting up Game Logic (Hits/Kills)...');
        const hitsRef = ref(this.db, `rooms/${this.roomId}/hits`);
        const MAX_KILLS = 20;

        // Process hits (This acts as the game server logic)
        onChildAdded(hitsRef, (snapshot) => {
             const hit = snapshot.val();
             if (!hit) return;

             // Logic to track damage and kills
             // Note: In P2P, we need to locate the victim and apply damage locally
             // to keep sync. 
             
             // 1. Identify Victim
             let victimTeam = null;
             
             // Check if I am the victim
             if (hit.targetId === this.uid) {
                 takeDamage(hit.damage);
                 // Check if I died (takeDamage logic handles health, but we need to know if it was fatal here)
                 // We can't easily know if *this* specific hit killed me without checking health before/after
                 // simplified: we assume hits are valid and reduce health.
             } else {
                 // Check if remote player
                 const remotePlayer = this.remotePlayerManager.getPlayer(hit.targetId);
                 if (remotePlayer) {
                     remotePlayer.takeDamage(hit.damage);
                     victimTeam = remotePlayer.team;
                     if (remotePlayer.health <= 0) {
                         // It's a kill? 
                         // Need de-duplication or state tracking because we might re-process old hits?
                         // onChildAdded runs on existing hits.
                         // But we don't respawn remote players here explicitly yet.
                     }
                 }
             }
             
             // 2. Score Tracking (Heuristic: we count every lethal hit or just count all kills if we had a kill feed)
             // Since 'hits' are raw damage, we need to know if it was a KILL.
             // Issue: 'hits' doesn't say "died".
             // We can't trust health <= 0 check on historical data without replaying perfectly.
             // BUT, the user wants "Slow Motion on Kill". 
             // Ideally we should push 'kills' to DB.
             // But existing code pushes 'hits'.
             // Let's assume for this feature that we will just check if this hit likely caused a win.
             
             // Since we can't perfectly track score without a 'score' node or 'kills' events,
             // I'll implement a 'kills' listener if I can, OR I will modify sendHitPlayer to push 'kill' if fatal.
             
             // But 'sendHitPlayer' doesn't know if fatal unless it checks health.
             
             // Workaround: We will listen for 'hits' and simply assume valid hits reduce health.
             // We will count how many times players have died? No. 
             
             // Better: Let's use the 'kills' node I will add support for.
             // In sendHitPlayer, I will add logic to check for kill.
        });
        
            const killsRef = ref(this.db, `rooms/${this.roomId}/kills`);
        onChildAdded(killsRef, (snapshot) => {
    const kill = snapshot.val();
    if (!kill) return;

    // ❗ BỎ QUA KILL CŨ
    if (!kill.timestamp || kill.timestamp < this.joinTime) return;

    // ✅ NẾU MÌNH BỊ GIẾT → RESET STREAK
    if (kill.victimId === this.uid) {
        console.log("☠️ You died → reset killstreak");
        killStreakUI.reset();
    }

    if (kill.killerTeam) {
        this.teamScores[kill.killerTeam] = (this.teamScores[kill.killerTeam] || 0) + 1;
        console.log(`💀 KILL! Score: Red ${this.teamScores.red} - Blue ${this.teamScores.blue}`);

        // ✅ CHỈ cộng streak nếu mình là killer
        if (kill.killerId === this.uid) {
            killStreakUI.onKill();
        }

        // WINNING KILL CHECK
        if (this.teamScores[kill.killerTeam] === MAX_KILLS) {
            if (Date.now() - kill.timestamp < 5000) {
                console.log("🔥 FINAL KILL! SLOW MOTION!");
                if (this.onSlowMotionTriggered) {
                    this.onSlowMotionTriggered(3000);
                }
            }
        }
    }
});


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
                        // console.log(`📤 Player ${playerId} updated:`, updatedData.position);
                        this.remotePlayerManager.updatePlayer({
                            id: playerId,
                            ...updatedData
                        });
                        
                        // FIX: Trigger UI update when remote player data changes (e.g. team swap)
                        if (this.onRoomUpdate) this.onRoomUpdate();
                    }
                }, (error) => {
                    console.error(`❌ Error listening to player ${playerId}:`, error);
                });
                // Trigger callback for UI update (Initial add)
                if (this.onRoomUpdate) this.onRoomUpdate();

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
                
                if (this.onRoomUpdate) this.onRoomUpdate();
            }
        });
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

        // this.socket.on('playerShot', (data) => {
        /*
        // ===== BROKEN SOCKET LISTENERS (Replaced by Firebase listeners) =====
        this.socket.on('playerShot', (data) => {
            if (data.id !== this.playerId) {
                // Show muzzle flash or effect for remote player
                this.remotePlayerManager.playShootEffect(data);
            }
        });

        this.socket.on('tookDamage', (data) => {
            console.log(`💥 Took ${data.damage} damage from ${data.attackerId}. Health: ${data.health}`);
            takeDamage(data.damage);

            if (this.onTookDamage) {
                this.onTookDamage(data);
            }
        });

        this.socket.on('damageConfirmed', (data) => {
            console.log(`✅ Hit confirmed on ${data.targetId}. Damage: ${data.damage}, Remaining health: ${data.remainingHealth}`);
        });

        this.socket.on('playerDied', (data) => {
            console.log(`☠️ You were killed by ${data.killerId}`);
            killStreakUI.reset();
        });

        this.socket.on('playerKilled', (data) => {
            console.log(`🎯 You killed ${data.victimId}`);

            killStreakUI.onKill(); 

            if (this.onPlayerKilled) {
                this.onPlayerKilled(data);
            }
        });

        this.socket.on('scoreboardUpdate', (data) => {
            console.log('Scoreboard updated:', data);
            this.scoreboardData = data.players || [];
            this.teamScores = data.teamScores || { red: 0, blue: 0 };
            this.matchEnded = data.matchEnded || false;
        });

        this.socket.on('matchWin', (data) => {
            console.log('Match Ended! Winner:', data.winner);
            this.matchEnded = true;
            this.teamScores = { red: data.redTeamKills, blue: data.blueTeamKills };
            if (this.onMatchWin) {
                this.onMatchWin(data);
            }
        });

        this.socket.on('respawned', (data) => {
            console.log(`♻️ Respawned with ${data.health} health`);
            respawn();
        });

        this.socket.on('playerLeft', (data) => {
            console.log('Player left:', data.id);
            this.remotePlayerManager.removePlayer(data.id);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.connected = false;
            this.stopUpdateLoop();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
        */

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

                // Check for kill (Client-side authority for P2P)
                const victim = this.remotePlayerManager.getPlayer(targetId);
                // We check if current health - damage <= 0. 
                // Note: victim.health is the currently synced health.
                if (victim && (victim.health - damage <= 0)) {
                     const killsRef = ref(this.db, `rooms/${this.roomId}/kills`);
                     await push(killsRef, {
                          killerId: this.uid,
                          killerTeam: this.playerTeam,
                          victimId: targetId,
                          timestamp: Date.now()
                     });
                     console.log(`💀 Sent KILL confirm for ${targetId}`);
                }

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

    async leaveRoom() {
        if (!this.roomId || !this.uid) return;

        console.log("🚪 Leaving room...");
        
        try {
            // 1. Get current room state to decide Host Migration or Deletion
            const playersRef = ref(this.db, `rooms/${this.roomId}/players`);
            const snapshot = await get(playersRef);
            
            if (snapshot.exists()) {
                const players = snapshot.val();
                const playerIds = Object.keys(players).filter(id => id !== this.uid); // Everyone else
                
                if (playerIds.length === 0) {
                     // 1a. No one left -> Delete Room
                     console.log("🧹 Last player leaving, deleting room...");
                     await remove(ref(this.db, `rooms/${this.roomId}`));
                } else if (this.isHost) {
                     // 1b. I am host, but others remain -> Migrate Host
                     const newHostId = playerIds[0]; // Pick first available char
                     console.log(`👑 Migrating host to ${newHostId}`);
                     await update(ref(this.db, `rooms/${this.roomId}/info`), {
                         hostId: newHostId
                     });
                }
            }

            // 2. Remove Self
            // Note: processing this AFTER host migration ensures clean state
            await remove(ref(this.db, `rooms/${this.roomId}/players/${this.uid}`));

            // 3. Cleanup Local State
            this.cleanup();
            
        } catch (e) {
            console.error("Error leaving room:", e);
        }
    }

    cleanup() {
        this.stopUpdateLoop();
        this.stopHeartbeat();
        this.stopTimeoutChecker();

        // Unsubscribe listeners
        this.playerListeners.forEach(unsubscribe => unsubscribe());
        this.playerListeners.clear();
        
        if (this.roomStateListener) {
            this.roomStateListener(); // Unsub
            this.roomStateListener = null;
        }

        if (this.connectionListener) {
            this.connectionListener();
            this.connectionListener = null;
        }
        
        this.connected = false;
        this.roomId = null;
        this.roomName = null;
        this.isHost = false;
        this.playerTeam = null;
        this.remotePlayerManager.clear(); 
        
        console.log("✅ Cleaned up local network state.");
    }

    async disconnect() {
        console.log('🔌 Disconnecting from Firebase...');
        await this.leaveRoom();
    }
}

export const networkManager = new NetworkManager();
