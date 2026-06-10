// タイルマップ式のレベル管理
export const TS = 32;            // タイル1辺のピクセル数
export const ROWS = 17;          // 画面の縦タイル数

export const T = {
    EMPTY: 0, GROUND: 1, BRICK: 2, QUESTION: 3, USED: 4, HARD: 5,
    PIPE_TL: 6, PIPE_TR: 7, PIPE_L: 8, PIPE_R: 9,
    COIN: 10, POLE: 11, POLE_TOP: 12,
};

const SOLID = new Set([
    T.GROUND, T.BRICK, T.QUESTION, T.USED, T.HARD,
    T.PIPE_TL, T.PIPE_TR, T.PIPE_L, T.PIPE_R,
]);

export const GROUND_Y = 15;      // 地面の上端の行

// レベルデータを組み立てるためのビルダー
class Builder {
    constructor(level) { this.level = level; }

    set(x, y, id) {
        if (x < 0 || x >= this.level.width || y < 0 || y >= ROWS) return;
        this.level.grid[y * this.level.width + x] = id;
    }

    // x0〜x1 (両端含む) に地面を敷く
    ground(x0, x1, topY = GROUND_Y) {
        for (let x = x0; x <= x1; x++)
            for (let y = topY; y < ROWS; y++) this.set(x, y, T.GROUND);
    }

    row(id, x0, x1, y) {
        for (let x = x0; x <= x1; x++) this.set(x, y, id);
    }

    brick(x, y) { this.set(x, y, T.BRICK); }
    bricks(x0, x1, y) { this.row(T.BRICK, x0, x1, y); }
    hard(x, y) { this.set(x, y, T.HARD); }

    // ハテナブロック content: 'coin' | 'power' | 'life'
    q(x, y, content = 'coin') {
        this.set(x, y, T.QUESTION);
        this.level.contents.set(`${x},${y}`, content);
    }

    coin(x, y) { this.set(x, y, T.COIN); }
    coins(x0, x1, y) { this.row(T.COIN, x0, x1, y); }

    // 土管 (幅2タイル・高さ h タイル)
    pipe(x, h, topY = GROUND_Y) {
        for (let i = 0; i < h; i++) {
            const y = topY - 1 - i;
            const top = i === h - 1;
            this.set(x, y, top ? T.PIPE_TL : T.PIPE_L);
            this.set(x + 1, y, top ? T.PIPE_TR : T.PIPE_R);
        }
    }

    // 上り階段 (硬いブロック)
    stairsUp(x, h, baseY = GROUND_Y) {
        for (let i = 0; i < h; i++)
            for (let j = 0; j <= i; j++) this.set(x + i, baseY - 1 - j, T.HARD);
    }

    // 下り階段
    stairsDown(x, h, baseY = GROUND_Y) {
        for (let i = 0; i < h; i++)
            for (let j = 0; j < h - i; j++) this.set(x + i, baseY - 1 - j, T.HARD);
    }

    enemy(type, x, y = GROUND_Y - 1) {
        this.level.spawns.push({ type, x: x * TS, y: y * TS });
    }

    // ゴール: 旗 + 城
    goal(x, baseY = GROUND_Y) {
        this.stairsUp(x - 9, 8, baseY);
        for (let y = baseY - 10; y < baseY; y++) this.set(x, y, T.POLE);
        this.set(x, baseY - 11, T.POLE_TOP);
        this.level.flagX = x;
        this.level.castleX = x + 6;
    }

    decor(kind, x, extra = 0) {
        this.level.decor.push({ kind, x: x * TS, extra });
    }
}

export class Level {
    constructor(data) {
        this.name = data.name;
        this.theme = data.theme;
        this.music = data.music || 'overworld';
        this.width = data.width;
        this.time = data.time || 300;
        this.grid = new Uint8Array(this.width * ROWS);
        this.contents = new Map();
        this.spawns = [];
        this.decor = [];
        this.flagX = this.width - 5;
        this.castleX = this.width - 3;
        this.playerSpawn = data.playerSpawn || { x: 3 * TS, y: (GROUND_Y - 2) * TS };
        data.build(new Builder(this));
        this.pixelWidth = this.width * TS;
        this.pixelHeight = ROWS * TS;
    }

    tileAt(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= ROWS) return T.EMPTY;
        return this.grid[row * this.width + col];
    }

    setTile(col, row, id) {
        if (col < 0 || col >= this.width || row < 0 || row >= ROWS) return;
        this.grid[row * this.width + col] = id;
    }

    isSolid(col, row) {
        if (col < 0 || col >= this.width) return true;  // 左右の壁
        if (row < 0 || row >= ROWS) return false;        // 上下は抜ける(穴)
        return SOLID.has(this.grid[row * this.width + col]);
    }
}

// AABB をタイルに対して移動・衝突解決する共通ルーチン
// entity: {x, y, w, h, vx, vy} を直接書き換え、結果フラグを返す
export function moveAndCollide(e, level, dt) {
    const res = { ground: false, ceiling: false, wall: false, headTiles: [] };

    // --- X 軸 ---
    e.x += e.vx * dt;
    if (e.vx > 0) {
        const col = Math.floor((e.x + e.w) / TS);
        for (let row = Math.floor(e.y / TS); row <= Math.floor((e.y + e.h - 1) / TS); row++) {
            if (level.isSolid(col, row)) {
                e.x = col * TS - e.w - 0.01;
                e.vx = 0;
                res.wall = true;
                break;
            }
        }
    } else if (e.vx < 0) {
        const col = Math.floor(e.x / TS);
        for (let row = Math.floor(e.y / TS); row <= Math.floor((e.y + e.h - 1) / TS); row++) {
            if (level.isSolid(col, row)) {
                e.x = (col + 1) * TS + 0.01;
                e.vx = 0;
                res.wall = true;
                break;
            }
        }
    }

    // --- Y 軸 ---
    e.y += e.vy * dt;
    if (e.vy > 0) {
        const row = Math.floor((e.y + e.h) / TS);
        for (let col = Math.floor((e.x + 2) / TS); col <= Math.floor((e.x + e.w - 3) / TS); col++) {
            if (level.isSolid(col, row)) {
                e.y = row * TS - e.h - 0.01;
                e.vy = 0;
                res.ground = true;
                break;
            }
        }
    } else if (e.vy < 0) {
        const row = Math.floor(e.y / TS);
        for (let col = Math.floor((e.x + 2) / TS); col <= Math.floor((e.x + e.w - 3) / TS); col++) {
            if (level.isSolid(col, row)) {
                e.y = (row + 1) * TS + 0.01;
                e.vy = 0;
                res.ceiling = true;
                res.headTiles.push({ col, row });
            }
        }
    }
    return res;
}

// 接地しているかどうかの判定 (足元 1px 下にソリッドがあるか)
export function onGround(e, level) {
    const row = Math.floor((e.y + e.h + 1) / TS);
    for (let col = Math.floor((e.x + 2) / TS); col <= Math.floor((e.x + e.w - 3) / TS); col++) {
        if (level.isSolid(col, row)) return true;
    }
    return false;
}
