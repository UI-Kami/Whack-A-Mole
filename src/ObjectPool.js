// src/ObjectPool.js - High performance reusable object pool
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get(...args) {
        let obj = this.pool.length > 0 ? this.pool.pop() : this.createFn();
        this.resetFn(obj, ...args);
        obj.active = true;
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        obj.active = false;
        const idx = this.active.indexOf(obj);
        if (idx !== -1) {
            this.active.splice(idx, 1);
            this.pool.push(obj);
        }
    }

    update(dt) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const item = this.active[i];
            const alive = item.update(dt);
            if (!alive) {
                item.active = false;
                this.active.splice(i, 1);
                this.pool.push(item);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.active.length; i++) {
            this.active[i].draw(ctx);
        }
    }

    clear() {
        while (this.active.length > 0) {
            const item = this.active.pop();
            item.active = false;
            this.pool.push(item);
        }
    }
}
