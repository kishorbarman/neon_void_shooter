import { randomRange } from './utils.js';

class EnemyProjectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.velocity = {
            x: Math.cos(angle) * 8, // Slower than player projectiles
            y: Math.sin(angle) * 8
        };
        this.color = '#aa00ff'; // Match shooter color
        this.damage = 10;
        this.remove = false;
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

        this.startWave(1);
    }

    startWave(waveNum) {
        this.game.wave = waveNum;
        this.enemiesToSpawn = 5 + Math.floor(waveNum * 2.5);
        this.spawnInterval = Math.max(200, 1000 - (waveNum * 60));
        this.waveInProgress = true;
        // console.log(`Starting Wave ${waveNum}, Enemies: ${this.enemiesToSpawn}`);
    }

    update(player, width, height) {
        // Spawning Logic
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
    }
}
