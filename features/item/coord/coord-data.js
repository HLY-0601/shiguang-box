/* ================================================================
   coord-data.js — コーデ機能（ランダムコーデ／マイコーデ／クローゼット
   コラージュ）共通のデータ・ストレージ層。

   item/index.html の「コーデ機能」ブロック（openRandomCoord()〜
   openCloset()一式、2870行目以降）のうち、3つのサブ機能すべてが
   共有しているロジック・localStorageキーをここに集約している：
     - allItemsCache（12カテゴリ分のアイテムを1つの配列にまとめたもの）の
       読み込み・キャッシュ（dashboard-view.js/search-modal.jsと同じ
       dynamic import方式。それらのファイルは「触ってはいけない」既存
       ファイル、またはこのモジュールから見て無関係のため、ここでも
       同じロジックを複製している——search-modal.js冒頭コメントと同じ方針）
     - getOwnedItemsForCat() / お気に入りの読み書き
       （category-view.jsのgetCategoryState/saveCategoryStateへ委譲。
       gameItems_<catKey>キー・{total,owned,itemOwned,itemFav,ownedItems}
       という形状は他機能と共有しているため、ここでも変更しない）
     - マイコーデ一覧（localStorage キー: myCoords、nsKey経由）
     - クローゼットコラージュ一覧（localStorage キー: closetCollages_v1、
       nsKey経由）とその背景プリセット定義
     - 3機能共通の見た目（モーダルカード内の行・ピッカー・トースト等）の
       スタイル注入、および写真ファイル→リサイズ済みdata URL変換ヘルパー

   ── データ互換性（最重要） ──────────────────────────────────────
   myCoords / closetCollages_v1 のキー名・JSON形状は item/index.html と
   完全に同一にしてある（nsKey()で名前空間化するのも同じ）。
     myCoords: Array<{ id:number, name:string, items:{[catKey]:Item},
                        createdAt:string, photoDataUrl?:string }>
       ※ id は Date.now() 由来の数値。items の各値は、そのカテゴリの
          ITEMS配列の要素そのもの（id/name/nameEn/img/event/cost/dye/
          noReprint/type）+ catKey を持つオブジェクト（allItemsCacheの
          要素と同一形状）。元実装も「保存時点のアイテム情報のスナップ
          ショット」をそのまま埋め込む方式で、一覧表示時に再度アイテム
          データと突き合わせ直すことはしていない（マイコーデ一覧の
          描画もこれと同じにしてある＝allItemsCache未読込でも一覧表示
          できる）。
     closetCollages_v1: Array<{ id:number, name:string, rows:number,
                        cols:number, cells:Array<null|
                        {type:'item',catKey,itemId}|{type:'photo',dataUrl}>,
                        bg:string, caption:string, createdAt:string }>
       ※ cellsの'item'セルはID参照のみを保持する元実装通りの形状
          （表示のたびにallItemsCacheと突き合わせて名前・画像を解決する
          必要があるため、コラージュ一覧・編集を開く前に必ず
          loadAllItemsOnce()を待つこと）。
   ================================================================ */

import { getCategoryState, saveCategoryState, nsKey } from '../../../js/state.js';
import { CATEGORY_REGISTRY } from '../data/categories.js';

export const GRID_CATEGORIES = CATEGORY_REGISTRY.filter(c => c.section === 'grid');

// 排他グループ: このうちどれか1つしか同時に「コーデ」に含められない
// （item/index.htmlのEXCLUSIVE_KEYSと同一）
export const EXCLUSIVE_KEYS = ['portable_item', 'small_placeable', 'large_placeable'];

/* ================================================================
   全カテゴリのアイテムデータ読み込み（dashboard-view.js/search-modal.jsの
   loadCategoryItems/loadAllItemsOnceと同じ方式をここでも複製）
   ================================================================ */
const itemModuleCache = new Map(); // catKey -> Promise<{ITEMS}>
const resolvedItemsByCat = new Map(); // catKey -> ITEMS[]（saveCategoryStateへ渡す同期アクセス用）

export function loadCategoryItems(catKey) {
  if (!itemModuleCache.has(catKey)) {
    const p = import(`../data/items/${catKey}.js`).then(mod => {
      resolvedItemsByCat.set(catKey, Array.isArray(mod.ITEMS) ? mod.ITEMS : []);
      return mod;
    });
    itemModuleCache.set(catKey, p);
  }
  return itemModuleCache.get(catKey);
}

