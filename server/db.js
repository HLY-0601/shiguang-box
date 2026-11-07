/* ================================================================
   db.js — 轻量 JSON 文件存储（零原生依赖，可直接在任意 Node 主机运行）
   结构：
     users    { [key]: { username, displayName, salt, hash, createdAt } }
     sessions { [token]: { user, createdAt } }
     data     { [key]: { height, friends:[], outfits:[], runs:[] } }
   若后续需要更强的持久化/并发，可在此文件内替换为 SQLite/Postgres，
   对外暴露的函数签名保持不变即可，server.js 无需改动。
   ================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const DATA_FILE = process.env.SHIGUANG_DB_FILE
  || path.join(process.cwd(), 'shiguang-data.json');

const emptyStore = () => ({ users: {}, sessions: {}, data: {} });

let store = emptyStore();

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      store = { ...emptyStore(), ...parsed };
    }
  } catch (err) {
    console.error('[db] 读取数据文件失败，使用空库：', err.message);
    store = emptyStore();
  }
}

let writeTimer = null;
function persist() {
  // 合并短时间内的多次写入，原子替换（先写临时文件再 rename）
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store));
    fs.renameSync(tmp, DATA_FILE);
  }, 50);
}

export function keyOf(username) {
  return String(username).trim().toLowerCase();
}

export function getUser(key) {
  return store.users[key] || null;
}
export function putUser(key, user) {
  store.users[key] = user;
  persist();
}

export function getData(key) {
  if (!store.data[key]) {
    store.data[key] = { height: null, friends: [], outfits: [], runs: [] };
    persist();
  }
  return store.data[key];
}
export function saveData(key) {
  persist();
}

export function createSession(key) {
  const token = randomToken(32);
  store.sessions[token] = { user: key, createdAt: Date.now() };
  persist();
  return token;
}
export function getSession(token) {
  const s = store.sessions[token];
  if (!s) return null;
  return s;
}
export function destroySession(token) {
  if (store.sessions[token]) {
    delete store.sessions[token];
    persist();
  }
}

export function randomToken(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}

load();
