/* ================================================================
   price-compare-view.js — 光遇商城各地区定价对照（#/price-compare）

   移植元: GitHub VoidCipher3/skyiap。原生重构：静态数据快照固化，
   不保留定时刷新 / Cloudflare Worker 管线；文案跟随夜月 CURRENT_LANG。
   数据为并入时点快照，纯静态站不再自动更新。

   2026-11-14 起：features/price-compare/live-source.js 会在后台从
   skyiap raw JSON 拉实时数据，拉到后热替换下方快照；离线/失败时静默
   用打包快照。不影响 PWA 离线可用。
   ================================================================ */
import { escapeHtml, CURRENT_LANG } from '../../js/i18n.js';
import { STORE } from './data/store.js';
import { DIFF } from './data/diff.js';
import { PRICE_HISTORY } from './data/price-history.js';
import { TIER_HISTORY } from './data/tier-history.js';
import { DESCRIPTIONS } from './data/desc.js';
import { I18N_PRICE } from './data/i18n-price.js';
import { loadLivePriceData } from './live-source.js';

const SCHEMA = 1;
const LANG = CURRENT_LANG === 'en' ? 'en' : CURRENT_LANG === 'ja' ? 'ja' : 'zh';
const NAME_KEY = CURRENT_LANG === 'en' ? 'en' : CURRENT_LANG === 'ja' ? 'ja' : 'cn';

const DEFAULT_REGIONS = ["TW", "CN", "US", "JP", "KR", "HK"];
const DEFAULT_BASE = { zh: "CNY", en: "USD", ja: "JPY" }[LANG] || "USD";
const BASE_CHOICES = ["TWD", "USD", "JPY", "KRW", "HKD", "CNY", "EUR", "GBP"];
const PREFS_KEY = "sky-price-compare-prefs-v1";
const TABS = ["price", "diff", "history", "tier", "version"];

const STYLE_ID = 'price-compare-styles';
let containerEl = null;

// ---------------------------------------------------------------- 狀態

let tab = "price";
let store = null, meta = null, items = [];
let regions = [], regionCurrency = {};
let latest = null, changeLog = [], catalog = {}, diffMeta = {};
let priceHistory = null;
let tierData = null;               // tier_history：價位對照
let tierPick = { a: null, b: null }; // 價位對照的兩個日期
let selectedRegions = new Set(DEFAULT_REGIONS);
let activeGroup = "";
let chartSku = null;
let wantedBase = null;             // 偏好的基準幣，等 <select> 有選項後才套得上
let countdownTimer = null;
let liveDescriptions = null;       // 实时说明文字（live-source 拉到后覆盖快照）
let liveFetchedAt = null;           // 实时数据的抓取时间戳

const $ = (id) => containerEl?.querySelector('#' + id);
const esc = escapeHtml;
const setMsg = (msg) => { const el = $("msg"); if (el) el.textContent = msg || ""; };

function getI18nNode(path) {
  for (const lang of [LANG, 'en', 'zh']) {
    let v = I18N_PRICE[lang];
    for (const part of path.split('.')) v = v?.[part];
    if (v != null) return v;
  }
  return null;
}

function lookupI18n(path) {
  const v = getI18nNode(path);
  return typeof v === 'string' ? v : null;
}

/** t("diff.title") / t("showing", {shown, all, regions}) */
function t(path, vars) {
  const v = lookupI18n(path);
  if (typeof v !== 'string') return path;
  return vars ? v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : v;
}

const nameOf = (o) => {
  const n = o?.name || {};
  return n[NAME_KEY] || n.en || n.ja || n.tw || o?.sku || "";
};
const regionName = (code) => {
  const key = `regions.${code}`;
  const name = lookupI18n(key);
  return name == null ? code : `${code} ${name}`;
};
const regionShort = (code) => regionName(code);

// ---------------------------------------------------------------- 偏好（本地存储）

function loadPrefs() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { /* 壞了就當沒有 */ }
  const list = Array.isArray(saved.regions) ? saved.regions : null;
  if (list?.length) selectedRegions = new Set(list);

  wantedBase = saved.base || null;
  if (saved.mode) $("displayMode").value = saved.mode;
  if (saved.sort) $("sortMode").value = saved.sort;
  activeGroup = saved.group || "";
  if (saved.onlyActive) $("onlyActive").checked = true;
  if (saved.tab && TABS.includes(saved.tab)) tab = saved.tab;
  tierPick = { a: saved.tierA || null, b: saved.tierB || null };
  $("tierFx").checked = !!saved.tierFx;
}

function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      regions: [...selectedRegions], base: $("baseCurrency").value,
      mode: $("displayMode").value, sort: $("sortMode").value,
      group: activeGroup, onlyActive: $("onlyActive").checked,
      tab, tierA: tierPick.a, tierB: tierPick.b, tierFx: $("tierFx").checked,
    }));
  } catch { /* 無痕模式寫不進去，忽略 */ }
}

/** 夜月为 hash 路由，不回写查询参数；空占位兼容下游调用。 */
function writeUrlState() {}

async function copyShareLink() {
  const btn = $("copyLinkBtn");
  try {
    await navigator.clipboard.writeText(location.href);
  } catch {
    const ta = document.createElement("textarea");   // 非 https 時的老方法
    ta.value = location.href;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* 真的不行就算了 */ }
    ta.remove();
  }
  if (btn) {
    btn.textContent = t("copied");
    setTimeout(() => { btn.textContent = t("copyLink"); }, 1600);
  }
}

// ---------------------------------------------------------------- 匯率 / 金額

const rateTable = () => meta?.rates?.rates || {};
const hasRates = () => Object.keys(rateTable()).length > 1;
const currencyOf = (code) => regionCurrency[code] || "USD";

function convert(amount, from, to) {
  if (amount == null) return null;
  if (from === to) return amount;
  const r = rateTable();
  const rf = r[from], rt = r[to];
  if (!rf || !rt) return null;
  return (amount / rf) * rt;
}

/** 用某一天的匯率快照換算。折線圖必須用當時的匯率，不是今天的。 */
function convertAt(amount, from, to, rateMap) {
  if (amount == null || !rateMap) return null;
  if (from === to) return amount;
  const rf = rateMap[from], rt = rateMap[to];
  if (!rf || !rt) return null;
  return (amount / rf) * rt;
}

const ZERO_DECIMAL = ["JPY", "KRW", "TWD", "CLP", "IDR", "VND", "HUF", "ISK", "COP", "CRC"];
const NUM_FMT = {};
/** display: "symbol" 整欄同幣別時用；"code" 各國原幣並排時用，$ 會撞號。 */
function fmtMoney(amount, currency, display = "code") {
  if (amount == null) return "—";
  const key = `${currency}|${display}`;
  if (!NUM_FMT[key]) {
    const locale = { zh: "zh-Hans", ja: "ja", en: "en" }[LANG] || "en";
    try {
      NUM_FMT[key] = new Intl.NumberFormat(locale, {
        style: "currency", currency, currencyDisplay: display,
        maximumFractionDigits: ZERO_DECIMAL.includes(currency) ? 0 : 2,
      });
    } catch {
      NUM_FMT[key] = { format: (v) => `${v.toFixed(2)} ${currency}` };
    }
  }
  return NUM_FMT[key].format(amount);
}

