/* ================================================================
   season-calc-view.js — 季節先祖解鎖計算機（#/season-calc）

   移植元: GitHub VoidCipher3/test_trust（MIT，见 ./SOURCE.md / ./LICENSE）。
   档3 原生重构：iframe を排し、夜月の fun-view モジュールとして再実装。
   - データは静的 import（data/ 配下の JS モジュール）
   - 保存は state モジュール経由で夜月 nsKey 隔離
   - 文言は夜月 CURRENT_LANG に追従（独立した言語/テーマ切替は持たない）
   ================================================================ */
import { escapeHtml } from '../../js/i18n.js';
import { nsKey } from '../../js/state.js';
import { toast } from '../shared/share-image.js';
import { t, dataName } from './data/i18n-calc.js';
import { SPIRITS_DATA } from './data/spirits-data.js';
import { SPIRITS_I18N } from './data/spirits-i18n.js';
import { SPIRITS_IMAGES } from './data/spirits-images.js';
import * as S from './season-calc-state.js';

const STYLE_ID = 'season-calc-styles';
const EXP_PER_ITEM = 100;
const MAX_TIER = 6;
const PRIMARY_CURRENCY = 'season_candle';
const PASS_ECONOMY = { withPass: { daily: 6 }, noPass: { daily: 5 } };
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjxwYXRoIGQ9Ik0yNSAxNWwtMTAgMTBoMjB6IiBmaWxsPSIjOTk5Ii8+PC9zdmc+';

let containerEl = null;
let token = 0;

/* --- 工具内状態（mount 毎に初期化） --- */
let currentSeason = '';
let items = [];
let spiritProfiles = [];
let currentProfileId = '';
let spiritExpMap = {};
let hasPass = true;
let dailyGain = PASS_ECONOMY.withPass.daily;
let initialCandle = 30;
let hideReward = false;

/* 動画フレーム共有タイマ */
const animated = [];
let animTimer = null;
let animTick = 0;

/* ---------- 画像・幣別ユーティリティ ---------- */
function imageOf(key, kind) {
  if (key && SPIRITS_IMAGES[key]) return SPIRITS_IMAGES[key];
  if (kind && SPIRITS_IMAGES['item.' + kind]) return SPIRITS_IMAGES['item.' + kind];
  return '';
}
const firstFrame = v => Array.isArray(v) ? (v[0] || '') : (v || '');

function registerAnimation(img, frames) {
  frames.forEach(u => { const p = new Image(); p.src = u; });
  animated.push({ img, frames });
  if (!animTimer) {
    animTimer = setInterval(() => {
      animTick++;
      for (const a of animated) {
        if (!a.img.isConnected) continue;
        a.img.src = a.frames[animTick % a.frames.length];
      }
    }, 400);
  }
}

function curLabel(code) { return t('currency.' + code) || code; }
function currencyOf(item) { return item.ctyp || PRIMARY_CURRENCY; }
function addCost(vec, code, n) { if (n) vec[code] = (vec[code] || 0) + n; return vec; }
function isTimeless() { return currentSeason === 'elders' || currentSeason.startsWith('realm_'); }
function isObtainable(item) { return hasPass || !item.season; }
function isHidden(item) { return hideReward && item.ctyp === 'season_heart'; }

/* ---------- 経済設定の読み書き ---------- */
function loadEconomy() {
  const e = S.loadEconomy(currentProfileId);
  hasPass = e.hasPass !== false;
  dailyGain = Number.isFinite(e.dailyGain) ? e.dailyGain
    : (hasPass ? PASS_ECONOMY.withPass.daily : PASS_ECONOMY.noPass.daily);
  initialCandle = Number.isFinite(e.initialCandle) ? e.initialCandle : 30;
  hideReward = !!(e.hideReward && e.hideReward[currentSeason]);
  syncEconomyInputs();
}
function saveEconomy() {
  const e = S.loadEconomy(currentProfileId);
  S.saveEconomy(currentProfileId, { ...e, hasPass, dailyGain, initialCandle });
}
function syncEconomyInputs() {
  const $ = id => root() && root().querySelector(id);
  const p = $('#sc-pass'), d = $('#sc-daily'), i = $('#sc-initial'), h = $('#sc-hide-reward');
  if (p) p.checked = hasPass;
  if (d) d.value = dailyGain;
  if (i) i.value = initialCandle;
  if (h) h.checked = hideReward;
}

