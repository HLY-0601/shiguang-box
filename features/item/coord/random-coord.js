/* ================================================================
   random-coord.js — 🎲 ランダムコーデ

   item/index.html の「ランダムコーデ」モーダル（openRandomCoord()〜
   confirmSaveRandom()、2982〜3134行目付近）を移植したもの。所持
   アイテムからカテゴリごとに1つずつ（排他グループは1カテゴリのみ）を
   ランダムに選び、その組み合わせを画面に表示する。「お気に入りのみ」
   モードでは各カテゴリのお気に入り登録アイテムを優先し、お気に入りが
   無いカテゴリだけ全所持アイテムにフォールバックする（元実装と同じ
   getPickPool()のロジック）。

   ── エクスポート契約 ──────────────────────────────────────────
     export async function open()  … モーダルを開く。初回のみ全カテゴリの
                                      アイテムデータを読み込み（コーデ機能
                                      共通のcoord-data.js側キャッシュを使う
                                      ため、my-coord.js/closet-collage.jsと
                                      読み込みを共有する）、直近の抽選結果
                                      （localStorage: lastRandomCoord_v1）が
                                      あればそれを再表示し、無ければ新規に
                                      抽選する。
     export function close()       … モーダルを閉じる。
   search-modal.jsと同じ「document.bodyへ直接<div class="modal-overlay">を
   appendするオーバーレイ」方式。ダッシュボードの「コーデ機能」セクションから
   `import * as randomCoord from './coord/random-coord.js'; randomCoord.open()`
   のように呼び出す想定（dashboard-view.jsへの配線は後続パスで行う——
   このファイル自体はdashboard-view.jsを一切editしていない）。

   ── 元実装からの意図的な簡略化 ────────────────────────────────
   1. 画像化してのXシェア（shareRandomOnTwitter）／リンクでの共有
      （shareRandomCoordLink・共有URLを開いたときの「共有されたコーデ」
      プレビューモーダル）は実装していない。いずれもhtml2canvas(CDN)＋
      Web Share API、またはURLクエリへのコーデエンコード/デコードに
      依存する独立した大きな機能で、cost-view.js（既存ファイル）が
      同じ理由でX/Twitterシェア一式を省略しているのと同じ判断。
      「ランダムに提案する」「保存する」というコア体験には影響しない。
   2. 上記に伴い、シェア画像用の写真添付（randomCoordPhotoDataUrl）・
      共有画像スタイル切替（ポラロイド風／アイコングリッド）・
      共有用IDテキストも実装していない（すべてシェア機能専用の付随UIで、
      保存されるデータには一切影響しない）。
   ================================================================ */

import { CURRENT_LANG, trCat, trItem, escapeHtml } from '../../../js/i18n.js';
import {
  GRID_CATEGORIES, EXCLUSIVE_KEYS,
  loadAllItemsOnce, getOwnedItemsForCat, getFavIds, toggleFavItem,
  loadLastRandomCoord, saveLastRandomCoord, addSavedCoord,
  itemIconHtml, catIconHtml, injectCoordSharedStyles, showCoordToast,
} from './coord-data.js';

const STYLE_ID = 'item-random-coord-styles';
const OVERLAY_ID = 'randomCoordModalOverlay';

let overlayEl = null;
let currentRandom = {};
let favOnlyMode = false;
let currentRandomFavOnly = false;

/* ── お気に入りがあればそこから、なければ全所持アイテムから返す ── */
function getPickPool(catKey) {
  const owned = getOwnedItemsForCat(catKey);
  if (!favOnlyMode) return owned;
  const favIds = getFavIds(catKey);
  const favs = owned.filter(i => favIds.includes(String(i.id)));
  return favs.length > 0 ? favs : owned;
}

function shuffleOutfit() {
  currentRandom = {};

  const exclusiveWithItems = EXCLUSIVE_KEYS.filter(key => getPickPool(key).length > 0);
  const chosenExclusiveKey = exclusiveWithItems.length > 0
    ? exclusiveWithItems[Math.floor(Math.random() * exclusiveWithItems.length)]
    : null;

  let anyFavExists = !favOnlyMode;
  if (favOnlyMode) {
    anyFavExists = GRID_CATEGORIES.some(c => getFavIds(c.key).length > 0);
    if (!anyFavExists) showCoordToast(CURRENT_LANG === 'en' ? 'No favorites set. Picking randomly from all items' : 'お気に入りが未設定です。全アイテムからランダムします');
  }
  currentRandomFavOnly = favOnlyMode && anyFavExists;

  GRID_CATEGORIES.forEach(cat => {
    const isExclusive = EXCLUSIVE_KEYS.includes(cat.key);
    if (isExclusive && cat.key !== chosenExclusiveKey) return;
    const pool = getPickPool(cat.key);
    if (pool.length > 0) currentRandom[cat.key] = pool[Math.floor(Math.random() * pool.length)];
  });

  saveLastRandomCoord(currentRandom, currentRandomFavOnly);
  renderCurrentRandom();
  hideSaveRow();
}

