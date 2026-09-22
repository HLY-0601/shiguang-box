/* ================================================================
   Skyの5×3（15マス）演奏グリッドに関する基本定数。
   移植元: tai-score/index.html 行1539-1561。MIDIノート番号は
   Sky Music Nightly (github.com/Specy/genshin-music) のデフォルトハープ配列
   [60,62,64,65,67,69,71,72,74,76,77,79,81,83,84] と同一。値は一切変更していない。
   ================================================================ */
import { CURRENT_LANG } from '../../../js/i18n.js';

export const NOTE_LABELS = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
export const NOTE_LABELS_EN = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
export const NOTE_MIDI = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
export const PITCHES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Skyコミュニティで広く使われている「ABC譜」記法（上段=A、中段=B、下段=C、左から1〜5）
export const NOTE_ABC_CODES = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5'];
export const INSTRUMENT_LABELS = { Harp: '楽器A', Guitar: '楽器B', Bass: '楽器C', Flute: '楽器D', Bells: '楽器E' };
export const INSTRUMENT_LABELS_EN = { Harp: 'Instrument A', Guitar: 'Instrument B', Bass: 'Instrument C', Flute: 'Instrument D', Bells: 'Instrument E' };

export function instrumentCodeFromLabel(label) {
  const found = Object.keys(INSTRUMENT_LABELS).find(code => INSTRUMENT_LABELS[code] === label || code === label);
  return found || null;
}
// 現在の表示言語での楽器ラベル（テキスト譜面のヘッダー等、常に日本語で扱う箇所には使わない）
export function instrumentLabel(code) {
  return (CURRENT_LANG === 'en' ? INSTRUMENT_LABELS_EN[code] : INSTRUMENT_LABELS[code]) || code;
}
// 音名表示（ド・レ・ミ…）。英語表示時はドレミ唱法のローマ字表記(Do/Re/Mi…)にする。
export function noteLabel(i) { return CURRENT_LANG === 'en' ? NOTE_LABELS_EN[i] : NOTE_LABELS[i]; }

export const DEFAULT_KEY_BINDINGS = ['y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', ';', 'n', 'm', ',', '.', '/'];
