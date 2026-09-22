/* ================================================================
   称号（実績）定義。tai-nomacan/index.html の `var TITLES = [...]`
   （~行5407-5426、6件）をそのまま移植したもの。id・条件ロジック・
   アイコンSVG・ja/en文言のいずれも変更していない。

   condition(stats) が見る stats の形は { currentMax, longestStreak }
   （nomacan-state.js の checkAndUnlockTitles() が組み立てて渡す）。
   ================================================================ */

export const TITLES = [
  {
    id: 'streak3',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-flame"/></svg>',
    name: { ja: '灯し始め', en: 'Spark of a Streak' },
    desc: { ja: '3日連続で記録', en: 'Recorded 3 days in a row' },
    condition: (stats) => stats.longestStreak >= 3,
  },
  {
    id: 'streak7',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-candle"/></svg>',
    name: { ja: '一週間の灯火', en: "A Week's Flame" },
    desc: { ja: '7日連続で記録', en: 'Recorded 7 days in a row' },
    condition: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'streak30',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-star"/></svg>',
    name: { ja: '絶やさぬ灯', en: 'Unwavering Flame' },
    desc: { ja: '30日連続で記録', en: 'Recorded 30 days in a row' },
    condition: (stats) => stats.longestStreak >= 30,
  },
  {
    id: 'hold100',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-candle"/></svg>',
    name: { ja: '灯の蓄え', en: 'Candle Stockpile' },
    desc: { ja: '所持本数が100本に到達', en: 'Reached 100 candles held' },
    condition: (stats) => stats.currentMax >= 100,
  },
  {
    id: 'hold300',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-candle"/></svg>',
    name: { ja: '光の貯蔵庫', en: 'Vault of Light' },
    desc: { ja: '所持本数が300本に到達', en: 'Reached 300 candles held' },
    condition: (stats) => stats.currentMax >= 300,
  },
  {
    id: 'hold600',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-crown"/></svg>',
    name: { ja: '灯火の富豪', en: 'Candle Baron' },
    desc: { ja: '所持本数が600本に到達', en: 'Reached 600 candles held' },
    condition: (stats) => stats.currentMax >= 600,
  },
];
