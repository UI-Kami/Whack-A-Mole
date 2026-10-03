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

        this.init();
    }

    init() {
        // Prevent default gesture zooms, callout menus, and context menus
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.style.touchAction = 'none';

        // Unified Pointer Events
        this.canvas.addEventListener('pointermove', e => this.handlePointerMove(e));
        this.canvas.addEventListener('pointerdown', e => this.handlePointerDown(e));
        this.canvas.addEventListener('pointerup', e => this.handlePointerUp(e));
        this.canvas.addEventListener('pointercancel', e => this.handlePointerUp(e));

        // Prevent iOS Safari and mobile Chrome gesture zooming/pull-to-refresh
        this.canvas.addEventListener('touchstart', e => {
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
        this.canvas.addEventListener('touchmove', e => {
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
    }

    // Convert client coordinates to virtual canvas coordinate system with exact letterboxing/scaling compensation
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return { x: this.viewportWidth / 2, y: this.viewportHeight / 2, isTouch: false };
        }

        const virtualW = this.viewportWidth;
        const virtualH = this.viewportHeight;
        const virtualAspect = virtualW / virtualH;
        const elemAspect = rect.width / rect.height;

        let renderedWidth = rect.width;
        let renderedHeight = rect.height;
        let offsetX = 0;
        let offsetY = 0;

        if (elemAspect > virtualAspect) {
            // Pillarbox (bars on left/right)
            renderedWidth = rect.height * virtualAspect;
            offsetX = (rect.width - renderedWidth) / 2;
        } else {
            // Letterbox (bars on top/bottom)
            renderedHeight = rect.width / virtualAspect;
            offsetY = (rect.height - renderedHeight) / 2;
        }

        let clientX = e.clientX;
        let clientY = e.clientY;
        const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen' || (e.touches && e.touches.length > 0);

        if (clientX === undefined && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        const relX = clientX - rect.left - offsetX;
        const relY = clientY - rect.top - offsetY;

        // Map directly into virtual game coordinates and clamp to world bounds
        const x = Math.max(0, Math.min(virtualW, (relX / renderedWidth) * virtualW));
        const y = Math.max(0, Math.min(virtualH, (relY / renderedHeight) * virtualH));

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
