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
    constructor(x, y, vx, beam = false, style = 'heart') {
        super(x / TS * TS, y, 18, 18);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.beam = beam;             // ビーム: まっすぐ高速で飛ぶ
        this.style = style;           // heart | ball | paper
        this.vy = beam ? 0 : -360;
        this.life = 2.4;
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
        if (this.beam) {
            this.x += this.vx * dt;
            this.life -= dt;
            if (this.life <= 0) this.removed = true;
        } else {
            this.vy = Math.min(this.vy + 1400 * dt, 700);
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
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

    drawOne(c, cx, cy, size, strong) {
        if (this.style === 'ball') {
            // さすけくんの青いボール
            c.fillStyle = strong ? '#1c46c8' : '#3a6ae8';
            c.beginPath();
            c.arc(cx, cy, size * 0.7, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#ffffffaa';
            c.beginPath();
            c.arc(cx - size * 0.22, cy - size * 0.22, size * 0.25, 0, Math.PI * 2);
            c.fill();
        } else if (this.style === 'paper') {
            // ひろやくんの書類 (ビームは紙飛行機)
            c.save();
            c.translate(cx, cy);
            if (this.beam) {
                c.fillStyle = '#f8f8f4';
                c.beginPath();
                const d = Math.sign(this.vx) || 1;
                c.moveTo(d * size, 0);
                c.lineTo(-d * size * 0.8, -size * 0.6);
                c.lineTo(-d * size * 0.4, 0);
                c.lineTo(-d * size * 0.8, size * 0.6);
                c.fill();
            } else {
                c.rotate(this.anim * 6);
                c.fillStyle = '#f8f8f4';
                c.fillRect(-size * 0.6, -size * 0.75, size * 1.2, size * 1.5);
                c.fillStyle = '#8a8a96';
                c.fillRect(-size * 0.4, -size * 0.45, size * 0.8, size * 0.14);
                c.fillRect(-size * 0.4, -size * 0.1, size * 0.8, size * 0.14);
            }
            c.restore();
        } else {
            drawHeart(c, cx, cy, size, strong ? '#ff2d6a' : undefined);
        }
    }

    render(c, camX) {
        const cx = this.x + this.w / 2 - camX;
        const cy = this.y + this.h / 2;
        if (this.beam) {
            // 残像つきのビーム表現
            c.globalAlpha = 0.25;
            this.drawOne(c, cx - Math.sign(this.vx) * 26, cy, 10, false);
            c.globalAlpha = 0.5;
            this.drawOne(c, cx - Math.sign(this.vx) * 13, cy, 11, false);
            c.globalAlpha = 1;
            this.drawOne(c, cx, cy, 13, true);
        } else {
            const wob = Math.sin(this.anim * 14) * 2;
            this.drawOne(c, cx, cy + wob, 11, false);
        }
    }
}

// ボスたちの性格設定
const BOSS_KINDS = {
    yui: {
        name: 'ゆい', sprites: ['yui1', 'yui2', 'yuiDizzy'], h: 86,
        speed: 80, rage: 40, jumpMin: 1.8, jumpVar: 1.2,
        throwMin: 2.0, throwVar: 0.7, beamEvery: 3,
        style: 'heart', shotSpeed: 200, beamSpeed: 390,
    },
    sasuke: {
        name: 'さすけ', sprites: ['sasuke1', 'sasuke2', 'sasukeDizzy'], h: 80,
        speed: 115, rage: 45, jumpMin: 1.1, jumpVar: 0.9,
        throwMin: 2.6, throwVar: 0.8, beamEvery: 4,
        style: 'ball', shotSpeed: 220, beamSpeed: 420,
    },
    hiroya: {
        name: 'ひろや', sprites: ['hiroya1', 'hiroya2', 'hiroyaDizzy'], h: 80,
        speed: 60, rage: 30, jumpMin: 2.5, jumpVar: 1.0,
        throwMin: 1.5, throwVar: 0.5, beamEvery: 3,
        style: 'paper', shotSpeed: 190, beamSpeed: 360,
    },
};

// ボス: 3回踏むと なかなおり できる
export class Boss extends Enemy {
    constructor(x, y, kind = 'yui') {
        super(x, y, 56, BOSS_KINDS[kind].h);
        this.kind = BOSS_KINDS[kind];
        this.boss = true;
        this.hp = 3;
        this.maxHp = 3;
        this.invuln = 0;
        this.defeated = false;
        this.jumpTimer = 2;
        this.throwTimer = 1.2 + Math.random() * 0.8;
        this.attackCount = 0;
        this.fireHits = 0;
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
        const k = this.kind;
        const stunned = this.invuln > 0;
        const speed = k.speed + (this.maxHp - this.hp) * k.rage;  // 怒るほど速くなる
        if (player && !stunned) this.dir = player.x + player.w / 2 > this.x + this.w / 2 ? 1 : -1;
        this.vx = stunned ? 0 : speed * this.dir;
        this.vy = Math.min(this.vy + 2200 * dt, 900);
        const res = moveAndCollide(this, level, dt);

        const grounded = res.ground || onGround(this, level);
        this.jumpTimer -= dt;
        if (grounded && !stunned && this.jumpTimer <= 0) {
            this.vy = -580;
            this.jumpTimer = k.jumpMin + Math.random() * k.jumpVar;
        }

        // プレイヤーが離れていると飛び道具攻撃 (数回に1回はビーム)
        this.throwTimer -= dt;
        if (game && player && !stunned && this.throwTimer <= 0 &&
            Math.abs(player.x - this.x) > 120) {
            this.throwTimer = k.throwMin + Math.random() * k.throwVar;
            this.attackCount++;
            const dir = player.x > this.x ? 1 : -1;
            if (this.attackCount % k.beamEvery === 0 || this.hp <= 1) {
                // ビーム: プレイヤーの高さへまっすぐ高速で飛ぶ
                game.enemies.push(new HeartShot(
                    this.x + this.w / 2, this.y + 30, dir * k.beamSpeed, true, k.style));
                game.sound.fireball();
            } else {
                const vx = dir * (k.shotSpeed + Math.random() * 60);
                game.enemies.push(new HeartShot(
                    this.x + this.w / 2, this.y + 6, vx, false, k.style));
                game.sound.kick();
            }
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

    // ファイアボールは効きにくい: 4発当ててハート1つ
    hitByFireball(game) {
        if (this.defeated || this.invuln > 0) return;
        this.fireHits++;
        if (this.fireHits >= 4) {
            this.fireHits = 0;
            this.takeHit(game);
        } else {
            game.addScore(50, this.x, this.y);
        }
    }

    render(c, camX, time) {
        const k = this.kind;
        const cx = this.x + this.w / 2 - camX;
        const blink = this.invuln > 0 && !this.defeated && Math.floor(this.anim * 12) % 2 === 0;
        if (!blink) {
            let img;
            if (this.defeated) img = sprites[k.sprites[2]].right;
            else img = (Math.floor(this.anim * 7) % 2 === 0) ? sprites[k.sprites[0]].right : sprites[k.sprites[1]].right;
            this.drawImg(c, img, camX);
        }

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

        // 名前表示
        c.save();
        c.font = 'bold 13px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        c.fillStyle = 'rgba(0,0,0,0.55)';
        c.fillText(k.name, cx + 1, this.y - 27);
        c.fillStyle = this.defeated ? '#aaffcc' : '#ffffff';
        c.fillText(k.name, cx, this.y - 28);
        c.restore();
    }
}

export function createEnemy(type, x, y) {
    if (type === 'kuri') return new Kuri(x, y);
    if (type === 'kame') return new Kame(x, y);
    if (type === 'kiiro') return new Kiiro(x, y);
    if (type === 'osushi') return new Osushi(x, y);
    if (type === 'lulu') return new Lulu(x, y);
    if (type === 'yui' || type === 'sasuke' || type === 'hiroya') return new Boss(x, y, type);
    return null;
}
