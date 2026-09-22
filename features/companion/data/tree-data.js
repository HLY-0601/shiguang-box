/* ================================================================
   精霊同行ツール（companion）の現行イベント精霊ツリーデータ。
   移植元: C:\Users\user\Downloads\skyツール\companion\index.html
   （createInitialTree/SPIRIT_TREE_COSTS/S1-S4_ART_IMAGES/createDefaultSpiritsData/
   TIER_TOTAL_OVERRIDES/CURRENT_SEASON_NAME/SEASON_START/SEASON_END、
   元ファイル3515-3736行付近）を値・コメントとも完全一致でそのまま移植したもの。

   ⚠️ これは「親愛なるファン・ゴッホへ」イベント（2026/7/17〜2026/10/2）専用の
   ツリー構成データ。次のイベント精霊ツリーに更新する際は、この1ファイルの
   中身（コスト表・アイコン画像・ポイント配分・個別上書き）を丸ごと次の
   ツリーの内容に置き換えること（companion/index.html側の更新と同じ作業）。
   ================================================================ */

// 🕯️ costs は精霊ごとのキャンドルコスト表（次イベントのツリー画像より反映）
// ツリーは下から第1層→第4層の順（画像の一番下が第1層、一番上のハートが最終報酬）。
// em1/mag1=第1層, it1/mag2=第2層, em2/mag3=第3層, it2/extra4=第4層季節アイテム, heart=シーズンハートとの交換（要アドパス）
// ⚠️ 第1層のみ、他の層と違って「アドパス①」の枠が実在しない（3つ目に見える右のアイコンは
// 連れ歩きを開始するためのボタンであり、キャンドルを払って交換する枠ではないため）。
// ⚠️ 第3層にはアドパスの枠が実在しない。代わりに第4層にアドパス④がある（ハートの後ろに追加し、
// heartのtier4[2]という位置参照を崩さないようにしている）。
// 🎭 エモートはLv1〜Lv4まであるが、Lv2とLv4はキャンドル交換ではなくアドパス限定で入手
// （アドパスアイテムとは別枠の「アドパスエモートLv2/Lv4」として存在）。
// キャンドルを払って交換できるのはLv1(第1層,無料)とLv3(第3層,em2)のみ。
// em2は「歩き系アイテムの出現順」で自動採番すると2番目=Lv2になってしまうため、customLabelでLv3に固定している。
function createInitialTree(prefix, costs) {
  return {
    tier1: [
      { id: prefix + '_em1', type: 'walk', firstUnlock: true, name: 'エモートLv1 (初回解放)', points: 20, candles: costs.em1, checked: true, excluded: false },
      { id: prefix + '_mag1', type: 'magic', name: '魔法①', points: 20, candles: costs.mag1, checked: false, excluded: false },
    ],
    tier2: [
      { id: prefix + '_it1', type: 'seasonal', name: '季節アイテム①', points: 30, candles: costs.it1, checked: false, excluded: false },
      { id: prefix + '_mag2', type: 'magic', name: '魔法②', points: 30, candles: costs.mag2, checked: false, excluded: false },
      { id: prefix + '_bonus2b', name: 'アドパスエモートLv2', points: 0, candles: 0, noPoints: true, firstBonus: true, requiresSeasonPass: true, checked: false, excluded: false },
    ],
    tier3: [
      { id: prefix + '_em2', type: 'walk', name: 'エモートLv3', customLabel: 'エモートLv3', points: 40, candles: costs.em2, checked: false, excluded: false },
      { id: prefix + '_mag3', type: 'magic', name: '魔法③', points: 40, candles: costs.mag3, checked: false, excluded: false },
    ],
    tier4: [
      { id: prefix + '_it2', type: 'seasonal', name: '季節アイテム②', points: 100, candles: costs.it2, checked: false, excluded: false },
      { id: prefix + '_extra4', type: 'magic', name: '魔法④', points: 0, candles: costs.extra, checked: false, excluded: false },
      { id: prefix + '_heart', name: '♡ ハートと交換', points: 0, candles: costs.heart, requiresSeasonPass: true, isHeartGoal: true, firstBonus: true, checked: false, excluded: false },
      { id: prefix + '_bonus4', name: 'アドパスアイテム', points: 0, candles: 0, noPoints: true, firstBonus: true, requiresSeasonPass: true, wrapRow: true, checked: false, excluded: false },
      { id: prefix + '_bonus4b', name: 'アドパスエモートLv4', points: 0, candles: 0, noPoints: true, firstBonus: true, requiresSeasonPass: true, checked: false, excluded: false },
    ],
  };
}