function renderCurrentRandom() {
  if (!overlayEl) return;
  const el = overlayEl.querySelector('#rcResult');
  if (!el) return;
  const en = CURRENT_LANG === 'en';
  let html = '';
  const hasAny = Object.keys(currentRandom).length > 0;

  if (currentRandomFavOnly && hasAny) {
    html += `<div class="rc-fav-mode-bar">${en ? 'Picking randomly from favorite items only' : 'お気に入りアイテムのみでランダム中'}</div>`;
  }

  GRID_CATEGORIES.forEach(cat => {
    const picked = currentRandom[cat.key] || null;
    const isExclusive = EXCLUSIVE_KEYS.includes(cat.key);

    if (!picked && isExclusive) {
      html += `
        <div class="rc-row rc-row-muted">
          <div class="rc-icon">${catIconHtml(cat)}</div>
          <div class="rc-info">
            <div class="rc-cat">${escapeHtml(trCat(cat.name))}</div>
            <div class="rc-empty">${en ? 'Not used in this coord' : 'このコーデでは使用しない'}</div>
          </div>
        </div>`;
      return;
    }

    const favOn = picked && getFavIds(cat.key).includes(String(picked.id));
    const favBtn = picked
      ? `<button type="button" class="rc-fav-btn ${favOn ? 'fav-on' : ''}" data-act="toggle-fav" data-cat="${cat.key}" data-id="${escapeHtml(String(picked.id))}" title="${en ? 'Add to favorites' : 'お気に入り登録'}">
           <svg class="inline-icon" width="20" height="20" style="stroke:currentColor; fill:${favOn ? 'currentColor' : 'none'}; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round;"><use href="#i-star"/></svg>
         </button>`
      : '';

    html += `
      <div class="rc-row">
        <div class="rc-icon">${itemIconHtml(cat, picked)}</div>
        <div class="rc-info">
          <div class="rc-cat">${escapeHtml(trCat(cat.name))}</div>
          ${picked
            ? `<div class="rc-name">${escapeHtml(trItem(picked))}</div>`
            : `<div class="rc-empty">${en ? 'No owned items' : '所持アイテムなし'}</div>`}
        </div>
        ${favBtn}
      </div>`;
  });

  if (!hasAny) {
    html = `<div class="cd-empty-msg">${en
      ? 'Once you check off items on each category page,<br>random coords will appear here.'
      : '各カテゴリページで所持チェックをすると<br>ここにランダムコーデが表示されます。'}</div>`;
  }
  el.innerHTML = html;
}

function hideSaveRow() {
  if (!overlayEl) return;
  const row = overlayEl.querySelector('#rcSaveRow');
  const input = overlayEl.querySelector('#rcSaveName');
  if (row) row.style.display = 'none';
  if (input) input.value = '';
}

function toggleSaveRow() {
  if (!overlayEl) return;
  const row = overlayEl.querySelector('#rcSaveRow');
  if (!row) return;
  const isHidden = row.style.display === 'none';
  row.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) overlayEl.querySelector('#rcSaveName')?.focus();
}

function confirmSaveRandom() {
  if (!overlayEl) return;
  const input = overlayEl.querySelector('#rcSaveName');
  const name = (input?.value || '').trim();
  const en = CURRENT_LANG === 'en';
  if (!name) { input?.focus(); return; }
  if (Object.keys(currentRandom).length === 0) return;

  addSavedCoord(name, currentRandom);
  hideSaveRow();
  showCoordToast(en ? `Saved "${name}"!` : `「${name}」を保存しました！`);
}

function updateFavOnlyBtn() {
  const btn = overlayEl?.querySelector('#rcFavOnlyBtn');
  if (!btn) return;
  const en = CURRENT_LANG === 'en';
  btn.classList.toggle('is-active', favOnlyMode);
  btn.textContent = favOnlyMode ? (en ? 'Favorites Mode' : 'お気に入り中') : (en ? 'Favorites Only' : 'お気に入りのみ');
}

function toggleFavOnlyMode() {
  favOnlyMode = !favOnlyMode;
  updateFavOnlyBtn();
  shuffleOutfit();
}

/* ================================================================
   モーダルの開閉
   ================================================================ */
