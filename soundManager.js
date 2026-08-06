// 効果音管理（Web Audio API のみ・音声ファイル不使用）
// AudioContext は初回のサウンド再生要求（＝ユーザーの初回操作）時に生成する。

let audioContext = null;

function ensureAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

function playTone(freq, startDelay, duration, { type = 'sine', peakGain = 0.25 } = {}) {
    const ctx = ensureAudioContext();
    const startTime = ctx.currentTime + startDelay;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
}

function playNoiseBurst(startDelay, duration, { peakGain = 0.3, filterFreq = 1200 } = {}) {
    const ctx = ensureAudioContext();
    const startTime = ctx.currentTime + startDelay;
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(peakGain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration + 0.02);
}

// ゲーム開始（「はいどうぞ」を押した瞬間）
export function playStart() {
    playTone(523.25, 0, 0.15, { type: 'triangle' }); // C5
    playTone(659.25, 0.12, 0.15, { type: 'triangle' }); // E5
    playTone(783.99, 0.24, 0.25, { type: 'triangle' }); // G5
}

// 食べ物を指でつまんだ瞬間
export function playPick() {
    playTone(880, 0, 0.08, { type: 'sine', peakGain: 0.2 });
}

// 食べ物を置いた瞬間（皿への配置・移動）
export function playDrop() {
    playTone(220, 0, 0.12, { type: 'sine', peakGain: 0.2 });
}

// ボタン押下
export function playButton() {
    playTone(600, 0, 0.06, { type: 'square', peakGain: 0.15 });
}

// 食べ物が口に届いた瞬間
export function playEat() {
    playNoiseBurst(0, 0.18, { peakGain: 0.3, filterFreq: 1500 });
}

// もぐもぐ（咀嚼音）
export function playMogu() {
    playTone(200, 0, 0.1, { type: 'sine', peakGain: 0.18 });
    playTone(170, 0.14, 0.12, { type: 'sine', peakGain: 0.18 });
}

// ごちそうさま（完食）
export function playComplete() {
    playTone(523.25, 0, 0.18, { type: 'triangle' }); // C5
    playTone(659.25, 0.15, 0.18, { type: 'triangle' }); // E5
    playTone(783.99, 0.3, 0.18, { type: 'triangle' }); // G5
    playTone(1046.5, 0.45, 0.4, { type: 'triangle' }); // C6
}
