/* ================================================================
   account-api.js — 远程后端账号（对接 server/ 提供的 REST API）

   当用户在页面里填写了后端地址后启用。登录态与资料在本地保留一份
   快照（仅用于界面同步渲染），真实数据以后端为准，每次启动会调用
   /api/me 校验并刷新。无法连接或登录失效时自动清除本地快照。
   ================================================================ */

const BASE_KEY = 'shiguang_api_base_v1';
const SESSION_CACHE = 'shiguang_remote_session_v1';

export function getBaseUrl() {
  return (localStorage.getItem(BASE_KEY) || '').trim().replace(/\/+$/, '');
}
export function setBaseUrl(url) {
  const v = (url || '').trim();
  if (v) localStorage.setItem(BASE_KEY, v);
  else localStorage.removeItem(BASE_KEY);
  if (!v) clearSession();
}
export function isRemote() {
  return !!getBaseUrl();
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_CACHE)) || null;
  } catch (e) {
    return null;
  }
}
function writeCache(c) {
  localStorage.setItem(SESSION_CACHE, JSON.stringify(c));
}
function clearSession() {
  localStorage.removeItem(SESSION_CACHE);
}

async function request(path, opts = {}) {
  const base = getBaseUrl();
  if (!base) throw new Error('未配置后端地址');
  const cache = readCache();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (cache && cache.token) headers.Authorization = `Bearer ${cache.token}`;

  let resp;
  try {
    resp = await fetch(base + path, { ...opts, headers });
  } catch (e) {
    throw new Error('无法连接后端，请检查后端地址或网络');
  }
  let data = null;
  try { data = await resp.json(); } catch (e) { /* 无 JSON 响应体 */ }
  if (!resp.ok) {
    if (resp.status === 401) clearSession();
    throw new Error((data && data.error) || `请求失败（${resp.status}）`);
  }
  return data;
}

// 把远程快照整理成视图需要的形状（与本地 account-state 的 currentUser 对齐）
function snapshotUser() {
  const c = readCache();
  if (!c) return null;
  return {
    username: c.user.username,
    profile: { height: c.profile ? c.profile.height : null },
  };
}

export async function register(username, password) {
  try {
    const d = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    writeCache({
      token: d.token,
      user: d.user,
      profile: { height: null, friends: [], outfits: [], runs: [] },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function login(username, password) {
  try {
    const d = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const me = await request('/api/me');
    writeCache({ token: d.token, user: me.user, profile: me.profile });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    /* 即使网络失败也清除本地登录态 */
  }
  clearSession();
}

export function currentUser() {
  return snapshotUser();
}

export async function updateProfile(patch) {
  const c = readCache();
  if (!c) return null;
  const d = await request('/api/me/profile', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  const next = { token: c.token, user: d.user, profile: d.profile };
  writeCache(next);
  return snapshotUser();
}

// 挂载时调用：校验 token 并从服务器拉取最新数据
export async function refresh() {
  const c = readCache();
  if (!c) return null;
  try {
    const d = await request('/api/me');
    writeCache({ token: c.token, user: d.user, profile: d.profile });
    return snapshotUser();
  } catch (e) {
    clearSession();
    return null;
  }
}
