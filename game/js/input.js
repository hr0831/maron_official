// キーボード & タッチ入力をまとめて管理する
export class Input {
    constructor() {
        this.down = new Set();      // 現在押されているアクション
        this.pressed = new Set();   // このフレームで押されたアクション

        const KEYMAP = {
            ArrowLeft: 'left', KeyA: 'left',
            ArrowRight: 'right', KeyD: 'right',
            ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
            ArrowDown: 'down', KeyS: 'down',
            ShiftLeft: 'run', ShiftRight: 'run', KeyX: 'run',
            Enter: 'start', Escape: 'start',
            KeyM: 'mute',
        };

        window.addEventListener('keydown', (e) => {
            const action = KEYMAP[e.code];
            if (!action) return;
            e.preventDefault();
            if (!this.down.has(action)) this.pressed.add(action);
            this.down.add(action);
        });

        window.addEventListener('keyup', (e) => {
            const action = KEYMAP[e.code];
            if (!action) return;
            this.down.delete(action);
        });

        window.addEventListener('blur', () => this.down.clear());

        this.bindTouch('tc-left', 'left');
        this.bindTouch('tc-right', 'right');
        this.bindTouch('tc-jump', 'jump');
        this.bindTouch('tc-run', 'run');
    }

    bindTouch(id, action) {
        const el = document.getElementById(id);
        if (!el) return;
        const press = (e) => {
            e.preventDefault();
            if (!this.down.has(action)) this.pressed.add(action);
            this.down.add(action);
        };
        const release = (e) => {
            e.preventDefault();
            this.down.delete(action);
        };
        el.addEventListener('touchstart', press, { passive: false });
        el.addEventListener('touchend', release, { passive: false });
        el.addEventListener('touchcancel', release, { passive: false });
        el.addEventListener('mousedown', press);
        el.addEventListener('mouseup', release);
    }

    held(action) { return this.down.has(action); }
    justPressed(action) { return this.pressed.has(action); }

    // 毎フレーム最後に呼ぶ
    update() { this.pressed.clear(); }
}
