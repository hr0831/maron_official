// 全てのグラフィックをコードで生成する (画像ファイル不要のオリジナルドット絵)
const SCALE = 2;

// 文字列のドット絵 → オフスクリーンキャンバス
function px(rows, palette, scale = SCALE) {
    const h = rows.length;
    const w = rows[0].length;
    const cv = document.createElement('canvas');
    cv.width = w * scale;
    cv.height = h * scale;
    const c = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x];
            if (ch === '.' || ch === ' ') continue;
            c.fillStyle = palette[ch] || '#f0f';
            c.fillRect(x * scale, y * scale, scale, scale);
        }
    }
    return cv;
}

function flipped(img) {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const c = cv.getContext('2d');
    c.translate(img.width, 0);
    c.scale(-1, 1);
    c.drawImage(img, 0, 0);
    return cv;
}

// ---- 主人公: 犬の「まろん」 ----
const DOG_PAL = {
    K: '#1a1208', B: '#a05a2c', D: '#6b3a14', W: '#ffffff',
    R: '#d62828', P: '#5a3218', G: '#222222',
};
// ファイアまろん (白毛 + 赤バンダナ)
const DOG_FIRE_PAL = { ...DOG_PAL, B: '#f5f0e8', D: '#cfc5b5', P: '#ffd9a0' };

const DOG_HEAD = [
    '..KK........KK..',
    '.KBDK......KDBK.',
    '.KBBK.KKKK.KBBK.',
    '.KBBKKBBBBKKBBK.',
    '..KBBBBBBBBBBK..',
    '..KBBWGBBWGBBK..',
    '..KBBBBBBBBBBK..',
    '..KBPPPPPPPPBK..',
    '..KBPPKKPPPPBK..',
    '...KBPPPPPPBK...',
    '...KKRRRRRRKK...',
];
const LEGS_IDLE = [
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
    '..KBBK....KBBK..',
    '..KBDK....KDBK..',
    '..KKK......KKK..',
];
const LEGS_RUN1 = [
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
    '.KBBK......KBBK.',
    'KBDK........KDBK',
    'KKK..........KKK',
];
const LEGS_RUN2 = [
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
    '....KBBKKBBK....',
    '....KDBKKBDK....',
    '....KKK..KKK....',
];
const LEGS_JUMP = [
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
    '..KKBBK..KBBKK..',
    '...KKDK..KDKK...',
    '....KK....KK....',
];
const BIG_BODY = [
    '..KBBWWWWWWBBK..',
    '..KBBWWWWWWBBK..',
    '..KBBWWWWWWBBK..',
    '..KBBBWWWWBBBK..',
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
    '..KBBBBBBBBBBK..',
];
const BIG_LEGS_IDLE = LEGS_IDLE.slice(2);
const BIG_LEGS_RUN1 = LEGS_RUN1.slice(2);
const BIG_LEGS_RUN2 = LEGS_RUN2.slice(2);
const BIG_LEGS_JUMP = LEGS_JUMP.slice(2);

function dogSmall(legs, pal) { return px([...DOG_HEAD, ...legs], pal); }
function dogBig(legs, pal) { return px([...DOG_HEAD, ...BIG_BODY, ...legs], pal); }

// ---- 敵: クリボン (栗) ----
const KURI_PAL = { K: '#1a1208', D: '#5e3a1a', B: '#c8884a', W: '#ffffff', S: '#e8d0a0' };
const KURI_1 = [
    '.....KKKKKK.....',
    '...KKDDDDDDKK...',
    '..KDDDDDDDDDDK..',
    '.KDDBBBBBBBBDDK.',
    '.KDBBBBBBBBBBDK.',
    'KDBBWKBBBBKWBBDK',
    'KDBBKKBBBBKKBBDK',
    'KDBBBBBBBBBBBBDK',
    'KDBBBKBBBBKBBBDK',
    '.KDBBBKKKKBBBDK.',
    '.KKDDDDDDDDDDKK.',
    '..KKKKKKKKKKKK..',
    '..KSSK....KSSK..',
    '..KSSK....KSSK..',
    '.KSSSK....KSSSK.',
    '.KKKKK....KKKKK.',
];
const KURI_2 = [
    ...KURI_1.slice(0, 12),
    '...KSSK..KSSK...',
    '...KSSK..KSSK...',
    '...KSSSKKSSSK...',
    '...KKKKKKKKKK...',
];
const KURI_FLAT = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....KKKKKK.....',
    '...KKDDDDDDKK...',
    '.KKDDBBBBBBDDKK.',
    'KDDBBWKBBBBKWBDK',
    'KSSSSSSSSSSSSSSK',
    '.KKKKKKKKKKKKKK.',
];

