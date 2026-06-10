// 画面上部のスコア・コイン・残り時間など
import { drawCoin } from './sprites.js';

export class HUD {
    render(c, game) {
        c.save();
        c.font = 'bold 16px monospace';
        c.textBaseline = 'top';
        c.fillStyle = '#ffffff';
        c.shadowColor = 'rgba(0,0,0,0.6)';
        c.shadowOffsetX = 2;
        c.shadowOffsetY = 2;

        c.textAlign = 'left';
        c.fillText('MARON', 30, 12);
        c.fillText(String(game.score).padStart(7, '0'), 30, 32);

        drawCoin(c, 250, 28, 0.2, 8);
        c.fillText(`× ${String(game.coins).padStart(2, '0')}`, 264, 20);

        c.textAlign = 'center';
        c.fillText('WORLD', 480, 12);
        c.fillText(game.level ? game.level.name.replace('WORLD ', '') : '1-1', 480, 32);

        c.fillText('TIME', 700, 12);
        const t = Math.max(0, Math.ceil(game.time));
        c.fillStyle = t <= 50 ? '#ff7070' : '#ffffff';
        c.fillText(String(t).padStart(3, '0'), 700, 32);

        c.fillStyle = '#ffffff';
        c.textAlign = 'right';
        c.fillText(`まろん × ${game.lives}`, 930, 12);
        if (game.sound.muted) c.fillText('🔇', 930, 34);
        c.restore();
    }
}
