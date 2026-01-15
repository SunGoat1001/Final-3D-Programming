import { io } from 'socket.io-client';
import { RemotePlayerManager } from './RemotePlayerManager.js';
import { takeDamage, respawn } from './player.js';
import { killFeed } from './ui/killFeedInstance.js';
import { SERVER_URL } from './constants.js';
class NetworkManager {
    constructor() {
        this.socket = null;
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

        this.onPlayerKilled = null;
        this.onTookDamage = null;
        this.scoreboardData = [];
        this.teamScores = { red: 0, blue: 0 };
        this.matchEnded = false;
    }

    connect(serverUrl = SERVER_URL) {
        console.log('Connecting to server...');

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling']
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.connected = true;
        });
        this.socket.on("killFeed", (data) => {
            console.log("🔥 KillFeed:", data);
            killFeed.addKill(data.killer, data.victim, data.weapon);
        });
        this.socket.on('init', (data) => {
            console.log('Initialized:', data);
            this.playerId = data.id;
            this.playerTeam = data.team;

            // Display team info
            this.showTeamNotification(data.team);

            // Add existing players
            data.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.remotePlayerManager.addPlayer(player);
                }
            });

            // Populate initial scoreboard
            if (data.scoreboard) {
                this.scoreboardData = data.scoreboard;
            }
            if (data.teamScores) {
                this.teamScores = data.teamScores;
            }
            this.matchEnded = data.matchEnded || false;

            // Start sending updates
            this.startUpdateLoop();
        });

        this.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data);
            if (data.id !== this.playerId) {
                this.remotePlayerManager.addPlayer(data);
            }
        });

        this.socket.on('playerMoved', (data) => {
            if (data.id !== this.playerId) {
                this.remotePlayerManager.updatePlayer(data);
            }
        });

        this.socket.on('playerWeaponChanged', (data) => {
            if (data.id !== this.playerId) {
                this.remotePlayerManager.changeWeapon(data.id, data.weapon);
            }
        });

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
        });

        this.socket.on('playerKilled', (data) => {
            console.log(`🎯 You killed ${data.victimId}`);
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
            if (this.connected && this.socket) {
                this.socket.emit('playerUpdate', this.localPlayerData);
            }
        }, this.UPDATE_RATE);
    }

    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateLocalPlayer(data) {
        this.localPlayerData = {
            ...this.localPlayerData,
            ...data
        };
    }

    sendShoot(position, direction, weapon) {
        if (this.connected && this.socket) {
            this.socket.emit('playerShoot', {
                position,
                direction,
                weapon
            });
        }
    }

    sendHitPlayer(targetId, damage) {
        if (this.connected && this.socket) {
            console.log(`Sending hit to ${targetId} for ${damage} damage`);
            this.socket.emit('hitPlayer', {
                targetId,
                damage
            });
        }
    }

    changeWeapon(weapon) {
        if (this.connected && this.socket) {
            this.socket.emit('weaponChange', { weapon });
        }
    }

    getRemotePlayers() {
        return this.remotePlayerManager.getPlayers();
    }

    update(deltaTime) {
        this.remotePlayerManager.update(deltaTime);
    }

    disconnect() {
        this.stopUpdateLoop();
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export const networkManager = new NetworkManager();
