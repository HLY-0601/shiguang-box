/* ================================================================
   live-source.js — 商城定价实时数据来源（对接 VoidCipher3/skyiap）

   price-compare 原本是移植时固化的静态快照（见 price-compare-view.js
   头注释）。本模块在后台从上游 skyiap 仓库的 raw JSON 拉最新数据，
   拉到就热替换快照；任一失败整体返回 null，调用方静默回落打包快照，
   离线 PWA 不能挂。
   ================================================================ */

const DATA_RAW = 'https://raw.githubusercontent.com/VoidCipher3/skyiap/main/data';
const TIMEOUT_MS = 6000;

// 夜月的界面语言(zh/en/ja) → skyiap 说明文字文件的语言码
const DESC_LANG_MAP = { zh: 'cn', en: 'en', ja: 'ja' };

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'default' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 拉取全部实时定价数据。
 * @param {'zh'|'en'|'ja'} uiLang 当前界面语言（决定拉哪份说明文字）
 * @returns {Promise<object|null>} 失败返回 null，调用方用快照
 */
export async function loadLivePriceData(uiLang) {
  try {
    const [store, diff, priceHistory, tierHistory] = await Promise.all([
      fetchJson(`${DATA_RAW}/store.json`),
      fetchJson(`${DATA_RAW}/store_diff.json`),
      fetchJson(`${DATA_RAW}/price_history.json`),
      fetchJson(`${DATA_RAW}/tier_history.json`),
    ]);
    if (!store || !Array.isArray(store.items)) return null;

    // 说明文字按当前界面语言拉一份；拉不到不挡主表（走快照）
    let liveDescriptions = null;
    const descLang = DESC_LANG_MAP[uiLang] || 'en';
    try {
      const desc = await fetchJson(`${DATA_RAW}/desc.${descLang}.json`);
      if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
        liveDescriptions = { [uiLang]: desc };
      }
    } catch { /* 说明文字缺失不影响价格表 */ }

    return {
      store, diff, priceHistory, tierHistory, liveDescriptions,
      fetchedAt: store.meta?.fetched || null,
    };
  } catch {
    return null;
  }
}
