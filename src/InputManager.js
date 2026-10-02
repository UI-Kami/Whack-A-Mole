// src/InputManager.js - Unified Zero-Latency Pointer & Touch Input Handler
export class InputManager {
    constructor(canvas, onPointerMove, onPointerDown) {
        this.canvas = canvas;
        this.onPointerMove = onPointerMove;
        this.onPointerDown = onPointerDown;

        this.pointerX = 0;
        this.pointerY = 0;
        this.isDown = false;

        this.init();
    }

    init() {
        // Prevent default gesture zooms and context menus
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.style.touchAction = 'none';

        // Unified Pointer Events
        this.canvas.addEventListener('pointermove', e => this.handlePointerMove(e));
        this.canvas.addEventListener('pointerdown', e => this.handlePointerDown(e));
        this.canvas.addEventListener('pointerup', e => this.handlePointerUp(e));
        this.canvas.addEventListener('pointercancel', e => this.handlePointerUp(e));
    }

    // Convert client coordinates to virtual canvas coordinate system
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handlePointerMove(e) {
        const { x, y } = this.getCanvasCoordinates(e);
        this.pointerX = x;
        this.pointerY = y;

        if (this.onPointerMove) {
            this.onPointerMove(x, y);
        }
    }

    handlePointerDown(e) {
        // Only primary mouse button or touch
        if (e.button !== undefined && e.button !== 0) return;

        const { x, y } = this.getCanvasCoordinates(e);
        this.pointerX = x;
        this.pointerY = y;
        this.isDown = true;

        if (this.onPointerDown) {
            this.onPointerDown(x, y);
        }
    }

    handlePointerUp(e) {
        this.isDown = false;
    }
}
