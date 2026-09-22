/* ================================================================
   favorites-share.js — ⭐ お気に入りをシェア

   item/index.html の「お気に入りをシェア」ブロック（1100〜1106行目の
   ボタン、openFavShare〜shareFavOnTwitter、4402〜4626行目付近）を
   tai-hub へ移植したもの。全カテゴリ横断でお気に入り登録済みアイテムを
   集め、共有対象・表示スタイル・背景・コメントを選んでから画像として
   保存/共有する。data/共有ロジックはshare-data.jsに委譲している。

   ── エクスポート契約 ──────────────────────────────────────────
     export async function open()  … モーダルを開く（openFavShare相当。
                                      初回のみ全カテゴリのアイテムデータを
                                      読み込み、お気に入り登録済みのものを
                                      集める）
     export function close()       … モーダルを閉じる
   ダッシュボードの「お気に入りをシェア」セクションから
   `import * as favoritesShare from './share/favorites-share.js';
    favoritesShare.open();`
   のように呼び出す想定（achievement-share.js/random-coord.js等と同じ
   import-as-namespace の作法。dashboard-view.js自体は一切editしていない）。

   ── データ互換性 ──────────────────────────────────────────────
   表示スタイル・背景テーマの保存キー favShareStyle_v1・favShareTheme_v1
   （nsKey経由）は item/index.html と完全同一（値の形状もそのまま文字列
   'detail'|'icon' およびSHARE_THEMESのキー名）。お気に入りフラグ自体は
   各カテゴリの gameItems_<catKey>.itemFav（state.jsのgetCategoryState）
   を横断参照するだけで、このファイル独自のキーは持たない。背景画像・
   選択アイテム・コメントは元実装と同じく保存しない（毎回モーダルを
   開き直すたびにリセットされる一時状態）。

   ── 元実装からの意図的な簡略化 ────────────────────────────────
   1. カテゴリ・季節/イベントの絞り込みセレクト（#favCatFilter/
      #favEventFilter）は実装しているが、季節/日々をoptgroupで分けた
      季節順ソート（item/index.htmlのEVENT_ORDER・isSeasonLikeEvent/
      isDayLikeEvent）までは移植せず、現在の言語でのローカライズ済み
      名称のアルファベット順（フラットなリスト）にしている。お気に入り
      一覧はユーザー自身が事前に選んだ少数のアイテムに限られるため、
      横断検索ほど厳密な季節順が無くても実用上の支障は小さいと判断した
      （EVENT_ORDERの重複複製[40件弱の定数]を避けるための簡略化）。
   2. 背景画像はitem/index.htmlと同じくFileReaderで読み込んだ生の
      dataURLをそのまま使う（リサイズ・クロップ処理は元実装にも無い）。
   上記以外（表示スタイル[詳細/アイコンのみ]切替、背景テーマ、共有対象の
   個別選択・すべて選択/解除、コメント、Xでの画像共有）は元実装のロジック・
   文言をそのまま移植している。
   ================================================================ */

import { CURRENT_LANG, trCat, trEvent, trItem, escapeHtml } from '../../../js/i18n.js';
import { nsKey } from '../../../js/state.js';
import {
  GRID_CATEGORIES, SHARE_THEMES, SITE_URL, FAV_SHARE_HASHTAG,
  getFavoriteShareItems, itemIconHtml,
  exportShareImage, showShareToast, injectShareSharedStyles,
} from './share-data.js';

const OVERLAY_ID = 'favoritesShareModalOverlay';
const FAV_SHARE_STYLE_KEY = 'favShareStyle_v1';
const FAV_SHARE_THEME_KEY = 'favShareTheme_v1';

let overlayEl = null;
let openToken = 0; // 読み込み中に再open/closeされた場合、古い結果の描画を捨てるためのトークン

// モーダルを開いている間だけ保持する状態（表示スタイル・背景テーマのみ次回に持ち越す）
let favShareStyle = 'detail';
let favShareTheme = 'orange';
let favShareItems = [];
let favShareSelectedIds = new Set();
let favShareBgImageDataUrl = null; // 背景画像は都度選び直す想定のため保存しない

