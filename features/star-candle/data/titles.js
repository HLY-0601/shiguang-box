/* ================================================================
   称号（実績）定義。star-candle/index.html の `var TITLES = [...]`
   （~行6848-6855、6件）をそのまま移植したもの。id・条件ロジック・
   ja/en文言のいずれも変更していない。

   アイコンのみ調整: 元の streak_7 は共有スプライトに無い `#i-flame` を
   参照していたため、tai-hub共有スプライト(js/icon-sprite.js、編集しない)
   に無いアイコンとして star-candle-view.js が自前で追加するローカル
   スプライト（プレフィックス `sc-i-`）の `#sc-i-flame` に差し替えている。
   他5件は既存の共有スプライトにあるIDをそのまま使う。

   condition(stats) が見る stats の形は { maxCandle, streakBest }
   （star-candle-view.js の checkAndUnlockTitles() が組み立てて渡す、
   元のTITLES条件関数の引数と同じ形）。
   ================================================================ */

export const TITLES = [
  {
    id: 'streak_3',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-candle"/></svg>',
    name: { ja: '灯を絶やさぬ者', en: 'Flame Unwavering' },
    desc: { ja: '赤闇を3日連続で取りこぼさず回収', en: 'Collected shard rewards 3 days in a row without missing one' },
    condition: (s) => s.streakBest >= 3,
  },
  {
    id: 'streak_7',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#sc-i-flame"/></svg>',
    name: { ja: '一週間の灯火番', en: 'Weeklong Flamekeeper' },
    desc: { ja: '赤闇を7日連続で取りこぼさず回収', en: 'Collected shard rewards 7 days in a row without missing one' },
    condition: (s) => s.streakBest >= 7,
  },
  {
    id: 'streak_20',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-sparkle"/></svg>',
    name: { ja: '常夜の灯守', en: 'Everlasting Flamekeeper' },
    desc: { ja: '赤闇を20日連続で取りこぼさず回収', en: 'Collected shard rewards 20 days in a row without missing one' },
    condition: (s) => s.streakBest >= 20,
  },
  {
    id: 'candle_30',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-star"/></svg>',
    name: { ja: '星屑の蒐集者', en: 'Stardust Collector' },
    desc: { ja: '所持本数が最高30本に到達', en: 'Held 30 candles at once for the first time' },
    condition: (s) => s.maxCandle >= 30,
  },
  {
    id: 'candle_100',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-star"/></svg>',
    name: { ja: '百連の灯', en: 'Hundredfold Flame' },
    desc: { ja: '所持本数が最高100本に到達', en: 'Held 100 candles at once for the first time' },
    condition: (s) => s.maxCandle >= 100,
  },
  {
    id: 'candle_300',
    icon: '<svg class="inline-icon" width="16" height="16"><use href="#i-crown"/></svg>',
    name: { ja: '星々の帳を統べる者', en: 'Sovereign of the Starry Veil' },
    desc: { ja: '所持本数が最高300本に到達', en: 'Held 300 candles at once for the first time' },
    condition: (s) => s.maxCandle >= 300,
  },
];
