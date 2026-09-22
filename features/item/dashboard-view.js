/* ================================================================
   item（アイテム所持管理）ダッシュボード（ホーム画面）。
   item/index.html のうち、カテゴリグリッド・楽譜/コスト管理への導線・
   横断アイテム検索の3機能を移植したもの（全体達成率バナー・称号・
   コーデ機能・シェア機能・ウィッシュリスト等、他の大きな独立機能は
   このビューの移植スコープ外——tai-hubプランに従い今回は含めない）。

   元実装はカテゴリ横断検索のために各カテゴリページ本体をfetchして
   HTMLから正規表現でITEMS_DATAを抜き出していたが（item/index.htmlの
   loadAllItemsOnce）、SPA化に伴いこの自己fetch+スクレイプは廃止し、
   各カテゴリの data/items/<catKey>.js を直接dynamic importする方式に
   置き換えている（元のCLAUDE.md方針とは無関係の、tai-hub移植時の
   意図的なアーキテクチャ改善）。
   ================================================================ */
import { CURRENT_LANG, trEvent, trCat, trItem, escapeHtml } from '../../js/i18n.js';
import { getCategoryState } from '../../js/state.js';
import { CATEGORY_REGISTRY } from './data/categories.js';
import { CURRENT_SEASON, getCurrentEventNames, isRevisitSpiritCurrentlyActive } from './data/season-data.js';

const STYLE_ID = 'item-dashboard-view-styles';
const SEARCH_RESULT_LIMIT = 80;

// 12種のウェアラブルカテゴリのみ（section:'special' の music_sheet は今回のダッシュボード
// 移植スコープ外——別枠の単独リンクとしてのみ扱う。categories.js からの動的取得のため、
// カテゴリが増減してもこのファイルを直接編集する必要はない）
const GRID_CATEGORIES = CATEGORY_REGISTRY.filter(c => c.section === 'grid');
const MUSIC_SHEET_CAT = CATEGORY_REGISTRY.find(c => c.key === 'music_sheet');

let hostEl = null;
let mountToken = 0; // 再マウント/アンマウント後に古い非同期処理の描画を捨てるためのトークン
let searchInputEl = null;
let onSearchInput = null;

// 各カテゴリの data/items/<catKey>.js は静的アイテム配列なので、一度読み込んだ
// Promiseをキャッシュして再利用する（タブを行き来するたびに読み直さない）
const itemModuleCache = new Map(); // catKey -> Promise<{ ITEMS }>
function loadCategoryItems(catKey) {
  if (!itemModuleCache.has(catKey)) {
    itemModuleCache.set(catKey, import(`./data/items/${catKey}.js`));
  }
  return itemModuleCache.get(catKey);
}

let searchIndexPromise = null;
function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = Promise.all(GRID_CATEGORIES.map(async cat => {
      try {
        const mod = await loadCategoryItems(cat.key);
        const items = Array.isArray(mod.ITEMS) ? mod.ITEMS : [];
        return items.map(item => ({ ...item, catKey: cat.key }));
      } catch (e) {
        console.error(`[item dashboard] failed to load item data for search: ${cat.key}`, e);
        return [];
      }
    })).then(lists => lists.flat());
  }
  return searchIndexPromise;
}

