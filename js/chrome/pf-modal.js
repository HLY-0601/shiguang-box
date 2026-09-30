/* ================================================================
   プロフィール切替モーダル（CRUD）。item/profiles.js の
   pfOpenModal/pfRenderModal系を移植したもの。称号の展開表示・
   アカウントカラー・所持通貨のクイック±ボタンもitem/companion/wings
   実装を移植し、フル機能で揃えてある。
   ================================================================ */
import { CURRENT_LANG } from '../i18n.js';
import {
  ensureProfilesInit, getActiveProfileId, pfDisplayName, nsKeyFor,
  createProfile, renameProfile, deleteProfile, switchProfile, duplicateProfile,
  getShowTitlesEnabled,
  loadOwnedCurrency, saveOwnedCurrencyField,
  pfIsSafeColor, setProfileColor, clearProfileColor,
} from '../state.js';
import { refreshProfileLabel } from './site-dock.js';
// 🏆 他ツール横断の称号カタログ（アイコン・名前・説明・出典ツール名）は、
// tai-card機能が既に持っている定義（他ツールの称号定義の読み取り専用ミラー。
// item自身の分も'item'キーとして同梱済み）をそのまま再利用する。ここで
// 重複定義を増やさない（features/tai-card/data/title-catalog.js参照）。
import { TITLE_CATALOG } from '../../features/tai-card/data/title-catalog.js';

// 🎨 プロフィールにアカウントカラーが未設定の間、カラーピッカーに
// 表示しておく初期値（tai-hubのアクセントカラーに合わせる）。
const DEFAULT_SWATCH_COLOR = '#6C63D8';

// 🏆 展開表示中のプロフィールID集合（モーダルを開くたびにリセットする）。
let expandedTitleIds = new Set();

// 💰 所持通貨欄で扱うフィールド定義（アイコンはjs/icon-sprite.jsの既存
// シンボルを流用。i-walletはtai-hub共有スプライトに無いため、通貨の
// アイコンとして意味が通るi-gemをセクション見出しに使う）。
const CURRENCY_FIELDS = [
  { key: 'candle', icon: 'i-candle', ja: 'キャンドル', en: 'Candles' },
  { key: 'heart', icon: 'i-heart', ja: 'ハート', en: 'Hearts' },
  { key: 'starCandle', icon: 'i-star-candle', ja: '星のキャンドル', en: 'Star Candles' },
  { key: 'seasonCandle', icon: 'i-candle', ja: 'シーズンキャンドル', en: 'Season Candles' },
];

let editingId = null;

function t(ja, en) { return CURRENT_LANG === 'en' ? en : ja; }

// 🏆 指定プロフィールの解除済み称号一覧（アイコン・名前・説明・出典ツール名）を、
// TITLE_CATALOG（'item'自身＋姉妹サイト群）を横断して合算して返す。
// tai-card機能のtai-card-state.js#syncEarnedTitlesと同じ読み方（破損データ・
// カタログ未収録のidは静かにスキップし、モーダル全体を巻き込まない）。
function getEarnedTitlesForProfile(profileId) {
  const out = [];
  Object.keys(TITLE_CATALOG).forEach(toolKey => {
    const tool = TITLE_CATALOG[toolKey];
    const key = tool.namespaced ? nsKeyFor(tool.storageKey, profileId) : tool.storageKey;
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(key)); } catch (e) { /* 破損データはスキップ */ }
    let ids = [];
    try { ids = tool.extract(raw) || []; } catch (e) { /* extract失敗時もスキップ */ }
    ids.forEach(id => {
      const def = tool.titles[id];
      if (!def) return; // カタログに無いidは無視
      out.push({ icon: def.icon, name: def.name, nameEn: def.nameEn, desc: def.desc, descEn: def.descEn, source: tool.source, sourceEn: tool.sourceEn });
    });
  });
  return out;
}

export function open() {
  document.getElementById('pfModalOverlay')?.remove();
  editingId = null;
  expandedTitleIds.clear();
  const overlay = document.createElement('div');
  overlay.className = 'pf-modal-overlay';
  overlay.id = 'pfModalOverlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.innerHTML = `
    <div class="pf-modal-card">
      <button type="button" class="modal-close-btn" id="pfModalCloseBtn"><svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg></button>
      <div class="modal-title">${t('プロフィール切替', 'Switch Profile')}</div>
      <div id="pfModalList"></div>
      <div class="pf-add-row">
        <input type="text" id="pfNewNameInput" maxlength="30" placeholder="${t('新しいプロフィール名', 'New profile name')}">
        <button type="button" class="pf-icon-btn pf-row-btn-ok" id="pfAddBtn">${t('追加', 'Add')}</button>
      </div>
      <div class="pf-currency-section">
        <div class="pf-currency-header">
          <span class="pf-currency-title"><svg class="inline-icon" width="14" height="14"><use href="#i-gem"/></svg>${t('所持通貨', 'Owned Currency')}</span>
          <span class="pf-currency-sub" id="pfCurrencyActiveName"></span>
        </div>
        <div class="pf-currency-grid" id="pfCurrencyGrid"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('pfModalCloseBtn').addEventListener('click', close);
  document.getElementById('pfAddBtn').addEventListener('click', () => {
    const input = document.getElementById('pfNewNameInput');
    if (input.value.trim()) createProfile(input.value);
  });
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    renderList();
    renderCurrency();
  });
}

