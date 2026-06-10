import { T } from '../level.js';

// WORLD 1-2: ひんやり地下洞窟
export default {
    name: 'WORLD 1-2',
    theme: 'underground',
    music: 'underground',
    width: 186,
    time: 300,
    build(b) {
        // 地形 (谷: 60-62, 100-103, 140-143)
        b.ground(0, 59);
        b.ground(63, 99);
        b.ground(104, 139);
        b.ground(144, 185);

        // 天井
        b.row(T.GROUND, 5, 158, 0);
        b.row(T.GROUND, 5, 158, 1);

        // 序盤のコイン棚
        b.bricks(12, 16, 11);
        b.coins(12, 16, 10);
        b.bricks(19, 23, 8);
        b.coins(19, 23, 7);
        b.enemy('kuri', 18);
        b.enemy('kuri', 21);

        // ハテナとレンガの通路
        b.q(28, 11, 'power');
        b.bricks(30, 36, 11);
        b.coins(31, 35, 13);
        b.enemy('kame', 33);

        // 段差のある洞窟内部
        b.row(T.HARD, 40, 44, 14);
        b.row(T.HARD, 42, 44, 13);
        b.coins(40, 44, 11);
        b.enemy('kuri', 48);
        b.enemy('kuri', 50);
        b.pipe(54, 3);

        // 谷 1 (60-62): 跳び越える
        b.coins(60, 62, 9);

        // 中盤: 高低差ゾーン
        b.bricks(66, 70, 11);
        b.q(68, 7, 'coin');
        b.enemy('kame', 72);
        b.row(T.HARD, 76, 79, 12);
        b.row(T.HARD, 82, 85, 9);
        b.coins(82, 85, 7);
        b.enemy('kuri', 88);
        b.enemy('kuri', 91);
        b.q(94, 11, 'life');

        // 谷 2 (100-103)
        b.coins(100, 103, 8);

        // 後半: レンガの迷路
        b.bricks(107, 112, 11);
        b.bricks(110, 117, 7);
        b.coins(110, 117, 6);
        b.q(114, 11, 'power');
        b.enemy('kame', 119);
        b.enemy('kuri', 123);
        b.enemy('kuri', 126);
        b.pipe(130, 2);
        b.coins(134, 137, 10);

        // 谷 3 (140-143)
        b.coins(140, 143, 9);

        // 出口へ
        b.enemy('kame', 148);
        b.enemy('kuri', 151);
        b.bricks(150, 153, 11);
        b.q(152, 11, 'coin');
        b.stairsUp(155, 3);

        b.goal(172);
    },
};
