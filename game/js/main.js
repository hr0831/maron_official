import { Input } from './input.js';
import { Sound } from './audio.js';
import { Level, T, TS, GROUND_Y } from './level.js';
import { Camera } from './camera.js';
import { Player } from './entities/player.js';
import { createEnemy, Kame, HeartShot } from './entities/enemies.js';
import { CoinPop, Mushroom, Flower, Fireball, ScorePopup } from './entities/items.js';
import { Particles } from './entities/particles.js';
import { HUD } from './hud.js';
import { LEVELS } from './levels/index.js';
import {
    sprites, THEMES, drawTile, drawCloud, drawHill, drawBush, drawCastle, drawFlag,
    drawWindow, drawPlant, drawClock, drawElevator,
} from './sprites.js';

const STEP = 1 / 120;

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.input = new Input();
        this.sound = new Sound();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.hud = new HUD();
        this.particles = new Particles();
        this.state = 'title';
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.levelIndex = 0;
        this.level = null;
        this.time = 0;
        this.elapsed = 0;        // アニメーション用の通算時間
        this.stateTimer = 0;
        this.bumps = [];         // 叩かれてバウンドするブロック
        this.best = Number(localStorage.getItem('maron-best') || 0);

        // デバッグ: URL に ?stage=4 を付けるとそのステージから開始できる
        this.startLevel = 0;
        try {
            const s = parseInt(new URLSearchParams(window.location.search).get('stage'), 10);
            if (s >= 1 && s <= LEVELS.length) this.startLevel = s - 1;
        } catch { /* location が無い環境では無視 */ }

        // ブラウザの自動再生制限の解除はユーザー操作イベント内で行う
        const unlock = () => this.sound.init();
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('mousedown', unlock);

        this.last = performance.now();
        this.acc = 0;
        requestAnimationFrame((t) => this.frame(t));
    }

    // ---------- 進行管理 ----------
    newGame(startLevel = this.startLevel) {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.levelIndex = startLevel;
        this.loadLevel(startLevel);
    }

    loadLevel(i) {
        this.levelIndex = i;
        this.level = new Level(LEVELS[i]);
        this.player = new Player(this.level.playerSpawn.x, this.level.playerSpawn.y);
        this.enemies = this.level.spawns.map((s) => createEnemy(s.type, s.x, s.y));
        this.items = [];
        this.fireballs = [];
        this.popups = [];
        this.bumps = [];
        this.particles = new Particles();
        this.time = this.level.time;
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.flagDone = false;
        this.playerHidden = false;
        this.state = 'playing';
        this.sound.playMusic(this.level.music);
    }

    addScore(points, x, y) {
        this.score += points;
        if (x !== undefined) this.popups.push(new ScorePopup(x, y, String(points)));
    }

    addCoin(x, y) {
        this.coins++;
        this.addScore(200);
        this.sound.coin();
        if (x !== undefined) this.particles.sparkle(x, y);
        if (this.coins >= 100) {
            this.coins -= 100;
            this.lives++;
            this.sound.oneUp();
            this.popups.push(new ScorePopup(this.player.x, this.player.y - 10, '1UP!'));
        }
    }

    // ---------- ブロックを下から叩いた ----------
    hitBlock(col, row, player) {
        const tile = this.level.tileAt(col, row);
        if (tile === T.QUESTION) {
            const content = this.level.contents.get(`${col},${row}`) || 'coin';
            this.level.setTile(col, row, T.USED);
            this.bumps.push({ col, row, t: 0 });
            if (content === 'coin') {
                this.items.push(new CoinPop(col * TS + TS / 2, row * TS - 8));
                this.addCoin();
            } else if (content === 'life') {
                this.items.push(new Mushroom(col, row, 'life'));
                this.sound.sprout();
            } else if (content === 'flower') {
                // 確定ファイアフラワー
                this.items.push(new Flower(col, row));
                this.sound.sprout();
            } else if (player.form === 'small') {
                this.items.push(new Mushroom(col, row, 'power'));
                this.sound.sprout();
            } else {
                this.items.push(new Flower(col, row));
                this.sound.sprout();
            }
        } else if (tile === T.BRICK) {
            if (player.form !== 'small') {
                this.level.setTile(col, row, T.EMPTY);
                this.particles.brickBreak(col * TS + TS / 2, row * TS + TS / 2, THEMES[this.level.theme].brick);
                this.addScore(50);
                this.sound.breakBlock();
                this.camera.kick();
            } else {
                this.bumps.push({ col, row, t: 0 });
                this.sound.bump();
            }
        } else if (tile === T.USED || tile === T.HARD || tile === T.GROUND) {
            this.sound.bump();
            return;
        } else {
            return;
        }
        // 叩いたブロックの上に乗っている敵を倒す
        for (const e of this.enemies) {
            if (!e.alive || e.flipped || e.boss) continue;
            const onTop = Math.abs(e.y + e.h - row * TS) < 6 &&
                e.x + e.w > col * TS - 4 && e.x < (col + 1) * TS + 4;
            if (onTop) {
                e.flip(this, e.x + e.w / 2 < col * TS + TS / 2 ? -1 : 1);
                this.sound.kick();
            }
        }
    }

    // ---------- 更新 ----------
    update(dt) {
        this.elapsed += dt;

        if (this.input.justPressed('mute')) this.sound.toggleMute();

        switch (this.state) {
            case 'title': {
                // デバッグ/ステージセレクト: 1〜4 キーで直接そのステージへ
                let selected = -1;
                for (let i = 0; i < LEVELS.length; i++) {
                    if (this.input.justPressed('lv' + (i + 1))) selected = i;
                }
                if (selected >= 0) {
                    this.sound.init();
                    this.newGame(selected);
                } else if (this.input.justPressed('start') || this.input.justPressed('jump')) {
                    this.sound.init();
                    this.newGame();
                }
                break;
            }
            case 'playing':
                this.updatePlaying(dt);
                break;
            case 'paused':
                if (this.input.justPressed('start')) this.state = 'playing';
                break;
            case 'dying':
                this.player.update(dt, this.input, this.level, this);
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.lives--;
                    if (this.lives < 0) {
                        this.state = 'gameover';
                        this.stateTimer = 5;
                        this.saveBest();
                        this.sound.gameOver();
                    } else {
                        this.loadLevel(this.levelIndex);
                    }
                }
                break;
            case 'flag':
                this.updateFlag(dt);
                break;
            case 'clearwalk':
                this.updateClearWalk(dt);
                break;
            case 'clear':
                this.particles.update(dt);
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    if (this.levelIndex + 1 < LEVELS.length) this.loadLevel(this.levelIndex + 1);
                    else {
                        this.state = 'win';
                        this.stateTimer = 0;
                        this.saveBest();
                    }
                }
                break;
            case 'bossclear':
                // ボス撃破演出: ゆいちゃんは目を回し、花火が上がる
                for (const e of this.enemies) {
                    if (e.boss) e.update(dt, this.level, this.player, this);
                }
                this.particles.update(dt);
                this.popups.forEach((s) => s.update(dt));
                this.popups = this.popups.filter((s) => !s.removed);
                if (Math.random() < 0.04) {
                    this.particles.firework(
                        this.camera.x + 150 + Math.random() * 660, 60 + Math.random() * 180);
                }
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    if (this.levelIndex + 1 < LEVELS.length) this.loadLevel(this.levelIndex + 1);
                    else {
                        this.state = 'win';
                        this.stateTimer = 0;
                        this.saveBest();
                    }
                }
                break;
            case 'gameover':
                this.stateTimer -= dt;
                if (this.stateTimer <= 0 || this.input.justPressed('start')) this.state = 'title';
                break;
            case 'win':
                this.stateTimer -= dt;
                this.particles.update(dt);
                if (this.stateTimer <= 0) {
                    this.particles.firework(
                        this.camera.x + 150 + Math.random() * 660, 80 + Math.random() * 200);
                    this.stateTimer = 0.5;
                }
                if (this.input.justPressed('start')) this.state = 'title';
                break;
        }
    }

    updatePlaying(dt) {
        if (this.input.justPressed('start')) {
            this.state = 'paused';
            return;
        }

        const p = this.player;
        p.update(dt, this.input, this.level, this);

        // ファイアボール発射
        if (p.form === 'fire' && this.input.justPressed('run') && this.fireballs.length < 2) {
            this.fireballs.push(new Fireball(
                p.x + (p.facing > 0 ? p.w : -12), p.y + 14, p.facing));
            this.sound.fireball();
        }

        // タイルのコイン取得
        for (let row = Math.floor(p.y / TS); row <= Math.floor((p.y + p.h) / TS); row++) {
            for (let col = Math.floor(p.x / TS); col <= Math.floor((p.x + p.w) / TS); col++) {
                if (this.level.tileAt(col, row) === T.COIN) {
                    this.level.setTile(col, row, T.EMPTY);
                    this.addCoin(col * TS + TS / 2, row * TS + TS / 2);
                }
            }
        }

        // 敵
        for (const e of this.enemies) {
            if (!e.active) {
                e.active = e.x < this.camera.x + this.camera.viewW + 64;
                continue;
            }
            e.update(dt, this.level, p, this);
            if (e.removed || !e.alive || p.dead) continue;
            if (!this.overlap(p, e)) continue;

            const stomping = p.vy > 0 && p.y + p.h - e.y < e.h * 0.6;
            if (e instanceof Kame && e.state === 'shell' && !stomping) {
                e.kick(this, p.x + p.w / 2 < e.x + e.w / 2 ? 1 : -1);
            } else if (stomping) {
                e.stomp(this, p);
                p.stompBounce(this.input.held('jump'));
                this.particles.puff(p.x + p.w / 2, e.y);
            } else if (p.invuln <= 0 && !(e.ignorePlayer > 0)) {
                const died = p.hurt();
                if (died) this.startDeath();
                else this.sound.hurt();
            }
        }
        // 滑る甲羅 vs 他の敵
        for (const shell of this.enemies) {
            if (!(shell instanceof Kame) || shell.state !== 'sliding' || !shell.alive) continue;
            for (const e of this.enemies) {
                if (e === shell || !e.alive || e.flipped || !e.active) continue;
                if (this.overlap(shell, e)) {
                    e.flip(this, shell.dir);
                    this.sound.kick();
                }
            }
        }
        this.enemies = this.enemies.filter((e) => !e.removed);

        // アイテム
        for (const it of this.items) {
            it.update(dt, this.level);
            if (it.removed || it instanceof CoinPop) continue;
            if (it.w !== undefined && this.overlap(p, it)) {
                it.removed = true;
                if (it instanceof Mushroom && it.kind === 'life') {
                    this.lives++;
                    this.sound.oneUp();
                    this.popups.push(new ScorePopup(it.x, it.y, '1UP!'));
                } else {
                    // フラワーはどの状態からでもファイアまろんになれる
                    if (it instanceof Flower) p.setForm('fire');
                    else if (p.form === 'small') p.setForm('big');
                    this.sound.powerup();
                    this.addScore(1000, it.x, it.y);
                }
            }
        }
        this.items = this.items.filter((it) => !it.removed);

        // ファイアボール
        for (const f of this.fireballs) {
            f.update(dt, this.level);
            for (const e of this.enemies) {
                if (!e.alive || e.flipped || !e.active || f.removed) continue;
                if (this.overlap(f, e)) {
                    f.removed = true;
                    if (e.hitByFireball) e.hitByFireball(this);
                    else e.flip(this, Math.sign(f.vx) || 1);
                    this.particles.sparkle(e.x + e.w / 2, e.y + e.h / 2, '#ff9f1c');
                    this.sound.kick();
                }
            }
        }
        this.fireballs = this.fireballs.filter((f) => !f.removed);

        this.popups.forEach((s) => s.update(dt));
        this.popups = this.popups.filter((s) => !s.removed);
        this.particles.update(dt);

        // ブロックのバウンド演出
        this.bumps.forEach((b) => (b.t += dt * 8));
        this.bumps = this.bumps.filter((b) => b.t < Math.PI);

        this.camera.follow(p, this.level, dt);

        // 残り時間
        this.time -= dt;
        if (this.time <= 0 && !p.dead) {
            p.invuln = 0;
            p.form = 'small';
            p.hurt();
            this.startDeath();
        }

        // 穴に落ちた
        if (p.y > this.level.pixelHeight + 60 && !p.dead) {
            p.dead = true;
            this.startDeath();
        }

        // ゴールの旗に到達
        if (!this.level.bossLevel && p.x + p.w >= this.level.flagX * TS + 12 && !p.dead) {
            this.startFlag();
        }
    }

    onBossDefeated() {
        // 飛んでいるハートを消して勝利演出へ
        this.enemies = this.enemies.filter((e) => !(e instanceof HeartShot));
        this.state = 'bossclear';
        this.stateTimer = 5;
        this.sound.clear();
    }

    startDeath() {
        this.state = 'dying';
        this.stateTimer = 2.2;
        this.player.dead = true;
        this.player.vy = -560;
        this.player.vx = 0;
        this.sound.die();
    }

    startFlag() {
        const p = this.player;
        this.state = 'flag';
        p.frozen = true;
        p.vx = 0;
        p.vy = 0;
        p.x = this.level.flagX * TS + TS / 2 - p.w - 2;
        const heightTiles = Math.max(1, Math.round((GROUND_Y * TS - (p.y + p.h)) / TS));
        this.addScore(heightTiles * 100, p.x, p.y);
        this.flagY = (GROUND_Y - 11) * TS + 16;
        this.sound.stopMusic();
        this.sound.flagpole();
    }

    updateFlag(dt) {
        const p = this.player;
        const bottom = GROUND_Y * TS;
        p.y = Math.min(p.y + 240 * dt, bottom - p.h);
        this.flagY = Math.min(this.flagY + 240 * dt, bottom - 60);
        this.camera.follow(p, this.level, dt);
        if (p.y >= bottom - p.h) {
            this.state = 'clearwalk';
            p.facing = 1;
        }
    }

    updateClearWalk(dt) {
        const p = this.player;
        p.x += 150 * dt;
        p.runAnim += dt * 8;
        p.vy = Math.min(p.vy + 2400 * dt, 900);
        p.y += p.vy * dt;
        const bottom = GROUND_Y * TS;
        if (p.y + p.h > bottom) {
            p.y = bottom - p.h;
            p.vy = 0;
        }
        this.camera.follow(p, this.level, dt);
        if (p.x > this.level.castleX * TS + 70) {
            this.playerHidden = true;
            this.state = 'clear';
            this.stateTimer = 3.2;
            const bonus = Math.ceil(Math.max(0, this.time)) * 20;
            this.addScore(bonus);
            this.time = 0;
            this.sound.clear();
        }
    }

    saveBest() {
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('maron-best', String(this.best));
        }
    }

    overlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // ---------- 描画 ----------
    render() {
        const c = this.ctx;
        c.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'title') {
            this.renderTitle(c);
            return;
        }

        const level = this.level;
        const th = THEMES[level.theme];
        const camX = this.camera.offsetX();

        // 空
        c.fillStyle = th.sky;
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 星空 (夜と地下)
        if (level.theme === 'night' || level.theme === 'underground') {
            c.fillStyle = level.theme === 'night' ? '#ffffffcc' : '#ffffff22';
            for (let i = 0; i < 60; i++) {
                const sx = ((i * 137 + 61) % (this.canvas.width + 100)) - (camX * 0.15) % (this.canvas.width + 100);
                const x = (sx + this.canvas.width + 100) % (this.canvas.width + 100) - 50;
                const y = (i * 71 + 23) % 320;
                const tw = Math.sin(this.elapsed * 2 + i) > 0.4 ? 2.4 : 1.4;
                c.fillRect(x, y, tw, tw);
            }
        }

        // 背景の装飾 (パララックス)
        const groundLine = GROUND_Y * TS;
        for (const d of level.decor) {
            if (d.kind === 'hill') drawHill(c, d.x - camX * 0.85, groundLine, 1 + (d.x % 3) * 0.25, th);
        }
        for (const d of level.decor) {
            if (d.kind === 'cloud') drawCloud(c, d.x - camX * 0.55, 60 + d.extra * 38, 0.8 + d.extra * 0.25, th.cloud);
            if (d.kind === 'bush') drawBush(c, d.x - camX, groundLine, th);
            if (d.kind === 'window') drawWindow(c, d.x - camX * 0.8, 110 + d.extra * 50);
            if (d.kind === 'clock') drawClock(c, d.x - camX * 0.8, 70, this.elapsed + d.x);
            if (d.kind === 'plant') drawPlant(c, d.x - camX, groundLine);
        }

        // 城と旗 (ボス面にはなし)
        if (!level.bossLevel) {
            if (level.theme === 'office') drawElevator(c, level.castleX * TS - camX, groundLine);
            else drawCastle(c, level.castleX * TS - camX, groundLine);
            const flagBaseY = this.state === 'flag' || this.state === 'clearwalk' || this.state === 'clear' || this.flagDone
                ? (this.flagY ?? (GROUND_Y - 10) * TS)
                : (GROUND_Y - 11) * TS + 16;
            drawFlag(c, level.flagX * TS + TS / 2 - 3 - camX, flagBaseY);
        }

        // ブロックからせり上がり中のアイテムはタイルの後ろに描く
        for (const it of this.items) {
            if (it.emerge > 0) it.render(c, camX);
        }

        // タイル
        const c0 = Math.floor(camX / TS);
        const c1 = Math.min(level.width - 1, c0 + Math.ceil(this.canvas.width / TS) + 1);
        for (let col = c0; col <= c1; col++) {
            for (let row = 0; row < 17; row++) {
                const id = level.tileAt(col, row);
                if (!id) continue;
                let dy = 0;
                for (const b of this.bumps) {
                    if (b.col === col && b.row === row) dy = -Math.sin(b.t) * 9;
                }
                drawTile(c, id, col * TS - camX, row * TS + dy, level.theme, this.elapsed);
            }
        }

        // エンティティ
        for (const it of this.items) {
            if (!(it.emerge > 0)) it.render(c, camX);
        }
        for (const e of this.enemies) e.render(c, camX);
        for (const f of this.fireballs) f.render(c, camX);
        if (!this.playerHidden) this.player.render(c, camX, this.elapsed);
        this.particles.render(c, camX);
        for (const s of this.popups) s.render(c, camX);

        this.hud.render(c, this);

        // 状態別オーバーレイ
        if (this.state === 'paused') this.overlayText(c, 'PAUSE', 'ENTER で再開');
        if (this.state === 'gameover') this.overlayText(c, 'GAME OVER', `SCORE ${this.score}`);
        if (this.state === 'clear' && this.levelIndex + 1 >= LEVELS.length) {
            // 最終面クリアの瞬間は何も出さない (win 画面へ)
        } else if (this.state === 'clear') {
            this.overlayText(c, 'COURSE CLEAR!', 'タイムボーナス獲得!');
        }
        if (this.state === 'bossclear') {
            this.overlayText(c, '🎀 なかなおり! 🎀', 'ゆいちゃんと なかよくなった!');
        }
        if (this.state === 'win') {
            this.overlayText(c, '🎉 ALL CLEAR! 🎉',
                `まろんは平和を取り戻した!  SCORE ${this.score}  /  BEST ${this.best}`,
                'ENTER でタイトルへ');
        }
    }

    overlayText(c, big, small, smaller) {
        c.fillStyle = 'rgba(0,0,0,0.55)';
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);
        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold 52px monospace';
        c.fillText(big, this.canvas.width / 2, 230);
        if (small) {
            c.font = 'bold 22px monospace';
            c.fillText(small, this.canvas.width / 2, 295);
        }
        if (smaller) {
            c.font = '16px monospace';
            c.fillText(smaller, this.canvas.width / 2, 340);
        }
    }

    renderTitle(c) {
        const w = this.canvas.width, h = this.canvas.height;
        const th = THEMES.overworld;
        c.fillStyle = th.sky;
        c.fillRect(0, 0, w, h);
        drawCloud(c, 90, 80, 1, '#fff');
        drawCloud(c, 600, 50, 1.3, '#fff');
        drawCloud(c, 800, 130, 0.8, '#fff');
        drawHill(c, 150, h - 64, 1.4, th);
        drawHill(c, 760, h - 64, 1, th);
        drawBush(c, 300, h - 64, th);
        drawBush(c, 660, h - 64, th);
        c.fillStyle = th.groundA;
        c.fillRect(0, h - 64, w, 64);
        c.fillStyle = th.groundTop;
        c.fillRect(0, h - 64, w, 5);

        // ロゴ
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.font = 'bold 64px monospace';
        c.fillText('SUPER MARON', w / 2 + 4, 144);
        c.fillText('WORLD', w / 2 + 4, 214);
        c.fillStyle = '#ffd24a';
        c.strokeStyle = '#8a4a10';
        c.lineWidth = 8;
        c.strokeText('SUPER MARON', w / 2, 140);
        c.strokeText('WORLD', w / 2, 210);
        c.fillText('SUPER MARON', w / 2, 140);
        c.fillText('WORLD', w / 2, 210);
        c.fillStyle = '#ffffff';
        c.font = 'bold 18px monospace';
        c.fillText('〜 まろんの大冒険 〜', w / 2, 262);

        // 主人公
        const img = sprites.dog.big.run1.right;
        const bounce = Math.abs(Math.sin(this.elapsed * 4)) * 14;
        c.drawImage(img, w / 2 - img.width, h - 64 - img.height * 2 - bounce, img.width * 2, img.height * 2);

        if (Math.floor(this.elapsed * 1.6) % 2 === 0) {
            c.fillStyle = '#ffffff';
            c.font = 'bold 24px monospace';
            c.fillText('PRESS ENTER / タップでスタート', w / 2, h - 130);
        }
        c.fillStyle = '#ffffffcc';
        c.font = '15px monospace';
        c.fillText(`BEST SCORE  ${String(this.best).padStart(7, '0')}`, w / 2, h - 92);
        c.fillStyle = '#ffffff88';
        c.font = '13px monospace';
        const stageHint = this.startLevel > 0 ? `▶ STAGE 1-${this.startLevel + 1} から開始` : '1〜4 キーでステージ選択 (4 = ボス戦)';
        c.fillText(stageHint, w / 2, h - 70);
    }

    // ---------- メインループ ----------
    frame(now) {
        const dt = Math.min(0.1, (now - this.last) / 1000);
        this.last = now;
        this.acc += dt;
        while (this.acc >= STEP) {
            this.update(STEP);
            this.input.update();
            this.acc -= STEP;
        }
        this.render();
        requestAnimationFrame((t) => this.frame(t));
    }
}

// デバッグ用にコンソールから触れるよう公開しておく
window.__MARON_GAME__ = new Game();
