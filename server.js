import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

// Player data storage
const players = new Map();
const teams = ['red', 'blue'];
const damageHistory = new Map(); // victimId -> Map(attackerId -> timestamp)
let redTeamKills = 0;
let blueTeamKills = 0;
let matchEnded = false;
const MAX_TEAM_KILLS = 20;

function broadcastScoreboard() {
    const scoreboardData = Array.from(players.values()).map(p => ({
        id: p.id,
        name: p.team === 'blue' ? 'Messi' : 'Ronaldo',
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        team: p.team
    }));

    io.emit('scoreboardUpdate', {
        players: scoreboardData,
        teamScores: {
            red: redTeamKills,
            blue: blueTeamKills
        },
        matchEnded: matchEnded
    });
    console.log(`[Scoreboard] Broadcasted update: R:${redTeamKills} B:${blueTeamKills}`);
}

io.on('connection', (socket) => {
    console.log(`[Server] Player connected: ${socket.id}. Current players: ${players.size + 1}`);

    // Assign team based on current player counts
    let redCount = 0;
    let blueCount = 0;

    players.forEach(p => {
        if (p.team === 'red') redCount++;
        else if (p.team === 'blue') blueCount++;
    });

    // Assign to the team with fewer players, default to red if equal
    const team = redCount <= blueCount ? 'red' : 'blue';

    console.log(`Assigning player ${socket.id} to TEAM ${team.toUpperCase()} (Red: ${redCount}, Blue: ${blueCount})`);

    // Assign character based on team
    // Blue team = Messi, Red team = Ronaldo
    const characterName = team === 'blue' ? 'messi_character' : 'ronaldo_character';

    // Initialize player data
    const playerData = {
        id: socket.id,
        team: team,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        bodyRotation: 0,
        health: 100,
        maxHealth: 100,
        currentWeapon: 'PISTOL',
        weaponState: {
            isAiming: false,
            isShooting: false
        },
        modelLoaded: false,
        characterName: characterName,
        kills: 0,
        deaths: 0,
        assists: 0
    };

    players.set(socket.id, playerData);

    // Send initialization data to the new player
    socket.emit('init', {
        id: socket.id,
        team: team,
        players: Array.from(players.entries()).map(([id, data]) => ({
            id,
            ...data
        })),
        teamScores: {
            red: redTeamKills,
            blue: blueTeamKills
        },
        matchEnded: matchEnded
    });

    // Notify other players about the new player
    socket.broadcast.emit('playerJoined', {
        id: socket.id,
        ...playerData
    });

    // Broadcast updated scoreboard
    broadcastScoreboard();

    // Handle player movement update
    socket.on('playerUpdate', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.bodyRotation = data.bodyRotation;
            player.currentWeapon = data.currentWeapon;
            player.weaponState = data.weaponState;
            // player.characterName should be managed by the server based on team
            player.modelLoaded = data.modelLoaded || false;

            // Broadcast to other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: player.position,
                rotation: player.rotation,
                bodyRotation: player.bodyRotation,
                currentWeapon: player.currentWeapon,
                weaponState: player.weaponState,
                characterName: player.characterName,
                modelLoaded: player.modelLoaded
            });
        }
    });

    // Handle weapon change
    socket.on('weaponChange', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.currentWeapon = data.weapon;

            socket.broadcast.emit('playerWeaponChanged', {
                id: socket.id,
                weapon: data.weapon
            });
        }
    });

    // Handle shooting
    socket.on('playerShoot', (data) => {
        const shooter = players.get(socket.id);
        if (!shooter) return;

        // Broadcast shoot event to other players
        socket.broadcast.emit('playerShot', {
            id: socket.id,
            position: data.position,
            direction: data.direction,
            weapon: data.weapon
        });
    });

    // Handle damage dealt to another player
    socket.on('hitPlayer', (data) => {
        const attacker = players.get(socket.id);
        const victim = players.get(data.targetId);

        if (!attacker || !victim) return;

        // Check if players are on different teams and match is not ended
        if (attacker.team !== victim.team && !matchEnded && victim.health > 0) {
            const damage = data.damage || 10;
            victim.health = Math.max(0, victim.health - damage);

            // Track damage for assists
            if (!damageHistory.has(data.targetId)) {
                damageHistory.set(data.targetId, new Map());
            }
            damageHistory.get(data.targetId).set(socket.id, Date.now());

            console.log(`Player ${socket.id} (${attacker.team}) hit ${data.targetId} (${victim.team}) for ${damage} damage. Health: ${victim.health}`);

            // Notify the victim
            io.to(data.targetId).emit('tookDamage', {
                damage: damage,
                health: victim.health,
                attackerId: socket.id
            });

            // Notify the attacker
            socket.emit('damageConfirmed', {
                targetId: data.targetId,
                damage: damage,
                remainingHealth: victim.health
            });

            // Check if victim died
            if (victim.health <= 0) {
                // Update stats
                victim.deaths++;
                attacker.kills++;

                // Update team scores
                if (attacker.team === 'red') redTeamKills++;
                else blueTeamKills++;
                                // ===== KILL FEED BROADCAST =====
                const killerName = attacker.team === 'blue' ? 'Messi' : 'Ronaldo';
                const victimName = victim.team === 'blue' ? 'Messi' : 'Ronaldo';

                io.emit("killFeed", {
                    killer: killerName,
                    victim: victimName,
                    weapon: attacker.currentWeapon
                });


                console.log(`[Score] RED: ${redTeamKills} | BLUE: ${blueTeamKills}`);

                // Calculate assists
                const contributors = damageHistory.get(data.targetId);
                if (contributors) {
                    contributors.forEach((time, contributorId) => {
                        // Assist if damaged within last 10 seconds and not the killer
                        if (contributorId !== socket.id && Date.now() - time < 10000) {
                            const assistPlayer = players.get(contributorId);
                            if (assistPlayer) {
                                assistPlayer.assists++;
                            }
                        }
                    });
                }

                // Clear damage history for victim
                damageHistory.delete(data.targetId);

                io.to(data.targetId).emit('playerDied', {
                    killerId: socket.id
                });

                socket.emit('playerKilled', {
                    victimId: data.targetId
                });

                // Broadcast updated scoreboard
                broadcastScoreboard();

                // Check win condition
                if (redTeamKills >= MAX_TEAM_KILLS || blueTeamKills >= MAX_TEAM_KILLS) {
                    matchEnded = true;
                    const winner = redTeamKills >= MAX_TEAM_KILLS ? 'red' : 'blue';
                    io.emit('matchWin', { winner, redTeamKills, blueTeamKills });
                    console.log(`[MATCH END] ${winner.toUpperCase()} Team Wins!`);
                }

                // Reset victim health after death
                setTimeout(() => {
                    victim.health = victim.maxHealth;
                    io.to(data.targetId).emit('respawned', {
                        health: victim.maxHealth
                    });
                }, 3000);
            }
        }
    });

    // Handle health update
    socket.on('healthUpdate', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.health = data.health;
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        players.delete(socket.id);
        damageHistory.delete(socket.id);

        // Notify other players
        socket.broadcast.emit('playerLeft', {
            id: socket.id
        });

        broadcastScoreboard();
    });
});

// Heartbeat to ensure all clients have latest stats
setInterval(broadcastScoreboard, 10000);

httpServer.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`=================================`);
});
