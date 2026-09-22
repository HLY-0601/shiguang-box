/* ================================================================
   achievement-share.js — 🖼️ 達成率をシェア（Xで画像を共有／カスタマイズして共有）

   item/index.html の「達成率をシェア」ブロック（1088〜1098行目のボタン2つ、
   openCustomizeModal〜shareOverallOnTwitter、4260〜4400行目付近）を
   tai-hub へ移植したもの。data/共有ロジックは share-data.js に委譲し、
   このファイルは「達成率カードのDOM組み立て」「カスタマイズモーダルの
   UI」の2点のみを担当する。

   ── エクスポート契約 ──────────────────────────────────────────
     export async function shareOnX() … 「Xで画像を共有」の直接トリガー
       （モーダル無し・ワンクリック）。元実装のshareOverallOnTwitter()
       （fromCustomize省略＝false）と同じく、保存済みのカスタマイズ設定
       とは無関係に「全カテゴリ・オレンジテーマ・コメント無し」の
       既定カードを生成する。
     export async function open()  … 「カスタマイズして共有」モーダルを開く
       （背景テーマ・表示カテゴリ・コメントを選べる。openCustomizeModal相当）
     export function close()       … モーダルを閉じる
   ダッシュボードの「達成率をシェア」セクションから
   `import * as achievementShare from './share/achievement-share.js';
    achievementShare.shareOnX(); / achievementShare.open();`
   のように呼び出す想定（random-coord.js等と同じ import-as-namespace の
   作法。dashboard-view.js自体はこのファイルから一切editしていない）。

   ── データ互換性 ──────────────────────────────────────────────
   カスタマイズ設定（背景テーマ・表示カテゴリ）の保存キー shareCustomize_v1
   （nsKey経由）・形状 {theme, cats:[catKey,...]} は item/index.html と
   完全同一。コメント欄の内容自体は保存しない（元実装と同じ——毎回空欄
   から始まる）。

   ── 元実装からの意図的な簡略化 ────────────────────────────────
   達成率カード（buildOverallExportCardEl）のレイアウトは元のCanvas風
   デザイン（円グラフ等）ではなく、元実装と同じ「白背景の統計ブロック＋
   3列のカテゴリ別グリッド」をそのまま踏襲している——見た目の簡略化は
   していない。唯一の差はデータ算出方法（getShareStats/getCatShareStats。
   詳細はshare-data.js冒頭コメント参照）。
   ================================================================ */

import { CURRENT_LANG, trCat, escapeHtml } from '../../../js/i18n.js';
import { nsKey } from '../../../js/state.js';
import {
  GRID_CATEGORIES, SHARE_THEMES, SITE_URL, SHARE_HASHTAG,
  loadAllShareItemsOnce, getShareStats, getCatShareStats,
  catIconHtml, exportShareImage, showShareToast, injectShareSharedStyles,
} from './share-data.js';

const OVERLAY_ID = 'achievementShareModalOverlay';
const CUSTOMIZE_KEY = 'shareCustomize_v1';

let overlayEl = null;

/* ── カスタマイズ設定の読み書き（item/index.htmlのloadShareCustomize/saveShareCustomizeを移植） ── */
function loadShareCustomize() {
  try {
    const d = JSON.parse(localStorage.getItem(nsKey(CUSTOMIZE_KEY)));
    return {
      theme: (d && d.theme && SHARE_THEMES[d.theme]) ? d.theme : 'orange',
      cats: (d && Array.isArray(d.cats)) ? d.cats : GRID_CATEGORIES.map(c => c.key),
    };
  } catch (_) {
    return { theme: 'orange', cats: GRID_CATEGORIES.map(c => c.key) };
  }
}
function saveShareCustomize(theme, cats) {
  localStorage.setItem(nsKey(CUSTOMIZE_KEY), JSON.stringify({ theme, cats }));
}

/* ================================================================
   達成率カード（DOM）の組み立て（item/index.htmlのbuildOverallExportCardElを移植）
   opts: { theme?: string, cats?: string[]（catKeyの配列）, comment?: string }
   ================================================================ */