// ---- 敵: カメッキー ----
const KAME_PAL = { K: '#103018', Y: '#e8c860', W: '#ffffff', G: '#3ba53b', E: '#f0e8c0' };
const KAME_1 = [
    '.....KKKK.......',
    '....KYYYYK......',
    '....KYWKYYK.....',
    '....KYYYYYK.....',
    '.....KYYK.......',
    '...KKGGGGKK.....',
    '..KGGEEEEGGK....',
    '.KGEEGGGGEEGK...',
    '.KGEGGGGGGEGK...',
    '.KGEGGGGGGEGK...',
    '.KGEEGGGGEEGK...',
    '..KGGEEEEGGK....',
    '...KKGGGGKK.....',
    '...KYYK.KYYK....',
    '..KYYK...KYYK...',
    '..KKK.....KKK...',
];
const KAME_2 = [
    ...KAME_1.slice(0, 13),
    '....KYYKYYK.....',
    '....KYYKYYK.....',
    '....KKK.KKK.....',
];
const SHELL = [
    '................',
    '................',
    '................',
    '................',
    '...KKKKKKKKKK...',
    '..KGGEEEEEEGGK..',
    '.KGEEGGGGGGEEGK.',
    '.KGEGGKKKKGGEGK.',
    '.KGEGGKKKKGGEGK.',
    '.KGEGGGGGGGGEGK.',
    '.KGEEGGGGGGEEGK.',
    '..KGGEEEEEEGGK..',
    '...KKKKKKKKKK...',
    '..KEEK....KEEK..',
    '...KK......KK...',
    '................',
];

// ---- アイテム ----
const ITEM_PAL = {
    K: '#1a1208', R: '#d62828', W: '#ffffff', O: '#ff9f1c',
    G: '#2d8a2d', E: '#3fbf3f',
};
const MUSHROOM = [
    '....KKKKKKKK....',
    '..KKRRWWWWRRKK..',
    '.KRRRWWWWWWRRRK.',
    '.KRWWRRRRRRWWRK.',
    'KRRWWRRRRRRWWRRK',
    'KRRRRRRWWRRRRRRK',
    'KRRRRRWWWWRRRRRK',
    '.KKKKKKKKKKKKKK.',
    '..KWWWWWWWWWWK..',
    '..KWWKWWWWKWWK..',
    '..KWWWWWWWWWWK..',
    '...KWWWWWWWWK...',
    '....KKKKKKKK....',
    '................',
    '................',
    '................',
];
const ONEUP_PAL = { ...ITEM_PAL, R: '#2d8a2d' };
const FLOWER = [
    '....KKKKKK......',
    '...KRRRRRRK.....',
    '..KRRWWWWRRK....',
    '..KRWWOOWWRK....',
    '..KRWWOOWWRK....',
    '..KRRWWWWRRK....',
    '...KRRRRRRK.....',
    '....KKKKKK......',
    '......KEK.......',
    '.KEK..KEK..KEK..',
    '..KEK.KEK.KEK...',
    '...KEEKEKEEK....',
    '.....KEEEK......',
    '......KEK.......',
    '......KEK.......',
    '................',
];

function build() {
    const dogSmallPal = DOG_PAL, dogFirePal = DOG_FIRE_PAL;
    const make = (img) => ({ right: img, left: flipped(img) });
    return {
        dog: {
            small: {
                idle: make(dogSmall(LEGS_IDLE, dogSmallPal)),
                run1: make(dogSmall(LEGS_RUN1, dogSmallPal)),
                run2: make(dogSmall(LEGS_RUN2, dogSmallPal)),
                jump: make(dogSmall(LEGS_JUMP, dogSmallPal)),
            },
            big: {
                idle: make(dogBig(BIG_LEGS_IDLE, dogSmallPal)),
                run1: make(dogBig(BIG_LEGS_RUN1, dogSmallPal)),
                run2: make(dogBig(BIG_LEGS_RUN2, dogSmallPal)),
                jump: make(dogBig(BIG_LEGS_JUMP, dogSmallPal)),
            },
            fire: {
                idle: make(dogBig(BIG_LEGS_IDLE, dogFirePal)),
                run1: make(dogBig(BIG_LEGS_RUN1, dogFirePal)),
                run2: make(dogBig(BIG_LEGS_RUN2, dogFirePal)),
                jump: make(dogBig(BIG_LEGS_JUMP, dogFirePal)),
            },
        },
        kuri1: make(px(KURI_1, KURI_PAL)),
        kuri2: make(px(KURI_2, KURI_PAL)),
        kuriFlat: make(px(KURI_FLAT, KURI_PAL)),
        kame1: make(px(KAME_1, KAME_PAL)),
        kame2: make(px(KAME_2, KAME_PAL)),
        shell: make(px(SHELL, KAME_PAL)),
        mushroom: px(MUSHROOM, ITEM_PAL),
        oneup: px(MUSHROOM, ONEUP_PAL),
        flower: px(FLOWER, ITEM_PAL),
    };
}

