import { T } from '../level.js';

// WORLD 1-3: 星ふる夜の大ジャンプ
export default {
    name: 'WORLD 1-3',
    theme: 'night',
    music: 'overworld',
    width: 198,
    time: 280,
    build(b) {
        for (let x = 4; x < 195; x += 18) b.decor('cloud', x, (x % 3));
        for (let x = 8; x < 195; x += 45) b.decor('hill', x);

        // スタート地点
        b.ground(0, 14);
        b.q(10, 11, 'coin');

        // 空中ステップ 1
        b.row(T.HARD, 18, 21, 12);
        b.row(T.HARD, 25, 28, 10);
        b.coins(25, 28, 8);
        b.row(T.HARD, 32, 35, 12);
        b.enemy('kame', 33, 11);

        // 小島 1
        b.ground(38, 48);
        b.q(43, 11, 'power');
        b.enemy('kiiro', 41);
        b.enemy('kuri', 44);
        b.enemy('kuri', 46);

        // 空中ステップ 2
        b.row(T.HARD, 52, 54, 12);
        b.row(T.HARD, 58, 60, 10);
        b.coins(58, 60, 8);
        b.row(T.HARD, 64, 66, 12);

        // 小島 2: 土管とカメ
        b.ground(69, 80);
        b.pipe(73, 2);
        b.enemy('kame', 78);
        b.q(76, 10, 'coin');

        // 空中ステップ 3 (ジグザグ)
        b.row(T.HARD, 84, 86, 11);
        b.row(T.HARD, 89, 93, 12);
        b.coins(89, 93, 10);
        b.row(T.HARD, 95, 99, 11);
        b.coins(95, 99, 9);

        // 小島 3: パワーアップチャンス
        b.ground(102, 114);
        b.bricks(107, 110, 11);
        b.q(108, 11, 'power');
        b.q(110, 7, 'life');
        b.enemy('kuri', 111);
        b.enemy('kame', 106);

        // 連続ロングジャンプ
        b.row(T.HARD, 118, 121, 12);
        b.row(T.HARD, 124, 127, 12);
        b.enemy('kuri', 125, 11);
        b.row(T.HARD, 130, 133, 12);
        b.coins(118, 133, 9);

        // 小島 4: 最後の試練
        b.ground(136, 150);
        b.stairsUp(140, 3);
        b.enemy('kame', 146);
        b.enemy('osushi', 143);
        b.enemy('kuri', 148);
        b.q(144, 8, 'coin');

        // ラストの空中回廊
        b.row(T.HARD, 154, 156, 12);
        b.row(T.HARD, 160, 163, 10);
        b.coins(160, 163, 8);

        // ゴール大陸
        b.ground(166, 197);
        b.enemy('kiiro', 171);
        b.enemy('lulu', 176);
        b.goal(184);
    },
};