/* ---------- 方案（profile） ---------- */
function initProfiles() {
  const fb = [{ id: 'spirit_default', name: t('defaultProfile') }];
  spiritProfiles = S.loadProfiles(fb) || fb;
  currentProfileId = S.loadCurrentProfileId(spiritProfiles[0].id);
  if (!spiritProfiles.some(p => p.id === currentProfileId)) currentProfileId = spiritProfiles[0].id;
}
function persistProfiles() {
  S.saveProfiles(spiritProfiles);
  S.saveCurrentProfileId(currentProfileId);
}

function root() { return containerEl && containerEl.querySelector('.sc-view'); }

export function mount(container) {
  injectStylesheet();
  containerEl = container;
  const my = ++token;
  initProfiles();

  container.innerHTML = `
    <div class="sc-view fun-view">
      <div class="fun-wrap">
        <header class="fun-head">
          <h1 class="fun-h1"><svg class="inline-icon" width="22" height="22" aria-hidden="true"><use href="#i-candle"/></svg>${escapeHtml(t('title'))}</h1>
        </header>

        <section class="sc-panel">
          <div class="sc-profile-row">
            <select id="sc-profile" class="fun-input" aria-label="profile"></select>
            <button class="fun-btn small" id="sc-add-profile">${escapeHtml(t('addProf'))}</button>
            <button class="fun-btn small danger" id="sc-del-profile">${escapeHtml(t('delProf'))}</button>
          </div>

          <div class="sc-totals" id="sc-totals"></div>
          <div class="sc-progress"><div class="sc-progress-bar" id="sc-progress-bar"></div></div>

          <div class="sc-controls">
            <label class="sc-check"><input type="checkbox" id="sc-pass"><span>${escapeHtml(t('pass'))}</span></label>
            <label class="sc-check" id="sc-hide-wrap"><input type="checkbox" id="sc-hide-reward"><span>${escapeHtml(t('hideReward'))}</span></label>
            <label class="sc-field">${escapeHtml(t('daily'))}<input type="number" id="sc-daily" min="0" step="1"></label>
            <label class="sc-field">${escapeHtml(t('initial'))}<input type="number" id="sc-initial" min="0" step="1"></label>
            <select id="sc-season" class="fun-input" aria-label="season"></select>
            <button class="fun-btn small" id="sc-reset-season">${escapeHtml(t('resetSeason'))}</button>
            <button class="fun-btn small" id="sc-export">${escapeHtml(t('export'))}</button>
            <button class="fun-btn small" id="sc-import">${escapeHtml(t('import'))}</button>
            <input type="file" id="sc-import-file" accept=".json" hidden>
          </div>
        </section>

        <div class="sc-spirits" id="sc-spirits"></div>
      </div>
    </div>`;

  bindEvents();
  refreshProfileSelect();
  fillSeasonSelect();
  loadSeasonData();
}

export function unmount() {
  token++;
  if (animTimer) { clearInterval(animTimer); animTimer = null; }
  animated.length = 0;
  if (containerEl) containerEl.innerHTML = '';
  containerEl = null;
}

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = new URL('../../css/season-calc.css', import.meta.url).href;
  document.head.appendChild(link);
}

/* ---------- イベント委譲 ---------- */
function bindEvents() {
  const r = root();
  r.addEventListener('click', onClick);
  r.addEventListener('change', onChange);
  r.addEventListener('input', onInput);
}

