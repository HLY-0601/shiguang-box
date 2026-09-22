/* ================================================================
   MIDIファイル（標準MIDIファイル/SMF）から楽譜を作成
   移植元: tai-score/index.html 行5362-5658。

   外部ライブラリは使わず、ArrayBufferのバイト列からフォーマット0/1/2の
   SMFを直接パースする（ヘッダーチャンク＋MTrkチャンク群、可変長数値
   （VLQ）のデルタタイム、ランニングステータス、テンポ／トラック名の
   メタイベントに対応）。
   ================================================================ */
import { midiToSkyIndex } from './image-import.js';
import { genId } from '../tai-score-state.js';

function midiError(msgKey) {
  const err = new Error(msgKey);
  err.midiUserMessage = msgKey;
  return err;
}
function readUint32(bytes, pos) {
  return ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
}
function readUint16(bytes, pos) {
  return (bytes[pos] << 8) | bytes[pos + 1];
}
// 可変長数値（Variable Length Quantity）：各バイトの上位1bitが継続フラグ、下位7bitが値
function readVarLen(bytes, pos, limit) {
  let value = 0, b, count = 0;
  do {
    if (pos >= limit || count++ > 5) throw midiError('midiParseFailed');
    b = bytes[pos++];
    value = (value << 7) | (b & 0x7f);
  } while (b & 0x80);
  return [value >>> 0, pos];
}
function decodeMidiText(byteSubarray) {
  try { return new TextDecoder('utf-8').decode(byteSubarray).trim(); } catch (e) { return ''; }
}

function parseMidiHeader(bytes) {
  if (bytes.length < 14) throw midiError('midiParseFailed');
  if (bytes[0] !== 0x4D || bytes[1] !== 0x54 || bytes[2] !== 0x68 || bytes[3] !== 0x64) throw midiError('midiParseFailed'); // "MThd"
  const headerLen = readUint32(bytes, 4);
  const format = readUint16(bytes, 8);
  const trackCount = readUint16(bytes, 10);
  const divisionRaw = readUint16(bytes, 12);
  let ticksPerQuarter = null, smpte = null;
  if (divisionRaw & 0x8000) {
    // SMPTEタイムコード形式（映像同期用途などで稀に使われる）
    const framesPerSecond = (256 - ((divisionRaw >> 8) & 0xFF)) || 30;
    const ticksPerFrame = (divisionRaw & 0xFF) || 4;
    smpte = { framesPerSecond, ticksPerFrame };
  } else {
    ticksPerQuarter = divisionRaw & 0x7FFF;
  }
  if (!smpte && ticksPerQuarter <= 0) throw midiError('midiParseFailed');
  return { format, trackCount, ticksPerQuarter, smpte, headerEnd: 8 + headerLen };
}

// 1トラック（MTrkチャンクの中身）をイベント列にパースする。
function parseMidiTrackEvents(bytes, start, end) {
  const events = [];
  let pos = start, tick = 0, runningStatus = 0;
  while (pos < end) {
    let delta;
    [delta, pos] = readVarLen(bytes, pos, end);
    tick += delta;
    if (pos >= end) break;

    let statusByte = bytes[pos];
    if (statusByte & 0x80) {
      pos++;
      if (statusByte < 0xF0) runningStatus = statusByte;
    } else {
      statusByte = runningStatus;
      if (!statusByte) break;
    }

    if (statusByte === 0xFF) {
      if (pos >= end) break;
      const metaType = bytes[pos++];
      let len; [len, pos] = readVarLen(bytes, pos, end);
      const dataStart = pos, dataEnd = pos + len;
      if (dataEnd > end) break;
      if (metaType === 0x51 && len >= 3) {
        events.push({ tick, type: 'tempo', usPerQuarter: (bytes[dataStart] << 16) | (bytes[dataStart + 1] << 8) | bytes[dataStart + 2] });
      } else if (metaType === 0x03) {
        events.push({ tick, type: 'trackName', text: decodeMidiText(bytes.subarray(dataStart, dataEnd)) });
      }
      pos = dataEnd;
    } else if (statusByte === 0xF0 || statusByte === 0xF7) {
      let len; [len, pos] = readVarLen(bytes, pos, end);
      pos += len;
    } else if (statusByte >= 0x80 && statusByte <= 0xEF) {
      const type = statusByte & 0xF0, channel = statusByte & 0x0F;
      if (pos >= end) break;
      const d1 = bytes[pos++];
      if (type === 0xC0 || type === 0xD0) {
        // プログラムチェンジ／チャンネルアフタータッチ：データ1バイトのみ
      } else {
        if (pos >= end) break;
        const d2 = bytes[pos++];
        if (type === 0x90 && d2 > 0) events.push({ tick, type: 'noteOn', note: d1, channel }); // velocity 0のノートオンはノートオフ扱い
      }
    } else {
      break; // 未知のステータスバイト：これ以上安全に読み進められない
    }
  }
  return events;
}

function parseMidiFile(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const header = parseMidiHeader(bytes);
  const tracks = [];
  let pos = header.headerEnd;
  while (pos + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    const len = readUint32(bytes, pos + 4);
    const dataStart = pos + 8, dataEnd = dataStart + len;
    if (dataEnd > bytes.length) break;
    if (id === 'MTrk') tracks.push(parseMidiTrackEvents(bytes, dataStart, dataEnd));
    pos = dataEnd;
  }
  if (tracks.length === 0) throw midiError('midiParseFailed');
  return { ticksPerQuarter: header.ticksPerQuarter, smpte: header.smpte, tracks };
}

