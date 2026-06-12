import { TS, moveAndCollide, onGround } from '../level.js';
import { sprites, drawHeart } from '../sprites.js';

// 敵の共通ベース
class Enemy {
    constructor(x, y, w, h) {
        this.x = x + (TS - w) / 2;
        this.y = y + TS - h;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
        this.removed = false;
        this.active = false;     // 画面内に入ったら動き出す
        this.anim = 0;
        this.dir = -1;
    }

    // 踏まれた以外の理由 (甲羅・ファイア・ブロック突き上げ) でやられた
    flip(game, dir = 1) {
        this.alive = false;
        this.flipped = true;
        this.vy = -420;
        this.vx = 130 * dir;
        game.addScore(100, this.x, this.y);
    }

    baseUpdate(dt, level) {
        this.vy = Math.min(this.vy + 2200 * dt, 900);
        if (this.flipped) {
            // ひっくり返って落ちていくだけ (地形を無視)
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.y > level.pixelHeight + 100) this.removed = true;
            return null;
        }
        return moveAndCollide(this, level, dt);
    }

    drawImg(c, img, camX) {
        const dx = Math.round(this.x + this.w / 2 - img.width / 2 - camX);
        const dy = Math.round(this.y + this.h - img.height + 2);
        if (this.flipped) {
            c.save();
            c.translate(dx + img.width / 2, dy + img.height / 2);
            c.scale(1, -1);
            c.drawImage(img, -img.width / 2, -img.height / 2);
            c.restore();
        } else {
            c.drawImage(img, dx, dy);
        }
    }
}

// クリボン: 歩くだけ。踏むとつぶれる
export class Kuri extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 28);
        this.speed = 55;
        this.squashed = 0;
    }

    update(dt, level) {
        this.anim += dt;
        if (this.squashed > 0) {
            this.squashed -= dt;
            if (this.squashed <= 0) this.removed = true;
            return;
        }
        const res = this.baseUpdate(dt, level);
        if (!res) return;
        this.vx = this.speed * this.dir;
        if (res.wall) this.dir *= -1;
        if (this.y > level.pixelHeight + 100) this.removed = true;
    }

    stomp(game) {
        this.alive = false;
        this.squashed = 0.5;
        this.vx = 0;
        game.sound.stomp();
        game.addScore(100, this.x, this.y);
    }

    render(c, camX) {
        let img;
        if (this.squashed > 0) img = sprites.kuriFlat.right;
        else img = (Math.floor(this.anim * 6) % 2 === 0) ? sprites.kuri1.right : sprites.kuri2.right;
        this.drawImg(c, img, camX);
    }
}

// カメッキー: 踏むと甲羅になり、蹴ると滑っていく
export class Kame extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 30);
        this.speed = 45;
        this.state = 'walk';      // walk | shell | sliding
        this.wakeTimer = 0;
        this.ignorePlayer = 0;    // 蹴った直後にすぐ当たらないように
    }

    update(dt, level) {
        this.anim += dt;
        if (this.ignorePlayer > 0) this.ignorePlayer -= dt;
        const res = this.baseUpdate(dt, level);
        if (!res) return;

        if (this.state === 'walk') {
            this.vx = this.speed * this.dir;
            if (res.wall) this.dir *= -1;
            // 崖の手前で引き返す
            if (res.ground || onGround(this, level)) {
                const aheadX = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
                const col = Math.floor(aheadX / TS);
                const row = Math.floor((this.y + this.h + 2) / TS);
                if (!level.isSolid(col, row)) this.dir *= -1;
            }
        } else if (this.state === 'shell') {
            this.vx = 0;
            this.wakeTimer -= dt;
            if (this.wakeTimer <= 0) {
                this.state = 'walk';
                this.h = 30;
                this.y -= 8;
            }
        } else if (this.state === 'sliding') {
            this.vx = 320 * this.dir;
            if (res.wall) this.dir *= -1;
        }
        if (this.y > level.pixelHeight + 100) this.removed = true;
    }

    stomp(game, player) {
        if (this.state === 'walk') {
            this.state = 'shell';
            this.h = 22;
            this.y += 8;
            this.wakeTimer = 7;
            game.sound.stomp();
            game.addScore(100, this.x, this.y);
        } else if (this.state === 'sliding') {
            this.state = 'shell';
            this.wakeTimer = 7;
            game.sound.stomp();
        } else {
            // 止まっている甲羅を踏んだ → 蹴る
            this.kick(game, player.x + player.w / 2 < this.x + this.w / 2 ? 1 : -1);
        }
    }

    kick(game, dir) {
        this.state = 'sliding';
        this.dir = dir;
        this.ignorePlayer = 0.4;
        this.wakeTimer = 99;
        game.sound.kick();
        game.addScore(200, this.x, this.y);
    }

    render(c, camX) {
        let img;
        if (this.state === 'walk') {
            const frame = (Math.floor(this.anim * 6) % 2 === 0) ? sprites.kame1 : sprites.kame2;
            img = this.dir > 0 ? frame.left : frame.right;
        } else {
            img = sprites.shell.right;
        }
        this.drawImg(c, img, camX);
    }
}

