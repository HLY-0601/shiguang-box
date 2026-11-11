/* ================================================================
   season-calc の保存状態ローカルストレージ層。
   夜月の nsKey（存档プロフィール隔離）を通し、他ツールとキー衝突しない。
   工具内の複数方案（profile）はこのモジュール内で独立管理する。
   ================================================================ */
import { nsKey } from '../../../js/state.js';

const PREFIX = 'seasonCalc_';

const profilesKey = () => nsKey(PREFIX + 'profiles');
const currentKey  = () => nsKey(PREFIX + 'currentProfile');
const econKey     = (pid) => nsKey(`${PREFIX}${pid}_economy`);
const expKey      = (pid) => nsKey(`${PREFIX}${pid}_expMap`);
const itemKey     = (pid, item) => nsKey(`${PREFIX}${pid}_${item}`);

function readJson(key, fb) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fb : v;
  } catch (_) { return fb; }
}
function writeJson(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; }
  catch (_) { return false; }
}

/* --- 方案リスト --- */
export function loadProfiles(fallback) {
  const list = readJson(profilesKey(), null);
  return Array.isArray(list) && list.length ? list : fallback;
}
export function saveProfiles(list) { writeJson(profilesKey(), list); }

export function loadCurrentProfileId(fallbackId) {
  return localStorage.getItem(currentKey()) || fallbackId;
}
export function saveCurrentProfileId(id) { localStorage.setItem(currentKey(), id); }

/* --- 経済設定（季卡・日产・起始・隠し報酬） --- */
export function loadEconomy(pid) { return readJson(econKey(pid), {}); }
export function saveEconomy(pid, econ) { writeJson(econKey(pid), econ); }

/* --- 陪伴好感度マップ --- */
export function loadExpMap(pid) { return readJson(expKey(pid), {}); }
export function saveExpMap(pid, map) { writeJson(expKey(pid), map); }

/* --- 個別ノード解放状態 --- */
export function loadItemUnlocked(pid, item) {
  return localStorage.getItem(itemKey(pid, item)) === 'true';
}
export function saveItemUnlocked(pid, item, unlocked) {
  localStorage.setItem(itemKey(pid, item), unlocked);
}

/* --- 方案削除：その方案に紐づく全キーを掃除 --- */
export function clearProfileData(pid) {
  const needle = `${PREFIX}${pid}_`;
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes(needle)) doomed.push(k);
  }
  doomed.forEach(k => localStorage.removeItem(k));
}

/* --- エクスポート用：全方案の生キーを収集 --- */
export function dumpProfileStore(pid) {
  const out = {};
  const needle = `${PREFIX}${pid}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes(needle)) out[k] = localStorage.getItem(k);
  }
  return out;
}

/* インポート検証（元のフォーマット互換） */
export const PROFILE_ID_RE = /^spirit_(default|profile_\d{1,20})$/;
export function isValidProfile(p) {
  return p && typeof p === 'object'
    && typeof p.id === 'string' && PROFILE_ID_RE.test(p.id)
    && typeof p.name === 'string' && p.name.length > 0 && p.name.length <= 60;
}
