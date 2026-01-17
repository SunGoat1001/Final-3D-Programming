
import { networkManager } from '../NetworkManager.js';

export class LobbyUI {
    constructor() {
        this.container = null;
        this.currentView = 'main'; // main | lobby
        this.roomId = null;
        this.isHost = false;
        
        // Ensure styles are injected
        this.injectStyles();
        this.setupLobbyListeners();
        this.render();
        
        // Auto-refresh room list if on main menu
        setInterval(() => {
            if (this.currentView === 'main' && this.container) {
                this.refreshRoomList();
            }
        }, 3000);
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #lobby-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 5, 20, 0.4);
                backdrop-filter: blur(15px);
                z-index: 20000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: white;
                backdrop-filter: blur(10px);
            }

            .lobby-card {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                width: 800px;
                max-width: 90%;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                display: flex;
                flex-direction: column;
                gap: 20px;
                animation: fadeIn 0.5s ease-out;
            }

            h1, h2 {
                margin: 0;
                text-align: center;
                background: -webkit-linear-gradient(45deg, #00f260, #0575e6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
            }

            h1 { font-size: 3rem; }
            h2 { font-size: 2rem; }

            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .btn-primary {
                background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
                color: #fff;
                box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4);
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 242, 254, 0.6);
            }

            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .btn-red {
                background: linear-gradient(45deg, #ff416c, #ff4b2b);
                color: white;
            }
            .btn-blue {
                background: linear-gradient(45deg, #2193b0, #6dd5ed);
                color: white;
            }
            .btn-start {
                background: linear-gradient(45deg, #11998e, #38ef7d);
                font-size: 20px;
                padding: 16px 32px;
                margin-top: 20px;
                width: 100%;
            }

            .room-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 300px;
                overflow-y: auto;
                margin: 20px 0;
            }

            .room-item {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.2s;
            }

            .room-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .team-container {
                display: flex;
                gap: 20px;
                margin-top: 20px;
            }

            .team-column {
                flex: 1;
                background: rgba(0, 0, 0, 0.2);
                padding: 20px;
                border-radius: 15px;
            }

            .team-header {
                font-size: 1.5rem;
                text-align: center;
                padding-bottom: 10px;
                border-bottom: 2px solid rgba(255,255,255,0.1);
                margin-bottom: 10px;
            }
            
            .team-red .team-header { color: #ff4b2b; border-color: #ff4b2b; }
            .team-blue .team-header { color: #6dd5ed; border-color: #6dd5ed; }

            .player-list {
                min-height: 150px;
            }

            .player-item {
                padding: 8px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex;
                justify-content: space-between;
            }
            
            .input-group {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            input[type="text"] {
                flex: 1;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                padding: 12px;
                border-radius: 10px;
                color: white;
                font-size: 16px;
            }
            
            input[type="text"]:focus {
                outline: none;
                border-color: #4facfe;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Scrollbar */
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.1);
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    render() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'lobby-overlay';
            document.body.appendChild(this.container);
        }

        this.container.innerHTML = ''; // Clear

        if (this.currentView === 'main') {
            this.renderMainMenu();
        } else if (this.currentView === 'lobby') {
            this.renderLobby();
        }
    }

    renderMainMenu() {
        const card = document.createElement('div');
        card.className = 'lobby-card';
        
        card.innerHTML = `
            <h1>GOAT Royale</h1>
            
            <div class="input-group">
                <input type="text" id="new-room-name" placeholder="Enter Room Name..." maxlength="20">
                <button class="btn btn-primary" id="btn-create">Create Room</button>
            </div>

            <h3 style="margin-bottom: 10px; opacity: 0.7;">Available Rooms</h3>
            <div class="room-list" id="room-list">
                <div style="text-align:center; padding: 20px; opacity: 0.5;">Loading rooms...</div>
            </div>
        `;

        this.container.appendChild(card);

        // Bind events
        card.querySelector('#btn-create').addEventListener('click', () => {
            const name = document.getElementById('new-room-name').value;
            if (name.trim()) this.handleCreateRoom(name);
        });
        
        this.refreshRoomList();
    }

    async refreshRoomList() {
        const listContainer = document.getElementById('room-list');
        if (!listContainer) return;

        try {
            const rooms = await networkManager.getRooms();
            listContainer.innerHTML = '';

            if (rooms.length === 0) {
                listContainer.innerHTML = `<div style="text-align:center; padding: 20px; opacity: 0.5;">No rooms found. Create one!</div>`;
                return;
            }

            rooms.forEach(room => {
                const item = document.createElement('div');
                item.className = 'room-item';
                const isPlaying = room.status === 'playing';
                const statusColor = isPlaying ? '#ff4b2b' : '#00f260'; // Red : Green
                const joinDisabled = room.playerCount >= 10; // Allow joining even if playing, just check count

                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong>${room.name}</strong>
                        <span style="color: ${statusColor}; font-size: 0.75rem; font-weight: bold; border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">
                            ${room.status.toUpperCase()}
                        </span>
                        <span style="opacity: 0.6; font-size: 0.9em;">
                            (${room.playerCount}/10)
                        </span>
                    </div>
                    <button class="btn btn-secondary btn-sm" ${joinDisabled ? 'disabled' : ''} style="${joinDisabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        ${isPlaying ? 'JOIN GAME' : 'JOIN'}
                    </button>
                `;
                
                item.querySelector('button').addEventListener('click', () => {
                    this.handleJoinRoom(room.id);
                });

                listContainer.appendChild(item);
            });
        } catch (e) {
            console.error("Failed to load rooms", e);
        }
    }

    renderLobby() {
        const card = document.createElement('div');
        card.className = 'lobby-card';
        card.style.maxWidth = '1000px';

        card.innerHTML = `
            <h2>${networkManager.roomName || 'Room Lobby'}</h2>
            <div style="text-align:center; opacity:0.7; margin-bottom:20px;">Use buttons below to switch teams</div>

            <div class="team-container">
                <div class="team-column team-red">
                    <div class="team-header">RED TEAM <span id="count-red">(0/5)</span></div>
                    <div class="player-list" id="list-red"></div>
                    <button class="btn btn-red" style="width:100%; margin-top:10px;" id="join-red">JOIN RED</button>
                </div>

                <div class="team-column team-blue">
                    <div class="team-header">BLUE TEAM <span id="count-blue">(0/5)</span></div>
                    <div class="player-list" id="list-blue"></div>
                    <button class="btn btn-blue" style="width:100%; margin-top:10px;" id="join-blue">JOIN BLUE</button>
                </div>
            </div>

            <div id="host-controls" style="display:none; text-align: center;">
                <button class="btn btn-start" id="btn-start-game">START GAME</button>
            </div>
            <div id="waiting-msg" style="text-align: center; margin-top: 20px; font-size: 1.2rem; display:none;">
                Waiting for host to start...
            </div>
            
            <button class="btn btn-secondary" id="btn-leave-room" style="align-self: center; margin-top: 10px; background: rgba(255, 59, 59, 0.2); border-color: rgba(255, 59, 59, 0.4);">
                LEAVE ROOM
            </button>
        `;

        this.container.appendChild(card);

        // Bind Events
        card.querySelector('#join-red').addEventListener('click', () => networkManager.setTeam('red'));
        card.querySelector('#join-blue').addEventListener('click', () => networkManager.setTeam('blue'));
        card.querySelector('#btn-start-game').addEventListener('click', () => networkManager.setStartGame());
        
        card.querySelector('#btn-leave-room').addEventListener('click', async () => {
            await networkManager.leaveRoom();
            this.currentView = 'main';
            this.render();
        });

        this.updateLobbyState();
    }

    updateLobbyState() {
        if (this.currentView !== 'lobby') return;

        const players = networkManager.getRemotePlayers();
        // Construct the list of ALL players including local
        const allPlayers = [];
        
        // Add Local Player
        if (networkManager.connected && networkManager.uid) {
             allPlayers.push({
                id: networkManager.uid,
                name: (networkManager.localPlayerData.characterName === 'messi' ? 'Messi' : 'Ronaldo') + ' (You)',
                team: networkManager.playerTeam,
                isLocal: true
             });
        }

        // Add Remote Players
        players.forEach(p => {
             // Avoid duplicate if for some reason remote manager has local player
             if (p.id !== networkManager.uid) {
                 allPlayers.push({
                    id: p.id,
                    name: (p.characterName === 'messi_character' || p.characterName === 'messi' ? 'Messi' : 'Ronaldo'),
                    team: p.team,
                    isLocal: false
                 });
             }
        });
        
        console.log(`Lobby Update: ${allPlayers.length} players found.`);

        const redList = document.getElementById('list-red');
        const blueList = document.getElementById('list-blue');
        let redCount = 0;
        let blueCount = 0;

        if (redList && blueList) {
            redList.innerHTML = '';
            blueList.innerHTML = '';

            allPlayers.forEach(p => {
                const pEl = document.createElement('div');
                pEl.className = 'player-item';
                pEl.textContent = p.name;
                if (p.isLocal) pEl.style.fontWeight = 'bold';

                if (p.team === 'red') {
                    redList.appendChild(pEl);
                    redCount++;
                } else {
                    blueList.appendChild(pEl);
                    blueCount++;
                }
            });
            
            document.getElementById('count-red').innerText = `(${redCount}/5)`;
            document.getElementById('count-blue').innerText = `(${blueCount}/5)`;
            
            // Disable buttons if full
             document.getElementById('join-red').disabled = redCount >= 5;
             document.getElementById('join-blue').disabled = blueCount >= 5;
        }

        // Host controls
        const hostControls = document.getElementById('host-controls');
        const waitingMsg = document.getElementById('waiting-msg');
        
        if (networkManager.isHost) {
            if (hostControls) hostControls.style.display = 'block';
            if (waitingMsg) waitingMsg.style.display = 'none';
        } else {
            if (hostControls) hostControls.style.display = 'none';
            if (waitingMsg) waitingMsg.style.display = 'block';
        }
    }

    async handleCreateRoom(name) {
        try {
            await networkManager.createRoom(name);
            this.currentView = 'lobby';
            this.render();
        } catch (e) {
            alert("Error creating room: " + e.message);
        }
    }

    async handleJoinRoom(id) {
        try {
            await networkManager.joinRoom(id);
            this.currentView = 'lobby';
            this.render();
        } catch (e) {
            alert("Error joining room: " + e.message);
        }
    }
    
    setupLobbyListeners() {
        // UI updates when players join/leave/switch teams
        networkManager.onRoomUpdate = () => {
            this.updateLobbyState();
        };
    }

    hide() {
        this.currentView = 'hidden'; // Stop background updates
        if (this.container) {
            this.container.style.display = 'none';
        }
        // Unlock controls logic if needed, but the game loop handles it
        // We might need to tell main.js to enable controls?
        // Right now controls are enabled but pointer lock requires click.
        // We should trigger a click or show a "Click to Play" overlay?
        // The game has an initial click screen usually.
    }
}

export const lobbyUI = new LobbyUI();
