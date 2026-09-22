/* ================================================================
   item（アイテム所持管理）ダッシュボード（ホーム画面）。
   item/index.html のうち、カテゴリグリッド・楽譜/コスト管理への導線・
   横断アイテム検索・全体達成率＋称号パネル・ウィッシュリスト/獲得ログ・
   コーデ機能・シェア機能を移植したもの。各サブ機能自体の実装は
   features/item/配下の専用ファイルに分かれており、このファイルは
   それらをダッシュボードへ配線する役割。

   元実装はカテゴリ横断検索のために各カテゴリページ本体をfetchして
   HTMLから正規表現でITEMS_DATAを抜き出していたが（item/index.htmlの
   loadAllItemsOnce）、SPA化に伴いこの自己fetch+スクレイプは廃止し、
   各カテゴリの data/items/<catKey>.js を直接dynamic importする方式に
   置き換えている（元のCLAUDE.md方針とは無関係の、tai-hub移植時の
   意図的なアーキテクチャ改善）。横断検索自体は search-modal.js に
   分離済みのため、このファイル自身の検索インデックス構築ロジックは
   カテゴリグリッドの所持数集計にのみ使う。
   ================================================================ */
import { CURRENT_LANG, trEvent, trCat, escapeHtml } from '../../js/i18n.js';
import { getCategoryState } from '../../js/state.js';
import { CATEGORY_REGISTRY } from './data/categories.js';
import { CURRENT_SEASON, getCurrentEventNames, isRevisitSpiritCurrentlyActive } from './data/season-data.js';
import * as titlesPanel from './titles-panel.js';
import * as searchModal from './search-modal.js';
import * as wishlistCostModal from './wishlist-cost-modal.js';
import * as acquireLogModal from './acquire-log-modal.js';
import * as randomCoord from './coord/random-coord.js';
import * as myCoord from './coord/my-coord.js';
import * as closetCollage from './coord/closet-collage.js';
import * as achievementShare from './share/achievement-share.js';
import * as favoritesShare from './share/favorites-share.js';

const STYLE_ID = 'item-dashboard-view-styles';

// 12種のウェアラブルカテゴリのみ（section:'special' の music_sheet は今回のダッシュボード
// 移植スコープ外——別枠の単独リンクとしてのみ扱う。categories.js からの動的取得のため、
// カテゴリが増減してもこのファイルを直接編集する必要はない）
const GRID_CATEGORIES = CATEGORY_REGISTRY.filter(c => c.section === 'grid');
const MUSIC_SHEET_CAT = CATEGORY_REGISTRY.find(c => c.key === 'music_sheet');

let hostEl = null;
let mountToken = 0; // 再マウント/アンマウント後に古い非同期処理の描画を捨てるためのトークン

