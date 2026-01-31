import Player from './player.js';
import EnemyManager from './enemy.js';
import ParticleSystem from './particle.js';
import SoundManager from './sound.js';
import AmmoSatelliteManager from './ammoSatellite.js';
import { checkCollision } from './utils.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.ui = {
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            scoreValue: document.getElementById('score-value'),
            waveValue: document.getElementById('wave-value'),
            finalScore: document.getElementById('final-score'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            healthBar: document.getElementById('health-bar'),
            livesValue: document.getElementById('lives-value'),
            ammoValue: document.getElementById('ammo-value'),
            ammoBar: document.getElementById('ammo-bar')
        };

        this.soundManager = new SoundManager();
        this.player = null;
        this.enemyManager = null;
        this.particleSystem = null;
        this.ammoSatelliteManager = null;

        this.score = 0;
        this.wave = 1;
        this.isRunning = false;
        this.animationId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.ui.startBtn.addEventListener('click', () => {
            // Needed to resume AudioContext on some browsers
            this.soundManager.ctx.resume().then(() => {
                this.startGame();
            });
        });

        this.ui.restartBtn.addEventListener('click', () => this.startGame());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    startGame() {
        this.score = 0;
        this.wave = 1;
        this.isRunning = true;

        // Hide screens
        this.ui.startScreen.classList.add('hidden');
        this.ui.startScreen.classList.remove('active');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.gameOverScreen.classList.remove('active');

        // Reset UI
        this.updateUI();

        // Initialize entities
        this.player = new Player(this.width / 2, this.height / 2, this);
        this.particleSystem = new ParticleSystem();
        this.enemyManager = new EnemyManager(this);
        this.ammoSatelliteManager = new AmmoSatelliteManager(this);

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animate();
    }

    gameOver() {
        this.isRunning = false;
        this.soundManager.play('gameover');
        this.ui.gameOverScreen.classList.remove('hidden');
        this.ui.gameOverScreen.classList.add('active');
        this.ui.finalScore.textContent = Math.floor(this.score);
        cancelAnimationFrame(this.animationId);
    }

    updateUI() {
        this.ui.scoreValue.textContent = Math.floor(this.score);
        this.ui.waveValue.textContent = this.wave;
        if (this.player) {
            const hpPercent = (this.player.health / this.player.maxHealth) * 100;
            this.ui.healthBar.style.width = `${Math.max(0, hpPercent)}%`;
            this.ui.livesValue.textContent = this.player.lives;

            // Update ammo display
            const ammoPercent = (this.player.ammo / this.player.maxAmmo) * 100;
            if (this.ui.ammoValue) {
                this.ui.ammoValue.textContent = this.player.ammo;
            }
            if (this.ui.ammoBar) {
                this.ui.ammoBar.style.width = `${Math.max(0, ammoPercent)}%`;
                // Change color based on ammo level
                if (ammoPercent > 50) {
                    this.ui.ammoBar.style.background = 'linear-gradient(90deg, #00aaff, #00ffff)';
                } else if (ammoPercent > 20) {
                    this.ui.ammoBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffff00)';
                } else {
                    this.ui.ammoBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
                }
            }
        }
    }

    animate() {
        if (!this.isRunning) return;

        this.ctx.fillStyle = 'rgba(10, 10, 18, 0.3)'; // Trails effect
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Update & Draw Player
        this.player.update(this.width, this.height);
        this.player.draw(this.ctx);

        // Update & Draw Enemies
        this.enemyManager.update(this.player, this.width, this.height);
        this.enemyManager.draw(this.ctx);

        // Update & Draw Ammo Satellites
        const collectedAmmo = this.ammoSatelliteManager.update(this.player, this.width, this.height);
        this.ammoSatelliteManager.draw(this.ctx);

        // Create pickup effects for collected ammo
        collectedAmmo.forEach(pickup => {
            this.particleSystem.createExplosion(pickup.x, pickup.y, 'PICKUP');
            this.soundManager.play('pickup');
        });

        // Update & Draw Particles
        this.particleSystem.update();
        this.particleSystem.draw(this.ctx);

        // Projectiles collision
        this.player.projectiles.forEach((projectile, pIndex) => {
            this.enemyManager.enemies.forEach((enemy, eIndex) => {
                if (checkCollision(projectile, enemy)) {
                    // Logic for hit
                    enemy.takeDamage(projectile.damage);
                    this.particleSystem.createExplosion(enemy.x, enemy.y, 'HIT');
                    this.soundManager.play('hit');

                    // Remove projectile
                    setTimeout(() => {
                        this.player.projectiles.splice(pIndex, 1);
                    }, 0);

                    if (enemy.isDead) {
                        this.score += enemy.scoreValue;
                        this.particleSystem.createExplosion(enemy.x, enemy.y, 'DEATH');
                        this.soundManager.play('explosion');
                        setTimeout(() => {
                            this.enemyManager.enemies.splice(eIndex, 1);
                        }, 0);
                    }
                }
            });
        });

        // Player Collision
        this.enemyManager.enemies.forEach(enemy => {
            if (checkCollision(this.player, enemy)) {
                this.player.takeDamage(10);
                enemy.takeDamage(100); // Enemy dies on impact usually
                this.particleSystem.createExplosion(this.player.x, this.player.y, 'PLAYER_HIT');
                this.soundManager.play('explosion');
            }
        });

        // Enemy Projectiles Collision
        this.enemyManager.projectiles.forEach((projectile) => {
            if (checkCollision(this.player, projectile)) {
                this.player.takeDamage(projectile.damage);
                projectile.remove = true;
                this.particleSystem.createExplosion(this.player.x, this.player.y, 'PLAYER_HIT');
                this.soundManager.play('explosion');
            }
        });

        if (this.player.isDead) {
            this.gameOver();
        }

        this.updateUI();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Start the game instance
window.game = new Game();