let allItemsCache = null; // [{ ...item, catKey }, ...]
let allItemsPromise = null;

export function loadAllItemsOnce() {
  if (allItemsCache) return Promise.resolve(allItemsCache);
  if (allItemsPromise) return allItemsPromise;

  allItemsPromise = Promise.all(GRID_CATEGORIES.map(async cat => {
    try {
      const mod = await loadCategoryItems(cat.key);
      const items = Array.isArray(mod.ITEMS) ? mod.ITEMS : [];
      return items.map(item => ({ ...item, catKey: cat.key }));
    } catch (e) {
      console.error(`[item coord] failed to load item data: ${cat.key}`, e);
      return [];
    }
  })).then(lists => {
    allItemsCache = lists.flat();
    allItemsPromise = null;
    return allItemsCache;
  }).catch(e => {
    allItemsPromise = null;
    throw e;
  });

  return allItemsPromise;
}

// 同期アクセス用（loadAllItemsOnce()の完了後であれば呼び出し側は
// このキャッシュを直接参照してよい。未読込ならnull）
export function getAllItemsCache() {
  return allItemsCache;
}

export function getItemByCatId(catKey, itemId) {
  return allItemsCache ? allItemsCache.find(it => it.catKey === catKey && it.id === itemId) : null;
}

// 所持アイテム（そのカテゴリの全アイテムのうち所持済みのもの、フルデータ付き）
// item/index.htmlのgetOwnedItemsForCat()相当。元実装は「保存された{id,name,
// nameEn}のみのownedItemsを、allItemsCacheの最新データで補って返す」という
// 2段構えだったが、tai-hubでは総アイテム数・詳細データが常に静的import
// （data/items/<catKey>.js）から得られる（dashboard-view.js/cost-view.js/
// titles-panel.jsが既に採用している前提と同じ）ため、allItemsCacheをそのまま
// owned判定でフィルタするだけで同じ結果になる。loadAllItemsOnce()未実行時は
// 空配列を返す（呼び出し側は各open()で必ず先にawaitすること）。
export function getOwnedItemsForCat(catKey) {
  if (!allItemsCache) return [];
  const { owned } = getCategoryState(catKey);
  return allItemsCache.filter(it => it.catKey === catKey && owned[it.id]);
}

export function getFavIds(catKey) {
  const { fav } = getCategoryState(catKey);
  return Object.keys(fav).filter(id => fav[id]);
}
export function isFavItem(catKey, itemId) {
  return !!getCategoryState(catKey).fav[itemId];
}
// category-view.jsのhandleToggleFavと同じ往復（gameItems_<catKey>を
// 完全互換の形状で書き戻す）。お気に入りをこのコーデ機能側から切り替えても
// 各カテゴリページ側にそのまま反映される（同一のlocalStorageキーを見ている
// だけで、特別な同期処理は不要）。
export function toggleFavItem(catKey, itemId) {
  const items = resolvedItemsByCat.get(catKey) || [];
  const state = getCategoryState(catKey);
  state.fav[itemId] = !state.fav[itemId];
  saveCategoryState(catKey, state.owned, state.fav, items);
  return state.fav[itemId];
}

/* ================================================================
   アイコン描画ヘルパー（item/index.htmlのcatIconHtml/itemIconHtmlの
   簡略版。tai-hubの各カテゴリデータは全アイテムがWikia画像URLを
   持つため、元実装のimages/<catKey>/<id>.pngローカル画像フォールバックは
   不要——img欠落時は各カテゴリの見本画像 or 汎用アイコンに委ねる）
   ================================================================ */
export function catIconHtml(cat) {
  return cat.img
    ? `<img src="${cat.img}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : `<svg class="inline-icon" width="20" height="20"><use href="#i-wing"/></svg>`;
}
export function itemIconHtml(cat, item) {
  if (!item) return catIconHtml(cat);
  const src = item.img || (cat && cat.img);
  if (!src) return `<svg class="inline-icon" width="20" height="20"><use href="#i-wing"/></svg>`;
  return `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{innerHTML:'<svg class=&quot;inline-icon&quot; width=&quot;20&quot; height=&quot;20&quot;><use href=&quot;#i-wing&quot;/></svg>'}).firstChild)">`;
}

/* ================================================================
   🎲 ランダムコーデ：直近の抽選結果の保存/復元
   localStorage キー: lastRandomCoord_v1（nsKey経由）
   形状: { items:{[catKey]:Item}, favOnly:boolean }
   ================================================================ */
