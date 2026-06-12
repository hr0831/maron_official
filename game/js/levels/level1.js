// WORLD 1-1: はじまりの草原
export default {
    name: 'WORLD 1-1',
    theme: 'overworld',
    music: 'overworld',
    width: 184,
    time: 300,
    build(b) {
        // 地形
        b.ground(0, 69);
        b.ground(73, 86);
        b.ground(90, 183);

        // 背景の装飾
        for (let x = 6; x < 180; x += 22) b.decor('cloud', x, (x % 3));
        for (let x = 2; x < 180; x += 38) b.decor('hill', x);
        for (let x = 11; x < 180; x += 27) b.decor('bush', x);

        // 最初のブロック地帯 (きいろちゃんとおすしちゃんがお出迎え)
        b.enemy('osushi', 14);
        b.enemy('kiiro', 19);
        b.q(16, 11, 'coin');
        b.brick(21, 11);
        b.q(22, 11, 'power');
        b.brick(23, 11);
        b.q(24, 11, 'coin');
        b.brick(25, 11);
        b.q(23, 7, 'coin');
        b.enemy('kuri', 24);
        b.enemy('kuri', 28);

        // 土管ゾーン
        b.pipe(32, 2);
        b.pipe(39, 3);
        b.pipe(47, 4);
        b.enemy('kuri', 36);
        b.enemy('kuri', 43);
        b.enemy('kame', 53);
        b.enemy('kiiro', 58);
        b.coins(50, 53, 10);

        // 最初の谷 (70-72) の先
        b.brick(77, 11);
        b.q(78, 11, 'coin');
        b.brick(79, 11);
        b.q(78, 7, 'life');
        b.enemy('kuri', 81);
        b.enemy('kuri', 83);

        // 2つ目の谷 (87-89) の先: ブロックの空中回廊
        b.bricks(94, 98, 11);
        b.coins(94, 98, 7);
        b.q(104, 11, 'power');
        b.enemy('osushi', 102);
        b.enemy('kuri', 100);
        b.enemy('kuri', 107);
        b.enemy('kuri', 110);

        // 階段の丘
        b.stairsUp(116, 4);
        b.stairsDown(122, 4);
        b.enemy('kame', 128);
        b.pipe(132, 2);
        b.enemy('kiiro', 137);
        b.coins(136, 140, 9);

        // ゴール前ラッシュ
        b.bricks(143, 145, 11);
        b.q(144, 7, 'coin');
        b.enemy('kame', 148);
        b.enemy('kuri', 152);
        b.enemy('kuri', 154);
        b.coins(156, 158, 11);

        // ゴール (旗 + 城)
        b.goal(170);
    },
};
