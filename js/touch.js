/**
 * Mobile Touch Controls
 * - Left side: Virtual joystick for movement
 * - Right side: Touch to aim + auto-fire while touching
 */
export default class TouchControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();

        // Movement joystick state
        this.joystick = {
            active: false,
            touchId: null,
            baseX: 0,
            baseY: 0,
            stickX: 0,
            stickY: 0,
            dx: 0, // normalized -1 to 1
            dy: 0,
            radius: 50
        };

        // Aim/fire touch state
        this.aim = {
            active: false,
            touchId: null,
            x: 0,
            y: 0
        };

        if (this.isMobile) {
            this.createUI();
            this.bindEvents();
        }
    }

    detectMobile() {
        return ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (window.innerWidth <= 1024 && 'ontouchstart' in window);
    }

    createUI() {
        // Container for touch controls (over canvas, under overlays)
        this.container = document.createElement('div');
        this.container.id = 'touch-controls';
        document.getElementById('game-container').appendChild(this.container);

        // Left joystick zone
        this.joystickZone = document.createElement('div');
        this.joystickZone.id = 'joystick-zone';
        this.container.appendChild(this.joystickZone);

        // Joystick base (appears on touch)
        this.joystickBase = document.createElement('div');
        this.joystickBase.id = 'joystick-base';
        this.joystickZone.appendChild(this.joystickBase);

        // Joystick stick (inner knob)
        this.joystickStick = document.createElement('div');
        this.joystickStick.id = 'joystick-stick';
        this.joystickBase.appendChild(this.joystickStick);

        // Right aim zone
        this.aimZone = document.createElement('div');
        this.aimZone.id = 'aim-zone';
        this.container.appendChild(this.aimZone);

        // Aim indicator (crosshair feedback)
        this.aimIndicator = document.createElement('div');
        this.aimIndicator.id = 'aim-indicator';
        this.aimZone.appendChild(this.aimIndicator);

        // Fire button (bottom-right, always visible for quick taps)
        this.fireBtn = document.createElement('div');
        this.fireBtn.id = 'fire-btn';
        this.fireBtn.textContent = 'FIRE';
        this.container.appendChild(this.fireBtn);

        // Hide by default, shown when game starts
        this.container.style.display = 'none';
    }

    show() {
        if (this.container) this.container.style.display = 'block';
    }

    hide() {
        if (this.container) this.container.style.display = 'none';
    }

    bindEvents() {
        const opts = { passive: false };

        // Prevent default touch behaviors on canvas
        document.addEventListener('touchstart', (e) => {
            if (this.game.isRunning) {
                e.preventDefault();
            }
        }, opts);

        // --- Joystick zone events ---
        this.joystickZone.addEventListener('touchstart', (e) => {
            if (!this.game.isRunning) return;
            e.preventDefault();
            e.stopPropagation();
            const touch = e.changedTouches[0];
            this.startJoystick(touch);
        }, opts);

        this.joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.joystick.touchId) {
                    this.moveJoystick(touch);
                }
            }
        }, opts);

        this.joystickZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.touchId) {
                    this.endJoystick();
                }
            }
        }, opts);

        this.joystickZone.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.touchId) {
                    this.endJoystick();
                }
            }
        }, opts);

        // --- Aim zone events ---
        this.aimZone.addEventListener('touchstart', (e) => {
            if (!this.game.isRunning) return;
            e.preventDefault();
            e.stopPropagation();
            const touch = e.changedTouches[0];
            this.startAim(touch);
        }, opts);

        this.aimZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.aim.touchId) {
                    this.moveAim(touch);
                }
            }
        }, opts);

        this.aimZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.aim.touchId) {
                    this.endAim();
                }
            }
        }, opts);

        this.aimZone.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.aim.touchId) {
                    this.endAim();
                }
            }
        }, opts);

        // --- Fire button ---
        this.fireBtn.addEventListener('touchstart', (e) => {
            if (!this.game.isRunning) return;
            e.preventDefault();
            e.stopPropagation();
            this.fireBtnActive = true;
            this.fireBtn.classList.add('active');
        }, opts);

        this.fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fireBtnActive = false;
            this.fireBtn.classList.remove('active');
        }, opts);

        this.fireBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.fireBtnActive = false;
            this.fireBtn.classList.remove('active');
        }, opts);
    }

    // --- Joystick logic ---

    startJoystick(touch) {
        this.joystick.active = true;
        this.joystick.touchId = touch.identifier;

        const rect = this.joystickZone.getBoundingClientRect();
        this.joystick.baseX = touch.clientX - rect.left;
        this.joystick.baseY = touch.clientY - rect.top;

        // Position the joystick base at touch point
        this.joystickBase.style.display = 'block';
        this.joystickBase.style.left = `${this.joystick.baseX}px`;
        this.joystickBase.style.top = `${this.joystick.baseY}px`;

        this.joystickStick.style.transform = 'translate(-50%, -50%)';
        this.joystick.dx = 0;
        this.joystick.dy = 0;
    }

    moveJoystick(touch) {
        if (!this.joystick.active) return;

        const rect = this.joystickZone.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        let dx = touchX - this.joystick.baseX;
        let dy = touchY - this.joystick.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.joystick.radius;

        // Clamp to radius
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        // Update stick visual position
        this.joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Normalize to -1..1
        this.joystick.dx = dx / maxDist;
        this.joystick.dy = dy / maxDist;
    }

    endJoystick() {
        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystick.dx = 0;
        this.joystick.dy = 0;

        this.joystickBase.style.display = 'none';
        this.joystickStick.style.transform = 'translate(-50%, -50%)';
    }

    // --- Aim logic ---

    startAim(touch) {
        this.aim.active = true;
        this.aim.touchId = touch.identifier;
        this.aim.x = touch.clientX;
        this.aim.y = touch.clientY;

        // Show aim indicator
        this.aimIndicator.style.display = 'block';
        this.aimIndicator.style.left = `${touch.clientX}px`;
        this.aimIndicator.style.top = `${touch.clientY}px`;
    }

    moveAim(touch) {
        if (!this.aim.active) return;
        this.aim.x = touch.clientX;
        this.aim.y = touch.clientY;

        this.aimIndicator.style.left = `${touch.clientX}px`;
        this.aimIndicator.style.top = `${touch.clientY}px`;
    }

    endAim() {
        this.aim.active = false;
        this.aim.touchId = null;
        this.aimIndicator.style.display = 'none';
    }

    // --- Query methods used by Player ---

    getMovement() {
        // Apply a deadzone
        const deadzone = 0.15;
        let dx = this.joystick.dx;
        let dy = this.joystick.dy;
        if (Math.abs(dx) < deadzone) dx = 0;
        if (Math.abs(dy) < deadzone) dy = 0;
        return { dx, dy };
    }

    getAimPosition() {
        if (this.aim.active) {
            return { active: true, x: this.aim.x, y: this.aim.y };
        }
        return { active: false, x: 0, y: 0 };
    }

    isFiring() {
        // Fire when aim zone is touched OR fire button is pressed
        return this.aim.active || this.fireBtnActive;
    }

    // Draw joystick on canvas (optional visual feedback)
    draw(ctx) {
        // Draw a subtle crosshair at aim point when aiming
        if (this.aim.active) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f3ff';

            const x = this.aim.x;
            const y = this.aim.y;
            const size = 12;

            ctx.beginPath();
            ctx.moveTo(x - size, y);
            ctx.lineTo(x + size, y);
            ctx.moveTo(x, y - size);
            ctx.lineTo(x, y + size);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    }
}
