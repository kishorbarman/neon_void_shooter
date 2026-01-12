import { randomRange } from './utils.js';

class Enemy {
    constructor(gameWidth, gameHeight, type) {
        this.type = type; // 'CHASER', 'SHOOTER', 'DASHER'
        this.radius = 12;
        this.color = '#ff0055';
        this.scoreValue = 100;
        this.speed = 2;
        this.isDead = false;

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
            this.speed = 4;
            this.color = '#ffaa00';
            this.scoreValue = 200;
        } else if (type === 'SHOOTER') {
            this.speed = 1.5;
            this.color = '#aa00ff';
            this.scoreValue = 150;
        }

        this.hp = 10;
        this.velocity = { x: 0, y: 0 };
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    update(player) {
        // Simple AI: Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);

        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.y = Math.sin(angle) * this.speed;

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
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1000; // ms

        this.enemiesToSpawn = 0;
        this.waveInProgress = false;

        this.startWave(1);
    }

    startWave(waveNum) {
        this.game.wave = waveNum;
        this.enemiesToSpawn = 5 + (waveNum * 2);
        this.spawnInterval = Math.max(200, 1000 - (waveNum * 50));
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
        this.enemies.forEach(enemy => enemy.update(player));
    }

    spawnEnemy(width, height) {
        const rand = Math.random();
        let type = 'CHASER';
        if (rand > 0.7) type = 'DASHER';
        if (rand > 0.9) type = 'SHOOTER'; // Shooter logic implementation simplified for now

        this.enemies.push(new Enemy(width, height, type));
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }
}
