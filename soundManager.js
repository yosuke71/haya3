// 効果音管理。基本はWeb Audio APIによる合成音。
// 「いただきます」「食べる音」「ごちそうさま」のみ収録済みの音声ファイルを再生する。
// AudioContext は初回のサウンド再生要求（＝ユーザーの初回操作）時に生成する。

const ITADAKIMASU_AUDIO_PATH = 'assets/sounds/itadakimasu.m4a';
let itadakimasuAudio = null;

const EAT_AUDIO_PATH = 'assets/sounds/amu.mp3';

const COMPLETE_AUDIO_PATH = 'assets/sounds/gochisousama.m4a';
let completeAudio = null;

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

// ゲーム開始（「はいどうぞ」を押した瞬間）
export function playStart() {
    playTone(523.25, 0, 0.15, { type: 'triangle' }); // C5
    playTone(659.25, 0.12, 0.15, { type: 'triangle' }); // E5
    playTone(783.99, 0.24, 0.25, { type: 'triangle' }); // G5
}

// 「いただきます」音声。再生が終わるまで待てるよう Promise を返す。
// 再生に失敗した場合もゲーム進行を止めないよう、その場で解決する。
export function playItadakimasu() {
    return new Promise((resolve) => {
        if (!itadakimasuAudio) {
            itadakimasuAudio = new Audio(ITADAKIMASU_AUDIO_PATH);
        }
        const audio = itadakimasuAudio;
        audio.currentTime = 0;

        const finish = () => {
            audio.removeEventListener('ended', finish);
            audio.removeEventListener('error', finish);
            resolve();
        };
        audio.addEventListener('ended', finish);
        audio.addEventListener('error', finish);
        audio.play().catch(finish);
    });
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
// マルチタッチで連続再生されても途切れないよう、毎回新しい Audio を生成する。
export function playEat() {
    const audio = new Audio(EAT_AUDIO_PATH);
    audio.play().catch(() => {});
}

// もぐもぐ（咀嚼音）
export function playMogu() {
    playTone(200, 0, 0.1, { type: 'sine', peakGain: 0.18 });
    playTone(170, 0.14, 0.12, { type: 'sine', peakGain: 0.18 });
}

// ごちそうさま（完食）
export function playComplete() {
    if (!completeAudio) {
        completeAudio = new Audio(COMPLETE_AUDIO_PATH);
    }
    completeAudio.currentTime = 0;
    completeAudio.play().catch(() => {});
}