export const sprites = build();

// ================= テーマ =================
export const THEMES = {
    overworld: {
        sky: '#5c94fc', groundA: '#c8723c', groundB: '#9c4a1c', groundTop: '#e8a05c',
        brick: '#b85c28', brickLine: '#7a3a14', hard: '#9a9a9a',
        hillA: '#3ba53b', hillB: '#2d7a2d', cloud: '#ffffff',
    },
    underground: {
        sky: '#101018', groundA: '#3a6ab0', groundB: '#274a80', groundTop: '#5a8ad0',
        brick: '#3a6ab0', brickLine: '#1c3760', hard: '#707080',
        hillA: '#1c3048', hillB: '#16263a', cloud: '#404858',
    },
    night: {
        sky: '#1c2a52', groundA: '#8a5a8a', groundB: '#623a62', groundTop: '#b080b0',
        brick: '#7a4a7a', brickLine: '#4a2a4a', hard: '#8a8a9a',
        hillA: '#26426a', hillB: '#1c3052', cloud: '#aab4d0',
    },
};

// ================= タイル描画 =================
import { T, TS } from './level.js';

export function drawTile(c, id, x, y, theme, t) {
    const th = THEMES[theme];
    switch (id) {
        case T.GROUND:
            c.fillStyle = th.groundA;
            c.fillRect(x, y, TS, TS);
            c.fillStyle = th.groundTop;
            c.fillRect(x, y, TS, 4);
            c.fillStyle = th.groundB;
            c.fillRect(x, y + TS - 4, TS, 4);
            c.fillRect(x + TS - 3, y, 3, TS);
            break;
        case T.BRICK:
            c.fillStyle = th.brick;
            c.fillRect(x, y, TS, TS);
            c.fillStyle = th.brickLine;
            c.fillRect(x, y, TS, 2);
            c.fillRect(x, y + 15, TS, 2);
            c.fillRect(x, y + 30, TS, 2);
            c.fillRect(x + 15, y, 2, 16);
            c.fillRect(x + 3, y + 16, 2, 16);
            c.fillRect(x + 26, y + 16, 2, 16);
            break;
        case T.QUESTION: {
            const pulse = Math.sin(t * 5) > 0.3 ? '#ffd24a' : '#f0a500';
            c.fillStyle = pulse;
            c.fillRect(x, y, TS, TS);
            c.fillStyle = '#8a5a00';
            c.strokeStyle = '#8a5a00';
            c.lineWidth = 2;
            c.strokeRect(x + 2, y + 2, TS - 4, TS - 4);
            c.fillStyle = '#7a3a00';
            c.font = 'bold 22px monospace';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('?', x + TS / 2, y + TS / 2 + 1);
            break;
        }
        case T.USED:
            c.fillStyle = '#8a5a3a';
            c.fillRect(x, y, TS, TS);
            c.fillStyle = '#6a4028';
            c.fillRect(x + 2, y + 2, TS - 4, TS - 4);
            break;
        case T.HARD:
            c.fillStyle = th.hard;
            c.fillRect(x, y, TS, TS);
            c.fillStyle = '#ffffff44';
            c.fillRect(x, y, TS, 4);
            c.fillRect(x, y, 4, TS);
            c.fillStyle = '#00000044';
            c.fillRect(x, y + TS - 4, TS, 4);
            c.fillRect(x + TS - 4, y, 4, TS);
            break;
        case T.PIPE_TL:
        case T.PIPE_TR: {
            const left = id === T.PIPE_TL;
            c.fillStyle = '#2d9a2d';
            c.fillRect(x - (left ? 0 : 4), y, TS + 4, TS);
            c.fillStyle = '#67d040';
            c.fillRect(x + (left ? 4 : -2), y, 6, TS);
            c.fillStyle = '#175a17';
            c.fillRect(x, y, left ? 2 : 0, TS);
            if (!left) c.fillRect(x + TS - 2, y, 2, TS);
            c.fillStyle = '#175a17';
            c.fillRect(x - (left ? 0 : 4), y, TS + 4, 3);
            c.fillRect(x - (left ? 0 : 4), y + TS - 3, TS + 4, 3);
            break;
        }
        case T.PIPE_L:
        case T.PIPE_R: {
            const left = id === T.PIPE_L;
            c.fillStyle = '#2d9a2d';
            c.fillRect(x + (left ? 2 : 0), y, TS - 2, TS);
            c.fillStyle = '#67d040';
            c.fillRect(x + (left ? 6 : 0), y, 6, TS);
            c.fillStyle = '#175a17';
            if (left) c.fillRect(x + 2, y, 2, TS);
            else c.fillRect(x + TS - 4, y, 2, TS);
            break;
        }
        case T.COIN:
            drawCoin(c, x + TS / 2, y + TS / 2, t);
            break;
        case T.POLE:
            c.fillStyle = '#3fae3f';
            c.fillRect(x + TS / 2 - 3, y, 6, TS);
            c.fillStyle = '#a8e8a8';
            c.fillRect(x + TS / 2 - 3, y, 2, TS);
            break;
        case T.POLE_TOP:
            c.fillStyle = '#3fae3f';
            c.fillRect(x + TS / 2 - 3, y + 10, 6, TS - 10);
            c.fillStyle = '#e8d860';
            c.beginPath();
            c.arc(x + TS / 2, y + 8, 7, 0, Math.PI * 2);
            c.fill();
            break;
    }
}

