import { randomRange } from './utils.js';

class EnemyProjectile {
    constructor(x, y, angle, isBossRocket = false) {
        this.x = x;
        this.y = y;
        this.isBossRocket = isBossRocket;

        if (isBossRocket) {
            this.radius = 8;
            this.velocity = {
                x: Math.cos(angle) * 6,
                y: Math.sin(angle) * 6
            };
            this.color = '#ff3300'; // Fiery red-orange for boss rockets
            this.damage = 35; // Very damaging
        } else {
            this.radius = 3;
            this.velocity = {
                x: Math.cos(angle) * 8,
                y: Math.sin(angle) * 8
            };
            this.color = '#aa00ff'; // Match shooter color
            this.damage = 10;
        }
        this.remove = false;
        this.trail = [];
    }

    update(width, height) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Remove if off screen
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.remove = true;
        }
    }

    draw(ctx) {
        if (this.isBossRocket) {
            // Draw trail for boss rockets
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 10) this.trail.shift();

            // Draw trail
            this.trail.forEach((point, index) => {
                const alpha = index / this.trail.length * 0.5;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.radius * (index / this.trail.length), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                ctx.fill();
            });

            // Draw rocket body
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff6600';
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Inner glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2, false);
            ctx.fillStyle = '#ffff00';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.closePath();
            ctx.shadowBlur = 0;
        }
    }
}

class Enemy {
    constructor(gameWidth, gameHeight, type, wave = 1) {
        this.type = type; // 'CHASER', 'SHOOTER', 'DASHER'
        this.radius = 12;
        this.color = '#ff0055';
        this.scoreValue = 100 * (1 + wave * 0.1);
        this.speed = 2 * (1 + wave * 0.05); // Speed scales 5% per wave
        this.isDead = false;
        this.wave = wave;

        this.lastShot = 0;
        this.fireRate = 2000; // Shoot every 2s

        // Spawn at random edge
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? -30 : gameWidth + 30;
            this.y = Math.random() * gameHeight;
        } else {
            this.x = Math.random() * gameWidth;
            this.y = Math.random() < 0.5 ? -30 : gameHeight + 30;
        }

        // Specific Stats
        if (type === 'DASHER') {
            this.speed = 4 * (1 + wave * 0.05);
            this.color = '#ffaa00';
            this.scoreValue = 200;
        } else if (type === 'SHOOTER') {
            this.speed = 1.5 * (1 + wave * 0.05);
            this.color = '#aa00ff';
            this.scoreValue = 150;
        }

        this.hp = 10 + (wave * 5); // HP scales with wave
        this.velocity = { x: 0, y: 0 };
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    update(player, enemyManager) { // Added enemyManager to spawn projectiles
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (this.type === 'SHOOTER' && dist < 300 && dist > 100) {
            // Stop and shoot
            this.velocity.x = 0;
            this.velocity.y = 0;

            const now = Date.now();
            if (now - this.lastShot >= this.fireRate) {
                // Shoot
                if (enemyManager) {
                    enemyManager.addProjectile(new EnemyProjectile(this.x, this.y, angle));
                }
                this.lastShot = now;
            }
        } else {
            // Chase
            this.velocity.x = Math.cos(angle) * this.speed;
            this.velocity.y = Math.sin(angle) * this.speed;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

class MegaBoss {
    constructor(gameWidth, gameHeight, wave) {
        this.type = 'MEGABOSS';
        this.radius = 50; // Much larger than normal enemies
        this.color = '#ff0000';
        this.secondaryColor = '#ff6600';
        this.scoreValue = 5000 * (wave / 10); // 5000 at wave 10, 10000 at wave 20, etc.
        this.speed = 1.2;
        this.isDead = false;
        this.wave = wave;

        // Boss spawns from a random edge
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // Top
                this.x = gameWidth / 2;
                this.y = -this.radius - 50;
                break;
            case 1: // Bottom
                this.x = gameWidth / 2;
                this.y = gameHeight + this.radius + 50;
                break;
            case 2: // Left
                this.x = -this.radius - 50;
                this.y = gameHeight / 2;
                break;
            case 3: // Right
                this.x = gameWidth + this.radius + 50;
                this.y = gameHeight / 2;
                break;
        }

        // Massive HP that scales with wave
        this.maxHp = 500 + (wave * 50);
        this.hp = this.maxHp;

        this.velocity = { x: 0, y: 0 };

        // Shooting properties
        this.lastShot = 0;
        this.fireRate = 1500; // Shoots every 1.5 seconds
        this.rocketsPerVolley = 5 + Math.floor(wave / 10); // More rockets at higher waves

        // Visual effects
        this.pulsePhase = 0;
        this.rotationAngle = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    update(player, enemyManager, width, height) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Move towards player but keep some distance
        if (dist > 250) {
            this.velocity.x = Math.cos(angle) * this.speed;
            this.velocity.y = Math.sin(angle) * this.speed;
        } else if (dist < 200) {
            // Back away if too close
            this.velocity.x = -Math.cos(angle) * this.speed * 0.5;
            this.velocity.y = -Math.sin(angle) * this.speed * 0.5;
        } else {
            // Strafe
            this.velocity.x = Math.cos(angle + Math.PI / 2) * this.speed * 0.5;
            this.velocity.y = Math.sin(angle + Math.PI / 2) * this.speed * 0.5;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Keep boss on screen
        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));

        // Shooting - fire multiple rockets in a spread pattern
        const now = Date.now();
        if (now - this.lastShot >= this.fireRate) {
            this.fireRocketVolley(angle, enemyManager);
            this.lastShot = now;
        }

        // Update visual effects
        this.pulsePhase += 0.1;
        this.rotationAngle += 0.02;
    }

    fireRocketVolley(baseAngle, enemyManager) {
        const spreadAngle = Math.PI / 4; // 45 degree total spread
        const angleStep = spreadAngle / (this.rocketsPerVolley - 1);
        const startAngle = baseAngle - spreadAngle / 2;

        for (let i = 0; i < this.rocketsPerVolley; i++) {
            const rocketAngle = startAngle + (angleStep * i);
            // Add slight randomness to each rocket
            const finalAngle = rocketAngle + (Math.random() - 0.5) * 0.1;
            enemyManager.addProjectile(new EnemyProjectile(this.x, this.y, finalAngle, true));
        }
    }

    draw(ctx) {
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.05;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Outer glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;

        // Main body - octagon shape
        ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 + this.rotationAngle;
            const px = Math.cos(angle) * this.radius * pulseScale;
            const py = Math.sin(angle) * this.radius * pulseScale;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#ffaa00');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#880000');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner rotating detail
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - this.rotationAngle * 2;
            const px = Math.cos(angle) * this.radius * 0.5;
            const py = Math.sin(angle) * this.radius * 0.5;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center eye
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

        // Draw HP bar above boss
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        // HP bar
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? '#ff0000' : (hpPercent > 0.25 ? '#ff6600' : '#ffff00');
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEGA BOSS', this.x, barY - 8);
    }
}

export default class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.projectiles = []; // Store enemy projectiles
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1000; // ms