function onClick(e) {
  const el = e.target.closest('[data-act], button, select, input');
  if (!el) return;
  const act = el.dataset.act;
  if (el.id === 'sc-add-profile') return addProfile();
  if (el.id === 'sc-del-profile') return deleteProfile();
  if (el.id === 'sc-reset-season') return resetSeason();
  if (el.id === 'sc-export') return exportData();
  if (el.id === 'sc-import') return root().querySelector('#sc-import-file').click();
  if (act === 'item') return toggleItem(el.dataset.key);
  if (act === 'add-exp') return addExp(el.dataset.spirit);
  if (act === 'reset-spirit') return resetSpirit(el.dataset.spirit);
}
function onChange(e) {
  const el = e.target;
  if (el.id === 'sc-profile') { currentProfileId = el.value; persistProfiles(); loadSeasonData(); }
  else if (el.id === 'sc-season') { currentSeason = el.value; saveSeason(); loadSeasonData(); }
  else if (el.id === 'sc-pass') { hasPass = el.checked; if (!hasPass) dailyGain = PASS_ECONOMY.noPass.daily; else dailyGain = PASS_ECONOMY.withPass.daily; saveEconomy(); loadSeasonData(); }
  else if (el.id === 'sc-hide-reward') { hideReward = el.checked; saveHideReward(); loadSeasonData(); }
  else if (el.id === 'sc-import-file') { importData(el.files && el.files[0]); el.value = ''; }
}
function onInput(e) {
  const el = e.target;
  if (el.id === 'sc-daily') { dailyGain = Math.max(0, parseInt(el.value, 10) || 0); saveEconomy(); updateUI(); }
  else if (el.id === 'sc-initial') { initialCandle = Math.max(0, parseInt(el.value, 10) || 0); saveEconomy(); updateUI(); }
}

/* ---------- 季節グループ ---------- */
function seasonGroups() {
  return Object.keys(SPIRITS_DATA).sort((a, b) => {
    const na = /^season_(\d+)$/.exec(a), nb = /^season_(\d+)$/.exec(b);
    if (na && nb) return +nb[1] - +na[1];
    return na ? -1 : nb ? 1 : a.localeCompare(b);
  });
}
function groupName(g) { return dataName(SPIRITS_I18N, 'group.' + g); }

function fillSeasonSelect() {
  const sel = root().querySelector('#sc-season');
  sel.textContent = '';
  const groups = seasonGroups();
  if (!groups.length) return;
  const saved = localStorage.getItem(nsKey('seasonCalc_currentSeason'));
  currentSeason = groups.includes(saved) ? saved : groups[0];
  groups.forEach(g => {
    const o = document.createElement('option');
    o.value = g; o.textContent = groupName(g);
    if (g === currentSeason) o.selected = true;
    sel.appendChild(o);
  });
}
function saveSeason() { localStorage.setItem(nsKey('seasonCalc_currentSeason'), currentSeason); }

/* ---------- データ装配 ---------- */
function loadSeasonData() {
  items = [];
  spiritExpMap = S.loadExpMap(currentProfileId);
  loadEconomy();
  const group = SPIRITS_DATA[currentSeason];
  if (!group) { updateUI(); return; }

  Object.keys(group.spirits).forEach(code => {
    const spirit = group.spirits[code];
    const sk = `season_data_${code}`;
    if (spiritExpMap[sk] === undefined) spiritExpMap[sk] = 0;

    spirit.items.forEach((item, idx) => {
      item.spiritKey = sk;
      item.spiritCode = code;
      item.spiritKind = spirit.kind;
      item.spiritName = spiritName(code);
      item.spiritImage = firstFrame(imageOf(`spirit.${code}`));
      item.nm = itemName(item.k);
      item.season = !!item.pass;
      item.image = imageOf(item.src, item.k);
      item.key = `${sk}_lv${item.level}_i${idx}`;
      if (isHidden(item)) { item.unlocked = false; return; }
      items.push(item);
    });
  });

  const wrap = root() && root().querySelector('#sc-hide-wrap');
  if (wrap) {
    const has = Object.values(group.spirits)
      .some(s => s.items.some(i => i.ctyp === 'season_heart'));
    wrap.style.display = has ? '' : 'none';
  }

  items.forEach(i => { i.unlocked = S.loadItemUnlocked(currentProfileId, i.key); });
  updateUI();
}

function spiritName(code) { return dataName(SPIRITS_I18N, `spirit.${code}`) || code; }
function itemName(k) { return dataName(SPIRITS_I18N, `item.${k}`) || k; }

function saveState() {
  items.forEach(i => S.saveItemUnlocked(currentProfileId, i.key, i.unlocked));
  S.saveExpMap(currentProfileId, spiritExpMap);
}

/* ---------- 経済設定の永続 ---------- */
function saveHideReward() {
  const e = S.loadEconomy(currentProfileId);
  S.saveEconomy(currentProfileId, { ...e, hideReward: { ...(e.hideReward || {}), [currentSeason]: hideReward } });
}