export const LAST_RANDOM_COORD_KEY = 'lastRandomCoord_v1';
export function saveLastRandomCoord(items, favOnly) {
  try {
    localStorage.setItem(nsKey(LAST_RANDOM_COORD_KEY), JSON.stringify({ items, favOnly }));
  } catch (e) { /* noop（容量エラー等はここでは致命的でないため無視） */ }
}
export function loadLastRandomCoord() {
  try {
    const raw = JSON.parse(localStorage.getItem(nsKey(LAST_RANDOM_COORD_KEY)));
    if (raw && raw.items && typeof raw.items === 'object' && Object.keys(raw.items).length > 0) {
      return { items: raw.items, favOnly: !!raw.favOnly };
    }
  } catch (e) { /* noop */ }
  return null;
}

/* ================================================================
   👗 マイコーデ：保存済みコーデ一覧
   localStorage キー: myCoords（nsKey経由）
   ================================================================ */
export const MY_COORDS_KEY = 'myCoords';
export function getSavedCoords() {
  // idは常にDate.now()の数値で生成しているため、それ以外（データ引継ぎ/
  // 改ざん等）は除外する（item/index.htmlのgetSavedCoords()と同一の防御）
  try {
    const list = JSON.parse(localStorage.getItem(nsKey(MY_COORDS_KEY)));
    return Array.isArray(list) ? list.filter(s => s && Number.isFinite(s.id)) : [];
  } catch (e) { return []; }
}
export function saveSavedCoords(list) {
  localStorage.setItem(nsKey(MY_COORDS_KEY), JSON.stringify(list));
}
export function addSavedCoord(name, items) {
  const sets = getSavedCoords();
  const entry = { id: Date.now(), name, items, createdAt: new Date().toISOString() };
  sets.push(entry);
  saveSavedCoords(sets);
  return entry;
}
export function deleteSavedCoord(id) {
  saveSavedCoords(getSavedCoords().filter(s => s.id !== id));
}
export function setSavedCoordPhoto(id, dataUrl) {
  const sets = getSavedCoords();
  const set = sets.find(s => s.id === id);
  if (!set) return false;
  if (dataUrl) set.photoDataUrl = dataUrl; else delete set.photoDataUrl;
  saveSavedCoords(sets);
  return true;
}

/* ================================================================
   🖼️ クローゼットコラージュ：保存済み一覧・背景プリセット
   localStorage キー: closetCollages_v1（nsKey経由）
   CLOSET_BG_PRESETSはitem/index.htmlのものをverbatim移植
   （key/label/css/accent[SVGパス]/dark、7背景+白+黒の8種類）
   ================================================================ */