// ---------------------------------------------------------------- 每列的計算

const orderedRegions = () => regions.filter(c => selectedRegions.has(c));

function computeRow(item) {
  const base = $("baseCurrency").value;
  const blocked = new Set(item.blocked || []);
  const cells = orderedRegions().map(code => {
    const amount = item.prices?.[code];
    return {
      code, amount,
      currency: currencyOf(code),
      blocked: blocked.has(code),
      converted: amount == null ? null : convert(amount, currencyOf(code), base),
    };
  });
  // 買不到的地區不參與最低／最高：把買不到的價格標成「最划算」會誤導
  const usable = cells.filter(c => c.converted != null && !c.blocked);
  const min = usable.length ? Math.min(...usable.map(c => c.converted)) : null;
  const max = usable.length ? Math.max(...usable.map(c => c.converted)) : null;
  const spread = (min != null && max > 0 && min > 0) ? Number((max / min - 1).toFixed(4)): null;
  const candles = item.candles || null;
  return { cells, min, max, spread, base, candles,
           unit: (candles && min != null) ? Number((min / candles).toFixed(2)) : null };
}

// ---------------------------------------------------------------- 篩選 / 排序

function matchQuery(item) {
  const q = $("searchQ").value.trim().toLowerCase();
  if (!q) return true;
  return [...Object.values(item.name || {}), item.sku, item.group]
    .some(v => (v || "").toLowerCase().includes(q));
}

function isLimitedActive(item) {
  if (!item.until) return false;          // 沒有結束時間 = 常駐
  const now = Date.now();
  const until = Date.parse(item.until);
  if (Number.isNaN(until)) return false;
  const from = item.from ? Date.parse(item.from) : null;
  if (from && !Number.isNaN(from) && now < from) return false;
  return now <= until;
}

function sortItems(rows) {
  const mode = $("sortMode").value || "cheapest";
  const withRow = rows.map(item => ({ item, row: computeRow(item) }));
  const byName = (a, b) => nameOf(a.item).localeCompare(nameOf(b.item),
    { zh: "zh-Hans", ja: "ja", en: "en" }[LANG] || "en");

  withRow.sort((a, b) => {
    switch (mode) {
      case "cheapest":
      case "priciest": {
        const am = a.row.min, bm = b.row.min;
        if (am == null) return 1;
        if (bm == null) return -1;
        return (mode === "cheapest" ? am - bm : bm - am) || byName(a, b);
      }
      case "spread":
        return (b.row.spread ?? -1) - (a.row.spread ?? -1) || byName(a, b);
      case "unit": {
        // 沒有蠟燭數的一律沉底，不然會跟有單價的混在一起看不出名堂
        const au = a.row.unit, bu = b.row.unit;
        if (au == null && bu == null) return byName(a, b);
        if (au == null) return 1;
        if (bu == null) return -1;
        return au - bu || byName(a, b);
      }
      case "group":
        return (a.item.group || "").localeCompare(b.item.group || "") || byName(a, b);
      default:
        return byName(a, b);
    }
  });
  return withRow;
}

// ---------------------------------------------------------------- 倒數 / 履歷

function fmtDuration(ms) {
  const u = getI18nNode('units') || { d: "d", h: "h", m: "m", s: "s" };
  let sec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(sec / 86400); sec %= 86400;
  const h = Math.floor(sec / 3600); sec %= 3600;
  const m = Math.floor(sec / 60); sec %= 60;
  // 只顯示最重要的兩個單位：剩三天不用報到秒，剩三分鐘才需要
  if (d) return `${d}${u.d} ${h}${u.h}`;
  if (h) return `${h}${u.h} ${m}${u.m}`;
  if (m) return `${m}${u.m} ${sec}${u.s}`;
  return `${sec}${u.s}`;
}

function countdownText(item, now = Date.now()) {
  if (!item.until) return null;
  const until = Date.parse(item.until);
  if (Number.isNaN(until)) return null;
  const from = item.from ? Date.parse(item.from) : null;
  if (from && !Number.isNaN(from) && now < from) return t("startsIn", { t: fmtDuration(from - now) });
  if (now <= until) return t("endsIn", { t: fmtDuration(until - now) });
  return t("endedAgo", { t: fmtDuration(now - until) });
}

function tickCountdowns() {
  if (tab !== "price") return;
  const now = Date.now();
  document.querySelectorAll("#priceTableWrap .countdown").forEach(el => {
    const s = countdownText({ until: el.dataset.until, from: el.dataset.from || "" }, now);
    if (s != null && el.textContent !== s) el.textContent = s;
  });
}

const DAY = 86400000;
function lifeText(item) {
  const L = item.life;
  if (!L) return "";
  const parts = [];
  if (L.run > 1) parts.push(t("life.run", { n: L.run }));
  if (L.back) parts.push(t("life.back", { d: L.back }));
  if (L.gone) {
    const days = Math.round((Date.now() - Date.parse(L.gone)) / DAY);
    if (Number.isFinite(days)) parts.push(t("life.gone", { n: Math.max(0, days) }));
  }
  return parts.join(" · ");
}

// ---------------------------------------------------------------- 價格表

function itemBadges(item) {
  const out = [];
  for (const code of item.labels || []) {
    out.push(`<span class="badge badge-label">${esc(t(`badges.${code}`) === `badges.${code}` ? code : t(`badges.${code}`))}</span>`);
  }
  if (item.free) out.push(`<span class="badge badge-free">${esc(t("badges.free"))}</span>`);
  if (item.uses > 1) out.push(`<span class="badge">${esc(t("badges.uses", { n: item.uses }))}</span>`);
  if (item.switch_note) {
    out.push(`<span class="badge badge-switch" title="${esc(t("switchNote"))}">${esc(t("switchTag"))}</span>`);
  }
  if ((item.blocked || []).length) {
    out.push(`<span class="badge badge-warn">${esc(t("badges.unavailable"))}</span>`);
  }
  return out.join("");
}

function periodText(item) {
  return item.until ? t("until", { d: item.until.slice(0, 10) }) : t("permanent");
}

