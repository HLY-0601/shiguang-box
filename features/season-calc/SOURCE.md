# 来源与许可说明

本工具移植自外部仓库：

- 来源：https://github.com/VoidCipher3/test_trust
- 许可：MIT License（见本目录 `LICENSE`，Copyright (c) 2026 Void）
- 并入日期：2026-11-11
- 重构方式：原生模块移植。原自包含单页已拆解为夜月 ES module（`season-calc-view.js` / `season-calc-state.js` / `data/`），
  套用夜月 CSS 变量、通用组件类与三语 i18n；兑换树节点、消耗统计、等级门槛、陪伴好感度、方案存档、导出/导入等交互逻辑原样保留。

## 文件对照

| 移植源（test_trust） | 夜月模块 |
| --- | --- |
| `spirits.data.json` | `data/spirits-data.js`（`SPIRITS_DATA`） |
| `spirits.i18n.json` | `data/spirits-i18n.js`（`SPIRITS_I18N`） |
| `spirits.images.json` | `data/spirits-images.js`（`SPIRITS_IMAGES`） |
| 界面文案（uiDict） | `data/i18n-calc.js`（夜月三语辞书） |

MIT 条款要求保留版权声明与许可声明，因此 `LICENSE` 原文（含版权行）随目录一并保留。
