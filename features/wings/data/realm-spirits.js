/* ================================================================
   恒常精霊（地方の精霊）リスト — 37体、うち12体はTier2の光の翼も追加である。
   t1/t2 は光の翼の開放に必要な星のキャンドルの本数（精霊ごとに異なる）。
   移植元: wings/index.html 内 REALM_SPIRITS（2093-2143行目）を
   byte-for-byteそのまま抽出したもの。
   ================================================================ */
export const REALM_SPIRITS = [
  { realm: { ja: '孤島', en: 'Isle of Dawn' }, spirits: [
    { name: { ja: '指差すキャンドル職人', en: 'Pointing Candlemaker' }, t1: 1 },
    { name: { ja: '固辞する航行者', en: 'Rejecting Voyager' }, t1: 1 },
    { name: { ja: '先導する星読み', en: 'Ushering Stargazer' }, t1: 1 },
  ] },
  { realm: { ja: '草原', en: 'Prairie' }, spirits: [
    { name: { ja: '賞賛する鐘の造り手', en: 'Applauding Bellmaker' }, t1: 1 },
    { name: { ja: '鳥の語り部', en: 'Bird Whisperer' }, t1: 2 },
    { name: { ja: '蝶々使い', en: 'Butterfly Charmer' }, t1: 1, t2: 3 },
    { name: { ja: '式典の礼拝者', en: 'Ceremonial Worshiper' }, t1: 1 },
    { name: { ja: '疲弊した荷積み人', en: 'Exhausted Dock Worker' }, t1: 1 },
    { name: { ja: '笑う光採取者', en: 'Laughing Light Catcher' }, t1: 2 },
    { name: { ja: '寝不足の造舟師', en: 'Sleepy Shipwright' }, t1: 1 }, // 未確認: 文脈からの推定訳
    { name: { ja: '手を振る鐘の造り手', en: 'Waving Bellmaker' }, t1: 2, t2: 6 }, // 一部推定: 賞賛する鐘の造り手と対になる名として推定
  ] },
  { realm: { ja: '雨林', en: 'Forest' }, spirits: [
    { name: { ja: '反省する木こり', en: 'Apologetic Lumberjack' }, t1: 1 },
    { name: { ja: '恥じらう探鉱者', en: 'Blushing Prospector' }, t1: 1 },
    { name: { ja: 'うろたえる狩人', en: 'Dismayed Hunter' }, t1: 3, t2: 9 },
    { name: { ja: 'かくれんぼ提唱者', en: "Hide'n'Seek Pioneer" }, t1: 3, t2: 6 },
    { name: { ja: '怒れる運び人', en: 'Pouty Porter' }, t1: 2, t2: 6 },
    { name: { ja: '凍える先駆者', en: 'Shivering Trailblazer' }, t1: 2 },
    { name: { ja: '涙ぐむ光坑夫', en: 'Tearful Light Miner' }, t1: 1, t2: 3 },
    { name: { ja: '鯨の語り部', en: 'Whale Whisperer' }, t1: 1 },
  ] },
  { realm: { ja: '峡谷', en: 'Valley' }, spirits: [
    { name: { ja: '宙返りをする優勝者', en: 'Backflipping Champion' }, t1: 2 },
    { name: { ja: 'お辞儀をするメダリスト', en: 'Bowing Medalist' }, t1: 2 },
    { name: { ja: '応援する観客', en: 'Cheerful Spectator' }, t1: 2 },
    { name: { ja: '自信に満ちた観光客', en: 'Confident Tourist' }, t1: 2 }, // 未確認: 文脈からの推定訳
    { name: { ja: '逆立ちする怖いもの知らず', en: 'Handstanding Daredevil' }, t1: 3, t2: 9 }, // 未確認: 文脈からの推定訳
    { name: { ja: 'マンタの語り部', en: 'Manta Whisperer' }, t1: 1 },
    { name: { ja: '誇り高き勝者', en: 'Proud Victor' }, t1: 3, t2: 9 },
  ] },
  { realm: { ja: '捨てられた地', en: 'Wasteland' }, spirits: [
    { name: { ja: '勇敢な戦士', en: 'Brave Warrior' }, t1: 2, t2: 6 }, // 未確認: 文脈からの推定訳
    { name: { ja: '昏倒する戦士', en: 'Fainting Warrior' }, t1: 2 },
    { name: { ja: '怯える難民', en: 'Frightened Refugee' }, t1: 1 },
    { name: { ja: '警戒する斥候', en: 'Lookout Scout' }, t1: 2 },
    { name: { ja: '敬礼する隊長', en: 'Saluting Captain' }, t1: 3 },
    { name: { ja: '隠れ潜む生存者', en: 'Stealthy Survivor' }, t1: 4, t2: 12 },
  ] },
  { realm: { ja: '書庫', en: 'Vault' }, spirits: [
    { name: { ja: '念動力の使い手', en: 'Levitating Adept' }, t1: 2 },
    { name: { ja: '瞑想する修道士', en: 'Meditating Monastic' }, t1: 3 },
    { name: { ja: '記憶の語り部', en: 'Memory Whisperer' }, t1: 4, t2: 12 },
    { name: { ja: '敬けんな賢人', en: 'Polite Scholar' }, t1: 2 },
    { name: { ja: '祈る侍者', en: 'Praying Acolyte' }, t1: 3, t2: 9 }, // 未確認: 文脈からの推定訳
  ] },
];

// ケープレベルごとの累計必要光の翼数（Sky Wiki「光の翼」ページより）
export const CAPE_LEVELS = [1, 2, 5, 10, 20, 35, 55, 75, 100, 120, 150, 200, 250];