/* ---------- 方案操作 ---------- */
function addProfile() {
  const name = prompt(t('profPrompt'));
  if (name && name.trim() !== '') {
    const newId = 'spirit_profile_' + Date.now();
    spiritProfiles.push({ id: newId, name: name.trim() });
    currentProfileId = newId;
    persistProfiles();
    refreshProfileSelect();
    loadSeasonData();
    toast(t('addProfileOk'));
  }
}
function deleteProfile() {
  if (spiritProfiles.length <= 1) { toast(t('delLast')); return; }
  if (!confirm(t('delProfileConfirm'))) return;
  S.clearProfileData(currentProfileId);
  spiritProfiles = spiritProfiles.filter(p => p.id !== currentProfileId);
  currentProfileId = spiritProfiles[0].id;
  persistProfiles();
  refreshProfileSelect();
  loadSeasonData();
  toast(t('profileDeleted'));
}
function refreshProfileSelect() {
  const sel = root().querySelector('#sc-profile');
  sel.innerHTML = '';
  spiritProfiles.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.name;
    if (p.id === currentProfileId) o.selected = true;
    sel.appendChild(o);
  });
}

/* ---------- エクスポート / インポート ---------- */
function exportData() {
  const data = { version: 1, profiles: spiritProfiles, dataStore: {} };
  spiritProfiles.forEach(p => {
    const store = S.dumpProfileStore(p.id);
    Object.keys(store).forEach(k => { data.dataStore[k] = store[k]; });
  });
  const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sky_season_backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast(t('exportOk'));
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.profiles) || !data.dataStore || typeof data.dataStore !== 'object') throw new Error('bad');
      const profiles = data.profiles.filter(S.isValidProfile);
      if (!profiles.length) throw new Error('bad');
      const accepted = [];
      let skipped = data.profiles.length - profiles.length;
      for (const [key, value] of Object.entries(data.dataStore)) {
        const owner = profiles.find(p => key.includes(`seasonCalc_${p.id}_`));
        if (owner && typeof value === 'string' && value.length <= 20000) accepted.push([key, value]);
        else skipped++;
      }
      spiritProfiles = profiles;
      if (!spiritProfiles.some(p => p.id === currentProfileId)) currentProfileId = spiritProfiles[0].id;
      S.saveProfiles(spiritProfiles);
      S.saveCurrentProfileId(currentProfileId);
      accepted.forEach(([k, v]) => localStorage.setItem(k, v));
      if (skipped > 0) toast(t('importBad'));
      toast(t('importOk'));
      refreshProfileSelect();
      setTimeout(() => loadSeasonData(), 300);
    } catch (_) { toast(t('loadError')); }
  };
  reader.readAsText(file);
}

/* ---------- 集計・レベル・日数 ---------- */
function calcTotals() {
  let totalExp = 0;
  const spent = {}, required = {}, spiritTotals = {}, spiritRequired = {};
  items.forEach(i => {
    const c = parseFloat(i.cst) || 0;
    const cur = currencyOf(i);
    if (!spiritRequired[i.spiritKey]) spiritRequired[i.spiritKey] = {};
    if (!spiritTotals[i.spiritKey]) spiritTotals[i.spiritKey] = { exp: 0, cost: {} };
    if (isObtainable(i)) { addCost(required, cur, c); addCost(spiritRequired[i.spiritKey], cur, c); }
    if (i.unlocked && isObtainable(i)) {
      totalExp += parseFloat(i.exp) || 0;
      addCost(spent, cur, c);
      spiritTotals[i.spiritKey].exp += parseFloat(i.exp) || 0;
      addCost(spiritTotals[i.spiritKey].cost, cur, c);
    }
  });
  return { totalExp, spent, required, spiritTotals, spiritRequired };
}

