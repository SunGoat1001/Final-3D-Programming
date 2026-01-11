/**
 * WeaponUI - Hiển thị thông tin vũ khí trên màn hình
 * Bao gồm: tên vũ khí, ammo, reload indicator
 */
export class WeaponUI {
    constructor() {
        this.container = null;
        this.weaponNameElement = null;
        this.ammoElement = null;
        this.reloadBarContainer = null;
        this.reloadBar = null;

        this._createUI();
    }

    /**
     * Create UI elements
     */
    _createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'weapon-ui';
        this.container.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            z-index: 1000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        `;

        // Weapon name
        this.weaponNameElement = document.createElement('div');
        this.weaponNameElement.id = 'weapon-name';
        this.weaponNameElement.style.cssText = `
            font-size: 16px;
            font-weight: 500;
            color: #aaa;
            text-transform: uppercase;
            letter-spacing: 2px;
        `;
        this.container.appendChild(this.weaponNameElement);

        // Ammo display
        this.ammoElement = document.createElement('div');
        this.ammoElement.id = 'ammo-display';
        this.ammoElement.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            line-height: 1;
            display: flex;
            align-items: baseline;
            gap: 8px;
        `;
        this.container.appendChild(this.ammoElement);

        // Reload bar container
        this.reloadBarContainer = document.createElement('div');
        this.reloadBarContainer.id = 'reload-bar-container';
        this.reloadBarContainer.style.cssText = `
            width: 200px;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            display: none;
        `;

        // Reload bar fill
        this.reloadBar = document.createElement('div');
        this.reloadBar.id = 'reload-bar';
        this.reloadBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ffaa00, #ff6600);
            border-radius: 3px;
            transition: width 0.05s linear;
        `;
        this.reloadBarContainer.appendChild(this.reloadBar);
        this.container.appendChild(this.reloadBarContainer);

        // Reload text
        this.reloadText = document.createElement('div');
        this.reloadText.id = 'reload-text';
        this.reloadText.style.cssText = `
            font-size: 14px;
            color: #ffaa00;
            display: none;
        `;
        this.reloadText.textContent = 'RELOADING...';
        this.container.appendChild(this.reloadText);

        // Weapon slots indicator
        this.slotsContainer = document.createElement('div');
        this.slotsContainer.id = 'weapon-slots';
        this.slotsContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 10px;
        `;
        this._createSlotIndicators();
        this.container.appendChild(this.slotsContainer);

        // Controls hint
        this.controlsHint = document.createElement('div');
        this.controlsHint.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        `;
        this.controlsHint.innerHTML = '[1][2][3][4] Switch | [R] Reload';
        this.container.appendChild(this.controlsHint);

        document.body.appendChild(this.container);
    }

    /**
     * Create weapon slot indicators
     */
    _createSlotIndicators() {
        const slots = [
            { key: '1', name: 'Rifle' },
            { key: '2', name: 'Shotgun' },
            { key: '3', name: 'Sword' },
            { key: '4', name: 'Grenade' }
        ];

        this.slotElements = {};

        slots.forEach(slot => {
            const slotEl = document.createElement('div');
            slotEl.style.cssText = `
                padding: 5px 10px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 5px;
            `;

            const keyEl = document.createElement('span');
            keyEl.style.cssText = `
                background: rgba(255, 255, 255, 0.2);
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: bold;
            `;
            keyEl.textContent = slot.key;

            const nameEl = document.createElement('span');
            nameEl.style.color = '#888';
            nameEl.textContent = slot.name;

            slotEl.appendChild(keyEl);
            slotEl.appendChild(nameEl);
            this.slotsContainer.appendChild(slotEl);
            this.slotElements[slot.key] = slotEl;
        });
    }

    /**
     * Update UI with weapon info
     * @param {Object} info - Weapon info from WeaponManager
     */
    updateWeaponInfo(info) {
        // Update weapon name
        this.weaponNameElement.textContent = info.name;

        // Update ammo display
        if (info.maxAmmo === Infinity) {
            // Melee weapon
            this.ammoElement.innerHTML = `
                <span style="color: #66ff66;">∞</span>
            `;
        } else {
          this.ammoElement.innerHTML = `
                <span id="current-ammo">${info.currentAmmo}</span>
                <span style="font-size: 20px; color: #666;">/</span>
                <span style="font-size: 20px; color: #888;">${info.reserveAmmo}</span>
            `;

            const currentSpan = this.ammoElement.querySelector('#current-ammo');

            // LOW AMMO WARNING
            if (info.maxAmmo !== Infinity && info.currentAmmo <= 5) {
                currentSpan.style.color = '#ff3333';
                currentSpan.style.animation = 'lowAmmoBlink 0.8s infinite';
            } else if (info.currentAmmo <= 10) {
                currentSpan.style.color = '#ffaa00';
                currentSpan.style.animation = 'none';
            } else {
                currentSpan.style.color = '#ffffff';
                currentSpan.style.animation = 'none';
            }

        }

        // Update slot indicators
        Object.entries(this.slotElements).forEach(([key, el]) => {
            const isActive =
                (key === '1' && info.name.includes('Rifle')) ||
                (key === '2' && info.name.includes('Shotgun')) ||
                (key === '3' && info.name.includes('Sword')) ||
                (key === '4' && info.name.includes('Grenade'));

            if (isActive) {
                el.style.borderColor = '#ffaa00';
                el.style.background = 'rgba(255, 170, 0, 0.2)';
            } else {
                el.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                el.style.background = 'rgba(0, 0, 0, 0.5)';
            }
        });
    }

    /**
     * Show reload progress
     * @param {number} progress - 0 to 1
     */
    showReloadProgress(progress) {
        this.reloadBarContainer.style.display = 'block';
        this.reloadText.style.display = 'block';
        this.reloadBar.style.width = `${progress * 100}%`;
    }

    /**
     * Hide reload indicator
     */
    hideReload() {
        this.reloadBarContainer.style.display = 'none';
        this.reloadText.style.display = 'none';
        this.reloadBar.style.width = '0%';
    }

    /**
     * Destroy UI
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default WeaponUI;
