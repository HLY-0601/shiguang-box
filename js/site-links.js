/* ================================================================
   🧭 共通「関連ツール」一覧（「他のツール」引き出し）
   一覧の元データは1か所だけ: https://taipak5000.github.io/tai-item/site-links.json
   （itemリポジトリの site-links.json）。そこを編集すると全サイト（このtai-hubも）
   のサイドバーに反映される。取得結果は端末(localStorage)にキャッシュし、
   オフラインでも前回の一覧で表示する。キーは全サイト共通・端末単位。
   ※tai-hubのルート名(#/<id>)はJSONの id と一致させてある。ROUTESに無いidは
     外部URL（https://taipak5000.github.io/<path>/）へのリンクにフォールバックする。
   ================================================================ */
import { ROUTES } from './router-registry.js';

const SITE_LINKS_URL = 'https://taipak5000.github.io/tai-item/site-links.json';
const SITE_LINKS_CACHE_KEY = 'sky_site_links_v1';

// 非公開のため共通JSONには載せていない、tai-hub内でだけ使うツール。
// afterId の直後に差し込む。
const HUB_ONLY_TOOLS = [
  { id: 'tai-nomacan-pro', afterId: 'tai-nomacan', icon: 'i-compass', ja: 'ノマキャン計算機プロ', en: 'Candle Calculator Pro' },
];

let tools = null;

function parse(d) {
  if (!d || !Array.isArray(d.tools)) return null;
  const ok = d.tools.filter(t => t && /^[A-Za-z0-9._-]+$/.test(t.path) && /^i-[a-z0-9-]+$/.test(t.icon));
  return ok.length ? ok : null;
}

function loadCached() {
  try { return parse(JSON.parse(localStorage.getItem(SITE_LINKS_CACHE_KEY))); } catch (e) { return null; }
}

/** 起動時に呼ぶ。キャッシュがあれば即使えるようにする（無ければgetSiteLinks()はnull） */
export function initSiteLinks() {
  tools = loadCached();
}

/** ネットワークから最新の一覧を取得して保存する。一覧が変わったらtrue */
export async function refreshSiteLinks() {
  const res = await fetch(SITE_LINKS_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const raw = await res.json();
  const fresh = parse(raw);
  if (!fresh) throw new Error('invalid site-links.json');
  const changed = JSON.stringify(fresh) !== JSON.stringify(tools);
  tools = fresh;
  try { localStorage.setItem(SITE_LINKS_CACHE_KEY, JSON.stringify(raw)); } catch (e) { /* noop */ }
  return changed;
}

/** 描画用の一覧（ハブ専用ツール込み）。未取得ならnull */
export function getSiteLinks() {
  if (!tools) return null;
  const list = [];
  tools.forEach(t => {
    list.push(t);
    HUB_ONLY_TOOLS.filter(h => h.afterId === t.id).forEach(h => list.push(h));
  });
  return list;
}

/** リンク先: ハブ内ルートがあれば #/<id>、無ければ外部URL */
export function siteLinkHref(tool) {
  if (ROUTES[tool.id]) return { href: `#/${tool.id}`, hubRoute: `#/${tool.id}` };
  return { href: `https://taipak5000.github.io/${tool.path}/`, hubRoute: '' };
}

export function siteLinkName(tool, lang) {
  return tool[lang] || tool.en || tool.ja;
}