function calcSpiritLevels(spiritItems) {
  const sp = spiritItems[0] && SPIRITS_DATA[currentSeason] &&
    SPIRITS_DATA[currentSeason].spirits[spiritItems[0].spiritCode];
  const out = {};
  if (sp && sp.tiers) {
    for (let lv = 2; lv <= MAX_TIER; lv++) if (sp.tiers[lv] !== undefined) out[lv] = sp.tiers[lv];
    if (Object.keys(out).length) return out;
  }
  for (let lv = 2; lv <= MAX_TIER; lv++) {
    out[lv] = spiritItems.filter(i => i.level < lv).reduce((s, i) => s + (parseFloat(i.exp) || 0), 0);
  }
  return out;
}
function calcSpiritCurrentExp(spiritKey, spiritItems) {
  const itemsExp = spiritItems.filter(i => i.unlocked).reduce((s, i) => s + (parseFloat(i.exp) || 0), 0);
  return itemsExp + (spiritExpMap[spiritKey] || 0);
}
function calcMaxLevel(spiritKey, spiritItems) {
  const levelsExp = calcSpiritLevels(spiritItems);
  const cur = calcSpiritCurrentExp(spiritKey, spiritItems);
  let maxLevel = 1;
  for (let lv = 2; lv <= MAX_TIER; lv++) {
    if (levelsExp[lv] === undefined) break;
    if (cur >= levelsExp[lv]) maxLevel = lv; else break;
  }
  return maxLevel;
}
function calcDaysRequired(spent, required) {
  const need = (required[PRIMARY_CURRENCY] || 0) - (spent[PRIMARY_CURRENCY] || 0);
  if (need <= 0) return 0;
  const afterStart = need - initialCandle;
  if (afterStart <= 0) return 0;
  return dailyGain > 0 ? Math.ceil(afterStart / dailyGain) : Infinity;
}

const CURRENCY_ORDER = ['season_candle', 'candles', 'heart', 'season_heart', 'prestige'];

function updateUI() {
  const box = root();
  if (!box) return;
  const container = box.querySelector('#sc-spirits');
  container.innerHTML = '';
  animated.length = 0;

  const totals = calcTotals();
  const days = calcDaysRequired(totals.spent, totals.required);

  /* --- 統計行 --- */
  const row = box.querySelector('#sc-totals');
  row.innerHTML = '';
  const tag = (label, value) => {
    const d = document.createElement('div');
    d.className = 'sc-total-tag';
    const l = document.createElement('span');
    l.className = 'sc-total-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.textContent = value;
    d.append(l, v);
    row.appendChild(d);
  };
  const codes = CURRENCY_ORDER.filter(c => (totals.required[c] || totals.spent[c]));
  codes.sort((a, b) => (b === PRIMARY_CURRENCY) - (a === PRIMARY_CURRENCY));
  codes.forEach(c => tag(`${curLabel(c)} ${t('spent')}/${t('totalReq')}`, `${totals.spent[c] || 0} / ${totals.required[c] || 0}`));
  tag(t('totalExp'), Math.round(totals.totalExp));
  if (!isTimeless()) tag(t('daysLeft'), Number.isFinite(days) ? String(days) : '∞');

  const mainCur = codes[0] || PRIMARY_CURRENCY;
  const reqP = totals.required[mainCur] || 0, spentP = totals.spent[mainCur] || 0;
  box.querySelector('#sc-progress-bar').style.width = `${reqP === 0 ? 0 : (spentP / reqP) * 100}%`;

  if (!hasPass && !isTimeless()) {
    const note = document.createElement('div');
    note.className = 'sc-note';
    note.textContent = t('noPassNote');
    row.appendChild(note);
  }
  const partial = (SPIRITS_DATA[currentSeason] || {}).partial;
  if (partial && partial.length) {
    const note = document.createElement('div');
    note.className = 'sc-note';
    note.textContent = t('partialNote', { n: partial.length });
    row.appendChild(note);
  }

  /* --- 先祖グループ化 --- */
  const grouped = {};
  items.forEach(i => { (grouped[i.spiritKey] ||= []).push(i); });

  const ITEMS_PER_ROW = 3;
  const maxRowsPerLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  Object.keys(grouped).forEach(sk => {
    const spiritItems = grouped[sk];
    if (spiritItems[0].spiritKind === 'guide') return;
    const lvGroups = {};
    for (let lv = 1; lv <= 6; lv++) lvGroups[lv] = spiritItems.filter(i => i.level === lv);
    for (let lv = 1; lv <= 6; lv++) {
      const levelItems = lvGroups[lv];
      if (!levelItems.length) continue;
      let rowCount = 0;
      const bySpirit = {};
      levelItems.forEach(item => { (bySpirit[item.spirit || 0] ||= []).push(item); });
      Object.keys(bySpirit).forEach(sID => {
        const list = bySpirit[sID];
        const ns = list.filter(i => !i.season).length;
        const ss = list.filter(i => i.season).length;
        const nonSeasonRows = ns > 0 ? Math.ceil(ns / ITEMS_PER_ROW) : 0;
        const seasonRows = ss > 0 ? (ns > 0 ? ss - 1 : ss) : 0;
        rowCount += nonSeasonRows + seasonRows;
      });
      if (rowCount > maxRowsPerLevel[lv]) maxRowsPerLevel[lv] = rowCount;
    }
  });

  Object.keys(grouped).forEach(sk => {
    const spiritItems = grouped[sk];
    renderSpiritCard(container, sk, spiritItems, totals, maxRowsPerLevel, ITEMS_PER_ROW);
  });
}