function renderModalHtml() {
  const en = CURRENT_LANG === 'en';
  return `
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="rcCloseX" aria-label="${en ? 'Close' : '閉じる'}">
        <svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg>
      </button>
      <div class="modal-title">${en ? 'Random Coord' : 'ランダムコーデ'}</div>

      <div id="rcResult"><div class="cd-empty-msg">${en ? 'Loading…' : '読み込み中…'}</div></div>

      <div class="cd-action-row" id="rcSaveRow" style="display:none;">
        <input type="text" class="cd-form-input" id="rcSaveName" placeholder="${en ? 'Enter coord name...' : 'コーデ名を入力...'}">
        <button type="button" class="cd-action-btn primary" id="rcConfirmSaveBtn" style="flex:0 0 auto;">${en ? 'Save' : '保存'}</button>
      </div>

      <div class="cd-action-row">
        <button type="button" class="cd-action-btn secondary" id="rcShuffleBtn">${en ? 'Shuffle Again' : 'もう一度'}</button>
        <button type="button" class="cd-action-btn secondary" id="rcFavOnlyBtn">${en ? 'Favorites Only' : 'お気に入りのみ'}</button>
      </div>
      <div class="cd-action-row">
        <button type="button" class="cd-action-btn primary full" id="rcToggleSaveBtn">${en ? 'Save This Coord' : '保存する'}</button>
      </div>
    </div>`;
}

function wireControls() {
  const q = sel => overlayEl.querySelector(sel);
  q('#rcCloseX').addEventListener('click', close);
  q('#rcShuffleBtn').addEventListener('click', shuffleOutfit);
  q('#rcFavOnlyBtn').addEventListener('click', toggleFavOnlyMode);
  q('#rcToggleSaveBtn').addEventListener('click', toggleSaveRow);
  q('#rcConfirmSaveBtn').addEventListener('click', confirmSaveRandom);
  q('#rcSaveName').addEventListener('keydown', e => { if (e.key === 'Enter') confirmSaveRandom(); });
  q('#rcResult').addEventListener('click', e => {
    const btn = e.target.closest('[data-act="toggle-fav"]');
    if (!btn) return;
    toggleFavItem(btn.dataset.cat, btn.dataset.id);
    renderCurrentRandom();
  });
}

export async function open() {
  injectCoordSharedStyles();
  injectStyles();
  document.getElementById(OVERLAY_ID)?.remove();

  overlayEl = document.createElement('div');
  overlayEl.className = 'modal-overlay';
  overlayEl.id = OVERLAY_ID;
  overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
  overlayEl.innerHTML = renderModalHtml();
  document.body.appendChild(overlayEl);

  wireControls();
  favOnlyMode = false;
  updateFavOnlyBtn();
  requestAnimationFrame(() => overlayEl.classList.add('open'));

  try {
    await loadAllItemsOnce();
  } catch (e) {
    console.error('[random-coord] failed to load item data', e);
    if (overlayEl) overlayEl.querySelector('#rcResult').innerHTML = `<div class="cd-empty-msg">${CURRENT_LANG === 'en' ? 'Failed to load item data.' : 'アイテムデータの読み込みに失敗しました。'}</div>`;
    return;
  }
  if (!overlayEl || !document.body.contains(overlayEl)) return; // 読込待ち中に閉じられた

  const last = loadLastRandomCoord();
  if (last) {
    currentRandom = last.items;
    currentRandomFavOnly = last.favOnly;
    renderCurrentRandom();
  } else {
    shuffleOutfit();
  }
}

export function close() {
  document.getElementById(OVERLAY_ID)?.classList.remove('open');
}

/* ================================================================
   スコープ付きスタイル注入
   ================================================================ */
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.rc-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 0.5px solid var(--hub-sep); }
.rc-row:last-child { border-bottom: 0; }
.rc-icon { width: 36px; height: 36px; background: var(--hub-bg); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.rc-icon img { width: 100%; height: 100%; object-fit: contain; padding: 12%; box-sizing: border-box; }
.rc-info { flex: 1; min-width: 0; }
.rc-cat { font-size: 11px; color: var(--hub-text-2); }
.rc-name { font-size: 14px; font-weight: 600; margin-top: 1px; }
.rc-empty { font-size: 13px; color: var(--hub-text-3); font-style: italic; margin-top: 1px; }
.rc-row-muted { opacity: 0.4; }
.rc-row-muted .rc-icon { filter: grayscale(1); }

.rc-fav-btn { border: 0; background: none; padding: 5px 4px; flex-shrink: 0; color: var(--hub-text-3); cursor: pointer; transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
.rc-fav-btn.fav-on { color: var(--cd-gold); }
.rc-fav-btn:active { transform: scale(1.3); }

.rc-fav-mode-bar {
  display: flex; align-items: center; gap: 6px; background: var(--hub-accent-bg); border-radius: var(--hub-r-sm);
  padding: 7px 12px; margin-bottom: 6px; font-size: 12px; color: var(--hub-accent); font-weight: 600;
}
`;
  document.head.appendChild(style);
}
