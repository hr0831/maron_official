// プレイヤーを追いかける横スクロールカメラ
export class Camera {
    constructor(viewW, viewH) {
        this.x = 0;
        this.y = 0;
        this.viewW = viewW;
        this.viewH = viewH;
        this.shake = 0;
    }

    follow(target, level, dt) {
        // 画面の 40% 地点にプレイヤーを置く
        const goal = target.x + target.w / 2 - this.viewW * 0.4;
        this.x += (goal - this.x) * Math.min(1, dt * 10);
        this.x = Math.max(0, Math.min(this.x, level.pixelWidth - this.viewW));
        if (this.shake > 0) this.shake -= dt;
    }

    kick(amount = 0.15) { this.shake = amount; }

    offsetX() {
        return Math.round(this.x + (this.shake > 0 ? (Math.random() - 0.5) * 8 : 0));
    }
}