function renderSpiritCard(container, spiritKey, spiritItems, totals, maxRowsPerLevel, ITEMS_PER_ROW) {
  const spiritName = spiritItems[0].spiritName;
  const spiritImage = spiritItems[0].spiritImage;

  const anc = document.createElement('div');
  anc.className = 'sc-spirit';

  const img = document.createElement('img');
  img.src = spiritImage || PLACEHOLDER;
  img.className = 'sc-spirit-img';
  img.alt = spiritName;
  img.onerror = () => { img.src = PLACEHOLDER; };
  anc.appendChild(img);

  const header = document.createElement('div');
  header.className = 'sc-spirit-header';
  header.textContent = spiritName;
  if (spiritItems[0].spiritKind === 'guide') {
    const badge = document.createElement('span');
    badge.className = 'sc-guide-badge';
    badge.textContent = t('guide');
    header.appendChild(badge);
  }
  anc.appendChild(header);

  const controls = document.createElement('div');
  controls.className = 'sc-spirit-controls';

  const currentExp = spiritExpMap[spiritKey] || 0;
  const hasCompanion = spiritItems.some(i => i.k === 'companion');

  if (hasCompanion) {
    const expLine = document.createElement('div');
    expLine.className = 'sc-exp-line';
    expLine.textContent = `${t('compExp')}: ${Math.round(currentExp)} (${Math.round(currentExp / EXP_PER_ITEM * 10) / 10} ${t('day')})`;
    controls.appendChild(expLine);

    const actionRow = document.createElement('div');
    actionRow.className = 'sc-exp-row';
    const input = document.createElement('input');
    input.type = 'number'; input.min = '1'; input.step = '1'; input.value = '1';
    input.id = `sc-exp-${spiritKey}`;
    const btnAdd = document.createElement('button');
    btnAdd.className = 'fun-btn small';
    btnAdd.textContent = t('addExp');
    btnAdd.dataset.act = 'add-exp';
    btnAdd.dataset.spirit = spiritKey;
    actionRow.append(input, btnAdd);
    controls.appendChild(actionRow);
  }

  const btnReset = document.createElement('button');
  btnReset.className = 'fun-btn small danger';
  btnReset.textContent = t('resetSpirit');
  btnReset.dataset.act = 'reset-spirit';
  btnReset.dataset.spirit = spiritKey;
  controls.appendChild(btnReset);
  anc.appendChild(controls);

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'sc-items';

  /* 嚮導: row/col グリッド */
  if (spiritItems[0].spiritKind === 'guide' && spiritItems.some(i => i.row !== undefined)) {
    const RK = hideReward ? 'hrow' : 'row', CK = hideReward ? 'hcol' : 'col';
    const maxRow = Math.max(...spiritItems.map(i => i[RK] || 0));
    const maxCol = Math.max(...spiritItems.map(i => i[CK] || 0));
    const levelOfRow = r => { const it = spiritItems.find(i => i[RK] === r); return it ? it.level : null; };
    const buildLine = r => {
      const line = document.createElement('div');
      line.className = 'sc-items-row';
      for (let c = 0; c <= maxCol; c++) {
        const it = spiritItems.find(i => i[RK] === r && i[CK] === c);
        if (it) line.appendChild(createItemDiv(it, spiritItems, spiritKey));
        else {
          const gap = document.createElement('div');
          gap.className = 'sc-item sc-gap';
          line.appendChild(gap);
        }
      }
      return line;
    };
    let r = maxRow;
    while (r >= 0) {
      const lv = levelOfRow(r);
      let lo = r;
      while (lo - 1 >= 0 && levelOfRow(lo - 1) === lv) lo--;
      const wrapper = document.createElement('div');
      wrapper.className = 'sc-level-row';
      for (let rr = lo; rr <= r; rr++) wrapper.appendChild(buildLine(rr));
      const label = document.createElement('div');
      label.className = 'sc-level-label';
      label.textContent = 'Lv.' + lv;
      wrapper.appendChild(label);
      itemsContainer.appendChild(wrapper);
      r = lo - 1;
    }
    anc.appendChild(itemsContainer);
    renderFooter(anc, spiritKey, spiritItems, totals);
    container.appendChild(anc);
    return;
  }

  /* 普通先祖: Lv 分组（6→1） */
  const lvGroups = {};
  for (let lv = 1; lv <= 6; lv++) lvGroups[lv] = spiritItems.filter(i => i.level === lv);

  [6, 5, 4, 3, 2, 1].forEach(level => {
    if (maxRowsPerLevel[level] === 0) return;
    const levelItems = lvGroups[level] || [];
    const wrapper = document.createElement('div');
    wrapper.className = 'sc-level-row';
    const label = document.createElement('div');
    label.className = 'sc-level-label';
    label.textContent = 'Lv.' + level;
    wrapper.appendChild(label);

    let actualRows = 0;
    if (levelItems.length) {
      const bySpirit = {};
      levelItems.forEach(item => { (bySpirit[item.spirit || 0] ||= []).push(item); });
      Object.keys(bySpirit).sort((a, b) => a - b).forEach(sID => {
        const list = bySpirit[sID];
        const nonSeason = list.filter(i => !i.season);
        const season = list.filter(i => i.season);

        for (let i = Math.floor((nonSeason.length - 1) / ITEMS_PER_ROW) * ITEMS_PER_ROW; i >= 0; i -= ITEMS_PER_ROW) {
          const slice = nonSeason.slice(i, i + ITEMS_PER_ROW);
          const inner = document.createElement('div');
          inner.className = 'sc-items-row';
          inner.style.justifyContent = i === 0 ? 'flex-start' : 'flex-end';
          slice.forEach(item => inner.appendChild(createItemDiv(item, spiritItems, spiritKey)));
          wrapper.insertBefore(inner, wrapper.firstChild);
          actualRows++;
        }
        const lastRow = nonSeason.length > 0 ? wrapper.firstChild : null;
        if (lastRow) {
          if (season.length > 0) {
            const s0 = createItemDiv(season[0], spiritItems, spiritKey);
            s0.style.marginLeft = 'auto';
            lastRow.appendChild(s0);
          }
          for (let i = 1; i < season.length; i++) {
            const inner = document.createElement('div');
            inner.className = 'sc-items-row';
            inner.style.justifyContent = 'flex-end';
            inner.appendChild(createItemDiv(season[i], spiritItems, spiritKey));
            wrapper.insertBefore(inner, label);
            actualRows++;
          }
        } else {
          for (let i = 0; i < season.length; i++) {
            const inner = document.createElement('div');
            inner.className = 'sc-items-row';
            inner.style.justifyContent = 'flex-end';
            inner.appendChild(createItemDiv(season[i], spiritItems, spiritKey));
            wrapper.insertBefore(inner, label);
            actualRows++;
          }
        }
      });
    } else {
      label.style.visibility = 'hidden';
      wrapper.style.borderTopColor = 'transparent';
    }

    const paddingNeeded = maxRowsPerLevel[level] - actualRows;
    for (let r = 0; r < paddingNeeded; r++) {
      const empty = document.createElement('div');
      empty.className = 'sc-items-row sc-gap-row';
      empty.innerHTML = `<div class="sc-item sc-gap"><div>_</div><div>_</div><div>_</div></div>`;
      wrapper.insertBefore(empty, label);
    }
    itemsContainer.appendChild(wrapper);
  });

  anc.appendChild(itemsContainer);
  renderFooter(anc, spiritKey, spiritItems, totals);
  container.appendChild(anc);
}