// きいろちゃん: ぴょんぴょん跳ねながら歩く金色ハムスター
export class Kiiro extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26);
        this.speed = 55;
        this.squashed = 0;
        this.hopTimer = 1 + Math.random();
    }

    update(dt, level) {
        this.anim += dt;
        if (this.squashed > 0) {
            this.squashed -= dt;
            if (this.squashed <= 0) this.removed = true;
            return;
        }
        const res = this.baseUpdate(dt, level);
        if (!res) return;
        this.vx = this.speed * this.dir;
        if (res.wall) this.dir *= -1;
        if (res.ground || onGround(this, level)) {
            this.hopTimer -= dt;
            if (this.hopTimer <= 0) {
                this.vy = -430;
                this.hopTimer = 1 + Math.random() * 0.9;
            }
        }
        if (this.y > level.pixelHeight + 100) this.removed = true;
    }

    stomp(game) {
        this.alive = false;
        this.squashed = 0.5;
        this.vx = 0;
        game.sound.stomp();
        game.addScore(100, this.x, this.y);
    }

    render(c, camX) {
        let img;
        if (this.squashed > 0) img = sprites.kiiroFlat.right;
        else if (this.vy < -50) img = sprites.kiiro2.right;
        else img = (Math.floor(this.anim * 6) % 2 === 0) ? sprites.kiiro1.right : sprites.kiiro2.right;
        this.drawImg(c, img, camX);
    }
}

// おすしちゃん: ちょこちょこ走って止まるを繰り返す白ハムスター
export class Osushi extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 24);
        this.squashed = 0;
        this.state = 'pause';     // pause | dash
        this.timer = 0.5 + Math.random() * 0.4;
        this.speed = 185;
    }

    update(dt, level, player) {
        this.anim += dt;
        if (this.squashed > 0) {
            this.squashed -= dt;
            if (this.squashed <= 0) this.removed = true;
            return;
        }
        const res = this.baseUpdate(dt, level);
        if (!res) return;

        if (this.state === 'dash') {
            this.vx = this.speed * this.dir;
            if (res.wall) this.dir *= -1;
            // 崖の手前で引き返す
            if (res.ground || onGround(this, level)) {
                const aheadX = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
                const col = Math.floor(aheadX / TS);
                const row = Math.floor((this.y + this.h + 2) / TS);
                if (!level.isSolid(col, row)) this.dir *= -1;
            }
            this.timer -= dt;
            if (this.timer <= 0) {
                this.state = 'pause';
                this.vx = 0;
                this.timer = 0.35 + Math.random() * 0.35;
            }
        } else {
            this.vx = 0;
            this.timer -= dt;
            if (this.timer <= 0) {
                // 近くにいるプレイヤーの方へちょこちょこ走る
                if (player && Math.abs(player.x - this.x) < 340) {
                    this.dir = player.x > this.x ? 1 : -1;
                }
                this.state = 'dash';
                this.timer = 0.45 + Math.random() * 0.25;
            }
        }
        if (this.y > level.pixelHeight + 100) this.removed = true;
    }

    stomp(game) {
        this.alive = false;
        this.squashed = 0.5;
        this.vx = 0;
        game.sound.stomp();
        game.addScore(150, this.x, this.y);
    }

    render(c, camX) {
        let img;
        if (this.squashed > 0) img = sprites.osushiFlat.right;
        else if (this.state === 'dash') {
            img = (Math.floor(this.anim * 12) % 2 === 0) ? sprites.osushi1.right : sprites.osushi2.right;
        } else img = sprites.osushi1.right;
        this.drawImg(c, img, camX);
    }
}

// ルルちゃん: 重力も地形も無視して、8の字を描いて縦横無尽に飛び回る子犬
export class Lulu extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26);
        this.cx = this.x;             // 飛行の中心
        this.cy = this.y - 70;
        this.t = Math.random() * Math.PI * 2;
        this.rx = 110;
        this.ry = 64;
        this.prevX = this.x;
    }

    update(dt, level) {
        this.anim += dt;
        if (this.flipped) {
            this.vy = Math.min(this.vy + 2200 * dt, 900);
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.y > level.pixelHeight + 100) this.removed = true;
            return;
        }
        this.t += dt;
        this.prevX = this.x;
        this.x = this.cx + Math.cos(this.t * 1.6) * this.rx;
        this.y = Math.max(8, this.cy + Math.sin(this.t * 2.4) * this.ry);
    }

    stomp(game) {
        this.alive = false;
        this.flipped = true;
        this.vx = 0;
        this.vy = -320;
        game.sound.stomp();
        game.addScore(200, this.x, this.y);
    }

    render(c, camX) {
        const img = (Math.floor(this.anim * 8) % 2 === 0) ? sprites.lulu1.right : sprites.lulu2.right;
        this.drawImg(c, img, camX);
    }
}

// ゆいちゃんが投げるハート (放物線を描いて飛んでくる)
export class HeartShot extends Enemy {
    constructor(x, y, vx) {
        super(x / TS * TS, y, 18, 18);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = -360;
        this.active = true;
    }

