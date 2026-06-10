// レンガの破片・キラキラ・花火などの簡易パーティクル
export class Particles {
    constructor() {
        this.list = [];
    }

    spawn({ x, y, vx = 0, vy = 0, life = 0.6, size = 6, color = '#fff', gravity = 1600, shape = 'rect' }) {
        this.list.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity, shape });
    }

    // レンガを壊したときの破片
    brickBreak(x, y, color) {
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, -0.4], [1, -0.4]]) {
            this.spawn({
                x, y,
                vx: dx * (120 + Math.random() * 80),
                vy: dy * (380 + Math.random() * 120),
                life: 1, size: 10, color,
            });
        }
    }

    // 踏みつけ時の土煙
    puff(x, y) {
        for (let i = 0; i < 6; i++) {
            this.spawn({
                x: x + (Math.random() - 0.5) * 20, y,
                vx: (Math.random() - 0.5) * 120,
                vy: -Math.random() * 80,
                life: 0.35, size: 5, color: '#ffffffaa', gravity: 0, shape: 'circle',
            });
        }
    }

    sparkle(x, y, color = '#ffd24a') {
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 60 + Math.random() * 120;
            this.spawn({
                x, y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life: 0.5, size: 4, color, gravity: 300, shape: 'circle',
            });
        }
    }

    firework(x, y) {
        const colors = ['#ff5050', '#ffd24a', '#50c0ff', '#80ff80', '#ff90e0'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            const sp = 120 + Math.random() * 80;
            this.spawn({
                x, y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life: 1, size: 4, color, gravity: 250, shape: 'circle',
            });
        }
    }

    update(dt) {
        for (const p of this.list) {
            p.life -= dt;
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
        this.list = this.list.filter((p) => p.life > 0);
    }

    render(c, camX) {
        for (const p of this.list) {
            c.globalAlpha = Math.max(0, p.life / p.maxLife);
            c.fillStyle = p.color;
            const s = p.size;
            if (p.shape === 'circle') {
                c.beginPath();
                c.arc(p.x - camX, p.y, s / 2, 0, Math.PI * 2);
                c.fill();
            } else {
                c.fillRect(p.x - camX - s / 2, p.y - s / 2, s, s);
            }
        }
        c.globalAlpha = 1;
    }
}
