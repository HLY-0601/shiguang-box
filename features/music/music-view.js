/* ================================================================
   music-view.js — 光遇15键琴窗
   键盘: QWERTYUI / ASDFGHJKL / ZXCVBNM
   实际映射: 上排Q-T, 中排A-G, 下排Z-B
   ================================================================ */

let container = null;
let audioCtx = null;

// 15个音高 (C4到C6)
const NOTES = [
  261.63, 293.66, 329.63, 349.23, 392.00,  // C4 G4
  440.00, 493.88, 523.25, 587.33, 659.25,  // A4 E5
  698.46, 783.99, 880.00, 987.77, 1046.50, // F5 C6
];

const KEY_MAP = {
  'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4,
  'a': 5, 's': 6, 'd': 7, 'f': 8, 'g': 9,
  'z': 10, 'x': 11, 'c': 12, 'v': 13, 'b': 14,
};

const NOTE_NAMES = ['C','D','E','F','G','A','B','C','D','E','F','G','A','B','C'];

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playNote(idx) {
  const ctx = getCtx();
  const freq = NOTES[idx];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
  // 视觉反馈
  const key = document.querySelector(`[data-note="${idx}"]`);
  if (key) { key.classList.add('active'); setTimeout(() => key.classList.remove('active'), 200); }
}

export function mount(cont) {
  container = cont;
  render();
  window.addEventListener('keydown', onKey);
}
export function unmount() {
  window.removeEventListener('keydown', onKey);
  container = null;
}

function onKey(e) {
  if (e.repeat) return;
  const idx = KEY_MAP[e.key.toLowerCase()];
  if (idx !== undefined) playNote(idx);
}

function render() {
  if (!container) return;
  const rows = [
    ['q','w','e','r','t'],
    ['a','s','d','f','g'],
    ['z','x','c','v','b'],
  ];
  let keyIdx = 0;
  container.innerHTML = `
    <style>
      .mu-wrap { max-width: 600px; margin: 0 auto; padding: 20px; }
      .mu-title { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
      .mu-sub { font-size: 13px; opacity: .6; margin: 0 0 24px; }
      .mu-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 8px; }
      .mu-key {
        width: 80px; height: 100px; border-radius: 10px; border: 1px solid rgba(255,255,255,.15);
        background: rgba(255,255,255,.08); display: flex; flex-direction: column;
        align-items: center; justify-content: center; cursor: pointer; user-select: none;
        transition: all .1s;
      }
      .mu-key:hover { background: rgba(255,255,255,.15); }
      .mu-key.active { background: #7c9eff; transform: scale(.95); }
      .mu-key .k { font-size: 11px; opacity: .5; }
      .mu-key .n { font-size: 16px; font-weight: 600; margin-top: 4px; }
    </style>
    <div class="mu-wrap">
      <h1 class="mu-title">琴窗</h1>
      <p class="mu-sub">用鼠标点击或电脑键盘 Q-T / A-G / Z-B 弹奏</p>
      ${rows.map(row => `
        <div class="mu-row">
          ${row.map(k => {
            const i = keyIdx++;
            return `<div class="mu-key" data-note="${i}" data-key="${k}">
              <span class="k">${k.toUpperCase()}</span>
              <span class="n">${NOTE_NAMES[i]}</span>
            </div>`;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
  container.querySelectorAll('.mu-key').forEach(el => {
    el.addEventListener('click', () => playNote(parseInt(el.dataset.note)));
  });
}
