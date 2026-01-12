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
        const count = type === 'DEATH' ? 20 : 5;
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