function renderPriceTable() {
  const wrap = $("priceTableWrap");
  const selected = orderedRegions();
  if (!selected.length) {
    wrap.innerHTML = `<div class="empty-table">${esc(t("emptyRegions"))}</div>`;
    $("dataMeta").textContent = "";
    return;
  }

  const onlyActive = $("onlyActive").checked;
  const filtered = items.filter(it =>
    (!activeGroup || it.group === activeGroup) &&
    (!onlyActive || isLimitedActive(it)) && matchQuery(it));

  const mode = $("displayMode").value || "converted";
  const base = $("baseCurrency").value;
  const showConverted = mode === "converted" && hasRates();
  const showUnit = showConverted && filtered.some(it => it.candles);

  // 每燭單價排在商品後面、各地區之前：它是「哪個划算」的答案，
  // 放最後會被 37 欄地區擠到要橫向捲動才看得到
  const heads = [t("head.item")];
  if (showUnit) heads.push(t("head.unit"));
  heads.push(...selected.map(regionShort));
  if (showConverted) heads.push(t("head.min"), t("head.max"), t("head.spread"));

  const sorted = sortItems(filtered);
  let html = `<table class="responsive-table price-table"><thead><tr>${
    heads.map((h, i) => {
      const cls = i === 0 ? ' class="col-item"' : (showUnit && i === 1 ? ' class="unit-col"' : "");
      return `<th${cls}>${esc(h)}</th>`;
    }).join("")}</tr></thead><tbody>`;

  for (const { item, row } of sorted) {
    const cells = [];
    const cd = countdownText(item);
    const life = lifeText(item);
    const badges = itemBadges(item);

    cells.push(`<td class="name-cell" data-label="${esc(t("head.item"))}">
      <div class="item-line">
        ${item.image ? `<img class="item-img" src="${esc(item.image)}" alt="" loading="lazy">` : ""}
        <div class="item-text">
          <div class="item-name"><button type="button" class="item-link" data-chart="${esc(item.sku)}">${esc(nameOf(item))}</button></div>
          <div class="item-sub">
            <span>${esc(t(`groups.${item.group}`) === `groups.${item.group}` ? item.group : t(`groups.${item.group}`))} · ${esc(periodText(item))}</span>
            ${cd ? `<span class="countdown" data-until="${esc(item.until)}" data-from="${esc(item.from || "")}">${esc(cd)}</span>` : ""}
            ${life ? `<span class="life-tag">${esc(life)}</span>` : ""}
            ${badges}
          </div>
        </div>
      </div></td>`);

    if (showUnit) {
      cells.push(`<td class="price-cell unit" data-label="${esc(t("head.unit"))}">${
        row.unit != null
          ? `<div class="price-main">${esc(fmtMoney(row.unit, base, "symbol"))}</div>
             <div class="price-sub">${esc(row.candles)}${item.candle_type === "bonus" ? "+" : ""}</div>`
          : '<span class="dash">—</span>'}</td>`);
    }

    for (const c of row.cells) {
      const label = regionShort(c.code);
      if (c.amount == null) {
        cells.push(`<td class="price-cell dash" data-label="${esc(label)}">—</td>`);
        continue;
      }
      const isMin = showConverted && !c.blocked && row.min != null && Math.abs(c.converted - row.min) < 1e-9;
      const isMax = showConverted && !c.blocked && row.max != null && row.max !== row.min
        && Math.abs(c.converted - row.max) < 1e-9;
      const main = showConverted && c.converted != null
        ? fmtMoney(c.converted, base, "symbol")
        : fmtMoney(c.amount, c.currency, "code");
      const sub = showConverted && c.converted != null
        ? `<div class="price-sub">${esc(fmtMoney(c.amount, c.currency, "code"))}</div>` : "";
      const cls = ["price-cell", isMin && "cheapest", isMax && "priciest", c.blocked && "blocked"]
        .filter(Boolean).join(" ");
      cells.push(`<td class="${cls}" data-label="${esc(label)}"${
        c.blocked ? ` title="${esc(t("badges.unavailable"))}"` : ""}>
        <div class="price-main">${esc(main)}</div>${sub}</td>`);
    }

    if (showConverted) {
      cells.push(`<td class="price-cell summary" data-label="${esc(t("head.min"))}">${
        row.min != null ? esc(fmtMoney(row.min, base, "symbol")) : "—"}</td>`);
      cells.push(`<td class="price-cell summary" data-label="${esc(t("head.max"))}">${
        row.max != null ? esc(fmtMoney(row.max, base, "symbol")) : "—"}</td>`);
      cells.push(`<td class="price-cell summary spread" data-label="${esc(t("head.spread"))}">${
        row.spread != null ? `+${(row.spread * 100).toFixed(0)}%` : "—"}</td>`);
    }
    html += `<tr>${cells.join("")}</tr>`;
  }

  wrap.innerHTML = sorted.length ? html + "</tbody></table>"
    : `<div class="empty-table">${esc(t("emptyItems"))}</div>`;
  wrap.querySelectorAll("[data-chart]").forEach(b => { b.onclick = () => openDetail(b.dataset.chart); });
  tickCountdowns();

  let line = t("showing", { shown: sorted.length, all: items.length, regions: selected.length });
  if (liveFetchedAt) line += ` · ${t("updated", { t: liveFetchedAt })} · 实时`;
  else if (meta?.fetched) line += ` · ${t("updated", { t: meta.fetched })}`;
  const r = meta?.rates;
  if (showConverted && r?.source) line += ` · ${t("rateNote", { date: (r.date || "").slice(0, 16), src: r.source })}`;
  else if (mode === "converted" && !hasRates()) line += ` · ${t("rateMissing")}`;
  $("dataMeta").textContent = line;
}

// ---------------------------------------------------------------- 變更 / 歷史

/** 歷史條目只存 sku，名稱與圖片一律查 catalog（永不刪除，所以查得到）。 */
function catalogEntry(sku) {
  return catalog[sku] || { name: { en: sku }, group: "", image: "" };
}

function diffItemHtml(entry, kind) {
  const c = catalogEntry(entry.sku);
  const group = t(`groups.${c.group}`) === `groups.${c.group}` ? c.group : t(`groups.${c.group}`);
  const suffix = kind === "removed" ? t("gone") : kind === "added" ? t("isNew") : "";
  let extra = "";
  if (kind === "changed" && entry.changes?.length) {
    extra = `<div class="diff-changes">${entry.changes.map(([region, from, to]) => {
      const cur = currencyOf(region);
      const dir = (from != null && to != null) ? (to > from ? "up" : "down") : "";
      return `<span class="chg ${dir}">${esc(regionShort(region))} ${
        esc(from != null ? fmtMoney(from, cur, "code") : "—")} → ${
        esc(to != null ? fmtMoney(to, cur, "code") : "—")}</span>`;
    }).join("")}</div>`;
  }
  return `<li>
    <div class="diff-line">
      ${c.image ? `<img class="diff-img" src="${esc(c.image)}" alt="" loading="lazy">` : ""}
      <div class="diff-text">
        <div class="diff-name">${esc(nameOf(c))}<span class="diff-suffix">${esc(suffix)}</span></div>
        <div class="diff-time">${esc(group)}</div>
      </div>
    </div>${extra}</li>`;
}

function renderDiffList(id, list, emptyText, kind) {
  $(id).innerHTML = list?.length
    ? list.map(x => diffItemHtml(x, kind)).join("")
    : `<li class="empty">${esc(emptyText)}</li>`;
}

