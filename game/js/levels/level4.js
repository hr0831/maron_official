import { T } from '../level.js';

// WORLD 1-4: 屋上決戦ハードモード! ボス3人 (ゆい・さすけ・ひろや)
export default {
    name: 'WORLD 1-4',
    theme: 'night',
    music: 'underground',
    width: 64,
    time: 300,
    boss: true,
    build(b) {
        for (let x = 4; x < 60; x += 16) b.decor('cloud', x, (x % 3));
        for (let x = 6; x < 60; x += 28) b.decor('hill', x);

        // 平らな決戦アリーナ (左右はステージ端の壁)
        b.ground(0, 63);

        // 踏みつけ用の足場
        b.row(T.HARD, 14, 17, 11);
        b.row(T.HARD, 28, 31, 9);
        b.row(T.HARD, 42, 45, 11);
        b.coins(28, 31, 7);

        // おたすけ: 確定ファイアフラワー
        b.q(7, 11, 'flower');

        // ボス3人 (ハードモード)
        b.enemy('yui', 48);
        b.enemy('sasuke', 38);
        b.enemy('hiroya', 57);
    },
};