export function drawCoin(c, cx, cy, t, r = 11) {
    const w = Math.abs(Math.cos(t * 5)) * r;
    c.fillStyle = '#ffd24a';
    c.beginPath();
    c.ellipse(cx, cy, Math.max(2, w), r, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#b8860b';
    c.beginPath();
    c.ellipse(cx, cy, Math.max(1, w * 0.55), r * 0.6, 0, 0, Math.PI * 2);
    c.fill();
}

export function drawFireball(c, x, y, t) {
    c.fillStyle = '#ff6b1c';
    c.beginPath();
    c.arc(x, y, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffd24a';
    c.beginPath();
    c.arc(x + Math.cos(t * 20) * 2, y + Math.sin(t * 20) * 2, 3.5, 0, Math.PI * 2);
    c.fill();
}

// ================= 背景の装飾 =================
export function drawCloud(c, x, y, scale, color) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, 16 * scale, 0, Math.PI * 2);
    c.arc(x + 22 * scale, y - 8 * scale, 20 * scale, 0, Math.PI * 2);
    c.arc(x + 46 * scale, y, 16 * scale, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x - 8 * scale, y, 62 * scale, 14 * scale);
}

export function drawHill(c, x, baseY, scale, th) {
    c.fillStyle = th.hillB;
    c.beginPath();
    c.moveTo(x - 70 * scale, baseY);
    c.quadraticCurveTo(x, baseY - 110 * scale, x + 70 * scale, baseY);
    c.fill();
}

export function drawBush(c, x, baseY, th) {
    c.fillStyle = th.hillA;
    c.beginPath();
    c.arc(x, baseY - 12, 14, 0, Math.PI * 2);
    c.arc(x + 20, baseY - 16, 17, 0, Math.PI * 2);
    c.arc(x + 42, baseY - 12, 14, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x - 14, baseY - 12, 70, 12);
}

export function drawCastle(c, x, baseY) {
    const w = 160, h = 128;
    c.fillStyle = '#b0b0b8';
    c.fillRect(x, baseY - h, w, h);
    c.fillStyle = '#88888f';
    c.fillRect(x + 36, baseY - h - 44, 88, 44);
    // 城壁の凹凸
    c.fillStyle = '#b0b0b8';
    for (let i = 0; i < 5; i++) c.fillRect(x + i * 36, baseY - h - 14, 22, 14);
    c.fillStyle = '#88888f';
    for (let i = 0; i < 3; i++) c.fillRect(x + 40 + i * 32, baseY - h - 58, 18, 14);
    // 扉と窓
    c.fillStyle = '#222226';
    c.beginPath();
    c.arc(x + w / 2, baseY - 28, 24, Math.PI, 0);
    c.fill();
    c.fillRect(x + w / 2 - 24, baseY - 28, 48, 28);
    c.fillRect(x + 20, baseY - h + 24, 14, 20);
    c.fillRect(x + w - 34, baseY - h + 24, 14, 20);
    // 旗
    c.fillStyle = '#ffffff';
    c.fillRect(x + w / 2 - 2, baseY - h - 92, 4, 34);
    c.fillStyle = '#d62828';
    c.beginPath();
    c.moveTo(x + w / 2 + 2, baseY - h - 92);
    c.lineTo(x + w / 2 + 30, baseY - h - 82);
    c.lineTo(x + w / 2 + 2, baseY - h - 72);
    c.fill();
}

export function drawFlag(c, poleX, y) {
    c.fillStyle = '#d62828';
    c.beginPath();
    c.moveTo(poleX, y);
    c.lineTo(poleX - 30, y + 12);
    c.lineTo(poleX, y + 24);
    c.fill();
}
