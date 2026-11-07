/* ================================================================
   珍珠季（Season of Pearl）兑换树「节点 id → 官方风格本地图标」显式映射。
   这里是人工核对的确定性映射，不做模糊匹配：
   companion 兑换树每个节点在 tree-data.js 里都有固定 id，
   按 id 直接命中对应图标，命中不了再走解析器/外部图/内置 SVG。
   图标位于 assets/pearl-icons/，均为透明底 PNG（由官方风格图标转制）。
   ================================================================ */

const BASE = 'assets/pearl-icons/';

// 节点 id -> 图标文件名（不含扩展名）
const NODE_ICON = {
  // ── s1 腕っぷし自慢の船乗り（角力水手 / Wrestling Sailor）──
  s1_it1: 'cape-folded',     // 角力水手斗篷
  s1_it2: 'sailor-hair',     // 角力水手发型（粉色头巾辫）
  s1_bonus3: 'sailor-outfit',// 角力水手连体裤（季卡）
  s1_mag1: 'star-spell',
  s1_bonus2b: 'star-spell',
  s1_mag3: 'star-spell',
  s1_bonus4b: 'star-spell',

  // ── s2 見せびらかしの商人（爱炫耀的商人 / Showy Merchant）──
  s2_it1: 'merchant-hair',   // 商人白色卷发
  s2_it2: 'merchant-dress',  // 商人粉色长裙
  s2_bonus3: 'necklace',     // 季卡项链（珍珠领结）
  s2_mag1: 'star-spell',
  s2_mag2: 'star-spell',

  // ── s3 老いた漁師（迟疑渔翁 / Old Angler）──
  s3_bonus3: 'angler-mask',  // 渔翁白胡子面具（季卡）
  s3_it2: 'angler-outfit',   // 渔翁白夹克棕裤
  s3_bonus4: 'sailor-cap',   // 渔翁水手帽（季卡发饰）
  s3_mag1: 'star-spell',
  s3_mag2: 'star-spell',

  // ── s4 転げまわる幼子（撒娇打滚的小孩 / Cuddly Rolling Child）──
  s4_it1: 'child-mask',      // 孩童腮红泪眼面具
  s4_mag3: 'child-outfit',   // 孩童白色短套装
  s4_bonus3: 'child-hair',   // 孩童白色刺猬头（季卡）
  s4_bonus4: 'cape-pouch',   // 孩童带兜斗篷（季卡）
  s4_mag1: 'star-spell',
  s4_mag2: 'star-spell',
};

// 按节点 id 取确定性图标路径；未登记返回 null
export function getPearlIcon(nodeId) {
  const name = NODE_ICON[nodeId];
  return name ? BASE + name + '.png' : null;
}

export const PEARL_NODE_ICON = NODE_ICON;