function renderDiff() {
  const s = latest || {};
  const parts = [];
  if (s.at) parts.push(t("diff.recorded", { t: s.at }));
  if (s.unchanged_since) parts.push(t("diff.unchanged"));
  parts.push(t("diff.count", { n: diffMeta.history_count ?? changeLog.length,
                               limit: diffMeta.history_limit ?? "?" }));
  $("diffMeta").textContent = parts.join(" · ");
  $("dataMeta").textContent = t("diff.title");
  const rec = s.recorded;
  renderDiffList("diffAdded", s.added, rec ? t("diff.emptyAdd") : t("diff.none"), "added");
  renderDiffList("diffRemoved", s.removed, rec ? t("diff.emptyDel") : t("diff.none"), "removed");
  renderDiffList("diffChanged", s.changed, rec ? t("diff.emptyChg") : t("diff.none"), "changed");
}

function renderHistory() {
  $("dataMeta").textContent = t("history.title") + " · "
    + t("diff.count", { n: diffMeta.history_count ?? changeLog.length,
                        limit: diffMeta.history_limit ?? "?" });
  const wrap = $("historyWrap");
  if (!changeLog.length) {
    wrap.innerHTML = `<div class="empty-table">${esc(t("history.empty"))}</div>`;
    return;
  }
  wrap.innerHTML = changeLog.map(rec => {
    const [a, r, c] = rec.n || [0, 0, 0];
    const blocks = [["added", t("diff.added"), rec.added],
                    ["removed", t("diff.removed"), rec.removed],
                    ["changed", t("diff.changed"), rec.changed]].filter(([, , l]) => l?.length);
    return `<details class="history-item">
      <summary>
        <span class="history-time">${esc(rec.at || "")}</span>
        <span class="history-sum">${esc(t("history.summary", { a, r, c }))}</span>
      </summary>
      <div class="history-body">${blocks.map(([kind, head, list]) => `
        <div class="diff-block"><h3>${esc(head)}</h3>
          <ul class="diff-list">${list.map(x => diffItemHtml(x, kind)).join("")}</ul>
        </div>`).join("")}</div>
    </details>`;
  }).join("");
}

// ---------------------------------------------------------------- 價位對照

/*
 * 資料來自 data/tier_history.json（tools/tier_history.py 產生）。
 * 一列是一個美區價格級距，格子是該級距當時在架商品的當地價。
 * - 待定：所有紀錄裡都沒出現過的級距
 * - 當前無禮包：出現過，但所選時間點沒有在架商品（附最後一次看到的值）
 * - 變動標記只看當地價；勾「比較匯率」時換算數字會因匯率不同而不同，不算變動
 */
const LOCAL_FMT = {};
function fmtLocal(v) {
  const locale = { zh: "zh-Hans", ja: "ja", en: "en" }[LANG] || "en";
  LOCAL_FMT[locale] ||= new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return LOCAL_FMT[locale].format(v);
}
const fmtLocalList = (vals) => vals.map(fmtLocal).join(" / ");

function tierRecords() {
  if (!tierData) return [];
  const list = (tierData.snapshots || []).map((s, i) => ({ id: `s${i}`, rec: s, known: s.known || {} }));
  if (tierData.current) list.push({ id: "cur", rec: tierData.current, known: tierData.known || {}, latest: true });
  return list;
}

function tierLabel(r) {
  return r.latest ? t("tier.latest", { at: r.rec.at }) : t("tier.snapshot", { at: r.rec.at });
}

function renderTierOptions() {
  const recs = tierRecords();
  const fill = (sel, want, fallback) => {
    sel.innerHTML = recs.map(r => `<option value="${esc(r.id)}">${esc(tierLabel(r))}</option>`).join("");
    const ids = recs.map(r => r.id);
    sel.value = ids.includes(want) ? want : fallback;
    sel.disabled = !recs.length;
  };
  // 預設：最早的快照 對 最新紀錄
  fill($("tierA"), tierPick.a, recs[0]?.id || "");
  fill($("tierB"), tierPick.b, recs[recs.length - 1]?.id || "");
  tierPick = { a: $("tierA").value, b: $("tierB").value };
}

function tierRows() {
  const fixed = tierData?.meta?.tiers || [];
  const seen = Object.keys(tierData?.known || {});
  return [...new Set([...fixed, ...seen])].sort((a, b) => parseFloat(a) - parseFloat(b));
}

/** 某時間點、某級距、某地區的狀態。 */
function tierCell(r, tier, code) {
  if (!(tier in (tierData.known || {}))) return { state: "tbd" };
  const present = r.rec.cells?.[tier];
  if (present) {
    const v = present[code];
    return v ? { state: "ok", v } : { state: "unknown" };
  }
  return { state: "none", last: r.known?.[tier]?.[code] || null };
}
const cmpVal = (c) => c.state === "ok" ? c.v : c.state === "none" && c.last ? c.last.v : null;

function convList(vals, code, base, rates) {
  if (!rates) return null;
  const out = vals.map(v => convertAt(v, currencyOf(code), base, rates));
  return out.some(x => x == null) ? null : out;
}
const fmtConvList = (vals, base) => vals.map(v => fmtMoney(v, base, "symbol")).join(" / ");

function tierCellHtml(A, B, a, b, code, fx, base) {
  const label = regionShort(code);
  if (b.state === "tbd") return `<td class="price-cell tier-tbd" data-label="${esc(label)}"><span class="tier-tag tag-tbd">${esc(t("tier.tbd"))}</span></td>`;
  if (b.state === "unknown") return `<td class="price-cell dash" data-label="${esc(label)}">${esc(t("tier.unknown"))}</td>`;

  const va = cmpVal(a), vb = cmpVal(b);
  const changed = va && vb && JSON.stringify(va) !== JSON.stringify(vb);
  let dir = "";
  if (changed) dir = (va.length === 1 && vb.length === 1) ? (vb[0] > va[0] ? "up" : "down") : "mixed";
  const arrow = { up: " ▲", down: " ▼", mixed: " ≠" }[dir] || "";
  const cls = ["price-cell", changed && `tier-chg ${dir}`].filter(Boolean).join(" ");

  if (b.state === "none") {
    const last = b.last ? `<div class="price-sub">${esc(t("tier.last", { v: fmtLocalList(b.last.v), d: b.last.seen }))}</div>` : "";
    const chg = changed ? `<div class="price-sub chg ${dir === "mixed" ? "" : dir}">${esc(`${fmtLocalList(va)} → ${fmtLocalList(vb)}${arrow}`)}</div>` : "";
    return `<td class="${cls}" data-label="${esc(label)}"><span class="tier-tag tag-none">${esc(t("tier.none"))}</span>${last}${chg}</td>`;
  }

  // b.state === "ok"
  const loc = changed ? `${fmtLocalList(va)} → ${fmtLocalList(vb)}${arrow}` : fmtLocalList(vb);
  let main = loc, sub = "";
  if (fx) {
    const cb = convList(vb, code, base, B.rec.rates);
    // A 那邊若是「當前無禮包」，比較用的是最後一次看到的值，沒有對應的匯率快照，
    // 只換算 B，A → B 留在當地價那行
    const ca = changed && a.state === "ok" ? convList(va, code, base, A.rec.rates) : null;
    if (cb) {
      main = ca ? `${fmtConvList(ca, base)} → ${fmtConvList(cb, base)}` : fmtConvList(cb, base);
      sub = loc;
    } else {
      sub = t("tier.noRate");
    }
  }
  const note = a.state === "none" ? t("tier.aNone") : "";
  return `<td class="${cls}" data-label="${esc(label)}">
    <div class="price-main">${esc(main)}</div>${sub ? `<div class="price-sub">${esc(sub)}</div>` : ""}${
    note ? `<div class="price-sub">${esc(note)}</div>` : ""}</td>`;
}

