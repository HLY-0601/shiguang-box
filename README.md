# 拾光匣（Shiguang Box）

《Sky：光遇》（Sky: Children of the Light）粉丝工具合集，把物品、表情、光翼、先祖树、复刻先祖、乐谱、蜡烛计算、创作管理等一系列工具整合到一个 PWA 应用中。

无需构建，纯原生 HTML / CSS / JavaScript，使用原生 ES Modules 与哈希路由，可直接部署到任意静态托管。

## 功能一览

- **物品管理**：仪表盘、13 个类别的持有/收藏管理、成本汇总、全物品搜索、愿望单与所需成本计算、获取记录、穿搭（随机穿搭 / 我的穿搭 / 衣橱拼图）、达成率与收藏分享图。
- **表情管理**：表情列表、分级持有切换、称号、获取历史、「一年前的今天」。
- **光翼管理**：光翼与光翼锁统计。
- **先祖目录**：先祖树、节点与兑换路径查看。
- **复刻先祖**：复刻信息与相关工具。
- **蜡烛计算**：目标计算、红暗碎片自动预测、月历、获取历史、提醒。
- **普通蜡烛计算器（含专业版）**：多目标、节奏计算、获取记录、日常任务、路线参考。
- **乐谱**：乐谱收集管理与在线乐谱编辑。
- **创作管理**：日历与作品的增删改查、批量操作（该模块基于 Vue 3 CDN，免构建）。
- **数据迁移**：不依赖外部服务，通过文件或复制粘贴在设备间迁移数据。
- **主题换装**：内置多种配色、可自定义主色/背景/壁纸/闪烁/卡片质感/圆角/字体，并可保存为收藏、通过分享码交换。

## 技术特点

- 无构建工具，原生 ES Modules（`<script type="module">`），哈希路由 SPA。
- 支持多语言切换，默认中文；语言、主题、档案等通过 `storage` 事件在多标签页同步。
- 多档案（多个保存槽）机制，数据保存在浏览器 localStorage。
- PWA 支持：`manifest.json`、应用图标、`service-worker.js`（stale-while-revalidate；本地 localhost 仅在加 `?sw=1` 时注册）。
- 所有弹窗共用底部抽屉，支持拖拽/滑动关闭与焦点锁定。

## 本地运行

ES Modules 无法通过 `file://` 直接打开（浏览器 CORS 限制），请使用本地静态服务器：

```bash
# 任选其一，在仓库根目录启动
python3 -m http.server 8000
npx serve .
```

然后在浏览器打开 `http://localhost:8000/`。如需测试离线/Service Worker，访问 `http://localhost:8000/?sw=1`。

## 目录结构

```
index.html            应用外壳
manifest.json         PWA 清单
service-worker.js     离线缓存
css/                  tokens.css（全局变量）、chrome.css（坞/弹窗）、各工具专属样式
js/                   router、state、i18n、theme、icon-sprite 与 chrome/* 等共享逻辑
features/             各功能模块（item、emote、wings、spirit-catalog、star-candle、
                       tai-nomacan、tai-score、share、data-transfer 等）
```

## 说明

本项目是《Sky：光遇》的非官方粉丝作品，与 thatgamecompany 无任何关联。游戏内素材版权归其权利方所有。
