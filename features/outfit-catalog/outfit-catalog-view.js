/* ================================================================
   outfit-catalog-view.js — 服饰图鉴（#/outfit-catalog）

   数据源：that-sky-project/that-sky-outfit-preview 的 outfitdefs.min.json
   （1335 件服饰，10 类），图标热链同仓库 /icons/。
   运行时 fetch，拉取失败显示空态；不打包 JSON 进仓库。
   ================================================================ */
import { escapeHtml, CURRENT_LANG } from '../../js/i18n.js';

const DATA_URL = 'https://raw.githubusercontent.com/that-sky-project/that-sky-outfit-preview/98defc1f9378b752b83b9b1ae098f84d4926f266/data/outfitdefs.min.json';
const ICON_BASE = 'https://raw.githubusercontent.com/that-sky-project/that-sky-outfit-preview/98defc1f9378b752b83b9b1ae098f84d4926f266/icons/';
const TIMEOUT_MS = 8000;

const L = CURRENT_LANG;
const T = {
  zh: { title: '服饰图鉴', subtitle: '1335 件服饰 · 数据来源 that-sky-project/outfit-preview', search: '搜索服饰…', loading: '加载中…', empty: '没有匹配的服饰', catAll: '全部' },
  ja: { title: '衣装図鑑', subtitle: '全1335点・データ提供元 that-sky-project/outfit-preview', search: '衣装を検索…', loading: '読み込み中…', empty: '該当する衣装がありません', catAll: 'すべて' },
  en: { title: 'Outfit Catalog', subtitle: '1335 items · data from that-sky-project/outfit-preview', search: 'Search outfits…', loading: 'Loading…', empty: 'No outfits match', catAll: 'All' },
}[L] || { zh: { title: '服饰图鉴', subtitle: '1335 件服饰', search: '搜索…', loading: '加载中…', empty: '无结果', catAll: '全部' } };

let container = null;
let data = null;
let activeCat = '';
let query = '';

const STYLE_ID = 'outfit-catalog-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = new URL('../../css/outfit-catalog.css', import.meta.url).href;
  document.head.appendChild(link);
}

async function fetchData() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(DATA_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function render() {
  if (!container) return;
  if (!data) {
    container.innerHTML = `<div class="oc-wrap"><div class="oc-loading">${escapeHtml(T.loading)}</div></div>`;
    return;
  }

  const slots = data.slots || [];
  const q = query.trim().toLowerCase();

  // 分类 chips
  const chips = [`<button class="oc-chip ${activeCat === '' ? 'active' : ''}" data-cat="">${escapeHtml(T.catAll)}</button>`]
    .concat(slots.map(s =>
      `<button class="oc-chip ${activeCat === s.key ? 'active' : ''}" data-cat="${escapeHtml(s.key)}">${escapeHtml(s.label)} <span class="oc-chip-n">${s.items.length}</span></button>`
    )).join('');

  // 收集要显示的 items
  const visible = [];
  for (const s of slots) {
    if (activeCat && s.key !== activeCat) continue;
    for (const it of s.items) {
      if (q) {
        const hay = [it.label, it.name, it.season || ''].join(' ').toLowerCase();
        if (!hay.includes(q)) continue;
      }
      visible.push({ ...it, slotLabel: s.label, slotKey: s.key });
    }
  }

  const grid = visible.map(it => {
    const icon = it.iconFile ? ICON_BASE + encodeURIComponent(it.iconFile) : '';
    const season = it.season ? `<span class="oc-season">${escapeHtml(it.season)}</span>` : '';
    return `<div class="oc-cell">
      <div class="oc-icon-wrap">
        ${icon ? `<img class="oc-icon" src="${icon}" alt="" loading="lazy">` : '<div class="oc-icon oc-icon-ph">?</div>'}
      </div>
      <div class="oc-label" title="${escapeHtml(it.name || '')}">${escapeHtml(it.label || it.name || '—')}</div>
      <div class="oc-meta"><span class="oc-slot">${escapeHtml(it.slotLabel)}</span>${season}</div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="oc-wrap">
      <h1 class="oc-title">${escapeHtml(T.title)}</h1>
      <p class="oc-sub">${escapeHtml(T.subtitle)}</p>
      <input id="ocSearch" class="oc-search" type="search" placeholder="${escapeHtml(T.search)}" value="${escapeHtml(query)}" autocomplete="off">
      <div class="oc-chips">${chips}</div>
      <div class="oc-count">${visible.length} / ${slots.reduce((n, s) => n + s.items.length, 0)}</div>
      <div class="oc-grid">${grid || `<div class="oc-empty">${escapeHtml(T.empty)}</div>`}</div>
    </div>`;

  // 绑定
  container.querySelectorAll('[data-cat]').forEach(btn => {
    btn.onclick = () => { activeCat = btn.dataset.cat; render(); };
  });
  const search = container.querySelector('#ocSearch');
  if (search) {
    search.oninput = () => { query = search.value; render(); const s = container.querySelector('#ocSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } };
  }
}

export async function mount(containerEl) {
  injectStyles();
  container = containerEl;
  activeCat = '';
  query = '';
  render();
  try {
    data = await fetchData();
  } catch {
    data = null;
  }
  render();
}

export function unmount() {
  container = null;
  data = null;
}