// 🎨 オランダの思い出（s1）の実機アイコン画像（本家スクショより）。
const S1_ART_IMAGES = {
  emote_generic: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/cb/Dear-Van-Gogh-Dutch-Memory-Emote-icon.png/revision/latest/scale-to-width-down/51',
  dye_white: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/64/White-dye-container-icon.png/revision/latest/scale-to-width-down/51',
  adpass_dress: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/a1/Dear-Van-Gogh-Dutch-Memory-Outfit-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_shell: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/85/Dear-Van-Gogh-Dutch-Memory-Cape-icon.png/revision/latest/scale-to-width-down/51',
  adpass_headpiece: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/ab/Dear-Van-Gogh-Dutch-Memory-Hair-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_vase: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/0a/Dear-Van-Gogh-Dutch-Memory-Vase-Prop-icon.png/revision/latest/scale-to-width-down/51',
};

// 🎨 素朴な思い出（s2）の実機アイコン画像（本家スクショより）。
const S2_ART_IMAGES = {
  emote_generic: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/fc/Dear-Van-Gogh-Rustic-Memory-Emote-icon.png/revision/latest/scale-to-width-down/51',
  dye_red: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/6c/Red-dye-container-icon.png/revision/latest/scale-to-width-down/51',
  adpass_cape: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/24/Dear-Van-Gogh-Rustic-Memory-Cape-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_hat: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/0e/Dear-Van-Gogh-Rustic-Memory-Hair-Accessory-icon.png/revision/latest/scale-to-width-down/51',
  adpass_shoe: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/36/Dear-Van-Gogh-Rustic-Memory-Shoes-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_painting: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/f2/Dear-Van-Gogh-Rustic-Memory-Painting-Prop-icon.png/revision/latest/scale-to-width-down/51',
};

// 🎨 喜びの思い出（s4）の実機アイコン画像（本家スクショより）。
const S4_ART_IMAGES = {
  emote_generic: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b8/Dear-Van-Gogh-Joyful-Memory-Emote-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_jacket: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/5f/Dear-Van-Gogh-Joyful-Memory-Cape-icon.png/revision/latest/scale-to-width-down/51',
  dye_black: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/97/Black-dye-container-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_hair: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/77/Dear-Van-Gogh-Joyful-Memory-Hair-icon.png/revision/latest/scale-to-width-down/51',
  adpass_cap: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/ca/Dear-Van-Gogh-Joyful-Memory-Hair-Accessory-icon.png/revision/latest/scale-to-width-down/51',
  seasonal_painting: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/62/Dear-Van-Gogh-Joyful-Memory-Painting-Prop-icon.png/revision/latest/scale-to-width-down/51',
};

// 🎨 芸術の思い出（s3）の実機アイコン画像（本家スクショより）。
const S3_ART_IMAGES = {
  dye_yellow: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/ad/Yellow-dye-container-icon.png/revision/latest/scale-to-width-down/51',
  adpass4_spiral: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/96/Dear-Van-Gogh-Artistic-Memory-Cape-icon.png/revision/latest/scale-to-width-down/51',
  emote_painting: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/1c/Dear-Van-Gogh-Artistic-Memory-Emote-icon.png/revision/latest/scale-to-width-down/51',
  magic_swirl: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/28/Special-event-spell-icon.png/revision/latest/scale-to-width-down/51',
  seasonal1_frame: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/87/Dear-Van-Gogh-Artistic-Memory-Painting-Prop-icon.png/revision/latest/scale-to-width-down/51',
  seasonal2_blob: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/26/Dear-Van-Gogh-Artistic-Memory-Hair-Accessory-icon.png/revision/latest/scale-to-width-down/51',
  seasonal3_vase: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/64/Dear-Van-Gogh-Artistic-Memory-Vase-Prop-icon.png/revision/latest/scale-to-width-down/51',
};

// 📊 次回イベント精霊ツリー（画像より）のキャンドルコスト一覧
// ツリー合計: オランダの思い出=89 / 素朴な思い出=89 / 芸術の思い出=103（黄色染料+10込み） / 喜びの思い出=111 （シーズンハートとの交換 🕯️3・要アドパス を含む）
export const SPIRIT_TREE_COSTS = {
  s1: { em1: 0, mag1: 4, it1: 18, mag2: 6, em2: 22, mag3: 10, it2: 26, extra: 0, heart: 3 },
  s2: { em1: 0, mag1: 4, it1: 18, mag2: 8, em2: 22, mag3: 8, it2: 26, extra: 0, heart: 3 },
  s3: { em1: 0, mag1: 12, it1: 18, mag2: 6, em2: 22, mag3: 22, it2: 10, extra: 0, heart: 3 },
  s4: { em1: 0, mag1: 12, it1: 0, mag2: 6, em2: 22, mag3: 8, it2: 26, extra: 12, heart: 3 },
};

