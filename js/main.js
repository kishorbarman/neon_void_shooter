import * as THREE from 'three';
import { Player } from './player.js';
import { Physics } from './physics.js';
import { Arena } from './arena.js';
import { Shotgun, RocketLauncher, Railgun, Projectile } from './weapons.js';
import { EnemyManager } from './enemy.js';
import { HUD } from './hud.js';
import { audioManager } from './audio.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.physics = null;
        this.arena = null;
        this.enemyManager = null;
        this.hud = null;

        this.projectiles = [];
        this.isPlaying = false;
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        // Scene - brighter background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x334455);
        this.scene.fog = new THREE.Fog(0x334455, 40, 80); // Pushed fog back for better visibility

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            90,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Physics
        this.physics = new Physics();

        // Arena
        this.arena = new Arena(this.scene, this.physics);

        // Player
        this.player = new Player(this.camera, this.physics);

        // Weapons
        const shotgun = new Shotgun(this.scene);
        const rocketLauncher = new RocketLauncher(this.scene);
        const railgun = new Railgun(this.scene);

        shotgun.attachToCamera(this.camera);
        rocketLauncher.attachToCamera(this.camera);
        railgun.attachToCamera(this.camera);

        this.player.addWeapon(shotgun);
        this.player.addWeapon(rocketLauncher);
        this.player.addWeapon(railgun);
        this.player.switchWeapon(0);

        // Enemies
        this.enemyManager = new EnemyManager(
            this.scene,
            this.physics,
            this.arena.getSpawnPoints()
        );
        this.enemyManager.spawnEnemies(4);

        // HUD
        this.hud = new HUD();

        // Event listeners
        this.setupEventListeners();

        // Start game loop
        this.animate();
    }

    setupEventListeners() {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');

        // Pointer lock
        blocker.addEventListener('click', () => {
            document.body.requestPointerLock();
            audioManager.init(); // Initialize audio on first click
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                this.isPlaying = true;
                blocker.classList.add('hidden');
            } else {
                this.isPlaying = false;
                blocker.classList.remove('hidden');
            }
        });

        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            if (!this.isPlaying) return;
            this.player.handleMouseMove(event.movementX, event.movementY);
        });

        // Mouse click (shooting)
        document.addEventListener('mousedown', (event) => {
            if (!this.isPlaying) return;
            if (event.button === 0) {
                this.handleShoot();
            }
        });

        // Keyboard - use capture phase to ensure we get events first
        const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Digit1', 'Digit2', 'Digit3',
                          'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

        document.addEventListener('keydown', (event) => {
            // Prevent default for game keys to avoid browser shortcuts
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
            if (!this.isPlaying) return;
            this.player.handleKeyDown(event.code);
        }, true); // Use capture phase

        document.addEventListener('keyup', (event) => {
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
            if (!this.isPlaying) return;
            this.player.handleKeyUp(event.code);
        }, true); // Use capture phase

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    handleShoot() {
        const shots = this.player.shoot();
        if (!shots) return;

        // Play weapon sound
        const weaponName = this.player.currentWeapon?.name;
        if (weaponName === 'SHOTGUN') {
            audioManager.playShotgun();
        } else if (weaponName === 'ROCKET LAUNCHER') {
            audioManager.playRocket();
        } else if (weaponName === 'RAILGUN') {
            audioManager.playRailgun();
        }

        for (const shot of shots) {
            if (shot.isHitscan) {
                this.handleHitscan(shot);
            } else {
                this.handleProjectile(shot);
            }
        }

        this.hud.updateWeapon(this.player.currentWeapon);
    }

    handleHitscan(shot) {
        // Check enemy hits
        const enemyHit = this.enemyManager.checkHit(shot.origin, shot.direction);

        // Check world hit
        const worldHit = this.physics.raycast(shot.origin, shot.direction);

        if (enemyHit && (!worldHit.hit || enemyHit.distance < worldHit.distance)) {
            // Hit enemy
            const killed = enemyHit.enemy.takeDamage(shot.damage);
            if (killed) {
                this.hud.addKill();
                audioManager.playEnemyDeath();
            } else {
                audioManager.playEnemyHit();
            }
            this.createHitEffect(
                shot.origin.clone().add(shot.direction.clone().multiplyScalar(enemyHit.distance)),
                0xff0000
            );
        } else if (worldHit.hit) {
            // Hit wall
            audioManager.playHit();
            this.createHitEffect(worldHit.point, 0xffaa00);
        }

        // Create tracer effect
        this.createTracer(shot.origin, shot.direction, enemyHit?.distance || worldHit.distance || 100);
    }

    handleProjectile(shot) {
        const projectile = new Projectile(
            this.scene,
            shot.origin,
            shot.direction,
            shot.projectileSpeed,
            shot.damage,
            shot.splashRadius
        );
        this.projectiles.push(projectile);
    }

    createHitEffect(position, color) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1
        });
        const hit = new THREE.Mesh(geometry, material);
        hit.position.copy(position);
        this.scene.add(hit);

        // Fade out
        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.2;
            material.opacity -= 0.1;
            hit.scale.setScalar(scale);
            if (material.opacity <= 0) {
                clearInterval(interval);
                this.scene.remove(hit);
            }
        }, 30);
    }

    createTracer(origin, direction, distance) {
        const points = [
            origin.clone(),
            origin.clone().add(direction.clone().multiplyScalar(Math.min(distance, 100)))
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        const tracer = new THREE.Line(geometry, material);
        this.scene.add(tracer);

        // Fade out
        setTimeout(() => {
            let opacity = 0.8;
            const interval = setInterval(() => {
                opacity -= 0.2;
                material.opacity = opacity;
                if (opacity <= 0) {
                    clearInterval(interval);
                    this.scene.remove(tracer);
                }
            }, 20);
        }, 50);
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);

            if (!projectile.alive) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check enemy collision
            const enemyHit = this.enemyManager.checkHit(
                projectile.position,
                projectile.direction,
                projectile.speed * deltaTime * 2
            );

            // Check world collision
            const worldHit = this.physics.raycast(
                projectile.position,
                projectile.direction,
                projectile.speed * deltaTime * 2
            );

            if (enemyHit || worldHit.hit) {
                // Play explosion sound
                audioManager.playExplosion();

                // Apply splash damage
                const hitPoint = enemyHit
                    ? projectile.position
                    : worldHit.point;

                const splashHits = this.enemyManager.checkSplashDamage(
                    hitPoint,
                    projectile.splashRadius,
                    projectile.damage
                );

                for (const hit of splashHits) {
                    const killed = hit.enemy.takeDamage(hit.damage);
                    if (killed) {
                        this.hud.addKill();
                        audioManager.playEnemyDeath();
                    }
                }

                // Check if player is in splash radius
                const playerDist = hitPoint.distanceTo(this.player.position);
                if (playerDist < projectile.splashRadius) {
                    const damageMultiplier = 1 - (playerDist / projectile.splashRadius);
                    const damage = projectile.damage * damageMultiplier * 0.5; // Self damage reduction
                    this.handlePlayerDamage(damage);
                }

                projectile.createExplosion();
                this.projectiles.splice(i, 1);
            }
        }
    }

    handlePlayerDamage(damage) {
        const died = this.player.takeDamage(damage);
        this.hud.showDamage();
        this.hud.updateHealth(this.player.health, this.player.maxHealth);
        audioManager.playPlayerHurt();

        if (died) {
            this.respawnPlayer();
        }
    }

    respawnPlayer() {
        const spawnPoints = this.arena.getSpawnPoints();
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        this.player.respawn(spawnPoint);
        this.hud.updateHealth(this.player.health, this.player.maxHealth);
    }

    update(deltaTime) {
        if (!this.isPlaying) return;

        // Update player
        this.player.update(deltaTime);

        // Update enemies and get their attacks
        const enemyAttacks = this.enemyManager.update(deltaTime, this.player.position);

        // Process enemy attacks
        for (const attack of enemyAttacks) {
            // Check if attack hits player
            const toPlayer = new THREE.Vector3()
                .subVectors(this.player.position, attack.origin);
            toPlayer.y += 0.9; // Aim at player center

            const playerDist = toPlayer.length();
            toPlayer.normalize();

            const dot = attack.direction.dot(toPlayer);

            // Check if attack is aimed at player and within range
            if (dot > 0.9 && playerDist < 25) {
                // Check for obstacles
                const worldHit = this.physics.raycast(attack.origin, attack.direction, playerDist);
                if (!worldHit.hit || worldHit.distance > playerDist - 1) {
                    // Hit player
                    this.handlePlayerDamage(attack.damage);
                }
            }

            // Create enemy tracer
            this.createTracer(attack.origin, attack.direction, 20);
        }

        // Update projectiles
        this.updateProjectiles(deltaTime);

        // Update HUD
        this.hud.updateWeapon(this.player.currentWeapon);
        this.hud.updateHealth(this.player.health, this.player.maxHealth);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new Game();
