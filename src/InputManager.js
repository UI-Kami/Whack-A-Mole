// src/InputManager.js - Unified Zero-Latency Pointer & Touch Input Handler
export class InputManager {
    constructor(canvas, onPointerMove, onPointerDown, config) {
        this.canvas = canvas;
        this.onPointerMove = onPointerMove;
        this.onPointerDown = onPointerDown;
        this.config = config || { VIEWPORT_WIDTH: 1200, VIEWPORT_HEIGHT: 800 };

        this.viewportWidth = this.config.VIEWPORT_WIDTH || 1200;
        this.viewportHeight = this.config.VIEWPORT_HEIGHT || 800;

        this.pointerX = this.viewportWidth / 2;
        this.pointerY = this.viewportHeight / 2;
        this.isDown = false;
        this.lastPointerDownTime = 0;

        this.init();
    }

    updateDimensions(vw, vh) {
        this.viewportWidth = vw;
        this.viewportHeight = vh;
    }

    init() {
        // Prevent default context menus
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.style.touchAction = 'none';

        // Unified Pointer Events
        this.canvas.addEventListener('pointermove', e => this.handlePointerMove(e));
        this.canvas.addEventListener('pointerdown', e => this.handlePointerDown(e));
        this.canvas.addEventListener('pointerup', e => this.handlePointerUp(e));
        this.canvas.addEventListener('pointercancel', e => this.handlePointerUp(e));

        // Touch fallback for maximum mobile cross-browser compatibility
        this.canvas.addEventListener('touchstart', e => {
            // Deduplicate if pointerdown already processed this interaction
            if (Date.now() - this.lastPointerDownTime < 250) return;
            if (e.changedTouches && e.changedTouches.length > 0) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    const coords = this.getCanvasCoordinates(t);
                    coords.isTouch = true;
                    this.pointerX = coords.x;
                    this.pointerY = coords.y;
                    this.isDown = true;
                    if (this.onPointerDown) {
                        this.onPointerDown(coords.x, coords.y, true);
                    }
                }
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', e => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                const coords = this.getCanvasCoordinates(t);
                this.pointerX = coords.x;
                this.pointerY = coords.y;
                if (this.onPointerMove) {
                    this.onPointerMove(coords.x, coords.y, true);
                }
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', () => {
            this.isDown = false;
        }, { passive: true });
    }

    // Convert screen coordinates to virtual canvas coordinate system with high precision
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return { x: this.viewportWidth / 2, y: this.viewportHeight / 2, isTouch: false };
        }

        let clientX = e.clientX;
        let clientY = e.clientY;
        const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen' || (e.touches && e.touches.length > 0);

        if (clientX === undefined) {
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
        }

        const virtualW = this.viewportWidth;
        const virtualH = this.viewportHeight;

        // Map directly into virtual canvas game coordinates and clamp safely
        const normX = Math.max(0, Math.min(1.0, (clientX - rect.left) / rect.width));
        const normY = Math.max(0, Math.min(1.0, (clientY - rect.top) / rect.height));

        const x = normX * virtualW;
        const y = normY * virtualH;

        return { x, y, isTouch };
    }

    handlePointerMove(e) {
        const { x, y, isTouch } = this.getCanvasCoordinates(e);
        this.pointerX = x;
        this.pointerY = y;

        if (this.onPointerMove) {
            this.onPointerMove(x, y, isTouch);
        }
    }

    handlePointerDown(e) {
        // Only primary mouse button or touch
        if (e.button !== undefined && e.button !== 0) return;
        this.lastPointerDownTime = Date.now();

        const { x, y, isTouch } = this.getCanvasCoordinates(e);
        this.pointerX = x;
        this.pointerY = y;
        this.isDown = true;

        if (this.onPointerDown) {
            this.onPointerDown(x, y, isTouch);
        }
    }

    handlePointerUp(e) {
        this.isDown = false;
    }
}
