export default class TouchControls {
    constructor() {
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Movement joystick state
        this.moveVector = { x: 0, y: 0 };
        this.moveActive = false;
        this.leftTouchId = null;

        // Aim joystick state
        this.aimAngle = 0;
        this.aimActive = false;
        this.rightTouchId = null;

        this.maxRadius = 50;

        if (this.isTouchDevice) {
            this.setupDOM();
            this.setupListeners();
        }
    }

    setupDOM() {
        const container = document.getElementById('game-container');
        container.classList.add('touch-active');

        this.leftOuter = document.getElementById('joystick-left');
        this.leftKnob = document.getElementById('joystick-left-knob');
        this.rightOuter = document.getElementById('joystick-right');
        this.rightKnob = document.getElementById('joystick-right-knob');

        // Store joystick center positions (computed on first touch)
        this.leftCenter = null;
        this.rightCenter = null;
    }

    getJoystickCenter(outerEl) {
        const rect = outerEl.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    setupListeners() {
        const canvas = document.getElementById('gameCanvas');

        const options = { passive: false };

        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), options);
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), options);
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), options);
        canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), options);

        // Also listen on joystick elements themselves
        const joystickEls = [this.leftOuter, this.rightOuter];
        joystickEls.forEach(el => {
            el.addEventListener('touchstart', (e) => this.onTouchStart(e), options);
            el.addEventListener('touchmove', (e) => this.onTouchMove(e), options);
            el.addEventListener('touchend', (e) => this.onTouchEnd(e), options);
            el.addEventListener('touchcancel', (e) => this.onTouchEnd(e), options);
        });

        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => {
            if (this.isTouchDevice) e.preventDefault();
        });
    }

    onTouchStart(e) {
        e.preventDefault();
        const screenMid = window.innerWidth / 2;

        for (const touch of e.changedTouches) {
            if (touch.clientX < screenMid && this.leftTouchId === null) {
                // Left half — movement joystick
                this.leftTouchId = touch.identifier;
                this.moveActive = true;
                this.leftCenter = this.getJoystickCenter(this.leftOuter);
                this.updateJoystick(touch, 'left');
            } else if (touch.clientX >= screenMid && this.rightTouchId === null) {
                // Right half — aim joystick
                this.rightTouchId = touch.identifier;
                this.aimActive = true;
                this.rightCenter = this.getJoystickCenter(this.rightOuter);
                this.updateJoystick(touch, 'right');
            }
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            if (touch.identifier === this.leftTouchId) {
                this.updateJoystick(touch, 'left');
            } else if (touch.identifier === this.rightTouchId) {
                this.updateJoystick(touch, 'right');
            }
        }
    }

    onTouchEnd(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            if (touch.identifier === this.leftTouchId) {
                this.leftTouchId = null;
                this.moveActive = false;
                this.moveVector.x = 0;
                this.moveVector.y = 0;
                this.resetKnob(this.leftKnob);
            } else if (touch.identifier === this.rightTouchId) {
                this.rightTouchId = null;
                this.aimActive = false;
                this.resetKnob(this.rightKnob);
            }
        }
    }

    updateJoystick(touch, side) {
        const center = side === 'left' ? this.leftCenter : this.rightCenter;
        const knob = side === 'left' ? this.leftKnob : this.rightKnob;

        if (!center) return;

        let dx = touch.clientX - center.x;
        let dy = touch.clientY - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Clamp to max radius
        if (dist > this.maxRadius) {
            dx = (dx / dist) * this.maxRadius;
            dy = (dy / dist) * this.maxRadius;
        }

        // Move knob visually
        knob.style.transform = `translate(${dx}px, ${dy}px)`;

        if (side === 'left') {
            // Normalize to -1..1 range
            this.moveVector.x = dx / this.maxRadius;
            this.moveVector.y = dy / this.maxRadius;
        } else {
            this.aimAngle = Math.atan2(dy, dx);
        }
    }

    resetKnob(knob) {
        knob.style.transform = 'translate(0px, 0px)';
    }
}
