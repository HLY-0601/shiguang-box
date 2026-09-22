/* ================================================================
   光の子（Children of Light）リスト — 全124体、地方 → 場所 → 個別の階層
   （天空の1体は転生ボーナスと重複するため除外）。各1体につき光の翼1枚
   （星のキャンドル不要）。
   移植元: wings/index.html 内 LIGHT_CHILDREN（2158-2558行目）を
   byte-for-byteそのまま抽出したもの。
   Sources: JP wiki https://sky-children-of-the-light.fandom.com/ja/wiki/%E5%85%89%E3%81%AE%E5%AD%90
            EN wiki https://sky-children-of-the-light.fandom.com/wiki/Children_of_Light (used only to fill one gap noted below)
   NOTE: isle_10 (孤島 光の子10) does not appear on the JP wiki page's content section (only 9 of 10
   Isle children are documented there). Its label/id were constructed to match the JP page's own
   numbering convention, and its image was sourced from the EN wiki page instead (a far/wide shot,
   no close-up exists there either).
   ================================================================ */
export const LIGHT_CHILDREN = [
  {
    realm: { ja: '花鳥郷', en: 'Aviary Village' },
    areas: [
      {
        area: { ja: 'さすらいカーニバル', en: 'Wandering Carnival' },
        children: [
          { id: 'aviary_1', label: '花鳥郷 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/47/Carnival-Winged-Light-1.jpg/revision/latest/scale-to-width-down/204?cb=20260417140555' },
          { id: 'aviary_2', label: '花鳥郷 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/34/Carnival-Winged-Light-2.jpg/revision/latest/scale-to-width-down/204?cb=20260417140556' },
        ]
      }
    ]
  },
  {
    realm: { ja: '孤島', en: 'Isle of Dawn' },
    areas: [
      {
        area: { ja: '孤島台地（砂丘）', en: 'Isle Plateau (Sand Dunes)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'isle_1', label: '孤島 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/ca/IMG_5816.JPG/revision/latest/scale-to-width-down/209?cb=20230703223929' },
          { id: 'isle_2', label: '孤島 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c2/StarIsle01.jpg/revision/latest/scale-to-width-down/204?cb=20190803001822' },
          { id: 'isle_3', label: '孤島 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/a8/StarIsle04.jpg/revision/latest/scale-to-width-down/204?cb=20190803002058' },
          { id: 'isle_4', label: '孤島 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/34/StarIsle03.jpg/revision/latest/scale-to-width-down/204?cb=20190803002059' },
          { id: 'isle_10', label: '孤島 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/e3/Migration-WingedLight-in-Isle.png/revision/latest/scale-to-width-down/204?cb=20251020164853' },
        ]
      },
      {
        area: { ja: '孤島の見晴らし台（蝶々の洞窟）', en: 'Isle Overlook (Butterfly Cave)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'isle_5', label: '孤島 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/46/IMG_5445.JPG/revision/latest/scale-to-width-down/209?cb=20230703224815' },
        ]
      },
      {
        area: { ja: '預言者の石窟', en: 'Cave of Prophecies' },
        children: [
          { id: 'isle_6', label: '孤島 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/6a/WL_water_trial.jpg/revision/latest/scale-to-width-down/209?cb=20230704012826' },
          { id: 'isle_7', label: '孤島 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/84/Trial_of_Earth_WL.jpg/revision/latest/scale-to-width-down/209?cb=20230705220526' },
          { id: 'isle_8', label: '孤島 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/86/AIR_WL.JPG/revision/latest/scale-to-width-down/209?cb=20230705232858' },
          { id: 'isle_9', label: '孤島 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c2/Trial-of-Fire-WL.png/revision/latest/scale-to-width-down/193?cb=20230110182520' },
        ]
      }
    ]
  },
  {
    realm: { ja: '草原', en: 'Prairie' },
    areas: [
      {
        area: { ja: '蝶々の住処', en: 'Butterfly Fields' },
        children: [
          { id: 'prairie_1', label: '草原 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c3/Butterflyfieldsstar3far.jpg/revision/latest/scale-to-width-down/167?cb=20241011010252' },
          { id: 'prairie_2', label: '草原 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/ca/StarPrairie01.jpeg/revision/latest/scale-to-width-down/204?cb=20190803002305' },
          { id: 'prairie_3', label: '草原 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/4f/StarPrairie02.jpg/revision/latest/scale-to-width-down/204?cb=20190803002306' },
        ]
      },
      {
        area: { ja: '草原の村', en: 'Prairie Village' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'prairie_4', label: '草原 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/ef/StarPrairie06.jpg/revision/latest/scale-to-width-down/204?cb=20190803002525' },
          { id: 'prairie_5', label: '草原 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/6e/StarPrairie07.jpg/revision/latest/scale-to-width-down/204?cb=20190803002526' },
          { id: 'prairie_6', label: '草原 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/32/StarPrairie08.jpg/revision/latest/scale-to-width-down/204?cb=20190803003034' },
        ]
      },
      {
        area: { ja: '草原高地（8人エレベーター）', en: 'Prairie Highlands (8-Player Elevator)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'prairie_7', label: '草原 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/1f/8playerpuzzlestar.JPG/revision/latest/scale-to-width-down/209?cb=20230703072031' },
        ]
      },
      {
        area: { ja: '草原の神殿', en: 'Prairie Temple' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'prairie_8', label: '草原 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d3/StarPrairie011.jpg/revision/latest/scale-to-width-down/209?cb=20230703233809' },
          { id: 'prairie_9', label: '草原 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/0b/StarPrairie012.jpg/revision/latest/scale-to-width-down/209?cb=20230703233859' },
        ]
      },
      {
        area: { ja: '草原の洞窟', en: 'Prairie Caves' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'prairie_10', label: '草原 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/17/StarPrairie09.jpg/revision/latest/scale-to-width-down/204?cb=20190803003035' },
          { id: 'prairie_11', label: '草原 光の子11', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/6d/StarPrairie010.jpg/revision/latest/scale-to-width-down/204?cb=20190803003036' },
        ]
      },
      {
        area: { ja: '鳥の巣（鳥の塔）', en: 'Bird Nest (Bird Tower)' },
        children: [
          { id: 'prairie_12', label: '草原 光の子12', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/16/StarPrairie4.jpg/revision/latest/scale-to-width-down/209?cb=20230707034626' },
          { id: 'prairie_13', label: '草原 光の子13', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/9c/StarPrairie5.jpg/revision/latest/scale-to-width-down/209?cb=20230707034705' },
        ]
      },
      {
        area: { ja: '楽園の島々', en: 'Sanctuary Islands' },
        children: [
          { id: 'prairie_14', label: '草原 光の子14', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/5d/Prairie_sanctuary_WL1.jpeg/revision/latest/scale-to-width-down/125?cb=20200626232203' },
          { id: 'prairie_15', label: '草原 光の子15', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/59/Prairie_sanctuary_WL2.jpeg/revision/latest/scale-to-width-down/209?cb=20230707050926' },
          { id: 'prairie_16', label: '草原 光の子16', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c6/Prairie_sanctuary_WL3.jpeg/revision/latest/scale-to-width-down/209?cb=20230707051027' },
          { id: 'prairie_17', label: '草原 光の子17', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/ec/Prairie_sanctuary_WL4.jpeg/revision/latest/scale-to-width-down/209?cb=20230707051122' },
          { id: 'prairie_18', label: '草原 光の子18', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/dc/Prairie_sanctuary_WL5.jpeg/revision/latest/scale-to-width-down/209?cb=20230707051225' },
          { id: 'prairie_19', label: '草原 光の子19', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/9a/Prairie_sanctuary_WL6.jpeg/revision/latest/scale-to-width-down/209?cb=20230707051333' },
          { id: 'prairie_20', label: '草原 光の子20', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d7/Prairie_sanctuary_WL7.jpeg/revision/latest/scale-to-width-down/209?cb=20230707051433' },
          { id: 'prairie_21', label: '草原 光の子21', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/45/Prairie_sanctuary_WL8.jpeg/revision/latest/scale-to-width-down/209?cb=20230707051537' },
        ]
      },
      {
        area: { ja: '草原連峰', en: 'Prairie Peaks' },
        children: [
          { id: 'prairie_22', label: '草原 光の子22', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/10/Prairie-Peaks-WL1.jpg/revision/latest/scale-to-width-down/209?cb=20230628152954' },
          { id: 'prairie_23', label: '草原 光の子23', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/2f/Prairie-Peaks-WL3.jpg/revision/latest/scale-to-width-down/209?cb=20230628152956' },
          { id: 'prairie_24', label: '草原 光の子24', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/36/Prairie-Peaks-WL2.jpg/revision/latest/scale-to-width-down/209?cb=20230628152955' },
        ]
      }
    ]
  },
  {
    realm: { ja: '雨林', en: 'Forest' },
    areas: [
      {
        area: { ja: '雨林の前庭（雨林の開拓地）', en: 'Forest Entrance (Forest Clearing)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_1', label: '雨林 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/63/StarForest01.jpg/revision/latest/scale-to-width-down/204?cb=20190803003514' },
          { id: 'forest_2', label: '雨林 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/85/StarForest02.jpg/revision/latest/scale-to-width-down/204?cb=20190803003515' },
        ]
      },
      {
        area: { ja: '雨林の小川', en: 'Forest Brook' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_3', label: '雨林 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/85/StarForest03.jpeg/revision/latest/scale-to-width-down/209?cb=20230711030827' },
          { id: 'forest_4', label: '雨林 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/f2/StarForest04.jpeg/revision/latest/scale-to-width-down/209?cb=20230707232933' },
          { id: 'forest_5', label: '雨林 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/83/StarForest05.jpg/revision/latest/scale-to-width-down/204?cb=20190803003551' },
          { id: 'forest_6', label: '雨林 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/9d/StarForest06.jpeg/revision/latest/scale-to-width-down/209?cb=20230711031132' },
        ]
      },
      {
        area: { ja: '雨林の墓場', en: 'Forest Graveyard' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_7', label: '雨林 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/ac/StarForest010.jpg/revision/latest/scale-to-width-down/204?cb=20190803011411' },
          { id: 'forest_8', label: '雨林 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/66/StarForest09.jpg/revision/latest/scale-to-width-down/204?cb=20190803011409' },
          { id: 'forest_9', label: '雨林 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/80/StarForest011.jpg/revision/latest/scale-to-width-down/204?cb=20190803011412' },
        ]
      },
      {
        area: { ja: '高台広場（雨の途切れる地）', en: 'Elevated Clearing (Sunny Spell)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_10', label: '雨林 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/94/StarForest07.jpg/revision/latest/scale-to-width-down/209?cb=20230711025937' },
          { id: 'forest_11', label: '雨林 光の子11', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/f6/StarForest08.jpg/revision/latest/scale-to-width-down/209?cb=20230709035049' },
        ]
      },
      {
        area: { ja: '青い鳥劇場', en: 'Blue Bird Theater' },
        children: [
          { id: 'forest_12', label: '雨林 光の子12', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/4c/Blue-Bird-Winged-Light-Location.jpg/revision/latest/scale-to-width-down/204?cb=20250421174747' },
        ]
      },
      {
        area: { ja: '雨林の大空洞（雨林の地下洞）', en: 'Forest Cavern (Forest Underground Cave)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_13', label: '雨林 光の子13', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/54/Caverns_star1.jpg/revision/latest/scale-to-width-down/209?cb=20230708022634' },
          { id: 'forest_14', label: '雨林 光の子14', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/e0/Caverns_star3.jpg/revision/latest/scale-to-width-down/209?cb=20230708022753' },
          { id: 'forest_15', label: '雨林 光の子15', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/cc/Caverns_star2.jpg/revision/latest/scale-to-width-down/209?cb=20230708022858' },
          { id: 'forest_16', label: '雨林 光の子16', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/2d/Caverns_star4.jpg/revision/latest/scale-to-width-down/209?cb=20230708022942' },
        ]
      },
      {
        area: { ja: '聖なる池（雨林の端）', en: 'Sacred Pond (Edge of the Forest)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_17', label: '雨林 光の子17', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/2b/StarForest012.jpg/revision/latest/scale-to-width-down/204?cb=20190803011413' },
        ]
      },
      {
        area: { ja: 'ツリーハウス', en: 'Treehouse' },
        children: [
          { id: 'forest_18', label: '雨林 光の子18', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/78/SOA-Winglight-2.jpg/revision/latest/scale-to-width-down/209?cb=20230708050149' },
          { id: 'forest_19', label: '雨林 光の子19', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/73/SOA-Winglight-1.jpg/revision/latest/scale-to-width-down/209?cb=20230708050236' },
        ]
      },
      {
        area: { ja: '風の街道', en: 'Wind Paths' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'forest_20', label: '雨林 光の子20', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/f3/SOF-Winglight-1.png/revision/latest/scale-to-width-down/209?cb=20230708071606' },
          { id: 'forest_21', label: '雨林 光の子21', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/0c/Migration-WingedLight-in-Windpath.png/revision/latest/scale-to-width-down/204?cb=20251020122821' },
        ]
      }
    ]
  },
  {
    realm: { ja: '峡谷', en: 'Valley' },
    areas: [
      {
        area: { ja: '凍った湖（アイスリンク）', en: 'Frozen Lake (Ice Rink)' },
        children: [
          { id: 'valley_1', label: '峡谷 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/47/StarValley01.jpg/revision/latest/scale-to-width-down/204?cb=20190803011525' },
          { id: 'valley_2', label: '峡谷 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/08/StarValley02.jpg/revision/latest/scale-to-width-down/204?cb=20190803011525' },
          { id: 'valley_3', label: '峡谷 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c1/StarValley03.jpg/revision/latest/scale-to-width-down/209?cb=20230707233401' },
        ]
      },
      {
        area: { ja: '峡谷の陸通り（陸のレース）', en: 'Valley Passage (Land Race)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'valley_4', label: '峡谷 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/ff/StarValley09.jpg/revision/latest/scale-to-width-down/204?cb=20190803221727' },
        ]
      },
      {
        area: { ja: '城塞都市', en: 'Citadel' },
        children: [
          { id: 'valley_5', label: '峡谷 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d6/StarValley04.jpg/revision/latest/scale-to-width-down/204?cb=20190803011528' },
          { id: 'valley_6', label: '峡谷 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/69/StarValley05.jpeg/revision/latest/scale-to-width-down/204?cb=20190803011529' },
        ]
      },
      {
        area: { ja: '峡谷の空通り（空のレース）', en: 'Valley Skyway (Sky Race)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'valley_7', label: '峡谷 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/38/StarValley06.jpg/revision/latest/scale-to-width-down/204?cb=20190803011529' },
          { id: 'valley_8', label: '峡谷 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c1/StarValley07.jpeg/revision/latest/scale-to-width-down/204?cb=20190803221725' },
        ]
      },
      {
        area: { ja: '円形劇場', en: 'Coliseum' },
        children: [
          { id: 'valley_9', label: '峡谷 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/5d/StarValley08.jpg/revision/latest/scale-to-width-down/204?cb=20190803221725' },
          { id: 'valley_10', label: '峡谷 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/e3/Screenshot_20201223-184359_Sky.jpg/revision/latest/scale-to-width-down/204?cb=20201224021445' },
        ]
      },
      {
        area: { ja: '峡谷の神殿', en: 'Valley Temple' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'valley_11', label: '峡谷 光の子11', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/9f/Temple_WL_11.jpg/revision/latest/scale-to-width-down/209?cb=20230708223004' },
        ]
      },
      {
        area: { ja: '夢見の町', en: 'Village of Dreams' },
        children: [
          { id: 'valley_12', label: '峡谷 光の子12', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/8f/SKY_20210105_115647_.jpg/revision/latest/scale-to-width-down/209?cb=20230708223216' },
          { id: 'valley_13', label: '峡谷 光の子13', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/bc/Valley_Wl_13.jpg/revision/latest/scale-to-width-down/209?cb=20230708223514' },
          { id: 'valley_14', label: '峡谷 光の子14', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/52/WL_14.jpg/revision/latest/scale-to-width-down/209?cb=20230708223718' },
        ]
      },
      {
        area: { ja: '隠者の峠', en: 'Hermit Valley' },
        children: [
          { id: 'valley_15', label: '峡谷 光の子15', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/0c/WingLight4.jpg/revision/latest/scale-to-width-down/209?cb=20230708224309' },
          { id: 'valley_16', label: '峡谷 光の子16', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/80/Hermit_Valley_WL_16.jpg/revision/latest/scale-to-width-down/209?cb=20230708230955' },
        ]
      },
      {
        area: { ja: '夢見の劇場', en: 'Dream Theater' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'valley_17', label: '峡谷 光の子17', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/41/Season_of_Performance_-_WingedLight.png/revision/latest/scale-to-width-down/209?cb=20230708231217' },
        ]
      }
    ]
  },
  {
    realm: { ja: '捨てられた地', en: 'Wasteland' },
    areas: [
      {
        area: { ja: '外郭（倒壊した祠）', en: 'Outer Wall (Collapsed Shrine)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'wasteland_1', label: '捨てられた地 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/45/StarWasteland01.jpg/revision/latest/scale-to-width-down/204?cb=20190803221906' },
          { id: 'wasteland_2', label: '捨てられた地 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/7b/StarWasteland02.jpg/revision/latest/scale-to-width-down/209?cb=20230710041928' },
        ]
      },
      {
        area: { ja: '墓所', en: 'Graveyard' },
        children: [
          { id: 'wasteland_3', label: '捨てられた地 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b8/StarWasteland03.jpg/revision/latest/scale-to-width-down/209?cb=20230710042216' },
          { id: 'wasteland_4', label: '捨てられた地 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/ed/StarWasteland04.jpg/revision/latest/scale-to-width-down/204?cb=20190803221908' },
          { id: 'wasteland_5', label: '捨てられた地 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/5/55/StarWasteland05.jpg/revision/latest/scale-to-width-down/204?cb=20190803221909' },
          { id: 'wasteland_6', label: '捨てられた地 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/1a/StarWasteland06.jpg/revision/latest/scale-to-width-down/204?cb=20190803222731' },
          { id: 'wasteland_7', label: '捨てられた地 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/19/StarWasteland07.jpg/revision/latest/scale-to-width-down/209?cb=20230710042728' },
          { id: 'wasteland_8', label: '捨てられた地 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b2/StarWasteland08.jpg/revision/latest/scale-to-width-down/204?cb=20190803222734' },
        ]
      },
      {
        area: { ja: '戦場', en: 'Battlefield' },
        children: [
          { id: 'wasteland_9', label: '捨てられた地 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/ff/StarWasteland012.jpg/revision/latest/scale-to-width-down/204?cb=20190803223900' },
          { id: 'wasteland_10', label: '捨てられた地 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/ac/StarWasteland013.jpg/revision/latest/scale-to-width-down/204?cb=20190803223901' },
        ]
      },
      {
        area: { ja: '蟹の沼地（座礁船）', en: 'Crab Marsh (Shipwreck)' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'wasteland_11', label: '捨てられた地 光の子11', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d0/StarWasteland09.jpeg/revision/latest/scale-to-width-down/204?cb=20190803222735' },
          { id: 'wasteland_12', label: '捨てられた地 光の子12', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/8a/StarWasteland010.jpg/revision/latest/scale-to-width-down/204?cb=20190803222736' },
          { id: 'wasteland_13', label: '捨てられた地 光の子13', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/8a/StarWasteland011.jpg/revision/latest/scale-to-width-down/204?cb=20190803222736' },
        ]
      },
      {
        area: { ja: '捨てられた地の神殿', en: 'Wasteland Temple' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'wasteland_14', label: '捨てられた地 光の子14', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/35/StarWasteland014.jpg/revision/latest/scale-to-width-down/204?cb=20190803223902' },
        ]
      },
      {
        area: { ja: '忘れられた方舟', en: 'Forgotten Ark' },
        children: [
          { id: 'wasteland_15', label: '捨てられた地 光の子15', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/69/Forgotten_ark_star_1.jpg/revision/latest/scale-to-width-down/188?cb=20200707194829' },
          { id: 'wasteland_16', label: '捨てられた地 光の子16', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/14/Forgotten_ark_star_2.jpg/revision/latest/scale-to-width-down/188?cb=20200707194904' },
        ]
      },
      {
        area: { ja: '秘宝の環礁', en: 'Treasure Reef' },
        children: [
          { id: 'wasteland_17', label: '捨てられた地 光の子17', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/81/Season_of_Abyss_-_Winglight_1.jpg/revision/latest/scale-to-width-down/209?cb=20211220014236' },
          { id: 'wasteland_18', label: '捨てられた地 光の子18', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/dd/Season_of_Abyss_-_Winglight2.jpg/revision/latest/scale-to-width-down/209?cb=20211220014249' },
        ]
      }
    ]
  },
  {
    realm: { ja: '書庫', en: 'Vault' },
    areas: [
      {
        area: { ja: '1〜3階', en: 'Floors 1-3' },
        children: [
          { id: 'vault_1', label: '書庫 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/96/StarVault01.jpg/revision/latest/scale-to-width-down/209?cb=20230711011811' },
          { id: 'vault_2', label: '書庫 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/05/StarVault02.jpg/revision/latest/scale-to-width-down/209?cb=20230711011913' },
        ]
      },
      {
        area: { ja: '4階〜最上階', en: 'Floor 4 - Top Floor' },
        children: [
          { id: 'vault_3', label: '書庫 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/e/ea/StarVault03.jpg/revision/latest/scale-to-width-down/204?cb=20190803230810' },
          { id: 'vault_4', label: '書庫 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/3a/Vaultnewstarfloor4.jpg/revision/latest/scale-to-width-down/183?cb=20200519163418' },
          { id: 'vault_5', label: '書庫 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b2/StarVault04.jpg/revision/latest/scale-to-width-down/204?cb=20190803224256' },
          { id: 'vault_6', label: '書庫 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/a1/StarVault05.jpg/revision/latest/scale-to-width-down/204?cb=20190803224257' },
        ]
      },
      {
        area: { ja: '資料庫', en: 'Archives' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'vault_7', label: '書庫 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b6/Vaultstar2.jpg/revision/latest/scale-to-width-down/167?cb=20200320013416' },
          { id: 'vault_8', label: '書庫 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/78/Vaultstar3.jpg/revision/latest/scale-to-width-down/167?cb=20200320013449' },
        ]
      },
      {
        area: { ja: '星月夜の砂漠', en: 'Starlight Desert' },
        children: [
          { id: 'vault_9', label: '書庫 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/66/SOTLP-Winglight-1.jpg/revision/latest/scale-to-width-down/198?cb=20210606020353' },
          { id: 'vault_10', label: '書庫 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c4/SOTLP-Winglight-2.jpg/revision/latest/scale-to-width-down/198?cb=20210606020354' },
          { id: 'vault_11', label: '書庫 光の子11', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b7/SOTLP-Winglight-3.jpg/revision/latest/scale-to-width-down/198?cb=20210606020354' },
        ]
      },
      {
        area: { ja: '君憶う保存庫', en: 'Chamber of Remembrance' }, // 未確認: 文脈からの推定訳
        children: [
          { id: 'vault_12', label: '書庫 光の子12', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/db/SOR-Winglight-1.png/revision/latest/scale-to-width-down/204?cb=20230116104621' },
        ]
      },
      {
        area: { ja: '三日月オアシス', en: 'Crescent Oasis' },
        children: [
          { id: 'vault_13', label: '書庫 光の子13', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/21/Crescent-Oasis-WL1.jpg/revision/latest/scale-to-width-down/204?cb=20231222213208' },
          { id: 'vault_14', label: '書庫 光の子14', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d6/Crescent-Oasis-WL2.jpg/revision/latest/scale-to-width-down/204?cb=20231222212155' },
          { id: 'vault_15', label: '書庫 光の子15', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c8/Crescent-Oasis-WL3.jpg/revision/latest/scale-to-width-down/203?cb=20240316230745' },
        ]
      },
      {
        area: { ja: 'ムーミン谷', en: 'Moominvalley' },
        children: [
          { id: 'vault_16', label: '書庫 光の子16', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c8/Season-of-Moomin-Winged-Light.jpg/revision/latest/scale-to-width-down/204?cb=20241009011144' },
        ]
      }
    ]
  },
  {
    realm: { ja: '暴風域', en: 'Eye of Eden' },
    areas: [
      {
        area: { ja: '暴風域', en: 'Eye of Eden' },
        children: [
          { id: 'eden_1', label: '暴風域 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d3/StarEden01.jpg/revision/latest/scale-to-width-down/209?cb=20230709035814' },
          { id: 'eden_2', label: '暴風域 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/bb/StarEden02.jpg/revision/latest/scale-to-width-down/204?cb=20190803224259' },
          { id: 'eden_3', label: '暴風域 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/76/StarEden3.jpg/revision/latest/scale-to-width-down/204?cb=20190803230258' },
          { id: 'eden_4', label: '暴風域 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/ce/StarEden04.jpg/revision/latest/scale-to-width-down/204?cb=20190803230259' },
          { id: 'eden_5', label: '暴風域 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/ad/StarEden05.jpg/revision/latest/scale-to-width-down/204?cb=20190803230301' },
          { id: 'eden_6', label: '暴風域 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/af/StarEden06.jpg/revision/latest/scale-to-width-down/204?cb=20190803230302' },
          { id: 'eden_7', label: '暴風域 光の子7', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/b4/StarEden07.jpg/revision/latest/scale-to-width-down/204?cb=20190803230303' },
          { id: 'eden_8', label: '暴風域 光の子8', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d5/StarEden08.jpg/revision/latest/scale-to-width-down/204?cb=20190803230546' },
          { id: 'eden_9', label: '暴風域 光の子9', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/73/StarEden09.jpg/revision/latest/scale-to-width-down/204?cb=20190803230547' },
          { id: 'eden_10', label: '暴風域 光の子10', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c8/StarEden010.jpg/revision/latest/scale-to-width-down/204?cb=20190803230548' },
        ]
      }
    ]
  },
  {
    realm: { ja: 'いにしえの追想', en: 'Void of Shattering' },
    areas: [
      {
        area: { ja: 'いにしえの追想', en: 'Void of Shattering' },
        children: [
          { id: 'shard_1', label: 'いにしえの追想 光の子1', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/12/SoShattering-Winged-Light-Jellyfish-Void.jpg/revision/latest/scale-to-width-down/193?cb=20220829003247' },
          { id: 'shard_2', label: 'いにしえの追想 光の子2', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/f/fe/SOShattering-Winged-light-crab-void.jpg/revision/latest/scale-to-width-down/209?cb=20220624235010' },
          { id: 'shard_3', label: 'いにしえの追想 光の子3', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/81/SOShattering-Winged-light-Manta-void.jpg/revision/latest/scale-to-width-down/209?cb=20220624235010' },
          { id: 'shard_4', label: 'いにしえの追想 光の子4', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/76/SOShattering-Winged-Light-in-Dark-Dragon-Void.jpg/revision/latest/scale-to-width-down/209?cb=20220821002301' },
          { id: 'shard_5', label: 'いにしえの追想 光の子5', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/2/2f/SOShattering-Winged-Light-whale-void.jpg/revision/latest/scale-to-width-down/209?cb=20220624235009' },
          { id: 'shard_6', label: 'いにしえの追想 光の子6', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c0/SoShattering-Winged-Light-elders-void.jpg/revision/latest/scale-to-width-down/209?cb=20220917012834' },
        ]
      }
    ]
  }
];
