/* ================================================================
   ハッシュベースのルーター。tai-info/index.html の showTab()/
   applyHashRoute()/hashchange パターン（<section>の表示切替）を、
   モジュール単位のマウント/アンマウントへ一般化したもの。

   GitHub Pages静的ホスティングにはサーバー側ルーティングが無いため
   pushStateではなくハッシュ方式を採用：どんなURLでも必ずindex.htmlに
   解決し、そこからJSがハッシュを見て正しいビューを組み立てる。
   ================================================================ */

import { ROUTES, DEFAULT_ROUTE } from './router-registry.js';

let appRoot = null;
let currentRoute = null; // { toolKey, sub }
let currentEntry = null; // ROUTES[toolKey]
let onRouteChange = null; // (toolKey, sub) => void

export function initRouter(rootEl, opts = {}) {
  appRoot = rootEl;
  onRouteChange = opts.onRouteChange || null;
  window.addEventListener('hashchange', applyRoute);
}

export function startRouter() {
  applyRoute();
}

export function navigate(toolKey, sub) {
  const hash = '#/' + toolKey + (sub ? '/' + sub : '');
  if (location.hash === hash) { applyRoute(); return; }
  location.hash = hash;
}

function parseHashRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [toolKey, sub] = raw.split('/');
  return { toolKey: toolKey || '', sub: sub || '' };
}

function applyRoute() {
  let { toolKey, sub } = parseHashRoute();
  if (!ROUTES[toolKey]) { toolKey = DEFAULT_ROUTE; sub = ''; }
  const entry = ROUTES[toolKey];

  if (currentEntry && currentEntry !== entry && typeof currentEntry.unmount === 'function') {
    currentEntry.unmount();
  }
  appRoot.innerHTML = '';
  entry.mount(appRoot, sub);
  currentEntry = entry;
  currentRoute = { toolKey, sub };

  document.title = entry.title ? entry.title(sub) : 'tai-hub';
  if (onRouteChange) onRouteChange(toolKey, sub);
}

export function getCurrentRoute() {
  return currentRoute;
}
