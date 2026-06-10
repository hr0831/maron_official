// Web Audio API でレトロ風の効果音と BGM をすべてコード生成する
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// BGM 用の音名ヘルパー
const N = {
    C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
    C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84,
    C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
    C2: 36, F2: 41, G2: 43, A2: 45,
};

// 16分音符単位のオリジナル曲 (null = 休符)。著作権フリーの自作メロディ。
const OVERWORLD_MELODY = [
    N.E5, N.E5, null, N.E5, null, N.C5, N.E5, null, N.G5, null, null, null, N.G4, null, null, null,
    N.C5, null, null, N.G4, null, null, N.E4, null, N.A4, null, N.B4, null, N.A4, N.G4, null, null,
    N.E5, N.G5, N.A5, null, N.F5, N.G5, null, N.E5, null, N.C5, N.D5, N.B4, null, null, null, null,
    N.C5, null, N.D5, null, N.E5, null, N.C5, null, N.A4, null, N.G4, null, null, null, null, null,
];
const OVERWORLD_BASS = [
    N.C3, null, N.G3, null, N.C3, null, N.G3, null, N.A3, null, N.E3, null, N.A3, null, N.E3, null,
    N.F3, null, N.C3, null, N.F3, null, N.C3, null, N.G3, null, N.D3, null, N.G3, null, N.B3, null,
    N.C3, null, N.G3, null, N.A3, null, N.E3, null, N.F3, null, N.C3, null, N.D3, null, N.G3, null,
    N.C3, null, N.G3, null, N.A3, null, N.E3, null, N.F3, null, N.G3, null, N.C3, null, null, null,
];
const UNDERGROUND_MELODY = [
    N.C4, N.C5, N.A4, null, N.A4, N.C5, null, null, N.E4, N.E5, N.C5, null, N.C5, N.E5, null, null,
    N.D4, N.D5, N.B4, null, N.B4, N.D5, null, null, N.F4, N.F5, N.D5, null, N.D5, N.F5, null, null,
];
const UNDERGROUND_BASS = [
    N.C2, null, null, null, N.A2, null, null, null, N.C3, null, null, null, N.A2, null, null, null,
    N.G2, null, null, null, N.B3, null, null, null, N.F2, null, null, null, N.G2, null, null, null,
];

export class Sound {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicTimer = null;
        this.musicStep = 0;
        this.musicNextTime = 0;
        this.currentTrack = null;
    }

    // ブラウザの自動再生制限のため、最初のユーザー操作後に呼ぶ
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.5;
        this.musicGain.connect(this.master);
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
        return this.muted;
    }

    tone({ freq, freqEnd, time = 0, dur = 0.1, type = 'square', vol = 0.5, dest }) {
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime + time;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(gain).connect(dest || this.master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    noise({ time = 0, dur = 0.2, vol = 0.3 }) {
        if (!this.ctx) return;
        const t0 = this.ctx.currentTime + time;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        src.connect(gain).connect(this.master);
        src.start(t0);
    }

    // ---- 効果音 ----
    jump()     { this.tone({ freq: 240, freqEnd: 700, dur: 0.18, type: 'square', vol: 0.35 }); }
    stomp()    { this.tone({ freq: 300, freqEnd: 80, dur: 0.12, type: 'square', vol: 0.4 }); this.noise({ dur: 0.08, vol: 0.15 }); }
    coin()     { this.tone({ freq: midi(83), dur: 0.07, vol: 0.35 }); this.tone({ freq: midi(88), time: 0.07, dur: 0.35, vol: 0.35 }); }
    bump()     { this.tone({ freq: 120, freqEnd: 70, dur: 0.1, type: 'square', vol: 0.4 }); }
    breakBlock() { this.noise({ dur: 0.25, vol: 0.4 }); this.tone({ freq: 200, freqEnd: 60, dur: 0.2, type: 'sawtooth', vol: 0.25 }); }
    sprout()   { for (let i = 0; i < 6; i++) this.tone({ freq: 200 + i * 90, time: i * 0.04, dur: 0.06, vol: 0.25 }); }
    powerup()  { const seq = [60, 64, 67, 72, 76, 79, 84]; seq.forEach((n, i) => this.tone({ freq: midi(n), time: i * 0.06, dur: 0.09, vol: 0.3 })); }
    oneUp()    { const seq = [64, 67, 76, 72, 74, 79]; seq.forEach((n, i) => this.tone({ freq: midi(n), time: i * 0.09, dur: 0.12, vol: 0.3 })); }
    hurt()     { this.tone({ freq: 500, freqEnd: 100, dur: 0.3, type: 'sawtooth', vol: 0.3 }); }
    kick()     { this.tone({ freq: 400, freqEnd: 900, dur: 0.08, type: 'square', vol: 0.35 }); }
    fireball() { this.tone({ freq: 700, freqEnd: 200, dur: 0.1, type: 'sawtooth', vol: 0.25 }); }
    die() {
        this.stopMusic();
        const seq = [72, 71, 70, 69, 67, 60, 55, 48];
        seq.forEach((n, i) => this.tone({ freq: midi(n), time: 0.1 + i * 0.11, dur: 0.12, type: 'triangle', vol: 0.4 }));
    }
    flagpole() {
        const seq = [55, 58, 60, 62, 65, 67, 70, 72, 74];
        seq.forEach((n, i) => this.tone({ freq: midi(n), time: i * 0.07, dur: 0.1, vol: 0.3 }));
    }
    clear() {
        this.stopMusic();
        const seq = [60, 64, 67, 72, 76, 79, 84, 79, 76, 72, 76, 79, 84];
        seq.forEach((n, i) => this.tone({ freq: midi(n), time: i * 0.13, dur: 0.16, type: 'square', vol: 0.3 }));
    }
    gameOver() {
        this.stopMusic();
        const seq = [72, 67, 64, 60, 62, 59, 55, 48];
        seq.forEach((n, i) => this.tone({ freq: midi(n), time: i * 0.2, dur: 0.25, type: 'triangle', vol: 0.35 }));
    }

    // ---- BGM (簡易ステップシーケンサー) ----
    playMusic(track = 'overworld') {
        if (!this.ctx) return;
        this.stopMusic();
        this.currentTrack = track;
        this.musicStep = 0;
        this.musicNextTime = this.ctx.currentTime + 0.05;
        this.musicTimer = setInterval(() => this.scheduleMusic(), 60);
    }

    scheduleMusic() {
        if (!this.ctx) return;
        const stepDur = this.currentTrack === 'underground' ? 0.16 : 0.13;
        const melody = this.currentTrack === 'underground' ? UNDERGROUND_MELODY : OVERWORLD_MELODY;
        const bass = this.currentTrack === 'underground' ? UNDERGROUND_BASS : OVERWORLD_BASS;
        while (this.musicNextTime < this.ctx.currentTime + 0.25) {
            const i = this.musicStep % melody.length;
            const t = this.musicNextTime - this.ctx.currentTime;
            const m = melody[i];
            const b = bass[i % bass.length];
            if (m) this.tone({ freq: midi(m), time: t, dur: stepDur * 0.9, type: 'square', vol: 0.18, dest: this.musicGain });
            if (b) this.tone({ freq: midi(b), time: t, dur: stepDur * 1.6, type: 'triangle', vol: 0.25, dest: this.musicGain });
            this.musicNextTime += stepDur;
            this.musicStep++;
        }
    }

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }
}
