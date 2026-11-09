/* ================================================================
   friendship-tree-data.js — 新好友树（Ver.33.5）データ
   出典: thatsky_syuan 氏のまとめ画像
   総計: 白キャンドル645 + 昇華10
   ================================================================ */

// 各レベルで解放される相互動作。costは白キャンドル（c）または昇華（ac）。
// 各動作は Lv.1〜4（または Lv.2〜4）までアップグレード可能。
export const FRIENDSHIP_TREE = [
  {
    level: 1, title: 'Lv.1', titleJa: '最初の友達',
    actions: [
      { name: 'Hold Hands', nameJa: '手をつなぐ', cost: 0, icon: 'hand' },
      { name: 'High Five', nameJa: 'ハイタッチ', cost: 1, icon: 'highfive' },
    ]
  },
  {
    level: 2, title: 'Lv.2', titleJa: '交流を深める',
    actions: [
      { name: 'High Five', nameJa: 'ハイタッチ Lv.2', cost: 5, icon: 'highfive' },
      { name: 'Wavedash', nameJa: '手振り', cost: 2, icon: 'wave', maxLevel: 4 },
      { name: 'Hug', nameJa: 'ハグ', cost: 3, icon: 'hug' },
    ]
  },
  {
    level: 3, title: 'Lv.3', titleJa: 'もっと仲良く',
    actions: [
      { name: 'Chat', nameJa: 'チャット', cost: 3, icon: 'chat' },
      { name: 'Cuddle', nameJa: '寄り添う', cost: 3, icon: 'cuddle', maxLevel: 4 },
      { name: 'Carry', nameJa: 'おんぶ', cost: 4, icon: 'carry', maxLevel: 4 },
    ]
  },
  {
    level: 4, title: 'Lv.4', titleJa: '信頼関係',
    actions: [
      { name: 'Gift', nameJa: 'プレゼント', cost: 6, icon: 'gift', maxLevel: 2 },
      { name: 'Piggyback', nameJa: '抱っこ', cost: 7, icon: 'piggyback', maxLevel: 4 },
      { name: 'Embrace', nameJa: '抱擁', cost: 9, icon: 'embrace', maxLevel: 4 },
    ]
  },
  {
    level: 5, title: 'Lv.5', titleJa: '冒険のパートナー',
    actions: [
      { name: 'Carry On', nameJa: '運ぶ', cost: 12, icon: 'carryon', maxLevel: 3 },
      { name: 'Piggyback More', nameJa: 'さらにおんぶ', cost: 14, icon: 'piggyback', maxLevel: 2 },
      { name: 'Wave More', nameJa: 'さらに手振り', cost: 15, icon: 'wave', maxLevel: 2 },
    ]
  },
  {
    level: 6, title: 'Lv.6', titleJa: '絆の力',
    actions: [
      { name: 'Fly Together', nameJa: '一緒に飛ぶ', cost: 0, ac: 10, icon: 'fly' },
      { name: 'Clap', nameJa: '拍手', cost: 25, icon: 'clap', minLevel: 3 },
      { name: 'Embrace More', nameJa: 'さらに抱擁', cost: 22, icon: 'embrace', minLevel: 3 },
      { name: 'Piggyback More', nameJa: 'さらに抱っこ', cost: 22, icon: 'piggyback', minLevel: 1 },
    ]
  },
  {
    level: 7, title: 'Lv.7', titleJa: '最高の友達',
    actions: [
      { name: 'Carry Best', nameJa: '最高の運び', cost: 34, icon: 'carryon', maxLevel: 2 },
    ]
  },
];

export const TOTAL_COST = { candles: 645, ascended: 10 };
