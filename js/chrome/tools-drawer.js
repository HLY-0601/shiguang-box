/* ================================================================
   「他のツール」引き出し。item/profiles.js の SITE_LINKS ドロワーを
   移植。ハブ内蔵5ツールは#/ハッシュリンク、残りは既存の外部URLのまま。
   ================================================================ */
import { CURRENT_LANG } from '../i18n.js';
import { SITE_LINKS } from '../state.js';
import { navigate } from '../router.js';

let currentToolKey = 'item';

function t(ja, en) { return CURRENT_LANG === 'en' ? en : ja; }

function ensureDom() {
  if (document.getElementById('toolsDrawerPanel')) return;
  const overlay = document.createElement('div');
  overlay.className = 'pf-drawer-overlay';
  overlay.id = 'toolsDrawerOverlay';
  overlay.addEventListener('click', close);
  document.body.appendChild(overlay);

  const drawer = document.createElement('aside');
  drawer.className = 'pf-drawer';
  drawer.id = 'toolsDrawerPanel';
  drawer.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div class="pf-drawer-label"><svg class="inline-icon" width="20" height="20"><use href="#i-menu"/></svg> ${t('関連ツール', 'Related Tools')}</div>
      <button type="button" class="modal-close-btn" id="toolsDrawerCloseBtn" style="position:static;"><svg class="inline-icon" width="14" height="14"><use href="#i-close"/></svg></button>
    </div>
    <div class="pf-drawer-nav" id="toolsDrawerNav"></div>`;
  document.body.appendChild(drawer);
  document.getElementById('toolsDrawerCloseBtn').addEventListener('click', close);
  renderNav();
}

function renderNav() {
  const nav = document.getElementById('toolsDrawerNav');
  if (!nav) return;
  nav.innerHTML = SITE_LINKS.map(s => {
    const isCurrentHubRoute = s.hubRoute && s.hubRoute === `#/${currentToolKey}`;
    const href = s.hubRoute || s.href;
    return `<a class="pf-drawer-link${isCurrentHubRoute ? ' current' : ''}" href="${href}" data-hub-route="${s.hubRoute || ''}">
      <svg class="inline-icon" width="19" height="19"><use href="#${s.icon}"/></svg>
      ${s.badgeTest ? `<span class="pf-drawer-badge-test">${t('test', 'test')}</span>` : ''} ${t(s.ja, s.en)}
    </a>`;
  }).join('');
  nav.querySelectorAll('a[data-hub-route]').forEach(a => {
    const route = a.dataset.hubRoute;
    if (!route) return;
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(route.replace(/^#\//, ''), '');
      close();
    });
  });
}

export function setActive(toolKey) {
  currentToolKey = toolKey;
  renderNav();
}

export function open() {
  ensureDom();
  document.getElementById('toolsDrawerOverlay').classList.add('show');
  document.getElementById('toolsDrawerPanel').classList.add('mobile-open');
}

export function close() {
  document.getElementById('toolsDrawerOverlay')?.classList.remove('show');
  document.getElementById('toolsDrawerPanel')?.classList.remove('mobile-open');
}