function mapMidiNoteToSkyIndex(midiNote) { return midiToSkyIndex(midiNote); }

// 区間の長さ（tick）で重み付けした平均テンポ（マイクロ秒/4分音符）を求める。
function averageMidiTempo(tempoEvents, endTick) {
  if (tempoEvents.length === 0) return 500000; // デフォルト 120BPM
  const points = [];
  tempoEvents.forEach(te => {
    if (points.length && points[points.length - 1].tick === te.tick) points[points.length - 1].usPerQuarter = te.usPerQuarter;
    else points.push({ tick: te.tick, usPerQuarter: te.usPerQuarter });
  });
  if (points[0].tick > 0) points.unshift({ tick: 0, usPerQuarter: points[0].usPerQuarter });
  let total = 0, weighted = 0;
  for (let i = 0; i < points.length; i++) {
    const segStart = points[i].tick;
    const segEnd = i + 1 < points.length ? points[i + 1].tick : Math.max(endTick, segStart);
    const segLen = Math.max(0, segEnd - segStart);
    total += segLen;
    weighted += segLen * points[i].usPerQuarter;
  }
  return total > 0 ? weighted / total : points[0].usPerQuarter;
}

function midiToSong(midi, fileName, t) {
  let ticksPerQuarter = midi.ticksPerQuarter;
  if (!ticksPerQuarter) {
    const ticksPerSecond = midi.smpte.framesPerSecond * midi.smpte.ticksPerFrame;
    ticksPerQuarter = Math.max(1, Math.round(ticksPerSecond * 0.5));
  }

  let trackName = '';
  const tempoEvents = [];
  const noteOnEvents = [];
  midi.tracks.forEach(events => {
    events.forEach(ev => {
      if (ev.type === 'tempo') {
        tempoEvents.push({ tick: ev.tick, usPerQuarter: ev.usPerQuarter });
      } else if (ev.type === 'trackName') {
        if (!trackName && ev.text) trackName = ev.text;
      } else if (ev.type === 'noteOn' && ev.channel !== 9 && ev.note >= 0 && ev.note <= 127) {
        // channel 9（表記上のMIDIチャンネル10）はGM規格上のドラム専用チャンネルのため対象外
        noteOnEvents.push({ tick: ev.tick, note: ev.note });
      }
    });
  });
  if (noteOnEvents.length === 0) throw midiError('midiNoNotesFound');

  tempoEvents.sort((a, b) => a.tick - b.tick);
  const maxTick = noteOnEvents.reduce((m, ev) => Math.max(m, ev.tick), 0);
  const usPerQuarter = averageMidiTempo(tempoEvents, maxTick);

  // 16分音符ぶんのグリッドへスナップ。曲が長い／密な場合やテンポが安全範囲
  // （40〜999 BPM）を超える場合は8分音符→4分音符→2分音符の順に粗くする。
  const FRAME_CAP = 3000;
  const BPM_MIN = 40, BPM_MAX = 999;
  const gridCandidates = [ticksPerQuarter / 4, ticksPerQuarter / 2, ticksPerQuarter, ticksPerQuarter * 2];
  const rawBpmForGrid = (ticks) => {
    const ms = (usPerQuarter / 1000) * (ticks / ticksPerQuarter);
    return ms > 0 ? 60000 / ms : BPM_MAX;
  };
  let gridTicks = Math.max(1, Math.round(gridCandidates[0]));
  let maxFrameIndex = Math.round(maxTick / gridTicks);
  let rawBpm = rawBpmForGrid(gridTicks);
  for (let i = 1; i < gridCandidates.length && (maxFrameIndex > FRAME_CAP || rawBpm > BPM_MAX); i++) {
    gridTicks = Math.max(1, Math.round(gridCandidates[i]));
    maxFrameIndex = Math.round(maxTick / gridTicks);
    rawBpm = rawBpmForGrid(gridTicks);
  }

  const frameNotes = new Map();
  noteOnEvents.forEach(ev => {
    const skyIndex = mapMidiNoteToSkyIndex(ev.note);
    const frameIndex = Math.round(ev.tick / gridTicks);
    if (!frameNotes.has(frameIndex)) frameNotes.set(frameIndex, new Set());
    frameNotes.get(frameIndex).add(skyIndex);
  });
  if (frameNotes.size === 0) throw midiError('midiNoNotesFound');

  const totalFrames = Math.max(1, maxFrameIndex + 1);
  const frames = [];
  for (let i = 0; i < totalFrames; i++) {
    frames.push(frameNotes.has(i) ? [...frameNotes.get(i)].sort((a, b) => a - b) : []);
  }

  const tempoAdjusted = rawBpm > BPM_MAX || rawBpm < BPM_MIN;
  const bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(rawBpm)));
  const name = (trackName && trackName.trim())
    || (fileName ? fileName.replace(/\.[^.]+$/, '').trim() : '')
    || t('midiDefaultSongName');

  return {
    song: { id: genId(), name: name || t('midiDefaultSongName'), bpm, pitch: 'C', instrument: 'Harp', frames, updatedAt: Date.now() },
    tempoAdjusted,
  };
}

// t: i18n-score.jsのt(key,vars)（曲名デフォルト値の生成に使う）。
// 戻り値: { song, tempoAdjusted } / 失敗時は err.midiUserMessage を持つErrorをthrowする
export async function convertMidiFile(arrayBuffer, fileName, t) {
  const midi = parseMidiFile(arrayBuffer);
  return midiToSong(midi, fileName, t);
}