        this.enemiesToSpawn = 0;
        this.waveInProgress = false;

        // Boss tracking
        this.boss = null;
        this.isBossWave = false;

        this.startWave(1);
    }

    startWave(waveNum) {
        this.game.wave = waveNum;
        this.waveInProgress = true;

        // Check if this is a boss wave (every 10th wave)
        if (waveNum % 10 === 0) {
            this.isBossWave = true;
            this.enemiesToSpawn = 0; // No regular enemies during boss fight
            // Spawn the Mega Boss
            this.boss = new MegaBoss(this.game.width, this.game.height, waveNum);
            console.log(`BOSS WAVE ${waveNum}! Mega Boss has appeared!`);
        } else {
            this.isBossWave = false;
            this.boss = null;
            this.enemiesToSpawn = 5 + Math.floor(waveNum * 2.5);
            this.spawnInterval = Math.max(200, 1000 - (waveNum * 60));
        }
    }

    update(player, width, height) {
        // Boss wave logic
        if (this.isBossWave && this.boss) {
            this.boss.update(player, this, width, height);

            // Check if boss is defeated
            if (this.boss.isDead) {
                // Boss defeated - award score and move to next wave
                this.game.score += this.boss.scoreValue;
                this.boss = null;
                this.isBossWave = false;
                this.waveInProgress = false;
                setTimeout(() => {
                    this.startWave(this.game.wave + 1);
                }, 3000); // Longer delay after boss defeat
            }
        } else {
            // Normal wave spawning logic
            if (this.enemiesToSpawn > 0) {
                this.spawnTimer++;
                if (this.spawnTimer > 60) { // Approx 1 sec at 60fps
                    this.spawnEnemy(width, height);
                    this.spawnTimer = 0;
                    this.enemiesToSpawn--;
                }
            } else if (this.enemies.length === 0 && this.waveInProgress) {
                // Wave Cleared
                this.waveInProgress = false;
                setTimeout(() => {
                    this.startWave(this.game.wave + 1);
                }, 2000);
            }
        }

        // Update Enemies
        this.enemies.forEach(enemy => enemy.update(player, this));

        // Update Projectiles
        this.projectiles.forEach((p, index) => {
            p.update(width, height);
            if (p.remove) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    spawnEnemy(width, height) {
        const rand = Math.random();
        let type = 'CHASER';
        if (rand > 0.7) type = 'DASHER';
        if (rand > 0.9) type = 'SHOOTER'; // Shooter logic implementation simplified for now

        this.enemies.push(new Enemy(width, height, type, this.game.wave));
    }

    addProjectile(p) {
        this.projectiles.push(p);
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
        this.projectiles.forEach(p => p.draw(ctx));

        // Draw boss if present
        if (this.boss && !this.boss.isDead) {
            this.boss.draw(ctx);
        }
    }

    // Check if a point hits the boss (for collision detection)
    getBoss() {
        return this.boss;
    }
}
