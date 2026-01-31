// Ammo Satellite types with different sizes and ammo amounts
const SATELLITE_TYPES = {
    SMALL: { ammoAmount: 15, size: 12, color: '#00ff88', panelColor: '#00aa55' },
    MEDIUM: { ammoAmount: 30, size: 18, color: '#00ffff', panelColor: '#00aaaa' },
    LARGE: { ammoAmount: 50, size: 25, color: '#ffff00', panelColor: '#aaaa00' }
};

class AmmoSatellite {
    constructor(gameWidth, gameHeight, type = 'SMALL') {
        const config = SATELLITE_TYPES[type] || SATELLITE_TYPES.SMALL;

        this.type = type;
        this.ammoAmount = config.ammoAmount;
        this.size = config.size;
        this.color = config.color;
        this.panelColor = config.panelColor;
        this.radius = this.size; // For collision detection

        // Spawn at random position (not too close to edges)
        const margin = 100;
        this.x = margin + Math.random() * (gameWidth - margin * 2);
        this.y = margin + Math.random() * (gameHeight - margin * 2);

        // Slow floating movement
        this.velocity = {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
        };

        // Rotation for visual effect
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;

        // Pulsing glow effect
        this.pulsePhase = Math.random() * Math.PI * 2;

        this.collected = false;
    }

    update(width, height) {
        // Float around
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Bounce off edges
        if (this.x < this.size || this.x > width - this.size) {
            this.velocity.x *= -1;
            this.x = Math.max(this.size, Math.min(width - this.size, this.x));
        }
        if (this.y < this.size || this.y > height - this.size) {
            this.velocity.y *= -1;
            this.y = Math.max(this.size, Math.min(height - this.size, this.y));
        }

        // Update rotation
        this.rotation += this.rotationSpeed;

        // Update pulse
        this.pulsePhase += 0.05;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.scale(pulseScale, pulseScale);

        // Glow effect
        ctx.shadowBlur = 15 + Math.sin(this.pulsePhase) * 5;
        ctx.shadowColor = this.color;

        // Main body - hexagonal shape (distinct from circular enemies)
        ctx.beginPath();
        const sides = 6;
        const bodySize = this.size * 0.6;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(angle) * bodySize;
            const py = Math.sin(angle) * bodySize;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Solar panels (rectangles extending from body) - makes it look like a satellite
        ctx.fillStyle = this.panelColor;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // Left panel
        ctx.fillRect(-this.size * 1.2, -this.size * 0.15, this.size * 0.5, this.size * 0.3);
        ctx.strokeRect(-this.size * 1.2, -this.size * 0.15, this.size * 0.5, this.size * 0.3);

        // Right panel
        ctx.fillRect(this.size * 0.7, -this.size * 0.15, this.size * 0.5, this.size * 0.3);
        ctx.strokeRect(this.size * 0.7, -this.size * 0.15, this.size * 0.5, this.size * 0.3);

        // Panel grid lines
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 0.5;

        // Left panel lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-this.size * 1.2 + (this.size * 0.5 / 3) * i, -this.size * 0.15);
            ctx.lineTo(-this.size * 1.2 + (this.size * 0.5 / 3) * i, this.size * 0.15);
            ctx.stroke();
        }

        // Right panel lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.size * 0.7 + (this.size * 0.5 / 3) * i, -this.size * 0.15);
            ctx.lineTo(this.size * 0.7 + (this.size * 0.5 / 3) * i, this.size * 0.15);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // Center detail - ammo icon (bullet shape)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.25);
        ctx.lineTo(this.size * 0.1, -this.size * 0.1);
        ctx.lineTo(this.size * 0.1, this.size * 0.2);
        ctx.lineTo(-this.size * 0.1, this.size * 0.2);
        ctx.lineTo(-this.size * 0.1, -this.size * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

export default class AmmoSatelliteManager {
    constructor(game) {
        this.game = game;
        this.satellites = [];
        this.spawnTimer = 0;
        this.spawnInterval = 300; // Spawn every ~5 seconds at 60fps
        this.maxSatellites = 5;
    }

    update(player, width, height) {
        // Spawn new satellites periodically
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.satellites.length < this.maxSatellites) {
            this.spawnSatellite(width, height);
            this.spawnTimer = 0;
        }

        // Update existing satellites
        this.satellites.forEach(satellite => {
            satellite.update(width, height);
        });

        // Check collision with player
        const collectedSatellites = [];
        this.satellites.forEach((satellite, index) => {
            const dx = player.x - satellite.x;
            const dy = player.y - satellite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + satellite.radius * 0.7) {
                // Player collected the satellite
                player.addAmmo(satellite.ammoAmount);
                satellite.collected = true;
                collectedSatellites.push({ satellite, index });
            }
        });

        // Remove collected satellites and return info for effects
        collectedSatellites.forEach(({ index }) => {
            this.satellites.splice(index, 1);
        });

        return collectedSatellites.map(({ satellite }) => ({
            x: satellite.x,
            y: satellite.y,
            ammoAmount: satellite.ammoAmount,
            color: satellite.color
        }));
    }

    spawnSatellite(width, height) {
        // Randomly choose satellite type
        const rand = Math.random();
        let type = 'SMALL';
        if (rand > 0.85) {
            type = 'LARGE';
        } else if (rand > 0.5) {
            type = 'MEDIUM';
        }

        this.satellites.push(new AmmoSatellite(width, height, type));
    }

    draw(ctx) {
        this.satellites.forEach(satellite => satellite.draw(ctx));
    }

    reset() {
        this.satellites = [];
        this.spawnTimer = 0;
    }
}
