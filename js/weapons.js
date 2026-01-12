import * as THREE from 'three';

class Weapon {
    constructor(scene, name, config) {
        this.scene = scene;
        this.name = name;
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 0.5;
        this.ammo = config.ammo || 30;
        this.maxAmmo = config.maxAmmo || 30;
        this.reserveAmmo = config.reserveAmmo || 90;
        this.isAutomatic = config.isAutomatic || false;
        this.spread = config.spread || 0;
        this.projectileSpeed = config.projectileSpeed || 0;
        this.isHitscan = config.isHitscan !== false;
        this.pelletCount = config.pelletCount || 1;
        this.splashRadius = config.splashRadius || 0;

        this.lastFireTime = 0;
        this.isFiring = false;
        this.mesh = null;
        this.muzzleFlash = null;

        this.createModel(config.color || 0x444444);
    }

    createModel(color) {
        const group = new THREE.Group();

        // Simple weapon shape
        const bodyGeom = new THREE.BoxGeometry(0.08, 0.08, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(0.15, -0.1, -0.3);
        group.add(body);

        // Barrel
        const barrelGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
        const barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0.15, -0.08, -0.55);
        group.add(barrel);

        // Muzzle flash
        const flashGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
        this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
        this.muzzleFlash.position.set(0.15, -0.08, -0.7);
        group.add(this.muzzleFlash);

        this.mesh = group;
        this.mesh.visible = false;
    }

    attachToCamera(camera) {
        camera.add(this.mesh);
    }

    show() {
        if (this.mesh) this.mesh.visible = true;
    }

    hide() {
        if (this.mesh) this.mesh.visible = false;
    }

    canFire() {
        const now = performance.now() / 1000;
        return this.ammo > 0 && (now - this.lastFireTime) >= this.fireRate;
    }

    fire(camera) {
        if (!this.canFire()) return null;

        this.lastFireTime = performance.now() / 1000;
        this.ammo--;

        // Show muzzle flash
        this.muzzleFlash.material.opacity = 1;
        setTimeout(() => {
            this.muzzleFlash.material.opacity = 0;
        }, 50);

        const shots = [];
        const origin = camera.position.clone();
        const baseDirection = new THREE.Vector3();
        camera.getWorldDirection(baseDirection);

        for (let i = 0; i < this.pelletCount; i++) {
            const direction = baseDirection.clone();

            // Apply spread
            if (this.spread > 0) {
                direction.x += (Math.random() - 0.5) * this.spread;
                direction.y += (Math.random() - 0.5) * this.spread;
                direction.z += (Math.random() - 0.5) * this.spread;
                direction.normalize();
            }

            shots.push({
                origin: origin.clone(),
                direction: direction,
                damage: this.damage,
                isHitscan: this.isHitscan,
                projectileSpeed: this.projectileSpeed,
                splashRadius: this.splashRadius
            });
        }

        return shots;
    }

    reload() {
        const needed = this.maxAmmo - this.ammo;
        const available = Math.min(needed, this.reserveAmmo);
        this.ammo += available;
        this.reserveAmmo -= available;
    }

    addAmmo(amount) {
        this.reserveAmmo += amount;
    }

    update(deltaTime, camera) {
        if (!this.mesh) return;

        // Weapon bob
        const time = performance.now() / 1000;
        const bobAmount = 0.003;
        const bobSpeed = 8;

        this.mesh.position.y = Math.sin(time * bobSpeed) * bobAmount;
        this.mesh.position.x = Math.cos(time * bobSpeed * 0.5) * bobAmount * 0.5;
    }

    getAmmoString() {
        return `${this.ammo} / ${this.reserveAmmo}`;
    }
}

export class Shotgun extends Weapon {
    constructor(scene) {
        super(scene, 'SHOTGUN', {
            damage: 15,
            fireRate: 0.8,
            ammo: 8,
            maxAmmo: 8,
            reserveAmmo: 32,
            isAutomatic: false,
            spread: 0.1,
            pelletCount: 8,
            isHitscan: true,
            color: 0x8b4513
        });
    }

    createModel(color) {
        const group = new THREE.Group();

        // Shotgun body
        const bodyGeom = new THREE.BoxGeometry(0.06, 0.1, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(0.2, -0.15, -0.35);
        group.add(body);

        // Double barrel
        const barrelGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });

        const barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel1.rotation.x = Math.PI / 2;
        barrel1.position.set(0.18, -0.1, -0.6);
        group.add(barrel1);

        const barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel2.rotation.x = Math.PI / 2;
        barrel2.position.set(0.22, -0.1, -0.6);
        group.add(barrel2);

        // Muzzle flash
        const flashGeom = new THREE.SphereGeometry(0.12, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
        this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
        this.muzzleFlash.position.set(0.2, -0.1, -0.85);
        group.add(this.muzzleFlash);

        this.mesh = group;
        this.mesh.visible = false;
    }
}