// 検索用にひらがなをカタカナへ正規化する（item/index.htmlのnormalizeSearchTextを移植。
// ひらがな入力でもカタカナ表記のアイテム名にヒットさせるため）
function normalizeSearchText(str) {
  return String(str).toLowerCase().replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .item-view .season-banner {
      background: linear-gradient(135deg, var(--orange-d) 0%, var(--orange) 55%, #FFBB00 100%);
      border-radius: var(--r); padding: 16px 18px; color: #fff;
      box-shadow: 0 4px 14px rgba(255, 149, 0, 0.28);
    }
    .item-view .season-banner-head { display: flex; align-items: center; gap: 12px; }
    .item-view .season-banner-icon { background: rgba(255, 255, 255, 0.22); color: #fff; border-radius: 10px; flex-shrink: 0; }
    .item-view .season-banner-eyebrow { font-size: 11px; font-weight: 700; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.04em; }
    .item-view .season-banner-title { font-size: 16px; font-weight: 700; margin-top: 2px; }
    .item-view .season-banner-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .item-view .season-chip {
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
      background: rgba(255, 255, 255, 0.22); color: #fff;
    }
    .item-view .season-chip-revisit { background: rgba(255, 255, 255, 0.34); }

    .item-view .cat-tile img { border-radius: 6px; }

    .item-view .dash-search-card { margin-top: 4px; }
    .item-view .dash-search-box {
      display: flex; align-items: center; gap: 8px; background: var(--bg);
      border-radius: var(--r-sm); padding: 8px 12px;
    }
    .item-view .dash-search-icon { color: var(--text-2); flex-shrink: 0; }
    .item-view .dash-search-input {
      border: 0; background: none; outline: none; flex: 1 1 auto;
      font-size: 14px; color: var(--text); font-family: inherit;
    }
    .item-view .dash-search-input::placeholder { color: var(--text-3); }
    .item-view .dash-search-results { margin-top: 4px; }
    .item-view .dash-search-status,
    .item-view .dash-search-empty { font-size: 12.5px; color: var(--text-2); padding: 12px 2px; }
    .item-view .dash-search-count { font-size: 11.5px; color: var(--text-2); padding: 10px 2px 4px; }
    .item-view .dash-search-row {
      display: flex; align-items: center; gap: 10px; padding: 8px 2px;
      border-top: 0.5px solid var(--sep); text-decoration: none; color: var(--text);
    }
    .item-view .dash-search-row:first-of-type { border-top: 0; }
    .item-view .dash-search-icon-img {
      width: 34px; height: 34px; object-fit: contain; flex-shrink: 0;
      background: var(--bg); border-radius: 8px; padding: 4px; box-sizing: border-box;
    }
    .item-view .dash-search-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .item-view .dash-search-cat { font-size: 10.5px; color: var(--text-2); }
    .item-view .dash-search-name {
      font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
}

function catTileHtml(cat, owned, total) {
  const name = trCat(cat.name);
  const countText = (owned === null || total === null) ? '…' : `${owned} / ${total}`;
  return `
    <a class="cat-tile" href="#/item/${cat.key}">
      <img src="${cat.img}" alt="${escapeHtml(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">
      <span class="cat-tile-name">${escapeHtml(name)}</span>
      <span class="cat-tile-pct">${countText}</span>
    </a>`;
}

function renderSeasonBanner() {
  const en = CURRENT_LANG === 'en';
  const events = getCurrentEventNames();
  const hasRevisit = isRevisitSpiritCurrentlyActive();
  const seasonName = trEvent(CURRENT_SEASON.name);
  // getCurrentEventNames() の先頭はCURRENT_SEASON自身なので、チップ側では重複させない
  const otherEvents = events.filter(name => name !== CURRENT_SEASON.name);

  return `
    <div class="season-banner">
      <div class="season-banner-head">
        <span class="icon-chip season-banner-icon" style="width:34px; height:34px;"><svg width="22" height="22"><use href="#i-sparkle"/></svg></span>
        <div>
          <div class="season-banner-eyebrow">${en ? 'Current Season' : '開催中の季節'}</div>
          <div class="season-banner-title">${escapeHtml(seasonName)}</div>
        </div>
      </div>
      ${(otherEvents.length > 0 || hasRevisit) ? `
        <div class="season-banner-chips">
          ${otherEvents.map(name => `<span class="season-chip">${escapeHtml(trEvent(name))}</span>`).join('')}
          ${hasRevisit ? `<span class="season-chip season-chip-revisit">${en ? 'Spirit Visiting' : '旅の精霊が来訪中'}</span>` : ''}
        </div>` : ''}
    </div>`;
}

function renderShell() {
  const en = CURRENT_LANG === 'en';
  return `
    <div class="item-view">
      <p class="sec-label">${en ? 'Season &amp; Events' : '季節・イベント'}</p>
      ${renderSeasonBanner()}

      <p class="sec-label" id="dashCatLabel">${en ? 'Categories' : 'カテゴリ一覧'}</p>
      <div class="cat-grid" id="dashCatGrid">
        ${GRID_CATEGORIES.map(cat => catTileHtml(cat, null, null)).join('')}
      </div>

      <p class="sec-label">${en ? 'Music Sheet Completion' : '楽譜コンプリート管理'}</p>
      <a href="#/item/${MUSIC_SHEET_CAT ? MUSIC_SHEET_CAT.key : 'music_sheet'}" class="feature-btn">
        <span class="feature-icon icon-chip" style="width:32px; height:32px;"><svg width="25" height="25"><use href="#i-sheet-music"/></svg></span>
        <span>
          <span class="feature-label">${en ? 'Music Sheet Completion Tracker' : '楽譜コンプリート率'}</span>
          <span class="feature-desc">${en
            ? "Track which of the in-game Music Sheets you've collected, by acquisition method and candle cost"
            : 'ゲーム内の楽譜の入手状況とコンプリート率を管理できます'}</span>
        </span>
      </a>

      <p class="sec-label">${en ? 'Cost Management' : 'コスト管理'}</p>
      <a href="#/item/cost" class="feature-btn">
        <span class="feature-icon icon-chip" style="width:32px; height:32px;"><svg width="25" height="25"><use href="#i-candle"/></svg></span>
        <span>
          <span class="feature-label">${en ? 'Item Cost Breakdown' : 'アイテム別コスト'}</span>
          <span class="feature-desc">${en
            ? 'Check the actual acquisition cost of owned items (Candles, Wax, Hearts, real currency)'
            : '所持アイテムの実際の入手コスト（キャンドル・星のキャンドル・ハート・実額）を確認できます'}</span>
        </span>
      </a>

      <p class="sec-label">${en ? 'Item Search' : 'アイテム検索'}</p>
      <div class="card dash-search-card">
        <div class="dash-search-box">
          <span class="icon-chip dash-search-icon" style="width:18px; height:18px;"><svg width="15" height="15"><use href="#i-search"/></svg></span>
          <input type="text" id="dashItemSearchInput" class="dash-search-input"
                 placeholder="${en ? 'Search item name across all categories...' : '全カテゴリのアイテム名で検索...'}" autocomplete="off">
        </div>
        <div id="dashItemSearchResults" class="dash-search-results"></div>
      </div>
    </div>`;
}

async function renderCategoryGrid(token) {
  const results = await Promise.all(GRID_CATEGORIES.map(async cat => {
    let total = 0;
    try {
      const mod = await loadCategoryItems(cat.key);
      total = Array.isArray(mod.ITEMS) ? mod.ITEMS.length : 0;
    } catch (e) {
      console.error(`[item dashboard] failed to load item data: ${cat.key}`, e);
    }
    const { owned } = getCategoryState(cat.key);
    const ownedCount = Object.values(owned).filter(Boolean).length;
    return { cat, ownedCount, total };
  }));

  if (token !== mountToken || !hostEl) return; // 別ルートへ遷移済みなら描画しない
  const gridEl = hostEl.querySelector('#dashCatGrid');
  if (gridEl) gridEl.innerHTML = results.map(r => catTileHtml(r.cat, r.ownedCount, r.total)).join('');

  const labelEl = hostEl.querySelector('#dashCatLabel');
  if (labelEl) {
    const totalOwned = results.reduce((s, r) => s + r.ownedCount, 0);
    const totalAll = results.reduce((s, r) => s + r.total, 0);
    labelEl.textContent = CURRENT_LANG === 'en'
      ? `Categories (${totalOwned}/${totalAll} owned)`
      : `カテゴリ一覧（${totalOwned}/${totalAll} 所持）`;
  }
}

function searchResultRowHtml(item) {
  const cat = GRID_CATEGORIES.find(c => c.key === item.catKey);
  if (!cat) return '';
  return `
    <a class="dash-search-row" href="#/item/${cat.key}">
      <img class="dash-search-icon-img" src="${item.img || ''}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">
      <span class="dash-search-info">
        <span class="dash-search-cat">${escapeHtml(trCat(cat.name))}</span>
        <span class="dash-search-name">${escapeHtml(trItem(item))}</span>
      </span>
    </a>`;
}

function renderSearchResults(resultsEl, matches) {
  const en = CURRENT_LANG === 'en';
  if (matches.length === 0) {
    resultsEl.innerHTML = `<div class="dash-search-empty">${en ? 'No items match.' : '条件に一致するアイテムが見つかりません。'}</div>`;
    return;
  }
  const shown = matches.slice(0, SEARCH_RESULT_LIMIT);
  const countLabel = matches.length > shown.length
    ? (en ? `${matches.length} items (showing first ${shown.length})` : `${matches.length}件（先頭${shown.length}件を表示）`)
    : (en ? `${matches.length} item(s)` : `${matches.length}件`);
  resultsEl.innerHTML = `<div class="dash-search-count">${countLabel}</div>${shown.map(searchResultRowHtml).join('')}`;
}

function setupSearch(token) {
  searchInputEl = hostEl.querySelector('#dashItemSearchInput');
  const resultsEl = hostEl.querySelector('#dashItemSearchResults');
  if (!searchInputEl || !resultsEl) return;

  onSearchInput = () => {
    const q = normalizeSearchText(searchInputEl.value.trim());
    if (!q) { resultsEl.innerHTML = ''; return; }
    resultsEl.innerHTML = `<div class="dash-search-status">${CURRENT_LANG === 'en' ? 'Searching…' : '検索中…'}</div>`;
    loadSearchIndex().then(allItems => {
      if (token !== mountToken || !hostEl) return; // アンマウント/再マウント後の古い結果は破棄
      const currentQ = normalizeSearchText(searchInputEl.value.trim());
      if (!currentQ) { resultsEl.innerHTML = ''; return; }
      const matches = allItems.filter(item =>
        normalizeSearchText(item.name).includes(currentQ) ||
        (item.nameEn && normalizeSearchText(item.nameEn).includes(currentQ))
      );
      renderSearchResults(resultsEl, matches);
    });
  };
  searchInputEl.addEventListener('input', onSearchInput);
}

export function mount(container) {
  hostEl = container;
  injectStyles();
  const token = ++mountToken;

  hostEl.innerHTML = renderShell();
  renderCategoryGrid(token);
  setupSearch(token);
}

export function unmount() {
  mountToken++; // 進行中の非同期描画（カテゴリ件数取得・検索）を無効化する
  if (searchInputEl && onSearchInput) {
    searchInputEl.removeEventListener('input', onSearchInput);
  }
  searchInputEl = null;
  onSearchInput = null;
  hostEl = null;
}