    update(dt, level) {
        this.anim += dt;
        if (this.flipped) {
            this.vy = Math.min(this.vy + 2200 * dt, 900);
            this.y += this.vy * dt;
            if (this.y > level.pixelHeight + 100) this.removed = true;
            return;
        }
        this.vy = Math.min(this.vy + 1400 * dt, 700);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        const col = Math.floor((this.x + this.w / 2) / TS);
        const row = Math.floor((this.y + this.h / 2) / TS);
        if (level.isSolid(col, row)) this.removed = true;
        if (this.y > level.pixelHeight + 60) this.removed = true;
    }

    stomp(game) {
        // 踏むと弾き返せる
        this.alive = false;
        this.flipped = true;
        this.vy = -250;
        game.sound.kick();
        game.addScore(100, this.x, this.y);
    }

    render(c, camX) {
        const wob = Math.sin(this.anim * 14) * 2;
        drawHeart(c, this.x + this.w / 2 - camX, this.y + this.h / 2 + wob, 11);
    }
}

// ボス: ゆいちゃん (ボブヘアの女の子)。3回踏むと なかなおり できる
export class Yui extends Enemy {
    constructor(x, y) {
        super(x, y, 44, 58);
        this.boss = true;
        this.hp = 3;
        this.maxHp = 3;
        this.invuln = 0;
        this.defeated = false;
        this.jumpTimer = 2;
        this.throwTimer = 2.5;
        this.dir = -1;
    }

    update(dt, level, player, game) {
        this.anim += dt;
        if (this.invuln > 0) this.invuln -= dt;
        if (this.defeated) {
            // へたりこんで目を回している
            this.vx = 0;
            this.vy = Math.min(this.vy + 2200 * dt, 900);
            moveAndCollide(this, level, dt);
            return;
        }

        // 踏まれた直後はひるんで立ち止まる (逃げる隙を作る)
        const stunned = this.invuln > 0;
        const speed = 80 + (this.maxHp - this.hp) * 40;  // 怒るほど速くなる
        if (player && !stunned) this.dir = player.x + player.w / 2 > this.x + this.w / 2 ? 1 : -1;
        this.vx = stunned ? 0 : speed * this.dir;
        this.vy = Math.min(this.vy + 2200 * dt, 900);
        const res = moveAndCollide(this, level, dt);

        const grounded = res.ground || onGround(this, level);
        this.jumpTimer -= dt;
        if (grounded && !stunned && this.jumpTimer <= 0) {
            this.vy = -580;
            this.jumpTimer = 1.8 + Math.random() * 1.2;
        }

        // プレイヤーが遠いときはハートを投げる
        this.throwTimer -= dt;
        if (game && player && !stunned && this.throwTimer <= 0 &&
            Math.abs(player.x - this.x) > 140) {
            this.throwTimer = 2.4 + Math.random() * 0.8;
            const vx = (player.x > this.x ? 1 : -1) * (200 + Math.random() * 60);
            game.enemies.push(new HeartShot(this.x + this.w / 2, this.y + 6, vx));
            game.sound.kick();
        }
    }

    takeHit(game) {
        if (this.invuln > 0 || this.defeated) return;
        this.hp--;
        this.invuln = 1.2;
        game.sound.hurt();
        game.addScore(500, this.x, this.y);
        if (this.hp <= 0) {
            this.defeated = true;
            this.alive = false;        // 接触ダメージ停止
            this.vy = -350;
            game.addScore(5000, this.x, this.y - 20);
            game.onBossDefeated();
        }
    }

    stomp(game) { this.takeHit(game); }
    hitByFireball(game) { this.takeHit(game); }

    render(c, camX, time) {
        // 被弾中は点滅
        if (this.invuln > 0 && !this.defeated && Math.floor(this.anim * 12) % 2 === 0) return;
        let img;
        if (this.defeated) img = sprites.yuiDizzy.right;
        else img = (Math.floor(this.anim * 7) % 2 === 0) ? sprites.yui1.right : sprites.yui2.right;
        this.drawImg(c, img, camX);

        const cx = this.x + this.w / 2 - camX;
        if (this.defeated) {
            // 目を回している星
            for (let i = 0; i < 3; i++) {
                const a = this.anim * 4 + i * (Math.PI * 2 / 3);
                c.fillStyle = '#ffe060';
                c.beginPath();
                c.arc(cx + Math.cos(a) * 24, this.y - 8 + Math.sin(a) * 6, 3.5, 0, Math.PI * 2);
                c.fill();
            }
        } else {
            // HP ハート
            for (let i = 0; i < this.maxHp; i++) {
                drawHeart(c, cx - (this.maxHp - 1) * 9 + i * 18, this.y - 16, 9,
                    i < this.hp ? '#ff4060' : '#00000033');
            }
        }
    }
}

export function createEnemy(type, x, y) {
    if (type === 'kuri') return new Kuri(x, y);
    if (type === 'kame') return new Kame(x, y);
    if (type === 'kiiro') return new Kiiro(x, y);
    if (type === 'osushi') return new Osushi(x, y);
    if (type === 'lulu') return new Lulu(x, y);
    if (type === 'yui') return new Yui(x, y);
    return null;
}
