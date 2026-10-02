// src/CameraShake.js - 2.5D Camera Shake with directional impulse and rotational roll
export class CameraShake {
    constructor(config) {
        this.config = config;
        this.trauma = 0;       // 0 to 1
        this.offsetX = 0;
        this.offsetY = 0;
        this.angle = 0;        // Radians
        this.time = 0;
    }

    // Add trauma: 0.1 to 1.0
    addTrauma(amount = 0.5, dirX = 0, dirY = 1) {
        this.trauma = Math.min(1.0, this.trauma + amount);
        this.dirX = dirX;
        this.dirY = dirY;
    }

    update(dt) {
        this.time += dt * 35; // Shake frequency

        if (this.trauma > 0.001) {
            // Non-linear shake curve (trauma squared for snappy response)
            const shake = this.trauma * this.trauma;
            const maxOffset = this.config.SHAKE_MAX_OFFSET;
            
            // Perlin-like pseudo-random harmonics
            const noiseX = Math.sin(this.time * 1.3) + Math.cos(this.time * 2.1) * 0.5;
            const noiseY = Math.cos(this.time * 1.7) + Math.sin(this.time * 2.5) * 0.5;
            const noiseRot = Math.sin(this.time * 1.5);

            this.offsetX = noiseX * maxOffset * shake;
            this.offsetY = (noiseY * maxOffset + (this.dirY || 0) * 8) * shake;
            this.angle = noiseRot * 0.045 * shake; // Subtle 2.5D camera tilt

            // Exponential decay
            this.trauma *= Math.pow(this.config.SHAKE_DECAY, dt * 60);
        } else {
            this.trauma = 0;
            this.offsetX = 0;
            this.offsetY = 0;
            this.angle = 0;
        }
    }

    apply(ctx) {
        if (this.offsetX !== 0 || this.offsetY !== 0 || this.angle !== 0) {
            ctx.translate(this.offsetX, this.offsetY);
            ctx.rotate(this.angle);
        }
    }
}
