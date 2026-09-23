/* ================================================================
   🏆 称号（実績）定義。移植元: wings/index.html の TITLES（4454-4470行目）。
   condition は getWingStats() 相当の値（stats）を見て判定するが、一度でも
   条件を満たして獲得記録（wingsTitles_v1）に書き込んだ称号は、その後
   チェックを外す等で数値が下がっても再評価しない（＝取り消しは起きない。
   判定側は呼び出し元 wings-state.js の checkAndUnlockTitles() が「既に
   獲得済みならconditionを呼ばない」ことで保証する）。
   ================================================================ */
export const TITLES = [
  {
    id: 'cape_lv5',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-wing"/></svg>',
    name: { ja: '羽ばたきの証', en: 'Budding Wings' },
    desc: { ja: 'ケープレベル5に到達（光の翼20枚）', en: 'Reached Cape Level 5 (20 Wings of Light)' },
    condition: stats => stats.capeLevel >= 5,
  },
  {
    id: 'cape_lv10',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-hanger"/></svg>',
    name: { ja: '旅するケープ使い', en: 'Traveling Cloak-Bearer' },
    desc: { ja: 'ケープレベル10に到達（光の翼120枚）', en: 'Reached Cape Level 10 (120 Wings of Light)' },
    condition: stats => stats.capeLevel >= 10,
  },
  {
    id: 'cape_lv13',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-crown"/></svg>',
    name: { ja: '光の翼、極めし者', en: 'Master of the Winged Light' },
    desc: { ja: 'ケープレベル最大の13に到達（光の翼250枚）', en: 'Reached the max Cape Level 13 (250 Wings of Light)' },
    condition: stats => stats.capeLevel >= 13,
  },
  {
    id: 'lc_half',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#wg-i-flashlight"/></svg>',
    name: { ja: '光を辿る探検家', en: 'Light-Tracing Explorer' },
    desc: { ja: '光の子を62体（半数）発見', en: 'Found 62 Children of Light (half)' },
    condition: stats => stats.lightChildrenGot >= 62,
  },
  {
    id: 'lc_all',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-star"/></svg>',
    name: { ja: '光の子コンプリート', en: 'Children of Light Completionist' },
    desc: { ja: '光の子124体すべてを発見', en: 'Found all 124 Children of Light' },
    condition: stats => stats.lightChildrenGot >= stats.lightChildrenTotal,
  },
];
