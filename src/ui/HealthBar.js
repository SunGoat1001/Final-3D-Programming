/**
 * HealthBar UI Component
 * Separates rendering logic from player state.
 */
export class HealthBar {
    constructor() {
        this.container = document.getElementById('health-bar-container');
        this.textElement = document.getElementById('health-text');
        this.segmentsCount = 20; // Number of segments in the bar
        this.segments = [];
        this.initSegments();
    }

    /**
     * Initialize the segments in the container
     */
    initSegments() {
        if (!this.container) return;

        // Clear existing content
        this.container.innerHTML = '';
        this.segments = [];

        for (let i = 0; i < this.segmentsCount; i++) {
            const segment = document.createElement('div');
            segment.className = 'health-segment';
            this.container.appendChild(segment);
            this.segments.push(segment);
        }
    }

    /**
     * Update the health bar UI
     * @param {number} health - Current health value
     * @param {number} maxHealth - Maximum health value
     */
    update(health, maxHealth) {
        const percentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));

        // Update text
        if (this.textElement) {
            this.textElement.innerText = Math.ceil(health);
        }

        // Render the segments
        this.render(percentage);
    }

    /**
     * Render the visual state of the health bar
     * @param {number} percentage - Health percentage (0-100)
     */
    render(percentage) {
        const activeSegmentsCount = Math.ceil((percentage / 100) * this.segmentsCount);

        let colorClass = 'green';
        let textColor = '#2ecc71';

        if (percentage < 30) {
            colorClass = 'red';
            textColor = '#e74c3c';
        } else if (percentage <= 70) {
            colorClass = 'yellow';
            textColor = '#f1c40f';
        }

        // Update text color
        if (this.textElement) {
            this.textElement.style.color = textColor;
        }

        this.segments.forEach((segment, index) => {
            // Clear previous color classes
            segment.classList.remove('green', 'yellow', 'red');

            if (index < activeSegmentsCount) {
                segment.classList.add('active', colorClass);
            } else {
                segment.classList.remove('active');
            }
        });
    }
}