function favItemKey(item) { return `${item.catKey}_${item.id}`; }

function loadPersistedPrefs() {
  favShareStyle = localStorage.getItem(nsKey(FAV_SHARE_STYLE_KEY)) === 'icon' ? 'icon' : 'detail';
  const savedTheme = localStorage.getItem(nsKey(FAV_SHARE_THEME_KEY));
  favShareTheme = SHARE_THEMES[savedTheme] ? savedTheme : 'orange';
}

/* ================================================================
   カード（DOM）の組み立て（item/index.htmlのbuildFavExportCardElを移植）
   ================================================================ */
function buildFavExportCardEl(items, comment, style, theme, bgImageDataUrl) {
  const en = CURRENT_LANG === 'en';
  let bodyHtml;
  if (style === 'icon') {
    const cells = items.map(item => {
      const cat = GRID_CATEGORIES.find(c => c.key === item.catKey);
      if (!cat) return '';
      return `<div class="ish-exp-fav-icon-cell">${itemIconHtml(cat, item)}</div>`;
    }).join('');
    bodyHtml = `<div class="ish-exp-fav-icon-grid">${cells}</div>`;
  } else {
    const rows = items.map(item => {
      const cat = GRID_CATEGORIES.find(c => c.key === item.catKey);
      if (!cat) return '';
      return `
        <div class="ish-exp-row">
          <div class="ish-exp-icon">${itemIconHtml(cat, item)}</div>
          <div class="ish-exp-info">
            <div class="ish-exp-cat">${escapeHtml(trCat(cat.name))} ・ ${escapeHtml(trEvent(item.event))}</div>
            <div class="ish-exp-name">${escapeHtml(trItem(item))}</div>
          </div>
        </div>`;
    }).join('');
    bodyHtml = `<div class="ish-exp-body">${rows}</div>`;
  }

  const card = document.createElement('div');
  card.className = 'ish-export-card';
  if (bgImageDataUrl) {
    // 背景画像を使う場合は、どんな写真でも文字が読めるよう暗めのオーバーレイを重ねる
    card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url("${bgImageDataUrl}")`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
  } else {
    card.style.background = SHARE_THEMES[theme] ? SHARE_THEMES[theme].grad : SHARE_THEMES.orange.grad;
  }
  card.innerHTML = `
    <div class="ish-exp-brand"><svg width="13" height="13" viewBox="0 0 24 24" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px;margin-right:3px"><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l1.6 2H18.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/></svg>${en ? 'Item Collection Tracker' : 'アイテム所持率管理'}</div>
    <div class="ish-exp-title">${en ? 'Favorite Items' : 'お気に入りアイテム'}</div>
    ${comment ? `<div class="ish-exp-comment">${escapeHtml(comment)}</div>` : ''}
    ${bodyHtml}
  `;
  document.body.appendChild(card);
  return card;
}

/* お気に入り共有時のコメント文（item/index.htmlのbuildFavShareTextを移植） */
function buildFavShareText(comment) {
  const en = CURRENT_LANG === 'en';
  if (comment) return `${comment}\n\n${SITE_URL}\n${FAV_SHARE_HASHTAG}`;
  return en
    ? `My favorite items\n\n${SITE_URL}\n${FAV_SHARE_HASHTAG}`
    : `お気に入りアイテムまとめ\n\n${SITE_URL}\n${FAV_SHARE_HASHTAG}`;
}

/* ================================================================
   選択リスト（カテゴリ・季節/イベント絞り込み）
   ================================================================ */
function getFilteredFavShareItems() {
  const fCat = overlayEl.querySelector('#fsCatFilter')?.value || 'all';
  const fEvent = overlayEl.querySelector('#fsEventFilter')?.value || 'all';
  return favShareItems.filter(item =>
    (fCat === 'all' || item.catKey === fCat) &&
    (fEvent === 'all' || item.event === fEvent));
}

function buildCatFilterOptions() {
  const en = CURRENT_LANG === 'en';
  const presentCats = new Set(favShareItems.map(i => i.catKey));
  const cats = GRID_CATEGORIES.filter(c => presentCats.has(c.key));
  const select = overlayEl.querySelector('#fsCatFilter');
  select.innerHTML = `<option value="all">${en ? 'All Categories' : 'すべてのカテゴリ'}</option>` +
    cats.map(c => `<option value="${c.key}">${escapeHtml(trCat(c.name))}</option>`).join('');
}

function buildEventFilterOptions() {
  const en = CURRENT_LANG === 'en';
  const events = [...new Set(favShareItems.map(i => i.event))]
    .sort((a, b) => trEvent(a).localeCompare(trEvent(b), en ? 'en' : 'ja'));
  const select = overlayEl.querySelector('#fsEventFilter');
  select.innerHTML = `<option value="all">${en ? 'All Seasons/Events' : 'すべての季節・イベント'}</option>` +
    events.map(ev => `<option value="${escapeHtml(ev)}">${escapeHtml(trEvent(ev))}</option>`).join('');
}

function renderFavItemSelectList() {
  const en = CURRENT_LANG === 'en';
  const listEl = overlayEl.querySelector('#fsItemSelectList');
  if (favShareItems.length === 0) { listEl.innerHTML = ''; return; }
  const visible = getFilteredFavShareItems();
  if (visible.length === 0) {
    listEl.innerHTML = `<div class="ish-empty-msg" style="padding:14px 0;">${en ? 'No favorite items match this filter' : '絞り込み条件に一致するお気に入りアイテムがありません'}</div>`;
    return;
  }
  listEl.innerHTML = visible.map(item => {
    const cat = GRID_CATEGORIES.find(c => c.key === item.catKey);
    if (!cat) return '';
    const key = favItemKey(item);
    const checked = favShareSelectedIds.has(key);
    return `
      <label class="ish-cat-opt" style="justify-content:flex-start;">
        <input type="checkbox" data-fav-key="${escapeHtml(key)}" ${checked ? 'checked' : ''}>
        <span class="ish-cat-icon">${itemIconHtml(cat, item)}</span>
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(trItem(item))}</span>
      </label>`;
  }).join('');
}

function setAllFavSelection(checked) {
  getFilteredFavShareItems().forEach(item => {
    const key = favItemKey(item);
    if (checked) favShareSelectedIds.add(key); else favShareSelectedIds.delete(key);
  });
  renderFavItemSelectList();
}

function getSelectedFavItems() {
  return favShareItems.filter(item => favShareSelectedIds.has(favItemKey(item)));
}

/* ================================================================
   表示スタイル／背景テーマ／背景画像のUI同期
   ================================================================ */
function updateStyleButtons() {
  overlayEl.querySelector('#fsStyleDetailBtn').classList.toggle('is-active', favShareStyle === 'detail');
  overlayEl.querySelector('#fsStyleIconBtn').classList.toggle('is-active', favShareStyle === 'icon');
}
function setDisplayStyle(style) {
  favShareStyle = style;
  localStorage.setItem(nsKey(FAV_SHARE_STYLE_KEY), style);
  updateStyleButtons();
}

function renderThemeSwatches() {
  const row = overlayEl.querySelector('#fsThemeRow');
  row.innerHTML = Object.keys(SHARE_THEMES).map(key => `
    <div class="ish-theme-swatch ${key === favShareTheme ? 'selected' : ''}" data-theme="${key}"
      style="background:${SHARE_THEMES[key].grad};" title="${escapeHtml(SHARE_THEMES[key].label)}"></div>`).join('');
}
function selectTheme(key) {
  favShareTheme = key;
  localStorage.setItem(nsKey(FAV_SHARE_THEME_KEY), key);
  overlayEl.querySelectorAll('#fsThemeRow .ish-theme-swatch').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === key);
  });
}

function updateBgStatusUI() {
  const en = CURRENT_LANG === 'en';
  const status = overlayEl.querySelector('#fsBgStatus');
  const clearBtn = overlayEl.querySelector('#fsBgClearBtn');
  if (favShareBgImageDataUrl) {
    status.textContent = en ? 'Image selected' : '画像を選択中';
    clearBtn.style.display = '';
  } else {
    status.textContent = en ? 'Not selected (using theme color)' : '未選択（テーマの色を使用）';
    clearBtn.style.display = 'none';
  }
}
function onBgImageSelected(e) {
  const en = CURRENT_LANG === 'en';
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showShareToast(en ? 'Please select an image file' : '画像ファイルを選択してください');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    favShareBgImageDataUrl = reader.result;
    updateBgStatusUI();
  };
  reader.readAsDataURL(file);
}
function clearBgImage() {
  favShareBgImageDataUrl = null;
  const input = overlayEl.querySelector('#fsBgInput');
  if (input) input.value = '';
  updateBgStatusUI();
}

/* ================================================================
   共有
   ================================================================ */
async function handleShareClick() {
  const en = CURRENT_LANG === 'en';
  const selected = getSelectedFavItems();
  if (selected.length === 0) {
    showShareToast(en ? 'Please select at least one item to share' : '共有するアイテムを1つ以上選択してください');
    return;
  }
  const comment = overlayEl.querySelector('#fsComment').value.trim();
  const style = favShareStyle;
  const theme = favShareTheme;
  const bgImageDataUrl = favShareBgImageDataUrl;
  close();
  await exportShareImage(() => buildFavExportCardEl(selected, comment, style, theme, bgImageDataUrl), en ? 'Favorite Items' : 'お気に入りアイテム', {
    shareText: buildFavShareText(comment),
    successToast: en ? 'Shared!' : '共有しました！',
  });
}

/* ================================================================
   モーダルの開閉
   ================================================================ */
function renderModalHtml() {
  const en = CURRENT_LANG === 'en';
  return `
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="fsCloseX" aria-label="${en ? 'Close' : '閉じる'}">
        <svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg>
      </button>
      <div class="modal-title">${en ? 'Share Favorites' : 'お気に入りを共有'}</div>

      <div class="ish-hint" id="fsCountText">${en ? 'Loading…' : '読み込み中…'}</div>

      <div class="ish-section-label">${en ? 'Display Style' : '表示スタイル'}</div>
      <div class="ish-action-row" style="margin-top:0;">
        <button type="button" class="ish-action-btn secondary" id="fsStyleDetailBtn">${en ? 'Detailed View' : '詳細表示'}</button>
        <button type="button" class="ish-action-btn secondary" id="fsStyleIconBtn">${en ? 'Icons Only' : 'アイコンのみ'}</button>
      </div>

      <div class="ish-section-label">${en ? 'Background Theme' : '背景テーマ'}</div>
      <div class="ish-theme-row" id="fsThemeRow"></div>

      <div class="ish-section-label">${en ? 'Background Image (optional)' : '背景画像（任意）'}</div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <label class="ish-action-btn secondary" style="flex:0 0 auto; padding:8px 14px; font-size:12.5px;">
          <span>${en ? 'Choose Image' : '画像を選ぶ'}</span>
          <input type="file" accept="image/*" id="fsBgInput" style="display:none;">
        </label>
        <span id="fsBgStatus" style="font-size:12px; color:var(--hub-text-2);">${en ? 'Not selected (using theme color)' : '未選択（テーマの色を使用）'}</span>
        <span id="fsBgClearBtn" style="display:none; color:var(--hub-accent); font-weight:600; font-size:12px; cursor:pointer;">${en ? 'Remove' : '削除'}</span>
      </div>

      <div class="ish-section-label" style="display:flex; align-items:center; justify-content:space-between;">
        <span>${en ? 'Select Items to Share' : '共有するアイテムを選択'}</span>
        <span style="display:flex; gap:10px; text-transform:none; letter-spacing:normal;">
          <span id="fsSelectAll" style="color:var(--hub-accent); font-weight:600; cursor:pointer;">${en ? 'Select All' : 'すべて選択'}</span>
          <span id="fsDeselectAll" style="color:var(--hub-accent); font-weight:600; cursor:pointer;">${en ? 'Deselect All' : 'すべて解除'}</span>
        </span>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:8px;">
        <select class="ish-select" id="fsCatFilter"></select>
        <select class="ish-select" id="fsEventFilter"></select>
      </div>
      <div id="fsItemSelectList" class="ish-cat-grid" style="max-height:240px; overflow-y:auto; padding-right:2px;"></div>

      <div class="ish-section-label">${en ? 'Comment (optional)' : 'コメント（任意）'}</div>
      <textarea id="fsComment" class="ish-textarea" maxlength="120" placeholder="${en ? 'e.g. Things I want, items I often use for XX style, etc.' : '例）今欲しいもの、〇〇系でよく使うアイテムなど'}"></textarea>

      <div class="ish-action-row" style="margin-top:16px;">
        <button type="button" class="ish-action-btn twitter full" id="fsShareBtn">${en ? 'Share Image on X' : 'Xで画像を共有'}</button>
      </div>
    </div>`;
}

function wireControls() {
  const q = sel => overlayEl.querySelector(sel);
  q('#fsCloseX').addEventListener('click', close);
  q('#fsShareBtn').addEventListener('click', handleShareClick);
  q('#fsStyleDetailBtn').addEventListener('click', () => setDisplayStyle('detail'));
  q('#fsStyleIconBtn').addEventListener('click', () => setDisplayStyle('icon'));
  q('#fsThemeRow').addEventListener('click', e => {
    const sw = e.target.closest('.ish-theme-swatch');
    if (sw) selectTheme(sw.dataset.theme);
  });
  q('#fsBgInput').addEventListener('change', onBgImageSelected);
  q('#fsBgClearBtn').addEventListener('click', clearBgImage);
  q('#fsSelectAll').addEventListener('click', () => setAllFavSelection(true));
  q('#fsDeselectAll').addEventListener('click', () => setAllFavSelection(false));
  q('#fsCatFilter').addEventListener('change', renderFavItemSelectList);
  q('#fsEventFilter').addEventListener('change', renderFavItemSelectList);
  q('#fsItemSelectList').addEventListener('change', e => {
    const input = e.target.closest('input[data-fav-key]');
    if (!input) return;
    if (input.checked) favShareSelectedIds.add(input.dataset.favKey);
    else favShareSelectedIds.delete(input.dataset.favKey);
  });
}

export async function open() {
  const en = CURRENT_LANG === 'en';
  const myToken = ++openToken;

  injectShareSharedStyles();
  document.getElementById(OVERLAY_ID)?.remove();

  loadPersistedPrefs();
  favShareItems = [];
  favShareSelectedIds = new Set();
  favShareBgImageDataUrl = null;

  overlayEl = document.createElement('div');
  overlayEl.className = 'modal-overlay';
  overlayEl.id = OVERLAY_ID;
  overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
  overlayEl.innerHTML = renderModalHtml();
  document.body.appendChild(overlayEl);

  wireControls();
  updateStyleButtons();
  renderThemeSwatches();
  updateBgStatusUI();
  requestAnimationFrame(() => overlayEl.classList.add('open'));

  try {
    favShareItems = await getFavoriteShareItems();
  } catch (e) {
    console.error('[favorites-share] failed to load favorite items', e);
    if (myToken !== openToken || !overlayEl) return;
    overlayEl.querySelector('#fsCountText').textContent = en
      ? 'Failed to load. Please try again.'
      : '読み込みに失敗しました。もう一度お試しください。';
    return;
  }
  if (myToken !== openToken || !overlayEl) return; // 読込待ち中に閉じ/再オープンされた

  favShareSelectedIds = new Set(favShareItems.map(favItemKey));
  buildCatFilterOptions();
  buildEventFilterOptions();
  renderFavItemSelectList();
  overlayEl.querySelector('#fsCountText').textContent = favShareItems.length > 0
    ? (en ? `You currently have ${favShareItems.length} favorite item(s)` : `現在 ${favShareItems.length}件のお気に入りアイテムがあります`)
    : (en ? "You haven't favorited any items yet (use the favorite button on a category page to add some)" : 'お気に入り登録したアイテムがまだありません（各カテゴリページのお気に入りボタンで登録できます）');
}

export function close() {
  openToken++; // 読み込み待ち中のopen()を無効化
  document.getElementById(OVERLAY_ID)?.classList.remove('open');
}
