import { checkCollision } from './utils.js';
import TouchControls from './touchControls.js';

class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.velocity = {
            x: Math.cos(angle) * 15,
            y: Math.sin(angle) * 15
        };
        this.color = '#00f3ff';
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

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

export default class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game; // Store game reference
        this.radius = 15;
        this.color = '#ffffff';
        this.velocity = { x: 0, y: 0 };
        this.speed = 4;
        this.friction = 0.92;

        this.projectiles = [];
        this.lastShot = 0;
        this.fireRate = 100; // ms

        // Ammo system
        this.maxAmmo = 100;
        this.ammo = 100;

        this.angle = 0;
        this.mouse = { x: 0, y: 0 };

        this.maxHealth = 100;
        this.health = 100;
        this.lives = 3;
        this.isDead = false;

        this.isInvulnerable = false;
        this.invulnerableTime = 2000;
        this.invulnerableStart = 0;

        this.setupInput();
    }

    setupInput() {
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            mouse: false
        };

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'w') this.keys.w = true;
            if (e.key.toLowerCase() === 'a') this.keys.a = true;
            if (e.key.toLowerCase() === 's') this.keys.s = true;
            if (e.key.toLowerCase() === 'd') this.keys.d = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'w') this.keys.w = false;
            if (e.key.toLowerCase() === 'a') this.keys.a = false;
            if (e.key.toLowerCase() === 's') this.keys.s = false;
            if (e.key.toLowerCase() === 'd') this.keys.d = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            const dx = this.mouse.x - this.x;
            const dy = this.mouse.y - this.y;
            this.angle = Math.atan2(dy, dx);
        });

        window.addEventListener('mousedown', () => this.keys.mouse = true);
        window.addEventListener('mouseup', () => this.keys.mouse = false);

        this.touchControls = new TouchControls();
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return;

        // console.log(`Took damage: ${amount}. Health: ${this.health}. Lives: ${this.lives}`);
        this.health -= amount;
        if (this.health <= 0) {
            this.lives--;
            console.log(`Lost a life! Remaining lives: ${this.lives}`);
            if (this.lives > 0) {
                this.respawn();
            } else {
                console.log("No lives left. Player dead.");
                this.isDead = true;
            }
        }
    }

    respawn() {
        console.log("Respawning player...");
        this.health = this.maxHealth;
        this.ammo = this.maxAmmo; // Refill ammo on respawn
        this.x = this.game.width / 2;
        this.y = this.game.height / 2;
        this.velocity = { x: 0, y: 0 };

        this.isInvulnerable = true;
        this.invulnerableStart = Date.now();
    }

    update(width, height) {
        // Invulnerability Timer
        if (this.isInvulnerable) {
            if (Date.now() - this.invulnerableStart > this.invulnerableTime) {
                this.isInvulnerable = false;
            }
        }

        // Touch input
        const tc = this.touchControls;
        if (tc && tc.isTouchDevice) {
            if (tc.moveActive) {
                this.velocity.x += tc.moveVector.x * 0.8;
                this.velocity.y += tc.moveVector.y * 0.8;
            }
            if (tc.aimActive) {
                this.angle = tc.aimAngle;
                this.keys.mouse = true;
            } else {
                this.keys.mouse = false;
            }
        }

        // Keyboard movement
        if (this.keys.w) this.velocity.y -= 0.5;
        if (this.keys.s) this.velocity.y += 0.5;
        if (this.keys.a) this.velocity.x -= 0.5;
        if (this.keys.d) this.velocity.x += 0.5;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Apply velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Boundary constraint
        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));

        // Shooting
        if (this.keys.mouse) {
            const now = Date.now();
            if (now - this.lastShot >= this.fireRate) {
                this.shoot();
                this.lastShot = now;
            }
        }

        // Update Projectiles
        this.projectiles.forEach((p, index) => {
            p.update(width, height);
            if (p.remove) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    shoot() {
        // Check ammo
        if (this.ammo <= 0) return;

        this.ammo--;

        const p = new Projectile(
            this.x + Math.cos(this.angle) * this.radius * 1.5,
            this.y + Math.sin(this.angle) * this.radius * 1.5,
            this.angle
        );
        this.projectiles.push(p);

        // Play sound
        if (this.game && this.game.soundManager) {
            this.game.soundManager.play('shoot');
        }
    }

    addAmmo(amount) {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }

    draw(ctx) {
        // Draw Projectiles
        this.projectiles.forEach(p => p.draw(ctx));

        // Draw Player Ship
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Flash if invulnerable
        if (this.isInvulnerable) {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        // Triangle shape
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-10, -10);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }
}
