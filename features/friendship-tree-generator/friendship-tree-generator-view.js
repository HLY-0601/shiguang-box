/* ================================================================
   friendship-tree-generator-view.js — 先祖好友树生成器（树图生成）

   参考 thatskyapplication 的 friendship-tree-generator：选一个先祖，
   画出该先祖完整的「先祖好友树」（节点 + 蜡烛/心/升华蜡烛成本 + 等级）。
   纯离线渲染，不依赖协议。节点图标走 Discord CDN，加载失败时降级为
   本地文字标签（成本始终用系统 emoji 符号，不依赖外部资源）。

   数据：data/friendship-trees.json（由 thatskyapplication 的 utility 包
   导出并精简，218 个先祖的中文名 + 树结构 + 成本 + 图标 id）。
   字段缩写：n=name, e=emoji id, en=emojiName, c=cost, l=level, ch=children,
   t=type, r=realm, s=season；成本 c=candles, h=hearts, ac=ascendedCandles,
   sc=seasonalCandles, sh=seasonalHearts, et=eventTickets。
   ================================================================ */

import { escapeHtml } from '../../js/i18n.js';

const DATA_URL = './features/friendship-tree-generator/data/friendship-trees.json';
const EMOJI_BASE = 'https://cdn.discordapp.com/emojis/';

// 节点图标（Discord CDN）加载失败时的文字降级标签。
// 只映射高频的通用节点与常见动作；其余回退到 emojiName 原文。
const FALLBACK_LABELS = {
  heart: '心', duets_heart: '心', blue_bird_heart: '心', migration_heart: '心',
  blessing_1: '祝福Ⅰ', blessing_2: '祝福Ⅱ', blessing_3: '祝福Ⅲ',
  quest: '任务', wing_buff: '光翼', music_sheet: '乐谱', trust: '信任',
  dye: '染料',
  dye_red: '红染', dye_yellow: '黄染', dye_blue: '蓝染', dye_cyan: '青染',
  dye_green: '绿染', dye_purple: '紫染', dye_black: '黑染', dye_white: '白染',
  hug: '拥抱', double_five: '双击掌', high_five: '击掌',
  wave: '挥手', clap: '拍手', point: '指路', come: '招手', bow: '鞠躬',
  laugh: '大笑', crying: '哭泣', yawn: '哈欠', salute: '敬礼', pray: '祈祷',
  nod: '点头', shrug: '耸肩', thinking: '思考', shush: '嘘', angry: '生气',
  shy: '害羞', shocked: '惊讶', apologise: '道歉', grateful: '感谢', respect: '致敬',
  welcome: '欢迎', sparkler: '烟花', confetti: '彩带', cheer: '欢呼', juggle: '杂耍',
  handstand: '倒立', backflip: '后空翻', leap: '跳跃', float: '漂浮', doze: '打盹',
  faint: '晕倒', duck: '躲避', boo: '吓唬', peek: '偷看', grumpy: '赌气',
  kabuki: '歌舞伎', telekinesis: '念力', yoga: '瑜伽', crab_walk: '横行',
};

// 装扮类节点（emojiName 形如 "02_outfit"、"05_mask"）按类别后缀降级为中文类别名。
const FALLBACK_SUFFIX = [
  ['outfit', '衣服'], ['full_outfit', '全套'], ['hair', '头发'], ['mask', '面具'],
  ['hair_accessory', '头饰'], ['head_accessory', '头饰'], ['face_accessory', '脸饰'],
  ['necklace', '颈饰'], ['cape', '斗篷'], ['shoe', '鞋'],
  ['held_prop', '手持道具'], ['small_placeable_prop', '小摆件'], ['large_placeable_prop', '大摆件'],
  ['shared_space', '共享空间'],
];

