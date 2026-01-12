export class HUD {
    constructor() {
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.weaponName = document.getElementById('weapon-name');
        this.ammo = document.getElementById('ammo');
        this.killCount = document.getElementById('kill-count');
        this.damageOverlay = document.getElementById('damage-overlay');

        this.kills = 0;
    }

    updateHealth(health, maxHealth) {
        const percent = (health / maxHealth) * 100;
        this.healthBar.style.width = percent + '%';
        this.healthText.textContent = Math.ceil(health);

        // Change color based on health
        if (percent > 60) {
            this.healthBar.style.background = 'linear-gradient(90deg, #00aa00, #44ff44)';
        } else if (percent > 30) {
            this.healthBar.style.background = 'linear-gradient(90deg, #aaaa00, #ffff44)';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #aa0000, #ff4444)';
        }
    }

    updateWeapon(weapon) {
        if (!weapon) return;
        this.weaponName.textContent = weapon.name;
        this.ammo.textContent = weapon.getAmmoString();
    }

    addKill() {
        this.kills++;
        this.killCount.textContent = this.kills;
    }

    showDamage() {
        this.damageOverlay.classList.add('active');
        setTimeout(() => {
            this.damageOverlay.classList.remove('active');
        }, 150);
    }

    showPickupMessage(message) {
        const msgEl = document.createElement('div');
        msgEl.className = 'pickup-message';
        msgEl.textContent = message;
        document.getElementById('hud').appendChild(msgEl);

        setTimeout(() => {
            msgEl.remove();
        }, 2000);
    }

    reset() {
        this.kills = 0;
        this.killCount.textContent = '0';
        this.updateHealth(100, 100);
    }
}
