// src/ui/KillFeed.js
export class KillFeed {
    constructor(maxItems = 5, containerId = 'kill-feed') {
        this.maxItems = maxItems;
        this.items = [];

        // Weapon icons (emoji for now - later replace with PNG)
        this.weaponIcons = {
            rifle: '🔫',
            shotgun: '💥',
            sword: '🗡️',
            bazooka: '🚀',
            grenade: '💣',
            default: '❌'
        };

        // Create container
        this.container = document.createElement('div');
        this.container.id = containerId; 
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            width: '320px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none'
        });

        document.body.appendChild(this.container);
    }

    addKill(killer, victim, weaponId = 'default') {
        const icon = this.weaponIcons[weaponId] || this.weaponIcons.default;

        const killEl = document.createElement('div');

        // Card style
        Object.assign(killEl.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#fff',
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transform: 'translateX(120%)',
            opacity: '0',
            transition: 'all 0.35s cubic-bezier(.2,.8,.2,1)'
        });

        // Left (killer)
        const killerEl = document.createElement('span');
        killerEl.textContent = killer;
        killerEl.style.color = '#4ade80'; // green

        // Weapon
        const weaponEl = document.createElement('span');
        weaponEl.textContent = icon;
        weaponEl.style.fontSize = '18px';

        // Right (victim)
        const victimEl = document.createElement('span');
        victimEl.textContent = victim;
        victimEl.style.color = '#f87171'; // red

        killEl.appendChild(killerEl);
        killEl.appendChild(weaponEl);
        killEl.appendChild(victimEl);

        // Add to top
        this.container.prepend(killEl);
        this.items.unshift(killEl);

        // Limit items
        if (this.items.length > this.maxItems) {
            const old = this.items.pop();
            if (old && old.parentElement) old.remove();
        }

        // Animate in
        requestAnimationFrame(() => {
            killEl.style.transform = 'translateX(0)';
            killEl.style.opacity = '1';
        });

        // Auto remove
        setTimeout(() => {
            killEl.style.opacity = '0';
            killEl.style.transform = 'translateX(120%)';

            setTimeout(() => {
                if (killEl.parentElement) killEl.remove();
                this.items = this.items.filter(i => i !== killEl);
            }, 400);
        }, 3500);
    }
}
