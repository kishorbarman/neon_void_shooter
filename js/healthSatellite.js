// Health Satellite - gives player an extra life
// Only spawns when player has 1 life left

class HealthSatellite {
    constructor(gameWidth, gameHeight) {
        this.size = 20;
        this.radius = this.size; // For collision detection
        this.color = '#ff4488'; // Pink/magenta for health
        this.glowColor = '#ff0066';

        // Spawn at random position (not too close to edges)
        const margin = 100;
        this.x = margin + Math.random() * (gameWidth - margin * 2);
        this.y = margin + Math.random() * (gameHeight - margin * 2);

        // Slow floating movement
        this.velocity = {
            x: (Math.random() - 0.5) * 0.4,
            y: (Math.random() - 0.5) * 0.4
        };

        // Visual effects
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.03;
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

        // Update rotation and pulse
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.08;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15;
        ctx.scale(pulseScale, pulseScale);

        // Outer glow
        ctx.shadowBlur = 25 + Math.sin(this.pulsePhase) * 10;
        ctx.shadowColor = this.glowColor;

        // Diamond/cross shape (distinct from hexagonal ammo satellites)
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.4, -this.size * 0.4);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(this.size * 0.4, this.size * 0.4);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.4, this.size * 0.4);
        ctx.lineTo(-this.size, 0);
        ctx.lineTo(-this.size * 0.4, -this.size * 0.4);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, '#aa0044');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner heart symbol
        ctx.shadowBlur = 0;
        this.drawHeart(ctx, 0, 0, this.size * 0.4);

        // Orbiting particles
        for (let i = 0; i < 3; i++) {
            const orbitAngle = this.pulsePhase * 2 + (i * Math.PI * 2 / 3);
            const orbitRadius = this.size * 0.8;
            const px = Math.cos(orbitAngle) * orbitRadius;
            const py = Math.sin(orbitAngle) * orbitRadius;

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.restore();
    }

    drawHeart(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        ctx.bezierCurveTo(
            -size * 0.5, -size * 0.3,
            -size, size * 0.1,
            0, size * 0.8
        );
        ctx.bezierCurveTo(
            size, size * 0.1,
            size * 0.5, -size * 0.3,
            0, size * 0.3
        );
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
    }
}

export default class HealthSatelliteManager {
    constructor(game) {
        this.game = game;
        this.satellites = [];
        this.spawnTimer = 0;
        this.spawnInterval = 600; // Check every ~10 seconds at 60fps
        this.maxSatellites = 1; // Only 1 at a time to keep it rare
        this.spawnChance = 0.4; // 40% chance to spawn when conditions are met
    }

    update(player, width, height) {
        // Only spawn if player has 1 life left
        if (player.lives === 1) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval && this.satellites.length < this.maxSatellites) {
                // Random chance to spawn
                if (Math.random() < this.spawnChance) {
                    this.spawnSatellite(width, height);
                }
                this.spawnTimer = 0;
            }
        } else {
            // Reset timer if player has more lives
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
                // Player collected the satellite - give extra life
                player.lives++;
                player.health = player.maxHealth; // Also restore health
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
            y: satellite.y
        }));
    }

    spawnSatellite(width, height) {
        this.satellites.push(new HealthSatellite(width, height));
    }

    draw(ctx) {
        this.satellites.forEach(satellite => satellite.draw(ctx));
    }

    reset() {
        this.satellites = [];
        this.spawnTimer = 0;
    }
}