/* カード底部の幣別小計と到達レベル */
function renderFooter(anc, spiritKey, spiritItems, totals) {
  const totalExp = calcSpiritCurrentExp(spiritKey, spiritItems);
  const spT = totals.spiritTotals[spiritKey] || { exp: 0, cost: {} };
  const spReq = totals.spiritRequired[spiritKey] || {};

  const footer = document.createElement('div');
  footer.className = 'sc-spirit-footer';
  CURRENCY_ORDER.filter(c => spReq[c] || spT.cost[c])
    .sort((a, b) => (b === PRIMARY_CURRENCY) - (a === PRIMARY_CURRENCY))
    .forEach(c => {
      const s = document.createElement('div');
      s.textContent = `${curLabel(c)} ${spT.cost[c] || 0} / ${spReq[c] || 0}`;
      footer.appendChild(s);
    });
  const expLine = document.createElement('div');
  expLine.textContent = `${t('totalExp')} ${Math.round(totalExp)}`;
  footer.appendChild(expLine);

  const sp = SPIRITS_DATA[currentSeason] && SPIRITS_DATA[currentSeason].spirits[spiritItems[0].spiritCode];
  if (sp && sp.tier) {
    const tierLine = document.createElement('div');
    tierLine.textContent = `${t('tierLbl')} ${calcMaxLevel(spiritKey, spiritItems)} / ${sp.tier}`;
    footer.appendChild(tierLine);
  }
  anc.appendChild(footer);
}