function renderTierTable() {
  const wrap = $("tierTableWrap");
  const recs = tierRecords();
  if (!tierData || !recs.length) {
    wrap.innerHTML = `<div class="empty-table">${esc(t("tier.empty"))}</div>`;
    $("dataMeta").textContent = "";
    $("tierNote").textContent = "";
    return;
  }
  const selected = orderedRegions();
  if (!selected.length) {
    wrap.innerHTML = `<div class="empty-table">${esc(t("emptyRegions"))}</div>`;
    return;
  }
  const A = recs.find(r => r.id === $("tierA").value) || recs[0];
  const B = recs.find(r => r.id === $("tierB").value) || recs[recs.length - 1];
  const fx = $("tierFx").checked && hasRates();
  const base = $("baseCurrency").value;

  let html = `<table class="responsive-table price-table tier-table"><thead><tr><th class="col-tier">${esc(t("tier.head"))}</th>${
    selected.map(c => `<th>${esc(regionShort(c))}<div class="th-cur">${esc(currencyOf(c))}</div></th>`).join("")}</tr></thead><tbody>`;
  let nChanged = 0;
  for (const tier of tierRows()) {
    const cells = selected.map(code => {
      const a = tierCell(A, tier, code), b = tierCell(B, tier, code);
      const va = cmpVal(a), vb = cmpVal(b);
      if (va && vb && JSON.stringify(va) !== JSON.stringify(vb)) nChanged++;
      return tierCellHtml(A, B, a, b, code, fx, base);
    });
    html += `<tr><td class="name-cell tier-name">USD ${esc(tier)}</td>${cells.join("")}</tr>`;
  }
  wrap.innerHTML = html + "</tbody></table>";

  const parts = [t("tier.compare", { a: tierLabel(A), b: tierLabel(B) }), t("tier.changedCount", { n: nChanged })];
  if (fx) {
    const rd = (r) => r.rec.rate_date ? String(r.rec.rate_date).slice(0, 16) : t("tier.unknown");
    parts.push(t("tier.rateDates", { a: rd(A), b: rd(B) }));
  }
  $("dataMeta").textContent = parts.join(" · ");
  $("tierNote").textContent = t("tier.note") + (fx ? " " + t("tier.fxNote") : "");
}

// ---------------------------------------------------------------- 版本紀錄

function renderVersion() {
  $("dataMeta").textContent = t("version.title");
  const list = Array.isArray(getI18nNode('changelog')) ? getI18nNode('changelog') : [];
  $("versionWrap").innerHTML = list.length ? list.map((v, i) => `
    <details class="history-item"${i === 0 ? " open" : ""}>
      <summary>
        <span class="history-time">v${esc(v.v)}</span>
        <span class="history-sum">${esc(v.date || t("version.noDate"))}</span>
      </summary>
      <div class="history-body"><ul class="version-list">${
        (v.items || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </details>`).join("")
    : `<div class="empty-table">${esc(t("version.empty"))}</div>`;
}

// ---------------------------------------------------------------- 走勢圖

const LINE_COLORS = ["#93c5fd", "#86efac", "#fca5a5", "#fcd34d",
                     "#c4b5fd", "#5eead4", "#f9a8d4", "#fdba74"];
const CW = 720, CH = 260, PAD = { t: 14, r: 14, b: 26, l: 58 };

const seriesFor = (sku) => priceHistory?.series?.[sku] || null;

function hasSeries(sku) {
  const s = seriesFor(sku);
  return !!s && orderedRegions().some(c => (s[c] || []).length >= 2);
}

/**
 * 把一段期間的變化拆成「商城調價」與「匯率波動」。
 * 兩者相乘不是相加：(1+local)(1+fx) = 1+total。
 */
function splitChange(points, snaps, currency, base) {
  if (!points || points.length < 2) return null;
  const [d0, a0] = points[0], [d1, a1] = points[points.length - 1];
  const c0 = convertAt(a0, currency, base, snaps[d0]);
  const c1 = convertAt(a1, currency, base, snaps[d1]);
  if (c0 == null || c1 == null || c0 === 0 || a0 === 0) return null;
  const localPct = (a1 / a0) - 1, totalPct = (c1 / c0) - 1;
  return { from: d0, to: d1, currency, base, localFrom: a0, localTo: a1,
           baseFrom: c0, baseTo: c1, localPct, totalPct,
           fxPct: ((1 + totalPct) / (1 + localPct)) - 1, repriced: a0 !== a1 };
}