export const CLOSET_KEY = 'closetCollages_v1';
export const CLOSET_MIN_GRID = 2;
export const CLOSET_MAX_GRID = 5;
export const CLOSET_BG_PRESETS = [
  { key: 'sakura', label: 'Sakura', css: 'linear-gradient(160deg, #FFE4EC 0%, #FFC1D9 50%, #FFE9C7 100%)', accent: '<svg width="90" height="90" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="12" cy="12" r="2"/><path d="M12 4a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3ZM12 20a3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3ZM4 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3ZM20 12a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3Z"/></svg>', dark: false },
  { key: 'sky', label: 'Sky', css: 'linear-gradient(160deg, #CDEBFF 0%, #A6D8FF 55%, #E8F6FF 100%)', accent: '<svg width="90" height="90" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 8.1 4.5 4.5 0 0 1 17.5 18Z"/></svg>', dark: false },
  { key: 'night', label: 'Night', css: 'linear-gradient(160deg, #241B4E 0%, #3F2E7A 55%, #6A4FB0 100%)', accent: '<svg width="90" height="90" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M12 3.5l2.5 5.6 6.1.6-4.6 4.1 1.3 6-5.3-3.2-5.3 3.2 1.3-6-4.6-4.1 6.1-.6Z"/></svg>', dark: true },
  { key: 'peach', label: 'Peach', css: 'linear-gradient(160deg, #FFE0D6 0%, #FFC9B3 55%, #FFD9A0 100%)', accent: '<svg width="90" height="90" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M12 6c-3 0-5.5 2.5-5.5 6s2 7 5.5 7 5.5-3.5 5.5-7S15 6 12 6Z"/></svg>', dark: false },
  { key: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #DCF2E3 0%, #B7E4C7 55%, #EFF7D8 100%)', accent: '<svg width="90" height="90" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M12 3c-5 2-8 6-8 11a8 8 0 0 0 8 7c5-2 8-6 8-11a8 8 0 0 0-8-7Z"/></svg>', dark: false },
  { key: 'gold', label: 'Gold', css: 'linear-gradient(160deg, #FFF6DA 0%, #FFE18C 55%, #FFCB6B 100%)', accent: '<svg width="90" height="90" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M12 3l1.5 6L20 12l-6.5 1.5L12 21l-1.5-6L4 12l6.5-1.5Z"/></svg>', dark: false },
  { key: 'white', label: 'White', css: '#FAFAFC', accent: '', dark: false },
  { key: 'black', label: 'Black', css: 'linear-gradient(160deg, #2E2E33 0%, #17171A 100%)', accent: '', dark: true },
];
export function closetBgPreset(key) {
  return CLOSET_BG_PRESETS.find(p => p.key === key) || CLOSET_BG_PRESETS[0];
}
export function getClosetCollages() {
  try { return JSON.parse(localStorage.getItem(nsKey(CLOSET_KEY))) || []; } catch (e) { return []; }
}
export function saveClosetCollages(list) {
  localStorage.setItem(nsKey(CLOSET_KEY), JSON.stringify(list));
}

/* ================================================================
   📷 写真ファイル → リサイズ済みdata URL（3機能共通）
   item/index.htmlは専用のドラッグ&ズームクロップUI（openPhotoCropModal
   系、約130行）を持っていたが、今回は「コアの保存・表示フローを確実に
   動かす」ことを優先し、share-view.js（features/share/share-view.js の
   handlePhotoFile）と同じ「FileReader→Imageへ読込→<canvas>で縮小/
   （必要なら中央正方形クロップ）描画→toDataURL」という定型パターンに
   簡略化している（tai-hub内に既に前例のある簡略化）。ユーザー自身が
   位置・ズームを調整するUIは提供しない。
   ================================================================ */
export function readImageFileAsDataUrl(file, { maxDim = 900, square = false, mime = 'image/jpeg', quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('not an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (square) {
          const side = Math.min(sw, sh);
          sx = (sw - side) / 2;
          sy = (sh - side) / 2;
          sw = side; sh = side;
        }
        const scale = Math.min(maxDim / sw, maxDim / sh, 1);
        const w = Math.max(1, Math.round(sw * scale));
        const h = Math.max(1, Math.round(sh * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => reject(new Error('image load failed'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(reader.error || new Error('file read failed'));
    reader.readAsDataURL(file);
  });
}

/* ================================================================
   🍞 トースト通知（3機能共通）
   category-view.jsのshowCatViewToast/cv-toastと同じ「opacity:0の実体を
   先に挿入してから次tickでクラスを付与する」構成（CLAUDE.mdの
   「開くアニメーションはtransitionではなくanimationにする」規則の対象
   外——display:noneからの表示切替を経由しないため、transitionのままで
   正しく発火する）。
   ================================================================ */
export function showCoordToast(msg) {
  const t = document.createElement('div');
  t.className = 'cd-toast';
  t.textContent = msg;
  const stackIndex = document.querySelectorAll('.cd-toast').length;
  if (stackIndex > 0) t.style.bottom = `calc(84px + env(safe-area-inset-bottom) + ${stackIndex * 44}px)`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ================================================================
   共有スタイル注入（3機能のモーダルが共通して使うクラス）。
   document.bodyへ直接appendするモーダルのため、search-modal.js冒頭
   コメントと同じ理由で --hub-* トークン（css/tokens.css）を使う。
   緑（所持/成功）・金（お気に入り）・赤（削除/警告）はハブ共通
   トークンに無いため、search-modal.jsの--sm-owned/--sm-favと同じ要領で
   このファイル内に --cd-* トークンとして定義する。
   ================================================================ */
const SHARED_STYLE_ID = 'item-coord-shared-styles';
export function injectCoordSharedStyles() {
  if (document.getElementById(SHARED_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SHARED_STYLE_ID;
  style.textContent = `
:root { --cd-green: #34C759; --cd-gold: #FFCC00; --cd-red: #FF3B30; }
[data-theme="dark"] { --cd-green: #30D158; --cd-gold: #FFD60A; --cd-red: #FF453A; }

.cd-modal-back {
  border: 0; background: none; color: var(--hub-accent); font-size: 14px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font-family: inherit; padding: 4px 2px;
}
.cd-form-field { margin-bottom: 14px; }
.cd-form-label { font-size: 12px; font-weight: 600; color: var(--hub-text-2); margin-bottom: 6px; display: block; }
.cd-form-input {
  width: 100%; background: var(--hub-bg); border: none; border-radius: var(--hub-r-sm); padding: 10px 12px;
  font-size: 14px; color: var(--hub-text); font-family: inherit; outline: none; box-sizing: border-box;
}
.cd-form-input::placeholder { color: var(--hub-text-3); }

.cd-action-row { display: flex; gap: 10px; margin-top: 12px; }
.cd-action-btn {
  flex: 1; padding: 12px; border-radius: var(--hub-r-sm); font-size: 14px; font-weight: 700;
  font-family: inherit; border: 0; cursor: pointer; text-align: center;
}
.cd-action-btn.primary { background: var(--hub-accent); color: #fff; }
.cd-action-btn.secondary { background: var(--hub-bg); color: var(--hub-text); }
.cd-action-btn.secondary.is-active { background: var(--hub-accent-bg); color: var(--hub-accent); box-shadow: inset 0 0 0 1.5px var(--hub-accent); }
.cd-action-btn.danger { color: var(--cd-red); }
.cd-action-btn.full { width: 100%; }
.cd-action-btn:disabled { opacity: 0.5; cursor: default; }

.cd-empty-msg { font-size: 13px; color: var(--hub-text-2); text-align: center; padding: 28px 8px; line-height: 1.7; }

/* ── 保存済みカード一覧（マイコーデ・クローゼット共通） ── */
.cd-card { background: var(--hub-bg); border-radius: var(--hub-r-sm); padding: 14px; margin-bottom: 10px; }
.cd-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.cd-card-title { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cd-card-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.cd-icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 0; background: none; color: var(--hub-text-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.cd-icon-btn:active { background: var(--hub-sep); }
.cd-icon-btn.danger { color: var(--hub-text-3); }
.cd-photo-thumb { width: 26px; height: 26px; border-radius: 7px; object-fit: cover; flex-shrink: 0; cursor: pointer; }

.cd-item-rows { display: flex; flex-direction: column; gap: 5px; }
.cd-item-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.cd-item-row-icon { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.cd-item-row-icon img { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; }
.cd-item-cat { color: var(--hub-text-2); width: 108px; flex-shrink: 0; font-size: 11.5px; }
.cd-item-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── アイコンで選ぶピッカー（マイコーデ作成・クローゼットのマス選択） ── */
.cd-pick-row { margin-bottom: 14px; }
.cd-pick-label { font-size: 12.5px; color: var(--hub-text-2); margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
.cd-pick-label img { width: 16px; height: 16px; object-fit: contain; }
.cd-pick-strip { display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 4px; -webkit-overflow-scrolling: touch; }
.cd-pick-item {
  flex-shrink: 0; width: 52px; height: 52px; border-radius: 12px; background: var(--hub-card);
  border: 2px solid transparent; display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative; cursor: pointer;
}
.cd-pick-item img { width: 100%; height: 100%; object-fit: contain; padding: 12%; box-sizing: border-box; display: block; }
.cd-pick-item.selected { border-color: var(--hub-accent); }
.cd-pick-item.selected::after {
  content: ''; position: absolute; bottom: 1px; right: 1px; width: 16px; height: 16px; border-radius: 50%;
  background: var(--hub-accent); box-shadow: 0 0 0 2px var(--hub-bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4.5 12.5l5 5L20 6.5' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: center; background-size: 60%;
}
.cd-pick-none { color: var(--hub-text-3); }
.cd-pick-empty { font-size: 12px; color: var(--hub-text-3); padding: 6px 2px; }
.cd-exclusive-hint {
  background: var(--hub-accent-bg); border-radius: var(--hub-r-sm); padding: 8px 12px; font-size: 11.5px;
  color: var(--hub-accent); margin-bottom: 8px; line-height: 1.5; display: flex; gap: 5px; align-items: flex-start;
}

.cd-toast {
  position: fixed; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom)); transform: translateX(-50%) translateY(20px);
  background: rgba(28,28,30,0.92); color: #fff; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 999px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25); opacity: 0; transition: opacity 0.25s, transform 0.25s; z-index: 1200;
  pointer-events: none; max-width: calc(100vw - 32px); text-align: center;
}
.cd-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
`;
  document.head.appendChild(style);
}