export function close() {
  document.getElementById('pfModalOverlay')?.classList.remove('open');
}

function renderList() {
  const area = document.getElementById('pfModalList');
  if (!area) return;
  const list = ensureProfilesInit();
  const activeId = getActiveProfileId();
  area.innerHTML = list.map(p => {
    const isActive = p.id === activeId;
    if (editingId === p.id) {
      return `
        <div class="pf-row">
          <input type="text" class="pf-row-input" id="pfEditInput" value="${escapeAttr(pfDisplayName(p))}" maxlength="30">
          <button type="button" class="pf-icon-btn pf-row-btn-ok" data-act="save-rename" data-id="${p.id}">${t('保存', 'Save')}</button>
          <button type="button" class="pf-icon-btn" data-act="cancel">${t('取消', 'Cancel')}</button>
        </div>`;
    }
    // 🎨 アカウントカラー（任意）。未設定時はDEFAULT_SWATCH_COLORをピッカーの初期値として見せる
    // だけで、実際には保存しない（pfIsSafeColorで不正値を弾く——localStorage改ざん対策）。
    const colorVal = pfIsSafeColor(p.color) ? p.color : DEFAULT_SWATCH_COLOR;

    // 🏆 このプロフィールで獲得済みの称号（獲得条件つき、アイコン・出典ツール名・名前・
    // 説明を表示する開閉リスト）。表示設定で「称号を表示する」がオフの場合は集計自体を行わない。
    const titlesVisible = getShowTitlesEnabled();
    const earnedTitles = titlesVisible ? getEarnedTitlesForProfile(p.id) : [];
    const titlesExpanded = expandedTitleIds.has(p.id);
    const titlesBlock = earnedTitles.length === 0
      ? `<p class="pf-row-titles-empty">${t('まだ称号を獲得していません', 'No titles earned yet')}</p>`
      : `
        <button type="button" class="pf-row-titles-toggle" aria-expanded="${titlesExpanded}" data-act="toggle-titles" data-id="${p.id}">
          <svg class="pf-row-titles-caret inline-icon" width="13" height="13"><use href="#i-chevron-down"/></svg><svg class="inline-icon" width="13" height="13"><use href="#i-trophy"/></svg> ${t(`${earnedTitles.length}個の称号`, `${earnedTitles.length} title${earnedTitles.length === 1 ? '' : 's'}`)}
        </button>
        ${titlesExpanded ? `<div class="pf-row-titles-list">${earnedTitles.map(et => `
          <div class="pf-row-title-item">
            <span class="pf-row-title-icon">${et.icon}</span>
            <span class="pf-row-title-text">
              <span class="pf-row-title-source">${escapeAttr(t(et.source, et.sourceEn))}</span>
              <b>${escapeAttr(t(et.name, et.nameEn))}</b> — ${escapeAttr(t(et.desc, et.descEn))}
            </span>
          </div>`).join('')}</div>` : ''}`;

    return `
      <div class="pf-row">
        <input type="color" class="pf-color-input" data-id="${p.id}" value="${colorVal}" title="${t('アカウントカラー', 'Account color')}">
        <span class="pf-row-name${isActive ? ' is-active' : ''}" data-act="switch" data-id="${p.id}">
          ${isActive ? '<svg class="inline-icon" width="13" height="13"><use href="#i-check"/></svg> ' : ''}${escapeAttr(pfDisplayName(p))}
        </span>
        ${p.color ? `<button type="button" class="pf-icon-btn pf-color-clear-btn" data-act="clear-color" data-id="${p.id}" title="${t('カラーを初期値に戻す', 'Reset color to default')}"><svg class="inline-icon" width="14" height="14"><use href="#i-sync"/></svg></button>` : ''}
        <button type="button" class="pf-icon-btn" data-act="rename" data-id="${p.id}" title="${t('名前変更', 'Rename')}"><svg class="inline-icon" width="14" height="14"><use href="#i-edit"/></svg></button>
        <button type="button" class="pf-icon-btn" data-act="duplicate" data-id="${p.id}" title="${t('複製', 'Duplicate')}"><svg class="inline-icon" width="14" height="14"><use href="#i-copy"/></svg></button>
        ${list.length > 1 ? `<button type="button" class="pf-icon-btn pf-row-btn-danger" data-act="delete" data-id="${p.id}" title="${t('削除', 'Delete')}"><svg class="inline-icon" width="14" height="14"><use href="#i-trash"/></svg></button>` : ''}
        ${titlesVisible ? `<div class="pf-row-titles">${titlesBlock}</div>` : ''}
      </div>`;
  }).join('');

  area.querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const act = el.dataset.act;
      if (act === 'switch') { switchProfile(id); }
      else if (act === 'rename') { editingId = id; renderList(); }
      else if (act === 'cancel') { editingId = null; renderList(); }
      else if (act === 'duplicate') {
        duplicateProfile(id);
        renderList();
        refreshProfileLabel(pfDisplayName(ensureProfilesInit().find(p => p.id === getActiveProfileId())));
      }
      else if (act === 'save-rename') {
        const val = document.getElementById('pfEditInput').value;
        renameProfile(id, val);
        editingId = null;
        renderList();
        refreshProfileLabel(pfDisplayName(ensureProfilesInit().find(p => p.id === getActiveProfileId())));
      } else if (act === 'delete') {
        if (confirm(t('このプロフィールを削除しますか？', 'Delete this profile?'))) { deleteProfile(id); renderList(); }
      } else if (act === 'clear-color') {
        clearProfileColor(id);
        renderList();
      } else if (act === 'toggle-titles') {
        if (expandedTitleIds.has(id)) expandedTitleIds.delete(id); else expandedTitleIds.add(id);
        renderList();
      }
    });
  });

  area.querySelectorAll('.pf-color-input').forEach(input => {
    input.addEventListener('change', () => {
      setProfileColor(input.dataset.id, input.value);
      renderList();
    });
  });
}