const pct = (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
const pctCls = (v) => (Math.abs(v) < 0.0005 ? "" : v > 0 ? "up" : "down");

function chartLines(sku, mode, base) {
  const series = seriesFor(sku);
  const snaps = priceHistory?.rates || {};
  if (!series) return [];
  const out = [];
  let ci = 0;
  for (const code of orderedRegions()) {
    const pts = series[code] || [];
    if (pts.length < 2) continue;
    const currency = currencyOf(code);
    const mapped = [];
    for (const [date, amount] of pts) {
      const v = mode === "local"
        ? amount / pts[0][1] * 100                       // 指數化：起點 100，只反映調價
        : convertAt(amount, currency, base, snaps[date]);
      if (v != null) mapped.push({ date, t: Date.parse(date), v, raw: amount });
    }
    if (mapped.length < 2) continue;
    out.push({ code, currency, points: mapped, color: LINE_COLORS[ci++ % LINE_COLORS.length],
               split: splitChange(pts, snaps, currency, base) });
  }
  return out;
}

function buildChartSvg(lines, mode, base) {
  const allT = lines.flatMap(l => l.points.map(p => p.t));
  const allV = lines.flatMap(l => l.points.map(p => p.v));
  const t0 = Math.min(...allT), t1 = Math.max(...allT);
  let v0 = Math.min(...allV), v1 = Math.max(...allV);
  if (v1 === v0) { v0 -= 1; v1 += 1; }                 // 完全沒變動也要畫得出線
  const pad = (v1 - v0) * 0.12; v0 -= pad; v1 += pad;

  const iw = CW - PAD.l - PAD.r, ih = CH - PAD.t - PAD.b;
  const X = (x) => PAD.l + (t1 === t0 ? iw / 2 : (x - t0) / (t1 - t0) * iw);
  const Y = (y) => PAD.t + ih - (y - v0) / (v1 - v0) * ih;

  // 價格是階梯狀的（撐著不動然後跳一次），用斜線會假裝它在慢慢漲
  const path = (pts) => pts.map((p, i) => i === 0
    ? `M${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`
    : `H${X(p.t).toFixed(1)}V${Y(p.v).toFixed(1)}`).join("");

  const fmtY = (v) => (mode === "local" ? v.toFixed(0) : fmtMoney(v, base, "symbol"));
  const grid = [0, .25, .5, .75, 1].map(f => v0 + (v1 - v0) * f).map(v => `
    <line class="grid" x1="${PAD.l}" y1="${Y(v).toFixed(1)}" x2="${CW - PAD.r}" y2="${Y(v).toFixed(1)}"/>
    <text class="axis" x="${PAD.l - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmtY(v))}</text>`).join("");
  const dates = [t0, t1].map((x, i) => `
    <text class="axis" x="${i === 0 ? PAD.l : CW - PAD.r}" y="${CH - 8}"
      text-anchor="${i === 0 ? "start" : "end"}">${new Date(x).toISOString().slice(0, 10)}</text>`).join("");
  const paths = lines.map(l => `
    <path class="line" d="${path(l.points)}" stroke="${l.color}"/>
    ${l.points.map(p => `<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.6" fill="${l.color}"/>`).join("")}`).join("");
  const legend = lines.map(l =>
    `<span class="legend-item"><i style="background:${l.color}"></i>${esc(regionShort(l.code))}</span>`).join("");

  return `<svg class="price-chart" viewBox="0 0 ${CW} ${CH}" preserveAspectRatio="xMidYMid meet" role="img">
      ${grid}${dates}${paths}</svg>
    <div class="chart-legend">${legend}</div>`;
}

function buildSplitTable(lines) {
  const rows = lines.map(l => {
    const s = l.split;
    if (!s) return `<tr><td>${esc(regionShort(l.code))}</td><td colspan="3" class="dash">${esc(t("fx.insufficient"))}</td></tr>`;
    return `<tr>
      <td>${esc(regionShort(l.code))}<div class="split-period">${esc(t("fx.period", { a: s.from, b: s.to }))}</div></td>
      <td class="num ${pctCls(s.localPct)}">${s.repriced ? esc(pct(s.localPct)) : `<span class="dash">${esc(t("fx.noReprice"))}</span>`}
        <div class="split-sub">${esc(fmtMoney(s.localFrom, s.currency, "code"))} → ${esc(fmtMoney(s.localTo, s.currency, "code"))}</div></td>
      <td class="num ${pctCls(s.fxPct)}">${esc(pct(s.fxPct))}</td>
      <td class="num strong ${pctCls(s.totalPct)}">${esc(pct(s.totalPct))}
        <div class="split-sub">${esc(fmtMoney(s.baseFrom, s.base, "symbol"))} → ${esc(fmtMoney(s.baseTo, s.base, "symbol"))}</div></td>
    </tr>`;
  });
  return `<h3 class="split-head">${esc(t("fx.heading"))}</h3>
    <div class="table-wrap split-wrap"><table class="split-table">
      <thead><tr><th></th><th>${esc(t("fx.repriced"))}</th><th>${esc(t("fx.rate"))}</th><th>${esc(t("fx.total"))}</th></tr></thead>
      <tbody>${rows.join("")}</tbody></table></div>
    <p class="meta chart-hint">${esc(t("chart.hint"))}</p>`;
}

/** 每個轉折點的實際數字。SVG 的 hover tooltip 手機看不到，所以另外列一份。 */
function buildPointTable(lines, base) {
  const rows = lines.map(l => {
    const snaps = priceHistory?.rates || {};
    const pts = l.points.map(p => {
      const conv = convertAt(p.raw, l.currency, base, snaps[p.date]);
      return `<tr>
        <td class="pt-date">${esc(p.date)}</td>
        <td class="num">${esc(fmtMoney(p.raw, l.currency, "code"))}</td>
        <td class="num">${conv != null ? esc(fmtMoney(conv, base, "symbol")) : "—"}</td></tr>`;
    }).join("");
    return `<div class="pt-block">
      <h4><i style="background:${l.color}"></i>${esc(regionName(l.code))}</h4>
      <table class="pt-table"><thead><tr>
        <th>${esc(t("chart.date"))}</th><th>${esc(t("chart.localPrice"))}</th><th>${esc(t("chart.basePrice"))}</th>
      </tr></thead><tbody>${pts}</tbody></table></div>`;
  });
  return `<details class="point-details"><summary>${esc(t("chart.points"))}</summary>
    <div class="pt-grid">${rows.join("")}</div></details>`;
}

function descOf(sku) {
  const pool = liveDescriptions || DESCRIPTIONS;
  for (const lang of [LANG, 'en', 'zh']) {
    const d = pool[lang];
    if (d && d[sku]) return d[sku];
  }
  return "";
}

function renderDetail() {
  if (!chartSku) return;
  const item = items.find(i => i.sku === chartSku) || { sku: chartSku, ...catalogEntry(chartSku) };
  const mode = $("chartMode").value || "converted";
  const base = $("baseCurrency").value;
  const lines = chartLines(chartSku, mode, base);

  $("chartTitle").textContent = nameOf(item) || chartSku;

  const head = [];
  const preview = item.preview || "";
  if (preview) {
    head.push(/\.mp4($|[?#])/i.test(preview)
      ? `<video class="item-preview" src="${esc(preview)}" autoplay loop muted playsinline></video>`
      : `<img class="item-preview" src="${esc(preview)}" alt="">`);
  } else if (item.image) {
    head.push(`<img class="item-preview item-preview-static" src="${esc(item.image)}" alt="">`);
  }
  const desc = descOf(chartSku);
  if (desc) head.push(`<p class="item-desc">${esc(desc)}</p>`);
  if (item.switch_note && !desc) head.push(`<p class="item-desc">${esc(t("switchNote"))}</p>`);
  const badges = itemBadges(item);
  if (badges) head.push(`<div class="item-sub detail-badges">${esc(badges)}</div>`);

  $("chartBody").innerHTML =
    (head.length ? `<div class="detail-head">${head.join("")}</div>` : "") +
    (lines.length
      ? buildChartSvg(lines, mode, base) + buildPointTable(lines, base) + buildSplitTable(lines, base)
      : `<div class="empty-table">${esc(t("chart.noData"))}</div>`);
  $("chartMode").classList.toggle("hidden", !lines.length);
}

function openDetail(sku) {
  chartSku = sku;
  $("chartModal").classList.remove("hidden");
  $("chartModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderDetail();
}

function closeDetail() {
  chartSku = null;
  $("chartModal").classList.add("hidden");
  $("chartModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ---------------------------------------------------------------- 控制項

function renderRegionChips() {
  const el = $("regionChips");
  el.innerHTML = regions.map(code => {
    const on = selectedRegions.has(code);
    return `<button type="button" class="chip${on ? " active-chip" : ""}" data-region="${esc(code)}">
      ${esc(regionName(code))} <span class="chip-cur">${esc(currencyOf(code))}</span></button>`;
  }).join("");
  el.querySelectorAll("[data-region]").forEach(btn => {
    btn.onclick = () => {
      const c = btn.dataset.region;
      selectedRegions.has(c) ? selectedRegions.delete(c) : selectedRegions.add(c);
      renderRegionChips(); savePrefs(); renderTab();
    };
  });
}

function renderGroupChips() {
  const groups = [...new Set(items.map(i => i.group))];
  const el = $("groupChips");
  const mk = (key, label) =>
    `<button type="button" class="chip${activeGroup === key ? " active-chip" : ""}" data-group="${esc(key)}">${esc(label)}</button>`;
  el.innerHTML = mk("", t("groupsAll")) + groups.map(g => {
    const label = t(`groups.${g}`);
    return mk(g, label === `groups.${g}` ? g : label);
  }).join("");
  el.querySelectorAll("[data-group]").forEach(btn => {
    btn.onclick = () => { activeGroup = btn.dataset.group; renderGroupChips(); writeUrlState(); renderTab(); };
  });
}

function renderBaseOptions() {
  const sel = $("baseCurrency");
  const available = new Set(Object.keys(rateTable()));
  const list = [...new Set([...BASE_CHOICES, ...regions.map(currencyOf)])]
    .filter(c => !available.size || available.has(c));
  const current = wantedBase || sel.value || DEFAULT_BASE;
  sel.innerHTML = list.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  sel.value = list.includes(current) ? current : (list.includes(DEFAULT_BASE) ? DEFAULT_BASE : list[0]);
  wantedBase = null;              // 只套用一次，之後以使用者當下的選擇為準
  sel.disabled = !hasRates();
}

function renderTab() {
  if (tab === "price") renderPriceTable();
  else if (tab === "diff") renderDiff();
  else if (tab === "tier") renderTierTable();
  else if (tab === "version") renderVersion();
  else renderHistory();
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);
function setTab(name) {
  tab = name;
  TABS.forEach(n => {
    $(`tab${cap(n)}`).classList.toggle("active-tab", n === name);
    $(`panel${cap(n)}`).classList.toggle("hidden", n !== name);
  });
  // 價位對照沿用基準幣與地區勾選；搜尋、分類、排序、顯示模式對它沒有意義，藏起來
  $("priceControls").classList.toggle("hidden", name !== "price" && name !== "tier");
  $("priceControls").classList.toggle("tier-mode", name === "tier");
  writeUrlState();
  renderTab();
}

function applyStaticText() {
  $("pageTitle").textContent = t("title");
  $("hint").textContent = t("hint");
  $("disclaimer").textContent = t("disclaimer");
  $("siteFooter").textContent = t("footer");
  $("tabPrice").textContent = t("tabs.price");
  $("tabDiff").textContent = t("tabs.diff");
  $("tabHistory").textContent = t("tabs.history");
  $("tabTier").textContent = t("tabs.tier");
  $("tabVersion").textContent = t("tabs.version");
  $("tierALabel").textContent = t("tier.dateA");
  $("tierBLabel").textContent = t("tier.dateB");
  $("tierFxLabel").textContent = t("tier.fx");
  $("searchQ").placeholder = t("search");
  $("baseLabel").textContent = t("baseLabel");
  $("modeLabel").textContent = t("modeLabel");
  $("sortLabel").textContent = t("sortLabel");
  $("onlyActiveLabel").textContent = t("onlyActive");
  $("regionsLabel").textContent = t("regionsLabel");
  $("regionAll").textContent = t("all");
  $("regionNone").textContent = t("none");
  $("regionDefault").textContent = t("default");
  $("copyLinkBtn").textContent = t("copyLink");
  $("diffAddedH").textContent = t("diff.added");
  $("diffRemovedH").textContent = t("diff.removed");
  $("diffChangedH").textContent = t("diff.changed");
  $("chartClose").textContent = t("chart.close");
  $("displayMode").querySelectorAll("option").forEach(o => { o.textContent = t(`modes.${o.value}`); });
  $("sortMode").querySelectorAll("option").forEach(o => { o.textContent = t(`sorts.${o.value}`); });
  $("chartMode").querySelectorAll("option").forEach(o => {
    o.textContent = t(o.value === "local" ? "chart.local" : "chart.converted");
  });
}

// ---------------------------------------------------------------- 資料初始化（靜態快照）

function initData() {
  store = STORE;
  meta = STORE.meta;
  items = STORE.items || [];
  regions = (meta.regions || []).map(r => r.code);
  regionCurrency = Object.fromEntries((meta.regions || []).map(r => [r.code, r.currency]));
  latest = DIFF?.latest || null;
  changeLog = DIFF?.history || [];
  catalog = DIFF?.catalog || {};
  diffMeta = DIFF?.meta || {};
  priceHistory = PRICE_HISTORY;
  tierData = TIER_HISTORY;
  renderTierOptions();

  const available = new Set(regions);
  const kept = [...selectedRegions].filter(c => available.has(c));
  selectedRegions = new Set(kept.length ? kept : DEFAULT_REGIONS.filter(c => available.has(c)));

  renderBaseOptions();
  renderRegionChips();
  renderGroupChips();
  setMsg(meta?.demo ? t("demoWarning") : "");
  renderTab();
  if (chartSku) renderDetail();

  const parts = [];
  if (meta?.fetched) parts.push(t("updated", { t: meta.fetched }));
  if (meta?.failed_regions?.length) parts.push(`⚠ ${meta.failed_regions.join(", ")}`);
  const fm = $("fetchMeta");
  if (fm) fm.textContent = parts.join(" · ");
}

/** 后台拉到实时数据后热替换模块状态并重渲染。 */
function applyLiveData(live) {
  if (!live || !containerEl) return;
  store = live.store;
  meta = live.store?.meta;
  items = live.store?.items || [];
  regions = (meta?.regions || []).map(r => r.code);
  regionCurrency = Object.fromEntries((meta?.regions || []).map(r => [r.code, r.currency]));
  latest = live.diff?.latest || null;
  changeLog = live.diff?.history || [];
  catalog = live.diff?.catalog || {};
  diffMeta = live.diff?.meta || {};
  priceHistory = live.priceHistory;
  tierData = live.tierHistory;
  if (live.liveDescriptions) liveDescriptions = live.liveDescriptions;
  liveFetchedAt = live.fetchedAt;

  const available = new Set(regions);
  const kept = [...selectedRegions].filter(c => available.has(c));
  selectedRegions = new Set(kept.length ? kept : DEFAULT_REGIONS.filter(c => available.has(c)));

  renderTierOptions();
  renderBaseOptions();
  renderRegionChips();
  renderGroupChips();
  renderTab();
  if (chartSku) renderDetail();

  const fm = $("fetchMeta");
  if (fm) fm.textContent = `实时 · ${live.fetchedAt || ""}`;
}

// ---------------------------------------------------------------- 骨架

const SKELETON = `
<div class="pc-view fun-view">
  <div class="fun-wrap">
    <h1 id="pageTitle" class="fun-h1"></h1>
    <div class="hint" id="hint"></div>

    <section class="card">
      <p id="fetchMeta" class="meta"></p>
      <p id="msg"></p>
    </section>

    <section class="card">
      <div class="row tab-bar">
        <button id="tabPrice" class="active-tab" type="button"></button>
        <button id="tabDiff" type="button"></button>
        <button id="tabHistory" type="button"></button>
        <button id="tabTier" type="button"></button>
        <button id="tabVersion" type="button"></button>
      </div>

      <div id="priceControls">
        <div class="row toolbar price-only">
          <input id="searchQ" class="field-grow" autocomplete="off">
          <label class="meta chk-only-active">
            <input type="checkbox" id="onlyActive"> <span id="onlyActiveLabel"></span>
          </label>
        </div>

        <div class="control-grid">
          <label class="control-field">
            <span id="baseLabel"></span>
            <select id="baseCurrency"></select>
          </label>
          <label class="control-field price-only">
            <span id="modeLabel"></span>
            <select id="displayMode">
              <option value="converted"></option>
              <option value="original"></option>
            </select>
          </label>
          <label class="control-field price-only">
            <span id="sortLabel"></span>
            <select id="sortMode">
              <option value="cheapest"></option>
              <option value="priciest"></option>
              <option value="spread"></option>
              <option value="unit"></option>
              <option value="name"></option>
              <option value="group"></option>
            </select>
          </label>
        </div>

        <div id="groupChips" class="row chip-row price-only"></div>

        <div class="region-head">
          <span id="regionsLabel"></span>
          <button id="regionAll" class="mini-btn" type="button"></button>
          <button id="regionNone" class="mini-btn" type="button"></button>
          <button id="regionDefault" class="mini-btn" type="button"></button>
        </div>
        <div id="regionChips" class="row chip-row"></div>

        <div class="row share-row">
          <button id="copyLinkBtn" class="mini-btn" type="button"></button>
        </div>
      </div>

      <p id="dataMeta" class="meta"></p>

      <div id="panelPrice">
        <div class="table-wrap" id="priceTableWrap"></div>
      </div>

      <div id="panelDiff" class="hidden">
        <div id="diffMeta" class="meta" style="margin-bottom:12px"></div>
        <div class="diff-grid">
          <div class="diff-block"><h3 id="diffAddedH"></h3><ul id="diffAdded" class="diff-list"></ul></div>
          <div class="diff-block"><h3 id="diffRemovedH"></h3><ul id="diffRemoved" class="diff-list"></ul></div>
          <div class="diff-block"><h3 id="diffChangedH"></h3><ul id="diffChanged" class="diff-list"></ul></div>
        </div>
      </div>

      <div id="panelHistory" class="hidden">
        <div id="historyWrap"></div>
      </div>

      <div id="panelTier" class="hidden">
        <div class="control-grid tier-controls">
          <label class="control-field">
            <span id="tierALabel"></span>
            <select id="tierA"></select>
          </label>
          <label class="control-field">
            <span id="tierBLabel"></span>
            <select id="tierB"></select>
          </label>
          <label class="meta chk-only-active">
            <input type="checkbox" id="tierFx"> <span id="tierFxLabel"></span>
          </label>
        </div>
        <p id="tierNote" class="meta tier-note"></p>
        <div class="table-wrap" id="tierTableWrap"></div>
      </div>

      <div id="panelVersion" class="hidden">
        <div id="versionWrap"></div>
      </div>
    </section>

    <p class="disclaimer" id="disclaimer"></p>
    <p class="site-footer" id="siteFooter"></p>
  </div>

  <div id="chartModal" class="chart-modal hidden" aria-hidden="true">
    <div class="chart-modal-panel">
      <div class="chart-modal-head">
        <h2 id="chartTitle"></h2>
        <select id="chartMode" class="chart-mode-select">
          <option value="converted"></option>
          <option value="local"></option>
        </select>
        <button id="chartClose" class="secondary" type="button"></button>
      </div>
      <div id="chartBody"></div>
    </div>
  </div>
</div>`;

function onKeydown(e) { if (e.key === "Escape") closeDetail(); }

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = new URL('../../css/price-compare.css', import.meta.url).href;
  document.head.appendChild(link);
}

export function mount(container) {
  injectStylesheet();
  containerEl = container;
  chartSku = null;
  containerEl.innerHTML = SKELETON;

  applyStaticText();
  loadPrefs();
  setTab(tab);

  $("tabPrice").onclick = () => setTab("price");
  $("tabDiff").onclick = () => setTab("diff");
  $("tabHistory").onclick = () => setTab("history");
  $("tabTier").onclick = () => setTab("tier");
  $("tabVersion").onclick = () => setTab("version");
  $("tierA").onchange = () => { tierPick.a = $("tierA").value; renderTab(); };
  $("tierB").onchange = () => { tierPick.b = $("tierB").value; renderTab(); };
  $("tierFx").onchange = () => { savePrefs(); renderTab(); };
  $("searchQ").oninput = () => renderTab();
  $("onlyActive").onchange = () => renderTab();
  $("baseCurrency").onchange = () => { savePrefs(); renderTab(); if (chartSku) renderDetail(); };
  $("displayMode").onchange = () => { savePrefs(); renderTab(); };
  $("sortMode").onchange = () => { savePrefs(); renderTab(); };
  $("regionAll").onclick = () => { selectedRegions = new Set(regions); renderRegionChips(); savePrefs(); renderTab(); };
  $("regionNone").onclick = () => { selectedRegions = new Set(); renderRegionChips(); savePrefs(); renderTab(); };
  $("regionDefault").onclick = () => {
    const av = new Set(regions);
    selectedRegions = new Set(DEFAULT_REGIONS.filter(c => av.has(c)));
    renderRegionChips(); savePrefs(); renderTab();
  };
  $("copyLinkBtn").onclick = copyShareLink;
  $("chartClose").onclick = closeDetail;
  $("chartMode").onchange = renderDetail;
  $("chartModal").onclick = (e) => { if (e.target.id === "chartModal") closeDetail(); };
  document.addEventListener("keydown", onKeydown);

  initData();

  // 后台拉实时数据（skyiap raw JSON），回来后热替换；失败静默用快照
  loadLivePriceData(LANG).then(live => { if (live) applyLiveData(live); });

  countdownTimer = setInterval(tickCountdowns, 1000);
}

export function unmount() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  document.removeEventListener("keydown", onKeydown);
  if (containerEl) containerEl.innerHTML = "";
  containerEl = null;
  liveDescriptions = null;
  liveFetchedAt = null;
}
