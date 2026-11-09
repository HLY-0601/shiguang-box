/* ================================================================
   ワイド画面（幅1280px以上）の常設サイドパネル。
   ・左端: 「関連ツール」一覧（ドックの「他のツール」で開く引き出しと同じ一覧。js/chrome/tools-drawer.js）
   ・右端: 「今日・今週・今月」ダッシュボード（ドックの「ダッシュボード」で開くモーダルと同じ中身。
          features/shared/event-dashboard.js を persistent でマウント）
   16:9の広い画面で、ドックを経由せずいつでも見られるようにするためのもの。
   表示/非表示の切替（幅・設定）に合わせて、中身のマウント/アンマウントだけをここで行う
   （レイアウトはcss/chrome.cssの html.side-panels-on ＋メディアクエリが担当）。
   設定は 表示設定 > ワイド画面のサイドパネル（左右を別々に切替。js/state.js の getSidePanelEnabled）。
   ================================================================ */
import { CURRENT_LANG } from '../i18n.js';
import { zhTr } from '../i18n-zh.js';
import { getSidePanelEnabled, setSidePanelEnabled, SKY_SIDE_TOOLS_KEY, SKY_SIDE_DASH_KEY } from '../state.js';
import * as toolsDrawer from './tools-drawer.js';
import * as eventDashboard from '../../features/shared/event-dashboard.js';

// css/chrome.css のメディアクエリと同じ幅にすること
const WIDE = window.matchMedia('(min-width: 1280px)');
let leftMounted = false;
let rightMounted = false;

function t(ja, en) { return CURRENT_LANG === 'en' ? en : (CURRENT_LANG === 'zh' ? zhTr(ja) : ja); }

function mountLeft() {
  if (leftMounted) return;
  const left = document.getElementById('side-left-root');
  if (!left) return;
  leftMounted = true;
  left.setAttribute('aria-label', t('関連ツール', 'Related Tools'));
  left.innerHTML = `
    <div class="side-panel-title"><svg class="inline-icon" width="20" height="20"><use href="#i-menu"/></svg> ${t('関連ツール', 'Related Tools')} <button class="side-panel-close" data-close="tools" title="${t('閉じる', 'Hide')}">×</button></div>
    <nav class="pf-drawer-nav js-tools-nav"></nav>`;
  toolsDrawer.renderNav();
  left.querySelector('[data-close="tools"]').addEventListener('click', () => { setSidePanelEnabled('tools', false); sync(); });
}

function mountRight() {
  if (rightMounted) return;
  const right = document.getElementById('side-right-root');
  if (!right) return;
  rightMounted = true;
  right.setAttribute('aria-label', t('今日・今週・今月', 'Today / This Week / This Month'));
  right.innerHTML = `
    <div class="side-panel-title"><svg class="inline-icon" width="20" height="20"><use href="#i-calendar"/></svg> ${t('今日・今週・今月', 'Today / This Week / This Month')} <button class="side-panel-close" data-close="dash" title="${t('閉じる', 'Hide')}">×</button></div>
    <div id="sideDashBody"></div>`;
  eventDashboard.mount(right.querySelector('#sideDashBody'), { persistent: true, icsExport: true });
  right.querySelector('[data-close="dash"]').addEventListener('click', () => { setSidePanelEnabled('dash', false); sync(); });
}

function unmountLeft() {
  if (!leftMounted) return;
  leftMounted = false;
  const left = document.getElementById('side-left-root');
  if (left) left.innerHTML = '';
}

function unmountRight() {
  if (!rightMounted) return;
  rightMounted = false;
  eventDashboard.unmountPersistent();
  const right = document.getElementById('side-right-root');
  if (right) right.innerHTML = '';
}

/** 設定・画面幅の変化に合わせて、各パネルの中身を出す/片付ける。レイアウト用クラスも設定に合わせる（左右は別々） */
export function sync() {
  const tools = getSidePanelEnabled('tools');
  const dash = getSidePanelEnabled('dash');
  const root = document.documentElement.classList;
  root.toggle('side-panels-on', tools);
  root.toggle('side-dash-on', dash);
  if (tools && WIDE.matches) mountLeft(); else unmountLeft();
  if (dash && WIDE.matches) mountRight(); else unmountRight();
  // 侧栏关了就显示边缘的重新打开按钮
  ensureReopenBtns();
}

function ensureReopenBtns() {
  let btnL = document.getElementById('sideReopenLeft');
  let btnR = document.getElementById('sideReopenRight');
  const tools = getSidePanelEnabled('tools');
  const dash = getSidePanelEnabled('dash');
  if (!btnL) {
    btnL = document.createElement('button');
    btnL.id = 'sideReopenLeft';
    btnL.className = 'side-reopen-btn';
    btnL.innerHTML = '☰';
    btnL.title = t('関連ツールを表示', 'Show Related Tools');
    btnL.addEventListener('click', () => { setSidePanelEnabled('tools', true); sync(); });
    document.body.appendChild(btnL);
  }
  if (!btnR) {
    btnR = document.createElement('button');
    btnR.id = 'sideReopenRight';
    btnR.className = 'side-reopen-btn side-reopen-right';
    btnR.innerHTML = '📅';
    btnR.title = t('ダッシュボードを表示', 'Show Dashboard');
    btnR.addEventListener('click', () => { setSidePanelEnabled('dash', true); sync(); });
    document.body.appendChild(btnR);
  }
  btnL.style.display = (!tools && WIDE.matches) ? 'flex' : 'none';
  btnR.style.display = (!dash && WIDE.matches) ? 'flex' : 'none';
}

export function init() {
  if (WIDE.addEventListener) WIDE.addEventListener('change', sync);
  else if (WIDE.addListener) WIDE.addListener(sync); // 古いSafari
  // 単体ツール（別タブ・同じ端末）で設定を変えた時も追従する
  window.addEventListener('storage', (e) => { if (e.key === SKY_SIDE_TOOLS_KEY || e.key === SKY_SIDE_DASH_KEY) sync(); });
  sync();
}
