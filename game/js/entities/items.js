import { TS, moveAndCollide } from '../level.js';
import { sprites, drawCoin, drawFireball } from '../sprites.js';

// ブロックから出てくるコイン (取得済み・演出のみ)
export class CoinPop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = -560;
        this.t = 0;
        this.removed = false;
    }
    update(dt) {
        this.t += dt;
        this.vy += 1800 * dt;
        this.y += this.vy * dt;
        if (this.t > 0.55) this.removed = true;
    }
    render(c, camX) {
        drawCoin(c, this.x - camX, this.y, this.t * 3);
    }
}

// キノコ / 1UP: ブロックからせり上がってから歩き出す
export class Mushroom {
    constructor(col, row, kind = 'power') {
        this.w = 26;
        this.h = 26;
        this.x = col * TS + (TS - this.w) / 2;
        this.y = row * TS + TS - this.h;
        this.kind = kind;             // power | life
        this.vx = 0;
        this.vy = 0;
        this.emerge = TS;             // せり上がる残り距離
        this.dir = 1;
        this.removed = false;
    }
    update(dt, level) {
        if (this.emerge > 0) {
            const step = 40 * dt;
            this.y -= step;
            this.emerge -= step;
            return;
        }
        this.vx = (this.kind === 'life' ? 110 : 75) * this.dir;
        this.vy = Math.min(this.vy + 2200 * dt, 900);
        const res = moveAndCollide(this, level, dt);
        if (res.wall) this.dir *= -1;
        if (this.y > level.pixelHeight + 100) this.removed = true;
    }
    render(c, camX) {
        const img = this.kind === 'life' ? sprites.oneup : sprites.mushroom;
        c.drawImage(img, Math.round(this.x + this.w / 2 - img.width / 2 - camX),
            Math.round(this.y + this.h - img.height + 6));
    }
}

// ファイアフラワー: せり上がってその場に留まる
export class Flower {
    constructor(col, row) {
        this.w = 26;
        this.h = 28;
        this.x = col * TS + (TS - this.w) / 2;
        this.y = row * TS + TS - this.h;
        this.emerge = TS;
        this.removed = false;
    }
    update(dt) {
        if (this.emerge > 0) {
            const step = 40 * dt;
            this.y -= step;
            this.emerge -= step;
        }
    }
    render(c, camX) {
        const img = sprites.flower;
        c.drawImage(img, Math.round(this.x + this.w / 2 - img.width / 2 - camX),
            Math.round(this.y + this.h - img.height + 2));
    }
}

// ファイアまろんが吐く火の玉
export class Fireball {
    constructor(x, y, dir) {
        this.w = 12;
        this.h = 12;
        this.x = x;
        this.y = y;
        this.vx = 400 * dir;
        this.vy = 150;
        this.t = 0;
        this.removed = false;
    }
    update(dt, level) {
        this.t += dt;
        this.vy = Math.min(this.vy + 2400 * dt, 800);
        const res = moveAndCollide(this, level, dt);
        if (res.ground) this.vy = -330;        // 地面で弾む
        if (res.wall || this.t > 3) this.removed = true;
        if (this.y > level.pixelHeight + 50) this.removed = true;
    }
    render(c, camX) {
        drawFireball(c, this.x + this.w / 2 - camX, this.y + this.h / 2, this.t);
    }
}

// スコアのポップアップ表示
export class ScorePopup {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.t = 0;
        this.removed = false;
    }
    update(dt) {
        this.t += dt;
        this.y -= 50 * dt;
        if (this.t > 0.8) this.removed = true;
    }
    render(c, camX) {
        c.fillStyle = '#ffffff';
        c.font = 'bold 14px monospace';
        c.textAlign = 'center';
        c.fillText(this.text, this.x - camX, this.y);
    }
}
