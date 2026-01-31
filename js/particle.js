export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = Math.random() * 3 + 1;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;

        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.01;

        // Colors based on type
        switch (type) {
            case 'HIT':
                this.color = '#ffaa00';
                break;
            case 'DEATH':
                this.color = '#ff0055';
                break;
            case 'PLAYER_HIT':
                this.color = '#ff0000';
                break;
            case 'PICKUP':
                this.color = '#00ffff';
                this.radius = Math.random() * 4 + 2; // Bigger particles for pickup
                break;
            case 'BOSS_DEATH':
                const bossColors = ['#ff0000', '#ff6600', '#ffff00', '#ffffff'];
                this.color = bossColors[Math.floor(Math.random() * bossColors.length)];
                this.radius = Math.random() * 8 + 4; // Much bigger particles
                break;
            case 'EXTRA_LIFE':
                const lifeColors = ['#ff4488', '#ff0066', '#ffffff', '#ffaacc'];
                this.color = lifeColors[Math.floor(Math.random() * lifeColors.length)];
                this.radius = Math.random() * 5 + 3; // Big celebratory particles
                break;
            default:
                this.color = '#ffffff';
        }
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

export default class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, type) {
        let count = 5;
        if (type === 'DEATH') count = 20;
        if (type === 'PICKUP') count = 15;
        if (type === 'BOSS_DEATH') count = 50; // Massive explosion for boss
        if (type === 'EXTRA_LIFE') count = 30; // Celebratory explosion for extra life
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    update() {
        this.particles.forEach((p, index) => {
            p.update();
            if (p.alpha <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