// 🧬 精霊4体ぶんの初期データ（デフォルト状態）を毎回まっさらに生成するファクトリ関数。
export function createDefaultSpiritsData() {
  const data = [
    { id: 1, name: 'オランダの思い出', walkDays: 0, currentPreset: 'custom', treeData: createInitialTree('s1', SPIRIT_TREE_COSTS.s1) },
    { id: 2, name: '素朴な思い出', walkDays: 0, currentPreset: 'custom', treeData: createInitialTree('s2', SPIRIT_TREE_COSTS.s2) },
    { id: 3, name: '芸術の思い出', walkDays: 0, currentPreset: 'custom', treeData: createInitialTree('s3', SPIRIT_TREE_COSTS.s3) },
    { id: 4, name: '喜びの思い出', walkDays: 0, currentPreset: 'custom', treeData: createInitialTree('s4', SPIRIT_TREE_COSTS.s4) },
  ];

  // オランダの思い出: 第3層の魔法③ → 白染料（🕯️10）
  data[0].treeData.tier3[1].type = 'dye';
  data[0].treeData.tier3[1].customLabel = '白染料';
  data[0].treeData.tier4[1].customLabel = '魔法④';
  data[0].treeData.tier1[0].customImage = S1_ART_IMAGES.emote_generic;
  data[0].treeData.tier2[0].customImage = S1_ART_IMAGES.seasonal_vase;
  data[0].treeData.tier2[2].customImage = S1_ART_IMAGES.emote_generic;
  data[0].treeData.tier3[0].customImage = S1_ART_IMAGES.emote_generic;
  data[0].treeData.tier3[1].customImage = S1_ART_IMAGES.dye_white;
  data[0].treeData.tier4[0].customImage = S1_ART_IMAGES.seasonal_shell;
  data[0].treeData.tier4[3].customImage = S1_ART_IMAGES.adpass_dress;
  data[0].treeData.tier4[4].customImage = S1_ART_IMAGES.emote_generic;
  data[0].treeData.tier3.push({ id: 's1_bonus3', name: 'アドパスアイテム', points: 0, candles: 0, noPoints: true, firstBonus: true, requiresSeasonPass: true, checked: false, excluded: false, customImage: S1_ART_IMAGES.adpass_headpiece });

  // 素朴な思い出: 第2層の魔法② → 赤染料（🕯️8）。第4層の魔法④は枠自体が存在しないため削除（コスト0化）
  data[1].treeData.tier2[1].type = 'dye';
  data[1].treeData.tier2[1].customLabel = '赤染料';
  data[1].treeData.tier3[1].customLabel = '魔法③';
  data[1].treeData.tier4[1].customLabel = '魔法④';
  data[1].treeData.tier1[0].customImage = S2_ART_IMAGES.emote_generic;
  data[1].treeData.tier2[0].customImage = S2_ART_IMAGES.seasonal_painting;
  data[1].treeData.tier2[1].customImage = S2_ART_IMAGES.dye_red;
  data[1].treeData.tier2[2].customImage = S2_ART_IMAGES.emote_generic;
  data[1].treeData.tier3[0].customImage = S2_ART_IMAGES.emote_generic;
  data[1].treeData.tier4[0].customImage = S2_ART_IMAGES.seasonal_hat;
  data[1].treeData.tier4[3].customImage = S2_ART_IMAGES.adpass_cape;
  data[1].treeData.tier4[4].customImage = S2_ART_IMAGES.emote_generic;
  data[1].treeData.tier3.push({ id: 's2_bonus3', name: 'アドパスアイテム', points: 0, candles: 0, noPoints: true, firstBonus: true, requiresSeasonPass: true, checked: false, excluded: false, customImage: S2_ART_IMAGES.adpass_shoe });

  // 芸術の思い出: 第1層 魔法①→季節アイテム①(🕯️12) / 第2層 魔法②は自動で①に繰上(🕯️6)
  // 第3層 魔法③→季節アイテム③(🕯️22) / 第4層 季節アイテム②→魔法②(🕯️10、自動で②になる)
  // 第3層に「黄色染料」を追加(🕯️10)。3アイテム構成・獲得ポイント合計は80になるよう26.4/26.4/27.2で配分
  data[2].treeData.tier1[1].type = 'seasonal';
  data[2].treeData.tier3[0].points = 26.4;
  data[2].treeData.tier3[1].type = 'seasonal';
  data[2].treeData.tier3[1].points = 26.4;
  data[2].treeData.tier3.push({ id: 's3_dye_yellow', type: 'dye', customLabel: '黄色染料', points: 27.2, candles: 10, checked: false, excluded: false });
  data[2].treeData.tier4[0].type = 'magic';
  data[2].treeData.tier1[0].customImage = S3_ART_IMAGES.emote_painting;
  data[2].treeData.tier1[1].customImage = S3_ART_IMAGES.seasonal1_frame;
  data[2].treeData.tier2[1].customImage = S3_ART_IMAGES.magic_swirl;
  data[2].treeData.tier3[0].customImage = S3_ART_IMAGES.emote_painting;
  data[2].treeData.tier3[1].customImage = S3_ART_IMAGES.seasonal3_vase;
  data[2].treeData.tier4[0].customImage = S3_ART_IMAGES.magic_swirl;
  data[2].treeData.tier2[0].customImage = S3_ART_IMAGES.seasonal2_blob;
  data[2].treeData.tier2[2].customImage = S3_ART_IMAGES.emote_painting;
  data[2].treeData.tier3[2].customImage = S3_ART_IMAGES.dye_yellow;
  data[2].treeData.tier4[3].customImage = S3_ART_IMAGES.adpass4_spiral;
  data[2].treeData.tier4[4].customImage = S3_ART_IMAGES.emote_painting;

  // 喜びの思い出: 第1層 魔法①→季節アイテム①(🕯️12)
  // 第2層 季節アイテム①は枠が存在しないため削除（コスト0化）。魔法②は自動で①に繰上(🕯️6のまま)。獲得ポイントは60pに修正
  // 第3層 エモートのコストのみ変更(🕯️22)。魔法③は自動で②に繰上(🕯️8のまま)。季節アイテム②を新規追加(🕯️22)。各27p（第3層合計81p）
  // 第4層 季節アイテムはコストのみ変更(🕯️26、自動で③に繰上)。魔法④→黒染料(🕯️12)。それぞれ50p（合計100p）
  data[3].treeData.tier1[1].type = 'seasonal';
  data[3].treeData.tier2[0].points = 0;
  data[3].treeData.tier2[1].points = 60;
  data[3].treeData.tier3[0].points = 27;
  data[3].treeData.tier3[1].points = 27;
  data[3].treeData.tier3.push({ id: 's4_it3', type: 'seasonal', name: '季節アイテム②', points: 27, candles: 22, checked: false, excluded: false });
  data[3].treeData.tier4[0].points = 50;
  data[3].treeData.tier4[1].type = 'dye';
  data[3].treeData.tier4[1].points = 50;
  data[3].treeData.tier4[1].customLabel = '黒染料';
  data[3].treeData.tier1[0].customImage = S4_ART_IMAGES.emote_generic;
  data[3].treeData.tier1[1].customImage = S4_ART_IMAGES.seasonal_painting;
  data[3].treeData.tier2[2].customImage = S4_ART_IMAGES.emote_generic;
  data[3].treeData.tier3[0].customImage = S4_ART_IMAGES.emote_generic;
  data[3].treeData.tier3[2].customImage = S4_ART_IMAGES.seasonal_hair;
  data[3].treeData.tier4[0].customImage = S4_ART_IMAGES.seasonal_jacket;
  data[3].treeData.tier4[1].customImage = S4_ART_IMAGES.dye_black;

  // 喜びの思い出: アドパス専用枠（コスト0）は第4層ではなく第2層に存在する。
  data[3].treeData.tier4.splice(3, 1);
  data[3].treeData.tier4[3].customImage = S4_ART_IMAGES.emote_generic;
  data[3].treeData.tier2.push({ id: 's4_bonus2c', name: 'アドパスアイテム', points: 0, candles: 0, noPoints: true, requiresSeasonPass: true, wrapRow: true, checked: false, excluded: false, customImage: S4_ART_IMAGES.adpass_cap });

  return data;
}

// 🔓 各層の「完了時の累計ポイント」上書き（喜びの思い出(id:4)だけツリー構成が異なるため）
export const TIER_TOTAL_OVERRIDES = { 4: { t2: 100, t3: 181, t4: 281 } };

// 🌸 現在のシーズン情報（ヘッダーのバナー表示用。開始日時まで必要なため、
// features/item/data/season-data.js の CURRENT_SEASON とは別にこの1ファイルへ
// 複製している——item側は終了日時しか持たない。次のイベントに切り替わったら
// season-data.js の更新と同じタイミングでこちらも手動更新すること）
export const CURRENT_SEASON_NAME = '親愛なるファン・ゴッホへ';
export const SEASON_START = new Date('2026-07-17T16:00:00');
export const SEASON_END = new Date('2026-10-02T15:59:00');
export const SEASON_START_TEXT = '2026/7/17 16:00';
export const SEASON_END_TEXT = '2026/10/2 15:59';
