/* ================================================================
   account-view.js — 本地账号（#/account）

   登录/注册 + 账号总览（身高 / 好友 / 装扮 / 跑图）。
   纯前端实现，数据仅保存在当前浏览器，详见 account-state.js 顶部说明。
   ================================================================ */
import { escapeHtml } from '../../js/i18n.js';
import { navigate } from '../../js/router.js';
import {
  register,
  login,
  logout,
  currentUser,
  updateProfile,
} from './account-state.js';

const STYLE_ID = 'account-view-styles';

let containerEl = null;
let authMode = 'login'; // login | register

const HEIGHT_OPTIONS = Array.from({ length: 15 }, (_, i) => i); // 0 号（最高）～ 14 号（最矮）

const NAV_CARDS = [
  { key: 'friends', icon: 'i-heart', title: '好友', desc: '记录好友纪念日与互动', route: 'friends' },
  { key: 'outfit', icon: 'i-hanger', title: '装扮', desc: '穿搭日记与道具持有', route: 'coord-diary' },
  { key: 'run', icon: 'i-compass', title: '跑图', desc: '跑图路线与蜡烛计算', route: 'tai-nomacan-pro' },
];

export function mount(container) {
  injectStylesheet();
  containerEl = container;
  render();
}

export function unmount() {
  containerEl = null;
}

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = new URL('../../css/account.css', import.meta.url).href;
  document.head.appendChild(link);
}

function render() {
  const user = currentUser();
  containerEl.innerHTML = user ? renderDashboard(user) : renderAuth();
  wireEvents();
}

/* ---------------- 登录 / 注册 ---------------- */
function renderAuth() {
  const isLogin = authMode === 'login';
  return `
  <div class="account-view">
    <div class="ac-head">
      <div class="ac-logo"><svg class="inline-icon" width="24" height="24"><use href="#i-person"/></svg></div>
      <h1>${isLogin ? '登录本地账号' : '注册本地账号'}</h1>
      <p>拾光匣 · 账号仅保存在当前浏览器</p>
    </div>

    <form class="ac-card" id="acAuthForm" autocomplete="off">
      <label class="ac-field">
        <span>用户名</span>
        <input type="text" id="acUsername" name="username" maxlength="24" placeholder="请输入用户名" required>
      </label>
      <label class="ac-field">
        <span>密码</span>
        <input type="password" id="acPassword" name="password" placeholder="请输入密码" required>
      </label>
      <p class="ac-error" id="acError" role="alert"></p>
      <button type="submit" class="ac-btn-primary" id="acSubmit">${isLogin ? '登录' : '注册并登录'}</button>
    </form>

    <div class="ac-switch">
      ${isLogin
        ? '还没有账号？<button type="button" class="ac-link" data-action="switch-register">去注册</button>'
        : '已经有账号了？<button type="button" class="ac-link" data-action="switch-login">去登录</button>'}
    </div>

    <div class="ac-notice">
      <svg class="inline-icon" width="15" height="15"><use href="#i-warning"/></svg>
      <p>本地账号不会上传服务器、不能跨设备同步，也无法登录 Sky 游戏或自动读取游戏数据；身高、好友、装扮、跑图等需在对应工具中自行记录。</p>
    </div>
  </div>`;
}

/* ---------------- 账号总览 ---------------- */
function renderDashboard(user) {
  const height = user.profile && user.profile.height;
  const heightOptions = [
    `<option value="">未记录</option>`,
    ...HEIGHT_OPTIONS.map((n) =>
      `<option value="${n}" ${height === n ? 'selected' : ''}>${n} 号身高</option>`
    ),
  ].join('');

  const cards = NAV_CARDS.map((c) => `
    <button type="button" class="ac-nav-card" data-route="${c.route}">
      <span class="ac-nav-icon"><svg class="inline-icon" width="22" height="22"><use href="#${c.icon}"/></svg></span>
      <span class="ac-nav-text"><b>${c.title}</b><small>${c.desc}</small></span>
      <svg class="inline-icon ac-nav-arrow" width="16" height="16"><use href="#i-chevron-right"/></svg>
    </button>`).join('');

  return `
  <div class="account-view">
    <div class="ac-dash-head">
      <div class="ac-avatar"><svg class="inline-icon" width="26" height="26"><use href="#i-person"/></svg></div>
      <div class="ac-dash-id">
        <h1>${escapeHtml(user.username)}</h1>
        <p>本地账号 · 数据仅保存在此浏览器</p>
      </div>
      <button type="button" class="ac-btn-ghost" data-action="logout">退出登录</button>
    </div>

    <div class="ac-section">
      <h2>我的身高</h2>
      <div class="ac-card ac-height-card">
        <span class="ac-nav-icon"><svg class="inline-icon" width="22" height="22"><use href="#i-person"/></svg></span>
        <select id="acHeight" class="ac-select">${heightOptions}</select>
        <small>手动选择（0 号最高，14 号最矮），无法自动读取游戏</small>
      </div>
    </div>

    <div class="ac-section">
      <h2>我的记录</h2>
      <div class="ac-nav-list">${cards}</div>
    </div>

    <div class="ac-notice">
      <svg class="inline-icon" width="15" height="15"><use href="#i-warning"/></svg>
      <p>本页面为浏览器本地记录，不与 Sky 游戏服务器互通；更换设备可用「数据转移」功能迁移。</p>
    </div>
  </div>`;
}

/* ---------------- 事件 ---------------- */
function wireEvents() {
  const form = containerEl.querySelector('#acAuthForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = containerEl.querySelector('#acError');
      const btn = containerEl.querySelector('#acSubmit');
      const username = containerEl.querySelector('#acUsername').value;
      const password = containerEl.querySelector('#acPassword').value;
      errEl.textContent = '';
      btn.disabled = true;
      const result = authMode === 'login'
        ? await login(username, password)
        : await register(username, password);
      btn.disabled = false;
      if (result.ok) {
        render();
      } else {
        errEl.textContent = result.error;
      }
    });
  }

  containerEl.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-action]');
    if (sw) {
      const action = sw.dataset.action;
      if (action === 'switch-register') { authMode = 'register'; render(); return; }
      if (action === 'switch-login') { authMode = 'login'; render(); return; }
      if (action === 'logout') { logout(); authMode = 'login'; render(); return; }
    }
    const nav = e.target.closest('[data-route]');
    if (nav) {
      navigate(nav.dataset.route, '');
    }
  });

  const heightSelect = containerEl.querySelector('#acHeight');
  if (heightSelect) {
    heightSelect.addEventListener('change', () => {
      const val = heightSelect.value === '' ? null : Number(heightSelect.value);
      updateProfile({ height: val });
    });
  }
}
