/* ================================================================
   tai-info（設定・更新情報）の「お使いのツール」自動検出テーブル。

   移植元: tai-info/index.html の `const TOOL_USAGE_SIGNS = [...]`
   （行2105-2115）。taipak5000.github.io系は同一オリジンで
   localStorageを共有しているため、通信なしで「他の公開ツールの
   データがこのブラウザに存在するか」を直接チェックできる。存在すれば
   「このツールを実際に使っている」とみなし、その使用中ツールに
   言及している更新情報エントリを⭐マークつきで控えめに強調表示する
   （tai-info-view.js の changelogEntryMentionsTool 参照）。

   keyPrefixesは各ツールの実在するlocalStorageキー名（推測ではない）。
   各ツールの大半はプロフィール切替（nsKey()）で `<rawKey>__p_<id>`
   という接尾辞が付くため、完全一致ではなくstartsWith判定にしている
   （tai-hubへポートされたitem/emote/share/tai-nomacan/star-candleの
   5ツールも、nsKey()がこのrawKeyをそのまま使う設計のため無変更で動く）。
   - item:        gameItems_<カテゴリ名>（例: gameItems_outfit）
   - emote:       emoteOwned_v1
   - share:       sky_tracker_storage
   - tai-nomacan: skyNomacanCalc_v1
   - star-candle: skyStarCandleCalc_v1
   - companion:   sky_companion_v4_data（未移植・スタンドアロンのまま）
   - wings:       wingTracker_v1（未移植・スタンドアロンのまま）
   - tai-score:   taiScoreSongs_v1（未移植・スタンドアロンのまま）
   - data-transfer: dataTransferHistory_v1（未移植・スタンドアロンのまま）
   toolKeyフィールドは元実装でも実際には未使用（matchJa/matchEnのみが
   判定に使われる）だが、データ形状の完全一致のためそのまま残している。
   ================================================================ */
export const TOOL_USAGE_SIGNS = [
  { toolKey: 'tools.item',       keyPrefixes: ['gameItems_'],            matchJa: 'アイテム所持',     matchEn: 'Item Tracker' },
  { toolKey: 'tools.emote',      keyPrefixes: ['emoteOwned_v1'],         matchJa: 'エモート所持',     matchEn: 'Emote Tracker' },
  { toolKey: 'tools.share',      keyPrefixes: ['sky_tracker_storage'],   matchJa: '創作物管理',       matchEn: 'Creation Manager' },
  { toolKey: 'tools.nomacan',    keyPrefixes: ['skyNomacanCalc_v1'],     matchJa: 'ノマキャン計算機', matchEn: 'Nomacan Calculator' },
  { toolKey: 'tools.starCandle', keyPrefixes: ['skyStarCandleCalc_v1'], matchJa: '星のキャンドル',   matchEn: 'Star Candle Calculator' },
  { toolKey: 'tools.companion',  keyPrefixes: ['sky_companion_v4_data'], matchJa: '精霊同行',         matchEn: 'Spirit Companion Tool' },
  { toolKey: 'tools.wings',      keyPrefixes: ['wingTracker_v1'],        matchJa: '羽トラッカー',     matchEn: 'Wing Tracker' },
  { toolKey: 'tools.score',      keyPrefixes: ['taiScoreSongs_v1'],      matchJa: '楽譜づくり',       matchEn: 'Sheet Music Maker' },
  { toolKey: 'tools.transfer',   keyPrefixes: ['dataTransferHistory_v1'], matchJa: 'データ引継ぎ',    matchEn: 'Data Transfer' },
];
