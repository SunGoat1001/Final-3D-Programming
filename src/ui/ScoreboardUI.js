import { networkManager } from '../NetworkManager.js';

export class ScoreboardUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.topScoreContainer = null;
        this.winOverlay = null;
        this._createUI();
        this._bindEvents();
    }

    _createUI() {
        this.container = document.createElement('div');
        this.container.id = 'scoreboard-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 1000px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 32px;
            color: white;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            display: none;
            z-index: 9999;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 16px;
        `;

        const title = document.createElement('h2');
        title.textContent = 'MATCH STATS';
        title.style.cssText = `
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 2px;
            background: linear-gradient(to right, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        `;

        const info = document.createElement('div');
        info.innerHTML = `<span style="color: rgba(255,255,255,0.4)">HOLD</span> <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-weight: bold;">TAB</span> <span style="color: rgba(255,255,255,0.4)">TO VIEW</span>`;
        info.style.fontSize = '12px';

        header.appendChild(title);
        header.appendChild(info);
        this.container.appendChild(header);

        const tablesContainer = document.createElement('div');
        tablesContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
        `;

        this.redTeamTable = this._createTeamTable('RED TEAM', '#ef4444');
        this.blueTeamTable = this._createTeamTable('BLUE TEAM', '#3b82f6');

        tablesContainer.appendChild(this.redTeamTable.container);
        tablesContainer.appendChild(this.blueTeamTable.container);
        this.container.appendChild(tablesContainer);

        // TOP TEAM SCORE COUNTER
        this.topScoreContainer = document.createElement('div');
        this.topScoreContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            flex-direction: row;
            align-items: center;
            gap: 20px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(8px);
            padding: 10px 40px;
            border-radius: 50px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 9998;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        this.topScoreContainer.innerHTML = `
            <div id="red-score" style="color: #ef4444; font-size: 32px; font-weight: 900; text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);">0</div>
            <div style="color: rgba(255,255,255,0.2); font-size: 20px; font-weight: 800;">VS</div>
            <div id="blue-score" style="color: #3b82f6; font-size: 32px; font-weight: 900; text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);">0</div>
        `;
        document.body.appendChild(this.topScoreContainer);

        // WIN OVERLAY
        this.winOverlay = document.createElement('div');
        this.winOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            flex-direction: column;
            align-items: center;
            z-index: 10001;
            font-family: 'Inter', sans-serif;
            pointer-events: none;
            text-align: center;
        `;
        this.winOverlay.innerHTML = `
            <div id="win-team-name" style="font-size: 72px; font-weight: 900; letter-spacing: 10px; margin-bottom: 10px; text-shadow: 0 0 50px rgba(255,255,255,0.5);">BLUE TEAM WINS</div>
            <div style="font-size: 20px; color: rgba(255,255,255,0.6); letter-spacing: 5px;">MATCH FINISHED</div>
        `;
        document.body.appendChild(this.winOverlay);

        document.body.appendChild(this.container);
    }

    _createTeamTable(teamName, color) {
        const container = document.createElement('div');

        const title = document.createElement('h3');
        title.textContent = teamName;
        title.style.cssText = `
            color: ${color};
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 16px;
            padding-left: 8px;
            border-left: 4px solid ${color};
        `;

        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        `;

        table.innerHTML = `
            <thead>
                <tr style="color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <th style="text-align: left; padding: 12px 8px;">PLAYER</th>
                    <th style="text-align: center; padding: 12px 8px; color: #fbbf24;">K</th>
                    <th style="text-align: center; padding: 12px 8px;">D</th>
                    <th style="text-align: center; padding: 12px 8px; color: #60a5fa;">A</th>
                </tr>
            </thead>
            <tbody class="players-body"></tbody>
        `;

        container.appendChild(title);
        container.appendChild(table);

        return {
            container,
            tbody: table.querySelector('.players-body')
        };
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') {
                e.preventDefault();
                this.show();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Tab') {
                if (!networkManager.matchEnded) {
                    this.hide();
                }
            }
        });
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.topScoreContainer.style.display = 'flex';
        this.update();
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.topScoreContainer.style.display = 'none';
    }

    update() {
        const players = networkManager.scoreboardData || [];
        const localId = networkManager.playerId;
        const teamScores = networkManager.teamScores;
        const matchEnded = networkManager.matchEnded;

        // Update Top Score numbers
        const redScoreEl = document.getElementById('red-score');
        const blueScoreEl = document.getElementById('blue-score');
        if (redScoreEl) redScoreEl.textContent = teamScores.red;
        if (blueScoreEl) blueScoreEl.textContent = teamScores.blue;

        // Handle Win Message
        if (matchEnded) {
            const winner = teamScores.red >= teamScores.blue ? 'RED' : 'BLUE';
            const winTeamNameEl = document.getElementById('win-team-name');
            if (winTeamNameEl) {
                winTeamNameEl.textContent = `${winner} TEAM WINS`;
                winTeamNameEl.style.color = winner === 'RED' ? '#ef4444' : '#3b82f6';
                winTeamNameEl.style.textShadow = `0 0 50px ${winner === 'RED' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`;
            }
            if (this.winOverlay.style.display !== 'flex') {
                this.winOverlay.style.display = 'flex';
                this.isVisible = true;
                this.container.style.display = 'block';
                this.topScoreContainer.style.display = 'flex';
            }
        }

        if (!this.isVisible) return;

        console.log('Scoreboard Data:', players);

        // Group & Sort
        const redPlayers = players.filter(p => p.team === 'red').sort((a, b) => b.kills - a.kills);
        const bluePlayers = players.filter(p => p.team === 'blue').sort((a, b) => b.kills - a.kills);

        if (players.length > 0) {
            console.log(`UI: Found ${players.length} players. Red: ${redPlayers.length}, Blue: ${bluePlayers.length}`);
        }

        this._renderPlayers(this.redTeamTable.tbody, redPlayers, localId);
        this._renderPlayers(this.blueTeamTable.tbody, bluePlayers, localId);
    }

    _renderPlayers(tbody, players, localId) {
        tbody.innerHTML = '';

        players.forEach(p => {
            const row = document.createElement('tr');
            const isLocal = p.id === localId;

            if (isLocal) {
                row.style.background = 'rgba(255, 255, 255, 0.05)';
            }

            row.style.borderBottom = '1px solid rgba(255,255,255,0.02)';

            row.innerHTML = `
                <td style="padding: 12px 8px; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 4px; height: 16px; background: ${p.team === 'red' ? '#ef4444' : '#3b82f6'}; border-radius: 2px;"></div>
                    <span style="font-weight: ${isLocal ? '800' : '500'}; color: ${isLocal ? '#fff' : '#cbd5e1'}">
                        ${p.name} ${isLocal ? '(YOU)' : ''}
                    </span>
                </td>
                <td style="text-align: center; padding: 12px 8px; font-weight: 800; color: #fbbf24;">${p.kills}</td>
                <td style="text-align: center; padding: 12px 8px; color: #ef4444; opacity: 0.8;">${p.deaths}</td>
                <td style="text-align: center; padding: 12px 8px; color: #60a5fa; opacity: 0.8;">${p.assists}</td>
            `;
            tbody.appendChild(row);
        });

        if (players.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: rgba(255,255,255,0.2); font-style: italic;">No players</td></tr>`;
        }
    }
}