// 成本用系统 emoji 符号（任何设备都能显示，不依赖外部 CDN）
const COST_ICONS = { c: '🕯️', h: '❤️', ac: '🔺', sc: '🧡', sh: '💗', et: '🎟️' };
const COST_ORDER = ['c', 'h', 'ac', 'sc', 'sh', 'et'];

// 计算节点降级标签
function fallbackLabel(node) {
  if (node.n) return node.n;
  if (FALLBACK_LABELS[node.en]) return FALLBACK_LABELS[node.en];
  const en = node.en || '';
  for (const [suffix, label] of FALLBACK_SUFFIX) {
    if (en.endsWith(suffix)) return label;
  }
  return en;
}

let container = null;
let dataPromise = null;

function loadData() {
  if (dataPromise) return dataPromise;
  dataPromise = fetch(DATA_URL, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error('好友树数据加载失败：HTTP ' + r.status);
    return r.json();
  });
  return dataPromise;
}

// 先祖分组（按类型）
const GROUPS = [
  { key: 'standard', label: '常驻先祖' },
  { key: 'elder', label: '长老' },
  { key: 'seasonal', label: '季节先祖' },
  { key: 'guide', label: '季节向导' },
];

export async function mount(cont, sub) {
  container = cont;
  container.innerHTML = `<div class="ftg-loading">加载先祖数据…</div>`;
  try {
    const data = await loadData();
    render(data);
  } catch (err) {
    container.innerHTML = `<div class="ftg-error">${escapeHtml(String(err.message || err))}</div>`;
  }
}

export function unmount() {
  container = null;
}

function render(data) {
  if (!container) return;
  const spirits = data.spirits || [];

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: spirits.filter((s) => s.t === g.key),
  })).filter((g) => g.items.length > 0);

  container.innerHTML = `
    <style>
      .ftg-wrap { max-width: 760px; margin: 0 auto; padding: 16px; }
      .ftg-head { margin-bottom: 16px; }
      .ftg-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
      .ftg-sub { font-size: 13px; opacity: .6; margin: 0 0 14px; }
      .ftg-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .ftg-select {
        flex: 1 1 260px; min-width: 0; padding: 10px 12px; border-radius: 10px;
        border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06);
        color: inherit; font-size: 15px; max-width: 100%;
      }
      .ftg-select optgroup { background: #1a1d29; color: inherit; }
      .ftg-select option { background: #1a1d29; color: inherit; }
      .ftg-meta { font-size: 13px; opacity: .75; margin-top: 8px; }
      .ftg-stage { margin-top: 16px; border-radius: 14px; background: rgba(255,255,255,.04); padding: 12px; overflow-x: auto; }
      .ftg-tree-svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }
      .ftg-node circle.ftg-bg { fill: rgba(0,0,0,.35); stroke: rgba(255,255,255,.25); stroke-width: 1.5; }
      .ftg-node text { fill: #fff; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
      .ftg-node .ftg-cost { font-size: 14px; font-weight: 600; }
      .ftg-node .ftg-lv { font-size: 12px; opacity: .85; }
      .ftg-node .ftg-fb { font-size: 13px; font-weight: 600; text-anchor: middle; }
      .ftg-line { stroke: rgba(255,255,255,.35); stroke-width: 2; fill: none; }
      .ftg-trunk { stroke: rgba(255,255,255,.28); stroke-width: 2; }
      .ftg-total { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 12px; font-size: 14px; font-weight: 600; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.06); }
      .ftg-total span { white-space: nowrap; }
      .ftg-hint { font-size: 12px; opacity: .5; margin-top: 10px; }
    </style>
    <div class="ftg-wrap">
      <div class="ftg-head">
        <h1 class="ftg-title">先祖好友树生成器</h1>
        <p class="ftg-sub">选一个先祖，生成完整的先祖好友树（节点成本用系统 emoji，节点图标走 CDN，失败自动降级为文字）。</p>
        <div class="ftg-controls">
          <select id="ftgSpiritSelect" class="ftg-select"></select>
        </div>
      </div>
      <div id="ftgStage" class="ftg-stage"></div>
    </div>
  `;

  const select = container.querySelector('#ftgSpiritSelect');
  for (const g of grouped) {
    const og = document.createElement('optgroup');
    og.label = g.label;
    for (const s of g.items) {
      const o = document.createElement('option');
      o.value = String(s.id);
      o.textContent = `${s.n}${s.s ? '（' + s.s + '）' : ''}`;
      og.appendChild(o);
    }
    select.appendChild(og);
  }

  select.addEventListener('change', () => {
    const spirit = spirits.find((s) => String(s.id) === select.value);
    if (spirit) drawTree(spirit);
  });

  if (grouped.length && grouped[0].items.length) {
    select.value = String(grouped[0].items[0].id);
    drawTree(grouped[0].items[0]);
  }
}