function createItemDiv(item, spiritItems, spiritKey) {
  const div = document.createElement('div');
  div.className = 'sc-item';
  if (item.unlocked) div.classList.add('unlocked');
  if (item.season) div.classList.add('season');
  const locked = !isObtainable(item);
  if (locked) div.classList.add('locked');

  const frames = Array.isArray(item.image) ? item.image : null;
  const img = document.createElement('img');
  img.className = 'sc-item-img';
  img.src = firstFrame(item.image) || PLACEHOLDER;
  img.onerror = () => { img.src = PLACEHOLDER; };
  div.appendChild(img);
  if (frames && frames.length > 1) registerAnimation(img, frames);

  const line = txt => { const d = document.createElement('div'); d.textContent = txt; div.appendChild(d); };
  line(item.nm);
  line(`${curLabel(currencyOf(item))}: ${item.cst}`);
  line(`${t('exp')}: ${item.exp}`);

  if (locked) { div.title = t('noPassNote'); return div; }

  div.dataset.act = 'item';
  div.dataset.key = item.key;
  div.dataset.spirit = spiritKey;
  return div;
}

/* ---------- 操作 ---------- */
function toggleItem(key) {
  const item = items.find(i => i.key === key);
  if (!item) return;
  const spiritItems = items.filter(i => i.spiritKey === item.spiritKey);
  const maxLevel = calcMaxLevel(item.spiritKey, spiritItems);
  if (item.level <= maxLevel || item.unlocked) {
    item.unlocked = !item.unlocked;
    saveState();
    updateUI();
  } else {
    toast(`${t('errReq')} ${item.spiritName} (Lv.${item.level})。${t('errReq2')} ${calcSpiritLevels(spiritItems)[item.level] || '??'}`);
  }
}

function addExp(spiritKey) {
  const input = root().querySelector(`#sc-exp-${CSS.escape(spiritKey)}`);
  const days = parseInt(input && input.value, 10);
  const amount = (Number.isFinite(days) ? days : 1) * EXP_PER_ITEM;
  if (amount > 0) {
    spiritExpMap[spiritKey] = (spiritExpMap[spiritKey] || 0) + amount;
    saveState();
    updateUI();
  }
}

function resetSpirit(spiritKey) {
  if (!confirm(t('resetSpiritConfirm'))) return;
  items.filter(i => i.spiritKey === spiritKey).forEach(i => { i.unlocked = false; });
  spiritExpMap[spiritKey] = 0;
  saveState();
  updateUI();
}

function resetSeason() {
  if (!confirm(t('resetSeasonConfirm'))) return;
  items.forEach(i => { i.unlocked = false; });
  Object.keys(spiritExpMap).forEach(k => { spiritExpMap[k] = 0; });
  saveState();
  updateUI();
  toast(t('seasonReset'));
}