// 💰 所持通貨欄（現在アクティブなプロフィールの分のみを表示・編集する。
// 一覧に並ぶ他プロフィールの通貨をここから直接編集することはできない——
// 編集したい場合はまずそのプロフィールへ切り替えてから、という導線
// （切替自体がlocation.reload()を伴うため、切替前提でないと値の対応が
// 分かりにくくなるための意図的な制約）。
function renderCurrency() {
  const grid = document.getElementById('pfCurrencyGrid');
  if (!grid) return;
  const activeId = getActiveProfileId();
  const activeProfile = ensureProfilesInit().find(p => p.id === activeId);
  const nameEl = document.getElementById('pfCurrencyActiveName');
  if (nameEl && activeProfile) {
    nameEl.textContent = t(`「${pfDisplayName(activeProfile)}」の分`, `for "${pfDisplayName(activeProfile)}"`);
  }
  const values = loadOwnedCurrency(activeId);
  grid.innerHTML = CURRENCY_FIELDS.map(f => {
    const label = t(f.ja, f.en);
    return `
    <div class="pf-currency-card">
      <span class="pf-currency-card-label"><svg class="inline-icon" width="13" height="13"><use href="#${f.icon}"/></svg>${label}</span>
      <div class="pf-currency-input-group">
        <button type="button" class="pf-currency-step-btn" data-act="dec" data-field="${f.key}" aria-label="${escapeAttr(t(`${label}を1減らす`, `Decrease ${label} by 1`))}">−</button>
        <input type="text" inputmode="numeric" autocomplete="off" class="pf-currency-input" data-field="${f.key}" aria-label="${escapeAttr(label)}" value="${formatCurrencyNum(values[f.key])}">
        <button type="button" class="pf-currency-step-btn" data-act="inc" data-field="${f.key}" aria-label="${escapeAttr(t(`${label}を1増やす`, `Increase ${label} by 1`))}">+</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.pf-currency-input').forEach(input => {
    input.addEventListener('focus', () => input.select());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    input.addEventListener('change', () => {
      const saved = saveOwnedCurrencyField(input.dataset.field, input.value, activeId);
      input.value = formatCurrencyNum(saved);
    });
  });

  // ➕➖ クイック±ボタン（companion/wingsの「+1本ずつ調整」と同じ考え方）。
  // 直接入力欄は毎回全部打ち直す必要があるため、イベント後などの1個単位の
  // 増減が多い操作をこちらで補助する（直接入力自体は残す）。
  grid.querySelectorAll('.pf-currency-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = btn.dataset.act === 'inc' ? 1 : -1;
      const cur = Number(loadOwnedCurrency(activeId)[btn.dataset.field]) || 0;
      saveOwnedCurrencyField(btn.dataset.field, cur + delta, activeId);
      renderCurrency();
    });
  });
}

// number inputだとブラウザが桁区切りカンマを受け付けないため、見やすさ
// 優先でtext+inputmode="numeric"にしている。入力値はsaveOwnedCurrencyField
// 側でカンマ等の非数字を除去してから解釈するので、カンマ付きのまま渡してよい。
function formatCurrencyNum(n) {
  return (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
