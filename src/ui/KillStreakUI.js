export class KillStreakUI {
    constructor() {
        this.killCount = 0;
        this.lastKillTime = 0;

        this.streaks = {
            1: { text: "FIRST BLOOD", sound: "public/sounds/killstreak/FirstKill.mp3", icon: "public/textures/killstreak/firstblood.webp" },
            2: { text: "DOUBLE KILL", sound: "public/sounds/killstreak/doublekill.ogg", icon: "public/textures/killstreak/doublekill.webp" },
            3: { text: "TRIPLE KILL", sound: "public/sounds/killstreak/triple.ogg", icon: "public/textures/killstreak/triplekill.webp" },
            4: { text: "QUADRA KILL", sound: "public/sounds/killstreak/fourkill.ogg", icon: "public/textures/killstreak/quadra.webp" },
            5: { text: "MEGA KILL", sound: "public/sounds/killstreak/mega.ogg", icon: "public/textures/killstreak/penta.webp" },
            6: { text: "LEGENDARY", sound: "public/sounds/killstreak/Lengendary.ogg", icon: "public/textures/killstreak/legendary.webp" },
        };

        this.createUI();
    }

    createUI() {
        this.container = document.createElement("div");
        Object.assign(this.container.style, {
            position: "fixed",
            left: "50%",
            bottom: "80px",
            transform: "translateX(-50%) scale(0.5)",
            opacity: "0",
            transition: "all 0.25s cubic-bezier(.2,.8,.2,1)",
            zIndex: 99999,
            textAlign: "center",
            pointerEvents: "none"
        });

        this.iconEl = document.createElement("img");
        this.iconEl.style.width = "160px";
        this.iconEl.style.filter = "drop-shadow(0 0 20px rgba(255,200,0,0.8))";

        this.textEl = document.createElement("div");
        Object.assign(this.textEl.style, {
            color: "#ffd700",
            fontSize: "32px",
            fontWeight: "900",
            textShadow: "0 0 20px black"
        });

        this.container.appendChild(this.iconEl);
        this.container.appendChild(this.textEl);
        document.body.appendChild(this.container);
    }

    onKill() {
        this.killCount++;
        console.log("🔥 KILL STREAK =", this.killCount);
        this.show(this.killCount);
    }


    show(count) {
        const data = this.streaks[count] || this.streaks[6];
        if (!data) return;

        // Set content
        this.iconEl.src = data.icon;
        this.textEl.textContent = data.text;

        // Play sound
        const audio = new Audio(data.sound);
        audio.volume = 0.8;
        audio.play();

        // Animate
        this.container.style.transition = "none";
        this.container.style.transform = "translateX(-50%) scale(0.5)";
        this.container.style.opacity = "0";

        requestAnimationFrame(() => {
            this.container.style.transition = "all 0.25s cubic-bezier(.2,.8,.2,1)";
            this.container.style.transform = "translateX(-50%) scale(1.1)";
            this.container.style.opacity = "1";
        });

        setTimeout(() => {
            this.container.style.transform = "translateX(-50%) scale(1)";
        }, 150);

        setTimeout(() => {
            this.container.style.opacity = "0";
            this.container.style.transform = "translateX(-50%) scale(0.7)";
        }, 1800);
    }

    reset() {
        this.killCount = 0;
        this.lastKillTime = 0;
    }
}
