/* ================================================================
   音声合成（WebAudio。ゲームから抽出した音源は一切使用しない）＋
   タップテンポ・メトロノーム／カウントイン。
   移植元: tai-score/index.html 行3518-3699。ロジックは変更していない。
   ================================================================ */
import { NOTE_MIDI, PITCHES } from './data/constants.js';

let audioCtx = null;
function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// ハープ・ギター・ベース・フルート：単一オシレーターを基本に、
// 楽器ごとに波形・音の立ち上がり/減衰・フィルターを変えて聴き分けやすくする
function playToneVoice(ctx, now, freq, instrument) {
  let attack = 0.006, decay = 1.1, peak = 0.28, waveType = 'triangle';
  let filterFrom = null, filterTo = null;
  if (instrument === 'Bass') { attack = 0.01; decay = 0.9; peak = 0.36; waveType = 'sine'; }
  else if (instrument === 'Flute') { attack = 0.06; decay = 0.9; peak = 0.20; waveType = 'sine'; }
  else if (instrument === 'Guitar') { attack = 0.003; decay = 1.0; peak = 0.30; waveType = 'sawtooth'; filterFrom = 5200; filterTo = 600; }
  // Harp（デフォルト）は上の初期値のまま

  const osc = ctx.createOscillator();
  osc.type = waveType;
  osc.frequency.setValueAtTime(freq, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

  let outNode = osc;
  if (filterFrom) {
    // ギター：弾いた瞬間は明るく、すぐ丸い音に落ち着くフィルターの動きをつける
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrom, now);
    filter.frequency.exponentialRampToValueAtTime(filterTo, now + decay * 0.6);
    osc.connect(filter);
    outNode = filter;
  }
  outNode.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + attack + decay + 0.05);

  // ハープは打鍵のきらめきとして1オクターブ上の弱い倍音を重ねる
  if (instrument === 'Harp') {
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(peak * 0.16, now + attack);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + attack + decay * 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + attack + decay * 0.45 + 0.05);
  }
}

// 鐘：非整数倍音比のオシレーターを複数重ねて金属的な響きにする
function playBellVoice(ctx, now, freq) {
  const partials = [1, 2.41, 3.88, 5.43];
  const decay = 1.8;
  partials.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, now);
    const gain = ctx.createGain();
    const peak = 0.22 / (i + 1.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay / (i * 0.4 + 1));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + decay + 0.05);
  });
}

// pitch: 調（'C'等）, instrument: 'Harp'|'Guitar'|'Bass'|'Flute'|'Bells'
export function playNote(noteIndex, pitch, instrument) {
  try {
    const ctx = ensureAudioCtx();
    const pitchOffset = PITCHES.indexOf(pitch || 'C');
    const now = ctx.currentTime;
    if (instrument === 'Bells') {
      const midi = NOTE_MIDI[noteIndex] + pitchOffset;
      playBellVoice(ctx, now, midiToFreq(midi));
      return;
    }
    const octaveShift = instrument === 'Bass' ? -12 : 0; // ベースは1オクターブ下げて低音らしくする
    const midi = NOTE_MIDI[noteIndex] + pitchOffset + octaveShift;
    playToneVoice(ctx, now, midiToFreq(midi), instrument);
  } catch (e) { /* オーディオが使えない環境では無視 */ }
}
export function playFrame(frame, pitch, instrument) { frame.forEach(n => playNote(n, pitch, instrument)); }

export function playMetronomeClick(accent) {
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(accent ? 1600 : 1000, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) { /* オーディオが使えない環境では無視 */ }
}

/* ================================================================
   メトロノーム／カウントイン。指定BPMで4拍分のクリックを鳴らし、完了後に
   onDoneを呼ぶ（標準的な「1・2・3・4」のカウントインと同じテンポ感で、
   5拍目の頭で本編が始まるようにする）。onBeat(beatNumber, totalBeats)は
   表示更新用のコールバック（省略可）。呼び出し側は演奏の中断時に
   cancelCountIn()でタイマーを止める必要がある。
   ================================================================ */
const COUNT_IN_BEATS = 4;
let countInTimer = null;
export function cancelCountIn() { clearTimeout(countInTimer); countInTimer = null; }
export function runCountIn(bpm, onBeat, onDone) {
  cancelCountIn();
  const intervalMs = 60000 / bpm;
  let beat = 0;
  const tick = () => {
    beat++;
    playMetronomeClick(beat === 1);
    if (onBeat) onBeat(beat, COUNT_IN_BEATS);
    if (beat >= COUNT_IN_BEATS) {
      countInTimer = setTimeout(() => { countInTimer = null; onDone(); }, intervalMs);
    } else {
      countInTimer = setTimeout(tick, intervalMs);
    }
  };
  tick();
}

/* ================================================================
   タップテンポ：画面を連続でタップして、その間隔からBPMを測定する
   2秒以上間が空いたら新しい計測として最初からやり直す。
   直近8タップ分の間隔の平均から算出する。
   ================================================================ */
const TAP_TEMPO_RESET_MS = 2000;
const TAP_TEMPO_MAX_TAPS = 8;
let tapTempoTimes = [];
// 戻り値: null（タップ1回目でまだ測定不能）| { bpm, count }
export function registerTapTempo() {
  const now = performance.now();
  if (tapTempoTimes.length > 0 && now - tapTempoTimes[tapTempoTimes.length - 1] > TAP_TEMPO_RESET_MS) {
    tapTempoTimes = [];
  }
  tapTempoTimes.push(now);
  if (tapTempoTimes.length > TAP_TEMPO_MAX_TAPS) tapTempoTimes.shift();
  if (tapTempoTimes.length < 2) return null;

  const intervals = [];
  for (let i = 1; i < tapTempoTimes.length; i++) intervals.push(tapTempoTimes[i] - tapTempoTimes[i - 1]);
  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.max(40, Math.min(300, Math.round(60000 / avgMs)));
  return { bpm, count: tapTempoTimes.length };
}