// 各カテゴリの data/items/<catKey>.js は静的アイテム配列なので、一度読み込んだ
// Promiseをキャッシュして再利用する（タブを行き来するたびに読み直さない）
const itemModuleCache = new Map(); // catKey -> Promise<{ ITEMS }>
function loadCategoryItems(catKey) {
  if (!itemModuleCache.has(catKey)) {
    itemModuleCache.set(catKey, import(`./data/items/${catKey}.js`));
  }
  return itemModuleCache.get(catKey);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .item-view .dash-wrap { max-width: 720px; margin: 0 auto; }
    @media (min-width: 850px) { .item-view .dash-wrap { max-width: 960px; } }

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

    .item-view .dash-feature-row { display: flex; flex-direction: column; gap: 10px; }
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
        <span class="icon-chip season-banner-icon" style="width:34px; height:34px;"><svg class="inline-icon" width="22" height="22"><use href="#i-sparkle"/></svg></span>
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

function featureBtnHtml({ id, href, icon, label, desc }) {
  const tag = href ? 'a' : 'button';
  const attrs = href ? `href="${href}"` : `type="button" id="${id}"`;
  return `
    <${tag} class="feature-btn" ${attrs}>
      <span class="feature-icon icon-chip" style="width:32px; height:32px;"><svg class="inline-icon" width="25" height="25"><use href="#${icon}"/></svg></span>
      <span>
        <span class="feature-label">${label}</span>
        <span class="feature-desc">${desc}</span>
      </span>
    </${tag}>`;
}

function renderShell() {
  const en = CURRENT_LANG === 'en';
  return `
    <div class="item-view">
    <div class="dash-wrap">
      <p class="sec-label">${en ? 'Season &amp; Events' : '季節・イベント'}</p>
      ${renderSeasonBanner()}

      <div id="dashTitlesPanel"></div>

      <p class="sec-label" id="dashCatLabel">${en ? 'Categories' : 'カテゴリ一覧'}</p>
      <div class="cat-grid" id="dashCatGrid">
        ${GRID_CATEGORIES.map(cat => catTileHtml(cat, null, null)).join('')}
      </div>

      <p class="sec-label">${en ? 'Music Sheet Completion' : '楽譜コンプリート管理'}</p>
      ${featureBtnHtml({
        href: `#/item/${MUSIC_SHEET_CAT ? MUSIC_SHEET_CAT.key : 'music_sheet'}`, icon: 'i-sheet-music',
        label: en ? 'Music Sheet Completion Tracker' : '楽譜コンプリート率',
        desc: en ? "Track which of the in-game Music Sheets you've collected, by acquisition method and candle cost"
                 : 'ゲーム内の楽譜の入手状況とコンプリート率を管理できます',
      })}

      <p class="sec-label">${en ? 'Item Search' : 'アイテム検索'}</p>
      ${featureBtnHtml({
        id: 'dashOpenSearchBtn', icon: 'i-search',
        label: en ? 'Search Items by Season / Event' : '季節・イベントでアイテムを検索',
        desc: en ? 'Search items across all categories by season, day event, category, favorite, and ownership status'
                 : '全カテゴリのアイテムを季節・日々・カテゴリ・お気に入り・所持状況で横断検索できます',
      })}

      <p class="sec-label">${en ? 'Cost Management' : 'コスト管理'}</p>
      <div class="dash-feature-row">
        ${featureBtnHtml({
          href: '#/item/cost', icon: 'i-candle',
          label: en ? 'Item Cost Breakdown' : 'アイテム別コスト',
          desc: en ? 'Check the actual acquisition cost of owned items (Candles, Wax, Hearts, real currency)'
                   : '所持アイテムの実際の入手コスト（キャンドル・星のキャンドル・ハート・実額）を確認できます',
        })}
        ${featureBtnHtml({
          id: 'dashOpenWishlistBtn', icon: 'i-cart',
          label: en ? 'Wishlist & Unlock Calculator' : 'ウィッシュリスト・必要コスト計算',
          desc: en ? 'Register items you want, and it automatically totals the candles/hearts/money needed and the shortfall'
                   : '欲しいアイテムを登録すると、必要なキャンドル・ハート・課金額の合計と不足数を自動計算します',
        })}
        ${featureBtnHtml({
          id: 'dashOpenAcquireLogBtn', icon: 'i-calendar',
          label: en ? 'Acquisition Log' : 'アイテム獲得ログ',
          desc: en ? 'View a chronological list of when you marked each item as owned' : '所持チェックを入れた日時の一覧を確認できます',
        })}
      </div>

      <p class="sec-label">${en ? 'Coord Features' : 'コーデ機能'}</p>
      <div class="dash-feature-row">
        ${featureBtnHtml({
          id: 'dashOpenRandomCoordBtn', icon: 'i-dice',
          label: en ? 'Random Coord' : 'ランダムコーデ',
          desc: en ? 'Suggest a random outfit combination from your owned items' : '所持アイテムからランダムにコーデを提案',
        })}
        ${featureBtnHtml({
          id: 'dashOpenMyCoordBtn', icon: 'i-hanger',
          label: en ? 'My Coord' : 'マイコーデ',
          desc: en ? 'Save and manage your favorite outfit sets' : 'お気に入りのコーデセットを保存・管理',
        })}
        ${featureBtnHtml({
          id: 'dashOpenClosetCollageBtn', icon: 'i-image',
          label: en ? 'Closet Collage' : 'クローゼットコラージュ',
          desc: en ? 'Arrange owned items and your own photos into a grid to create and share a cute collage image'
                   : '所持アイテムや自分の写真をマス目に並べて、かわいいコラージュ画像を作成・共有できます',
        })}
      </div>

      <p class="sec-label">${en ? 'Share Achievement Rate' : '達成率をシェア'}</p>
      <div class="dash-feature-row">
        ${featureBtnHtml({
          id: 'dashShareOnXBtn', icon: 'i-upload',
          label: en ? 'Share Image to X' : 'Xで画像を共有',
          desc: en ? 'Turn your achievement rate into an image and post it to X (also saves the image)'
                   : '達成率を画像にしてXへ投稿できます（画像の保存も同時にできます）',
        })}
        ${featureBtnHtml({
          id: 'dashCustomizeShareBtn', icon: 'i-palette',
          label: en ? 'Customize & Share' : 'カスタマイズして共有',
          desc: en ? 'Choose which categories to show, a background theme, and a comment before saving/sharing'
                   : '表示するカテゴリ・背景テーマ・コメントを自分好みに設定してから保存/共有できます',
        })}
      </div>

      <p class="sec-label">${en ? 'Share Your Favorites' : 'お気に入りをシェア'}</p>
      ${featureBtnHtml({
        id: 'dashFavShareBtn', icon: 'i-heart',
        label: en ? 'Share Favorite Items' : 'お気に入りアイテムを共有',
        desc: en ? 'Save and share your favorited items as an image with a comment' : 'お気に入り登録したアイテムをコメント付きの画像で保存・共有できます',
      })}
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