export class RocketLauncher extends Weapon {
    constructor(scene) {
        super(scene, 'ROCKET LAUNCHER', {
            damage: 100,
            fireRate: 1.2,
            ammo: 5,
            maxAmmo: 5,
            reserveAmmo: 20,
            isAutomatic: false,
            spread: 0,
            isHitscan: false,
            projectileSpeed: 40,
            splashRadius: 5,
            color: 0x445544
        });
    }

    createModel(color) {
        const group = new THREE.Group();

        // Launcher tube
        const tubeGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12);
        const tubeMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 });
        const tube = new THREE.Mesh(tubeGeom, tubeMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0.2, -0.12, -0.4);
        group.add(tube);

        // Grip
        const gripGeom = new THREE.BoxGeometry(0.04, 0.12, 0.08);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.8 });
        const grip = new THREE.Mesh(gripGeom, gripMat);
        grip.position.set(0.2, -0.22, -0.25);
        group.add(grip);

        // Scope
        const scopeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const scopeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
        const scope = new THREE.Mesh(scopeGeom, scopeMat);
        scope.rotation.z = Math.PI / 2;
        scope.position.set(0.2, -0.04, -0.35);
        group.add(scope);

        // Muzzle flash
        const flashGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0 });
        this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
        this.muzzleFlash.position.set(0.2, -0.12, -0.75);
        group.add(this.muzzleFlash);

        this.mesh = group;
        this.mesh.visible = false;
    }
}

export class Railgun extends Weapon {
    constructor(scene) {
        super(scene, 'RAILGUN', {
            damage: 80,
            fireRate: 1.5,
            ammo: 10,
            maxAmmo: 10,
            reserveAmmo: 30,
            isAutomatic: false,
            spread: 0,
            isHitscan: true,
            color: 0x4444aa
        });
    }

    createModel(color) {
        const group = new THREE.Group();

        // Main body
        const bodyGeom = new THREE.BoxGeometry(0.06, 0.08, 0.7);
        const bodyMat = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x2222ff,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(0.18, -0.12, -0.4);
        group.add(body);

        // Rails
        const railGeom = new THREE.BoxGeometry(0.01, 0.02, 0.5);
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        });

        const rail1 = new THREE.Mesh(railGeom, railMat);
        rail1.position.set(0.14, -0.12, -0.5);
        group.add(rail1);

        const rail2 = new THREE.Mesh(railGeom, railMat);
        rail2.position.set(0.22, -0.12, -0.5);
        group.add(rail2);

        // Energy core
        const coreGeom = new THREE.SphereGeometry(0.025, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const core = new THREE.Mesh(coreGeom, coreMat);
        core.position.set(0.18, -0.12, -0.25);
        group.add(core);

        // Muzzle flash
        const flashGeom = new THREE.SphereGeometry(0.06, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 });
        this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
        this.muzzleFlash.position.set(0.18, -0.12, -0.8);
        group.add(this.muzzleFlash);

        this.mesh = group;
        this.mesh.visible = false;
    }
}

export class Projectile {
    constructor(scene, origin, direction, speed, damage, splashRadius) {
        this.scene = scene;
        this.position = origin.clone();
        this.direction = direction.clone().normalize();
        this.speed = speed;
        this.damage = damage;
        this.splashRadius = splashRadius;
        this.alive = true;
        this.lifetime = 5;
        this.age = 0;

        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            emissive: 0xff4400
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);

        // Trail
        const trailGeom = new THREE.CylinderGeometry(0.05, 0.1, 0.5, 8);
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xff2200,
            transparent: true,
            opacity: 0.6
        });
        this.trail = new THREE.Mesh(trailGeom, trailMat);
        this.trail.rotation.x = Math.PI / 2;
        this.trail.position.z = 0.3;
        this.mesh.add(this.trail);

        // Point light
        this.light = new THREE.PointLight(0xff4400, 1, 5);
        this.mesh.add(this.light);

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (!this.alive) return;

        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }

        const movement = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        this.position.add(movement);
        this.mesh.position.copy(this.position);

        // Orient towards direction
        this.mesh.lookAt(this.position.clone().add(this.direction));
    }

    destroy() {
        this.alive = false;
        this.scene.remove(this.mesh);
    }

    createExplosion() {
        // Simple explosion effect
        const explosionGeom = new THREE.SphereGeometry(this.splashRadius, 16, 16);
        const explosionMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeom, explosionMat);
        explosion.position.copy(this.position);
        this.scene.add(explosion);

        const light = new THREE.PointLight(0xff4400, 3, this.splashRadius * 2);
        light.position.copy(this.position);
        this.scene.add(light);

        // Fade out
        let opacity = 0.8;
        const fadeInterval = setInterval(() => {
            opacity -= 0.1;
            explosionMat.opacity = opacity;
            light.intensity = opacity * 3;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                this.scene.remove(explosion);
                this.scene.remove(light);
            }
        }, 30);

        this.destroy();
    }
}
