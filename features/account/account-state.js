/* ================================================================
   account-state.js — 本地账号（仅保存在当前浏览器）

   说明：本站是托管在 GitHub Pages 的纯静态 PWA，没有后端服务器，
   也没有连接 Sky 游戏官方账号的接口。因此这里的“账号”是一个
   仅存在于本浏览器 localStorage 的本地账号：
     · 密码使用 Web Crypto SHA-256 + 随机盐做哈希，绝不保存明文；
     · 数据不会上传到任何服务器，也不能跨设备同步；
     · 无法登录 Sky 游戏，也无法自动读取游戏内的身高/好友/装扮/跑图数据，
       这些内容需要你在对应工具里自行记录。
   ================================================================ */

const ACCOUNTS_KEY = 'shiguang_accounts_v1';
const SESSION_KEY = 'shiguang_account_session_v1';

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function genSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}

export async function register(username, password) {
  const name = String(username || '').trim();
  const pwd = String(password || '');
  if (!name) return { ok: false, error: '请输入用户名' };
  if (name.length > 24) return { ok: false, error: '用户名最多 24 个字符' };
  if (!pwd) return { ok: false, error: '请输入密码' };
  if (pwd.length < 4) return { ok: false, error: '密码至少 4 位' };

  const accounts = readAccounts();
  const key = name.toLowerCase();
  if (accounts[key]) return { ok: false, error: '该用户名已被注册' };

  const salt = genSalt();
  const hash = await hashPassword(pwd, salt);
  accounts[key] = {
    username: name,
    salt,
    hash,
    createdAt: new Date().toISOString(),
    profile: { height: null },
  };
  writeAccounts(accounts);
  setSession(name);
  return { ok: true };
}

export async function login(username, password) {
  const name = String(username || '').trim();
  const pwd = String(password || '');
  if (!name || !pwd) return { ok: false, error: '请输入用户名和密码' };

  const accounts = readAccounts();
  const acc = accounts[name.toLowerCase()];
  if (!acc) return { ok: false, error: '用户不存在' };

  const hash = await hashPassword(pwd, acc.salt);
  if (hash !== acc.hash) return { ok: false, error: '密码错误' };

  setSession(acc.username);
  return { ok: true };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function currentUser() {
  const name = localStorage.getItem(SESSION_KEY);
  if (!name) return null;
  const acc = readAccounts()[name.toLowerCase()];
  return acc || null;
}

export function updateProfile(patch) {
  const name = localStorage.getItem(SESSION_KEY);
  if (!name) return null;
  const accounts = readAccounts();
  const key = name.toLowerCase();
  if (!accounts[key]) return null;
  accounts[key].profile = { ...(accounts[key].profile || {}), ...patch };
  writeAccounts(accounts);
  return accounts[key];
}