function buildOverallExportCardEl(opts = {}) {
  const en = CURRENT_LANG === 'en';
  const { own, tot, p } = getShareStats();
  const pctTxt = p !== null ? `${p}<span class="ish-num-unit">%</span>` : '--%';
  const theme = SHARE_THEMES[opts.theme] ? opts.theme : 'orange';
  const selectedCats = opts.cats ? GRID_CATEGORIES.filter(c => opts.cats.includes(c.key)) : GRID_CATEGORIES;
  const comment = opts.comment || '';

  const cells = selectedCats.map(cat => {
    const { p: cp } = getCatShareStats(cat.key);
    const high = cp !== null && cp >= 80;
    const cls = cp === null ? 'empty' : high ? 'high' : '';
    const cpTxt = cp !== null ? `${cp}<span class="ish-num-unit">%</span>` : '--';
    return `
      <div class="ish-exp-cat-cell">
        <div class="ish-exp-cat-cell-icon">${catIconHtml(cat)}</div>
        <div class="ish-exp-cat-cell-pct ${cls}">${cpTxt}</div>
        <div class="ish-exp-cat-cell-name">${escapeHtml(trCat(cat.name))}</div>
      </div>`;
  }).join('');

  const today = new Date();
  const dateTxt = en
    ? `Created ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    : `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日作成`;

  const card = document.createElement('div');
  card.className = 'ish-export-card';
  card.style.background = SHARE_THEMES[theme].grad;
  card.innerHTML = `
    <div class="ish-exp-brand"><svg width="13" height="13" viewBox="0 0 24 24" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px;margin-right:3px"><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l1.6 2H18.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/></svg>${en ? 'Item Collection Tracker' : 'アイテム所持率管理'}</div>
    <div class="ish-exp-hero">
      <div class="ish-exp-hero-pct">${pctTxt}</div>
      <div class="ish-exp-hero-label">${en ? 'Collection Completion Rate' : 'コレクション達成率'}</div>
      <div class="ish-exp-hero-nums">${en
        ? `Owned ${tot > 0 ? own : '--'} / Total ${tot > 0 ? tot : '--'}`
        : `所持中 ${tot > 0 ? own : '--'} ／ 総アイテム数 ${tot > 0 ? tot : '--'}`}</div>
    </div>
    ${comment ? `<div class="ish-exp-comment">${escapeHtml(comment)}</div>` : ''}
    ${cells ? `<div class="ish-exp-cat-grid">${cells}</div>` : ''}
    <div class="ish-exp-date">${dateTxt}</div>
  `;
  document.body.appendChild(card);
  return card;
}

/* 達成率からツイート本文を作成（item/index.htmlのbuildOverallTweetTextを移植。
   文末に必ずサイトURL＋ハッシュタグを付与。コメント指定時はそちらを使う） */
function buildOverallTweetText(comment) {
  if (comment) return `${comment}\n\n${SITE_URL}\n${SHARE_HASHTAG}`;
  const en = CURRENT_LANG === 'en';
  const { own, tot, p } = getShareStats();
  const pctTxt = p !== null ? p + '%' : '--%';
  return en
    ? `My item completion rate is ${pctTxt}!\n(Owned ${own} / Total ${tot})\nHow much do you have?\n\n${SITE_URL}\n${SHARE_HASHTAG}`
    : `アイテム所持率は${pctTxt}でした！\n（所持中 ${own} ／ 総アイテム数 ${tot}）\nあなたは何%持ってる？\n\n${SITE_URL}\n${SHARE_HASHTAG}`;
}

/* ================================================================
   「Xで画像を共有」の直接トリガー（モーダル無し）
   ================================================================ */
export async function shareOnX() {
  const en = CURRENT_LANG === 'en';
  await loadAllShareItemsOnce();
  if (getShareStats().tot === 0) {
    showShareToast(en ? 'Please register items on a category page first' : 'まずはカテゴリページでアイテムを登録してください');
    return;
  }
  injectShareSharedStyles();
  return exportShareImage(() => buildOverallExportCardEl({}), en ? 'Collection Completion Rate' : 'コレクション達成率', {
    shareText: buildOverallTweetText(''),
    successToast: en ? 'Shared!' : '共有しました！',
  });
}

/* ================================================================
   カスタマイズモーダル
   ================================================================ */
function renderModalHtml() {
  const en = CURRENT_LANG === 'en';
  return `
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="asCloseX" aria-label="${en ? 'Close' : '閉じる'}">
        <svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg>
      </button>
      <div class="modal-title">${en ? 'Customize Image' : '画像をカスタマイズ'}</div>

      <div class="ish-section-label">${en ? 'Background Theme' : '背景テーマ'}</div>
      <div class="ish-theme-row" id="asThemeRow"></div>

      <div class="ish-section-label">${en ? 'Categories to Show' : '表示するカテゴリ'}</div>
      <div class="ish-cat-grid" id="asCatGrid"></div>

      <div class="ish-section-label">${en ? 'Comment (optional)' : 'コメント（任意）'}</div>
      <textarea id="asComment" class="ish-textarea" maxlength="120" placeholder="${en ? 'e.g. Player name: XX (default text is used if left blank)' : '例）プレイヤーネーム：〇〇（未入力の場合は通常の文言になります）'}"></textarea>

      <div class="ish-action-row" style="margin-top:16px;">
        <button type="button" class="ish-action-btn twitter full" id="asShareBtn">${en ? 'Share Image on X with These Settings' : 'この設定でXへ画像を共有'}</button>
      </div>
    </div>`;
}

function renderThemeRow(selectedTheme) {
  const row = overlayEl.querySelector('#asThemeRow');
  row.innerHTML = Object.keys(SHARE_THEMES).map(key => `
    <div class="ish-theme-swatch ${key === selectedTheme ? 'selected' : ''}" data-theme="${key}"
      style="background:${SHARE_THEMES[key].grad};" title="${escapeHtml(SHARE_THEMES[key].label)}"></div>`).join('');
}

function renderCatGrid(selectedCats) {
  const grid = overlayEl.querySelector('#asCatGrid');
  grid.innerHTML = GRID_CATEGORIES.map(cat => `
    <label class="ish-cat-opt">
      <input type="checkbox" value="${cat.key}" ${selectedCats.includes(cat.key) ? 'checked' : ''}>
      <span class="ish-cat-icon">${catIconHtml(cat)}</span> ${escapeHtml(trCat(cat.name))}
    </label>`).join('');
}

function selectTheme(key) {
  overlayEl.querySelectorAll('#asThemeRow .ish-theme-swatch').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === key);
  });
}

/* モーダルの現在の選択状態（テーマ・カテゴリ・コメント）を読み取り、
   テーマ/カテゴリ選択は保存もしておく（item/index.htmlのreadShareCustomizeFromModalを移植） */
function readCustomizeFromModal() {
  const themeEl = overlayEl.querySelector('#asThemeRow .ish-theme-swatch.selected');
  const theme = themeEl ? themeEl.dataset.theme : 'orange';
  const cats = [...overlayEl.querySelectorAll('#asCatGrid input:checked')].map(el => el.value);
  const comment = overlayEl.querySelector('#asComment').value.trim();
  saveShareCustomize(theme, cats);
  return { theme, cats, comment };
}

async function handleShareClick() {
  const opts = readCustomizeFromModal();
  close();
  await exportShareImage(() => buildOverallExportCardEl(opts), CURRENT_LANG === 'en' ? 'Collection Completion Rate' : 'コレクション達成率', {
    shareText: buildOverallTweetText(opts.comment),
    successToast: CURRENT_LANG === 'en' ? 'Shared!' : '共有しました！',
  });
}

function wireControls() {
  const q = sel => overlayEl.querySelector(sel);
  q('#asCloseX').addEventListener('click', close);
  q('#asShareBtn').addEventListener('click', handleShareClick);
  q('#asThemeRow').addEventListener('click', e => {
    const sw = e.target.closest('.ish-theme-swatch');
    if (sw) selectTheme(sw.dataset.theme);
  });
}

export async function open() {
  const en = CURRENT_LANG === 'en';
  await loadAllShareItemsOnce();
  if (getShareStats().tot === 0) {
    showShareToast(en ? 'Please register items on a category page first' : 'まずはカテゴリページでアイテムを登録してください');
    return;
  }

  injectShareSharedStyles();
  document.getElementById(OVERLAY_ID)?.remove();

  const saved = loadShareCustomize();

  overlayEl = document.createElement('div');
  overlayEl.className = 'modal-overlay';
  overlayEl.id = OVERLAY_ID;
  overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
  overlayEl.innerHTML = renderModalHtml();
  document.body.appendChild(overlayEl);

  renderThemeRow(saved.theme);
  renderCatGrid(saved.cats);
  wireControls();
  requestAnimationFrame(() => overlayEl.classList.add('open'));
}

export function close() {
  document.getElementById(OVERLAY_ID)?.classList.remove('open');
}
