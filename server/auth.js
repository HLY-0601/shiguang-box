/* ================================================================
   auth.js — 注册/登录/鉴权中间件
   密码使用 Node 内置 scrypt + 随机盐做哈希，绝不存明文；
   登录态为不透明随机 token，存于服务端，可随时吊销。
   ================================================================ */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import * as db from './db.js';

const KEY_LEN = 32;

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(String(password), salt, KEY_LEN).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const candidate = scryptSync(String(password), salt, KEY_LEN);
  const expected = Buffer.from(expectedHash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function publicUser(user) {
  return { username: user.username, displayName: user.displayName || user.username };
}

export function register(username, password) {
  const name = String(username || '').trim();
  const pwd = String(password || '');
  if (name.length < 2) return { error: '用户名至少需要 2 个字符', status: 400 };
  if (pwd.length < 6) return { error: '密码至少需要 6 位', status: 400 };
  const key = db.keyOf(name);
  if (db.getUser(key)) return { error: '该用户名已被注册', status: 409 };
  const { salt, hash } = hashPassword(pwd);
  db.putUser(key, {
    username: name,
    displayName: name,
    salt,
    hash,
    createdAt: Date.now(),
  });
  db.getData(key); // 初始化数据区
  const token = db.createSession(key);
  return { token, user: publicUser(db.getUser(key)) };
}

export function login(username, password) {
  const key = db.keyOf(String(username || ''));
  const user = db.getUser(key);
  if (!user || !verifyPassword(String(password || ''), user.salt, user.hash)) {
    return { error: '用户名或密码错误', status: 401 };
  }
  const token = db.createSession(key);
  return { token, user: publicUser(user) };
}

export function logout(token) {
  db.destroySession(token);
}

// Express 中间件：校验 Authorization: Bearer <token>
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const session = token ? db.getSession(token) : null;
  if (!session) return res.status(401).json({ error: '未登录或登录已失效' });
  req.token = token;
  req.userKey = session.user;
  req.user = db.getUser(session.user);
  next();
}