// 计算某先祖树的总成本
function totalCost(spirit) {
  const total = { c: 0, h: 0, ac: 0, sc: 0, sh: 0, et: 0 };
  const walk = (node) => {
    if (!node) return;
    if (node.c) {
      for (const k of COST_ORDER) {
        if (typeof node.c[k] === 'number') total[k] += node.c[k];
      }
    }
    if (node.ch) node.ch.forEach(walk);
  };
  spirit.tree.forEach((layer) => layer.forEach(walk));
  return total;
}

function drawTree(spirit) {
  const stage = container && container.querySelector('#ftgStage');
  if (!stage) return;

  // —— 布局参数 ——
  const W = 640;
  const slotX = [W * 0.22, W * 0.52, W * 0.82]; // 左/中/右 槽位中心
  const nodeR = 38;
  const rowH = 150;
  const topPad = 110;
  const trunkX = W * 0.52;

  // 分层数组：[[node,node],[node],...]，children 展开为该层的额外节点
  const layers = spirit.tree.map((layer) => {
    const flat = [];
    layer.forEach((n) => {
      if (!n) return;
      flat.push(n);
      if (n.ch) n.ch.forEach((c) => c && flat.push(c));
    });
    return flat;
  });

  const totalH = topPad + Math.max(0, layers.length - 1) * rowH + 90;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  svg.setAttribute('class', 'ftg-tree-svg');
  svg.setAttribute('role', 'img');

  // 树干（中央竖线）
  const trunk = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  trunk.setAttribute('x1', trunkX);
  trunk.setAttribute('y1', topPad - nodeR);
  trunk.setAttribute('x2', trunkX);
  trunk.setAttribute('y2', topPad + (layers.length - 1) * rowH + nodeR);
  trunk.setAttribute('class', 'ftg-trunk');
  svg.appendChild(trunk);

  const placedByLayer = [];

  layers.forEach((layer, li) => {
    const y = topPad + li * rowH;
    const count = layer.length;
    const placed = [];

    // 槽位分配：节点在左/右槽位之间均匀分布（1 个居中，2 个左右，3 个左中右，更多则更密集）
    const sxOf = (ni) => {
      if (count === 1) return slotX[1];
      return slotX[0] + (slotX[2] - slotX[0]) * (ni / (count - 1));
    };

    layer.forEach((node, ni) => {
      const sx = sxOf(ni);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'ftg-node');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', sx);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', nodeR);
      circle.setAttribute('class', 'ftg-bg');
      g.appendChild(circle);

      // 分支连线（从树干到节点）
      if (Math.abs(sx - trunkX) > 4) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', trunkX);
        line.setAttribute('y1', y);
        line.setAttribute('x2', sx > trunkX ? sx - nodeR : sx + nodeR);
        line.setAttribute('y2', y);
        line.setAttribute('class', 'ftg-line');
        svg.appendChild(line);
      }

      // 节点图标（emoji 图或降级文字）。CDN 可达则显示 emoji，失败/超时则降级为文字。
      const label = fallbackLabel(node);
      if (node.e) {
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.setAttribute('x', sx - nodeR + 6);
        img.setAttribute('y', y - nodeR + 6);
        img.setAttribute('width', (nodeR - 6) * 2);
        img.setAttribute('height', (nodeR - 6) * 2);
        img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        img.setAttribute('href', EMOJI_BASE + node.e + '.webp');
        let done = false;
        const toFallback = () => {
          if (done || !img.isConnected) return;
          done = true;
          img.remove();
          g.insertBefore(renderFallback(sx, y, nodeR, label), g.firstChild);
        };
        img.addEventListener('load', () => { done = true; });
        img.addEventListener('error', toFallback);
        setTimeout(toFallback, 2500); // CDN 挂起时 2.5 秒超时降级
        g.appendChild(img);
      } else {
        g.appendChild(renderFallback(sx, y, nodeR, label));
      }

      // 成本（节点下方）
      if (node.c) {
        const parts = COST_ORDER.filter((k) => typeof node.c[k] === 'number' && node.c[k] > 0);
        if (parts.length) {
          const txt = parts.map((k) => COST_ICONS[k] + node.c[k]).join(' ');
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('x', sx);
          t.setAttribute('y', y + nodeR + 18);
          t.setAttribute('text-anchor', 'middle');
          t.setAttribute('class', 'ftg-cost');
          t.textContent = txt;
          g.appendChild(t);
        }
      }

      // 等级徽章（节点左上角）
      if (node.l) {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', sx - nodeR + 4);
        t.setAttribute('y', y - nodeR + 4);
        t.setAttribute('class', 'ftg-lv');
        t.textContent = 'Lv.' + node.l;
        g.appendChild(t);
      }

      svg.appendChild(g);
      placed.push({ x: sx, y });
    });

    placedByLayer.push(placed);
  });

  // 层间纵向连线（相邻层的节点之间：简单的最近连接）
  for (let i = 0; i < placedByLayer.length - 1; i++) {
    const up = placedByLayer[i];
    const down = placedByLayer[i + 1];
    for (const u of up) {
      let best = null, bestDist = Infinity;
      for (const d of down) {
        const dist = Math.abs(d.x - u.x);
        if (dist < bestDist) { bestDist = dist; best = d; }
      }
      if (best) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', u.x);
        line.setAttribute('y1', u.y + nodeR);
        line.setAttribute('x2', best.x);
        line.setAttribute('y2', best.y - nodeR);
        line.setAttribute('class', 'ftg-line');
        svg.insertBefore(line, svg.firstChild);
      }
    }
  }

  const total = totalCost(spirit);
  const totalParts = COST_ORDER.filter((k) => total[k] > 0).map((k) => COST_ICONS[k] + total[k]);

  stage.innerHTML = `
    <div class="ftg-meta">
      先祖：<strong>${escapeHtml(spirit.n)}</strong>
      ${spirit.s ? ' · ' + escapeHtml(spirit.s) : ''}
      ${spirit.r ? ' · ' + escapeHtml(spirit.r) : ''}
      · 共 ${layers.length} 层
    </div>
  `;
  stage.appendChild(svg);
  if (totalParts.length) {
    const totalEl = document.createElement('div');
    totalEl.className = 'ftg-total';
    totalEl.innerHTML = `<span>全解锁：</span>` + totalParts.map((p) => `<span>${escapeHtml(p)}</span>`).join('');
    stage.appendChild(totalEl);
  }
  stage.insertAdjacentHTML('beforeend', `<div class="ftg-hint">节点图标走 Discord CDN；若显示为文字，说明当前网络无法访问 CDN，已自动降级。</div>`);
}

function renderFallback(x, y, r, label) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x);
  t.setAttribute('y', y + 4);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('class', 'ftg-fb');
  t.textContent = label.length > 6 ? label.slice(0, 6) : label;
  g.appendChild(t);
  return g;
}
