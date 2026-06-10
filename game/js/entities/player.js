import { TS, moveAndCollide, onGround } from '../level.js';
import { sprites } from '../sprites.js';

const ACCEL = 1500;
const AIR_ACCEL = 1100;
const FRICTION = 1900;
const MAX_WALK = 185;
const MAX_RUN = 310;
const GRAVITY = 2450;
const HOLD_GRAVITY = 1280;   // ジャンプ長押し中の上昇時は重力を弱める
const MAX_FALL = 920;
const JUMP_V = -665;
const STOMP_BOUNCE = -420;
const COYOTE = 0.08;
const JUMP_BUFFER = 0.12;

export class Player {
    constructor(x, y) {
        this.w = 22;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.form = 'small';     // small | big | fire
        this.h = 28;
        this.facing = 1;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuf = 0;
        this.runAnim = 0;
        this.invuln = 0;         // ダメージ後の無敵時間
        this.dead = false;
        this.frozen = false;     // ゴール演出などで操作を止める
    }

    setForm(form) {
        const oldH = this.h;
        this.form = form;
        this.h = form === 'small' ? 28 : 56;
        this.y -= this.h - oldH;  // 足元の位置を保つ
    }

    hurt() {
        if (this.invuln > 0 || this.dead) return false;
        if (this.form === 'small') {
            this.dead = true;
            return true;          // 死亡
        }
        this.setForm(this.form === 'fire' ? 'big' : 'small');
        this.invuln = 2;
        return false;
    }

    update(dt, input, level, game) {
        if (this.dead) {
            // 死亡演出: その場で跳ねて落下
            this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
            this.y += this.vy * dt;
            return;
        }

        const left = !this.frozen && input.held('left');
        const right = !this.frozen && input.held('right');
        const run = !this.frozen && input.held('run');
        const jumpHeld = !this.frozen && input.held('jump');
        if (!this.frozen && input.justPressed('jump')) this.jumpBuf = JUMP_BUFFER;

        const max = run ? MAX_RUN : MAX_WALK;
        const accel = this.grounded ? ACCEL : AIR_ACCEL;

        if (left && !right) {
            this.vx -= accel * dt;
            this.facing = -1;
        } else if (right && !left) {
            this.vx += accel * dt;
            this.facing = 1;
        } else if (this.grounded) {
            // 摩擦
            const f = FRICTION * dt;
            if (Math.abs(this.vx) <= f) this.vx = 0;
            else this.vx -= Math.sign(this.vx) * f;
        }
        this.vx = Math.max(-max, Math.min(max, this.vx));

        // ジャンプ (コヨーテタイム + 先行入力)
        this.coyote = this.grounded ? COYOTE : Math.max(0, this.coyote - dt);
        this.jumpBuf = Math.max(0, this.jumpBuf - dt);
        if (this.jumpBuf > 0 && this.coyote > 0) {
            this.vy = JUMP_V - Math.abs(this.vx) * 0.18; // 走っていると少し高く跳べる
            this.coyote = 0;
            this.jumpBuf = 0;
            game.sound.jump();
        }

        // 重力 (上昇中にボタンを押し続けていると高く跳べる)
        const g = (this.vy < 0 && jumpHeld) ? HOLD_GRAVITY : GRAVITY;
        this.vy = Math.min(this.vy + g * dt, MAX_FALL);

        const res = moveAndCollide(this, level, dt);
        this.grounded = res.ground || onGround(this, level);
        if (res.ground) this.vy = 0;

        // 頭上のブロックを叩いた
        if (res.headTiles.length) {
            // 中央に最も近いタイルを優先
            const cx = this.x + this.w / 2;
            res.headTiles.sort((a, b) =>
                Math.abs((a.col + 0.5) * TS - cx) - Math.abs((b.col + 0.5) * TS - cx));
            game.hitBlock(res.headTiles[0].col, res.headTiles[0].row, this);
        }

        if (this.invuln > 0) this.invuln -= dt;

        // アニメーション
        if (this.grounded && Math.abs(this.vx) > 10) {
            this.runAnim += Math.abs(this.vx) * dt * 0.06;
        }
    }

    stompBounce(held) {
        this.vy = held ? STOMP_BOUNCE * 1.3 : STOMP_BOUNCE;
    }

    currentSprite() {
        const set = sprites.dog[this.form];
        let img;
        if (!this.grounded) img = set.jump;
        else if (Math.abs(this.vx) > 10) img = (Math.floor(this.runAnim) % 2 === 0) ? set.run1 : set.run2;
        else img = set.idle;
        return this.facing >= 0 ? img.right : img.left;
    }

    render(c, camX, time) {
        if (this.invuln > 0 && Math.floor(time * 12) % 2 === 0 && !this.dead) return; // 点滅
        const img = this.currentSprite();
        const dx = Math.round(this.x + this.w / 2 - img.width / 2 - camX);
        const dy = Math.round(this.y + this.h - img.height + 2);
        c.drawImage(img, dx, dy);
    }
}