// ダッシュボード上の各「開く」ボタンとサブ機能モジュールの対応表。
// mount()でこの表を元にリスナーを配線し、unmount()で同じ表を使って
// 開きっぱなしのモーダルを閉じる（ルート離脱時に後片付けする）。
const FEATURE_TRIGGERS = [
  { btnId: 'dashOpenSearchBtn', mod: searchModal, action: 'open' },
  { btnId: 'dashOpenWishlistBtn', mod: wishlistCostModal, action: 'open' },
  { btnId: 'dashOpenAcquireLogBtn', mod: acquireLogModal, action: 'open' },
  { btnId: 'dashOpenRandomCoordBtn', mod: randomCoord, action: 'open' },
  { btnId: 'dashOpenMyCoordBtn', mod: myCoord, action: 'open' },
  { btnId: 'dashOpenClosetCollageBtn', mod: closetCollage, action: 'open' },
  { btnId: 'dashShareOnXBtn', mod: achievementShare, action: 'shareOnX' },
  { btnId: 'dashCustomizeShareBtn', mod: achievementShare, action: 'open' },
  { btnId: 'dashFavShareBtn', mod: favoritesShare, action: 'open' },
];

let triggerListeners = []; // [{el, handler}] unmount時にremoveEventListenerするため保持

function setupFeatureTriggers() {
  triggerListeners = FEATURE_TRIGGERS.map(({ btnId, mod, action }) => {
    const el = hostEl.querySelector(`#${btnId}`);
    if (!el) return null;
    const handler = () => { mod[action](); };
    el.addEventListener('click', handler);
    return { el, handler };
  }).filter(Boolean);
}

function teardownFeatureTriggers() {
  triggerListeners.forEach(({ el, handler }) => el.removeEventListener('click', handler));
  triggerListeners = [];
  // 離脱時、開きっぱなしのモーダルがあれば閉じる（close()はどのモーダルも
  // 「開いていなければ何もしない」実装のため、常時呼んでも安全）
  [searchModal, wishlistCostModal, acquireLogModal, randomCoord, myCoord, closetCollage, achievementShare, favoritesShare]
    .forEach(mod => { try { mod.close(); } catch (e) { /* no-op */ } });
}

export function mount(container) {
  hostEl = container;
  injectStyles();
  const token = ++mountToken;

  hostEl.innerHTML = renderShell();
  renderCategoryGrid(token);
  setupFeatureTriggers();
  titlesPanel.mount(hostEl.querySelector('#dashTitlesPanel'));
}

export function unmount() {
  mountToken++; // 進行中の非同期描画（カテゴリ件数取得）を無効化する
  teardownFeatureTriggers();
  hostEl = null;
}
