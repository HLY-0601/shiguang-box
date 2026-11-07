# 拾光匣后端（Shiguang Box Server）

拾光匣的后端服务，提供**自有账号体系**与「身高 / 好友 / 装扮 / 跑图」数据的 REST API。
纯 Node.js + Express，无原生依赖，可在任意支持 Node 的主机运行。

> 说明：本服务是拾光匣自己的账号与数据系统，**不连接、也无法登录 Sky 游戏官方账号**。
> 官方 `thatgamecompany.com` 仅允许其第一方客户端使用、不向第三方开放且无 CORS，
> 因此这里的账号由用户在本系统内注册，数据由用户自行记录。

## 本地运行

```bash
cd server
npm install
npm start          # 默认 http://localhost:8787
```

环境变量：

| 变量 | 作用 | 默认 |
|---|---|---|
| `PORT` | 监听端口（托管平台通常自动注入） | `8787` |
| `CORS_ORIGIN` | 额外允许的前端来源，多个用逗号分隔 | 已内置 GitHub Pages 与本地来源 |
| `SHIGUANG_DB_FILE` | JSON 数据文件路径 | `server/shiguang-data.json` |

## 接口一览

鉴权接口登录后返回 `token`，后续请求带上请求头 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 注册 `{username,password}` |
| POST | `/api/auth/login` | 登录 `{username,password}` |
| POST | `/api/auth/logout` | 退出登录（需鉴权） |
| GET | `/api/me` | 当前用户与全部资料 |
| PUT | `/api/me/profile` | 更新 `{height, displayName}`（身高 0–14） |
| GET/POST | `/api/me/friends` | 好友列表 / 新增 |
| DELETE | `/api/me/friends/:id` | 删除好友 |
| GET/POST | `/api/me/outfits` | 装扮列表 / 新增 |
| DELETE | `/api/me/outfits/:id` | 删除装扮 |
| GET/POST | `/api/me/runs` | 跑图列表 / 新增 |
| DELETE | `/api/me/runs/:id` | 删除跑图 |

## 部署到免费主机

GitHub Pages 只能托管静态文件，无法运行本后端，需要一个 Node 主机。

### Render（推荐，最简单）
1. 注册并登录 [render.com](https://render.com)。
2. New → **Blueprint**，选择本仓库，会自动识别仓库根目录的 `render.yaml`。
3. 等待部署完成，得到形如 `https://shiguang-box-api.onrender.com` 的地址。
4. 把该地址填入拾光匣「本地账号」页的「后端地址」即可。

也可手动 New → Web Service，Root Directory 填 `server`，Build `npm install`，Start `npm start`。

### 其他主机
Railway / Fly.io / Railway 等均可：运行目录为 `server`，启动命令 `npm start`，
并在环境变量里设置 `CORS_ORIGIN=https://hly-0601.github.io`。

### 数据持久化注意
默认使用 JSON 文件存储。Render 免费套餐的文件系统在重启或重新部署后会重置；
如需长期保留，请使用主机的持久化磁盘，或将 `db.js` 替换为托管数据库
（保持其对外函数签名不变，`server.js` 无需改动）。

## 安全说明
- 密码使用 Node 内置 `scrypt` + 随机盐哈希，**不存明文**。
- 登录态为不透明随机 token，存于服务端，可随时吊销。
- 请勿在本系统中使用与重要账号相同的密码。
