/* ================================================================
   server.js — 夜月后端入口（Express）
   提供自有账号与 身高/好友/装扮/跑图 的 REST API。
   端口由平台注入的 PORT 决定（本地默认 8787）。
   ================================================================ */
import express from 'express';
import * as db from './db.js';
import { register, login, logout, requireAuth, publicUser } from './auth.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

/* ---------- CORS：允许静态前端跨域调用 ---------- */
const DEFAULT_ORIGINS = [
  'https://hly-0601.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
];
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean).concat(DEFAULT_ORIGINS);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------- 健康检查 ---------- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'shiguang-box-server', time: new Date().toISOString() });
});

/* ---------- 账号 ---------- */
app.post('/api/auth/register', (req, res) => {
  const r = register(req.body.username, req.body.password);
  if (r.error) return res.status(r.status).json({ error: r.error });
  res.status(201).json(r);
});

app.post('/api/auth/login', (req, res) => {
  const r = login(req.body.username, req.body.password);
  if (r.error) return res.status(r.status).json({ error: r.error });
  res.json(r);
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  logout(req.token);
  res.json({ ok: true });
});

/* ---------- 当前用户与资料 ---------- */
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user), profile: db.getData(req.userKey) });
});

app.put('/api/me/profile', requireAuth, (req, res) => {
  const data = db.getData(req.userKey);
  const { height, displayName } = req.body || {};
  if (height !== undefined) {
    const h = Number(height);
    data.height = Number.isInteger(h) && h >= 0 && h <= 14 ? h : null;
  }
  if (typeof displayName === 'string' && displayName.trim()) {
    req.user.displayName = displayName.trim().slice(0, 30);
    db.putUser(req.userKey, req.user);
  }
  db.saveData(req.userKey);
  res.json({ user: publicUser(req.user), profile: data });
});

/* ---------- 通用列表资源（friends/outfits/runs） ---------- */
function listRoutes(field, basePath) {
  app.get(basePath, requireAuth, (req, res) => {
    res.json({ items: db.getData(req.userKey)[field] });
  });

  app.post(basePath, requireAuth, (req, res) => {
    const data = db.getData(req.userKey);
    const item = { id: db.randomToken(8), createdAt: Date.now(), ...(req.body || {}) };
    if (!item.name || !String(item.name).trim()) {
      return res.status(400).json({ error: '名称不能为空' });
    }
    item.name = String(item.name).trim().slice(0, 60);
    data[field].push(item);
    db.saveData(req.userKey);
    res.status(201).json({ item });
  });

  app.delete(`${basePath}/:id`, requireAuth, (req, res) => {
    const data = db.getData(req.userKey);
    const before = data[field].length;
    data[field] = data[field].filter(it => it.id !== req.params.id);
    db.saveData(req.userKey);
    res.json({ removed: before - data[field].length });
  });
}

listRoutes('friends', '/api/me/friends');
listRoutes('outfits', '/api/me/outfits');
listRoutes('runs', '/api/me/runs');

/* ---------- 兜底 ---------- */
app.use((req, res) => res.status(404).json({ error: '接口不存在' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`夜月后端已启动，端口 ${PORT}`);
});
