// モジュール構成の JS を連結して、file:// でもダブルクリックで遊べる
// 単一 HTML (game/play.html) を生成する
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// 依存順に連結する (import 行を消すだけで動く順序)
const FILES = [
    'js/level.js',
    'js/sprites.js',
    'js/input.js',
    'js/audio.js',
    'js/camera.js',
    'js/entities/particles.js',
    'js/entities/items.js',
    'js/entities/enemies.js',
    'js/entities/player.js',
    'js/hud.js',
    ['js/levels/level1.js', 'LEVEL1_DATA'],
    ['js/levels/level2.js', 'LEVEL2_DATA'],
    ['js/levels/level3.js', 'LEVEL3_DATA'],
    ['js/levels/level4.js', 'LEVEL4_DATA'],
    'js/main.js',
];

function transform(src, defaultName) {
    let out = src
        // 1行・複数行どちらの import 文もまるごと除去 (... from '...'; まで)
        .replace(/^\s*import\s+[\s\S]*?from\s*['"][^'"]+['"];?\s*$/gm, '')
        .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '')
        .replace(/^export default \{/m, `const ${defaultName} = {`)
        .replace(/^export\s+(const|class|function|let|var)/gm, '$1');
    return out;
}

let js = "'use strict';\n";
for (const entry of FILES) {
    const [file, defaultName] = Array.isArray(entry) ? entry : [entry, null];
    js += `\n// ===== ${file} =====\n`;
    js += transform(readFileSync(join(root, file), 'utf8'), defaultName);
}
// levels/index.js の代わり
js = js.replace('const STEP = 1 / 120;',
    'const LEVELS = [LEVEL1_DATA, LEVEL2_DATA, LEVEL3_DATA, LEVEL4_DATA];\n\nconst STEP = 1 / 120;');

// 連結漏れがないか検証
for (const name of ['LEVEL1_DATA', 'LEVEL2_DATA', 'LEVEL3_DATA', 'LEVEL4_DATA']) {
    if (!js.includes(`const ${name} = {`)) throw new Error(`missing level data: ${name}`);
}

const css = readFileSync(join(root, 'css/style.css'), 'utf8');
const htmlSrc = readFileSync(join(root, 'index.html'), 'utf8');

// 元の index.html から body 内の UI 部分を流用し、CSS と JS を埋め込む
const html = htmlSrc
    .replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}\n</style>`)
    .replace(/<script type="module"[^>]*><\/script>/, `<script>\n${js}\n</script>`);

writeFileSync(join(root, 'play.html'), html);
console.log('generated game/play.html (' + html.length + ' bytes)');
