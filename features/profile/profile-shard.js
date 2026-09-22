/* ================================================================
   🔺 闇の破片（シャード）の有無・色・場所（アバター右下の小さなバッジ用）。
   移植元: profile/index.html の findShardStatus()一式をロジック完全一致で
   ES moduleへ切り出したもの。コミュニティで検証された予測ルール
   （Sky Shards: PlutoyDev/sky-shards の Shard Prediction Rule）を元に、
   いつ・何色の破片がどの王国に来るかを計算する。

   features/shared/event-dashboard.js も同じアルゴリズムの別実装
   （shardInfo()）を内部に持つが、そちらはモジュール外に公開されておらず
   出力形状もダッシュボードの行表示用に特化しているため、アバター横の
   常時表示バッジ（色付きドット＋王国名＋タップで開くツールチップ）には
   このファイルの独立コピーを使う（元実装も2箇所で別々に持っていたのと
   同じ構成）。
   ================================================================ */

const PT_ZONE = 'America/Los_Angeles';

export const SHARD_REALMS = ['prairie', 'forest', 'valley', 'wasteland', 'vault'];
const SHARD_REALM_JA = { prairie: '草原', forest: '雨林', valley: '峡谷', wasteland: '捨てられた地', vault: '書庫' };
const SHARD_REALM_EN = { prairie: 'Prairie', forest: 'Forest', valley: 'Valley', wasteland: 'Wasteland', vault: 'Vault' };
export function realmName(lang, key) {
  return lang === 'en' ? (SHARD_REALM_EN[key] || key) : (SHARD_REALM_JA[key] || key);
}
const SHARD_WD_ISO = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
// 黒い破片2種・赤い破片3種、それぞれの初回開始時刻（PT）・間隔・発生しない曜日（ISO: 月=1〜日=7）
// maps は [草原, 雨林, 峡谷, 捨てられた地, 書庫] の順の場所名（9bit準拠）
const SHARD_CONFIGS = [
  { color: 'black', offsetSec: (1 * 3600 + 50 * 60), intervalSec: 8 * 3600, noShardWkDay: [6, 7],
    maps: ['蝶々の住処', '小川', 'スケートリンク', '最初のエリア', '星月夜の砂漠（バラ付近）'],
    mapsEn: ['Butterfly Fields', 'The Brook', 'Skating Rink', 'First Area', 'Starlight Desert (near the Roses)'] }, // 土・日は無し
  { color: 'black', offsetSec: (2 * 3600 + 10 * 60), intervalSec: 8 * 3600, noShardWkDay: [7, 1],
    maps: ['草原の村', '開拓地', 'スケートリンク', '戦場', '星月夜の砂漠（バラ付近）'],
    mapsEn: ['Prairie Village', 'The Clearing', 'Skating Rink', 'Battlefield', 'Starlight Desert (near the Roses)'] }, // 日・月は無し
  { color: 'red', offsetSec: (7 * 3600 + 40 * 60), intervalSec: 6 * 3600, noShardWkDay: [1, 2],
    maps: ['洞窟', '神殿奥', '夢見の町', '墓所', '星月夜の砂漠（舟のエリア）'],
    mapsEn: ['The Cave', 'Behind the Temple', 'Village of Dreams', 'Graveyard', 'Starlight Desert (near the boats)'] }, // 月・火は無し
  { color: 'red', offsetSec: (2 * 3600 + 20 * 60), intervalSec: 6 * 3600, noShardWkDay: [2, 3],
    maps: ['鳥の巣', 'ツリーハウス', '夢見の町', '座礁船', '星月夜の砂漠（舟のエリア）'],
    mapsEn: ['Bird Nest', 'Treehouse', 'Village of Dreams', 'Shipwreck', 'Starlight Desert (near the boats)'] }, // 火・水は無し
  { color: 'red', offsetSec: (3 * 3600 + 30 * 60), intervalSec: 6 * 3600, noShardWkDay: [3, 4],
    maps: ['楽園の島々', '晴れ間', '隠者の峠', '忘れられた方舟', '星月夜の砂漠（舟のエリア）'],
    mapsEn: ['Paradise Islands', 'Sunny Break', "Hermit's Pass", 'Forgotten Ark', 'Starlight Desert (near the boats)'] }, // 水・木は無し
];
const SHARD_DURATION_SEC = 4 * 3600; // 破片は出現から4時間で消える

function getZoneParts(zone, baseDate) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    weekday: 'short',
  }).formatToParts(baseDate || new Date());
  const get = t => (parts.find(p => p.type === t) || {}).value;
  return {
    y: get('year'), mo: get('month'), d: get('day'),
    h: Number(get('hour')) % 24, mi: Number(get('minute')), s: Number(get('second')),
    weekday: get('weekday'),
  };
}

// PTでの「その日の日付・曜日」から、その日の破片の色・場所・発生パターンを求める
function computeShardForDay(dayOfMonth, weekdayIso) {
  const isRed = dayOfMonth % 2 === 1;
  const realmIdx = (dayOfMonth - 1) % 5;
  const infoIndex = isRed ? (Math.floor((dayOfMonth - 1) / 2) % 3) + 2 : (Math.floor(dayOfMonth / 2) % 2);
  const cfg = SHARD_CONFIGS[infoIndex];
  return {
    color: cfg.color,
    realmIdx,
    place: cfg.maps[realmIdx],
    placeEn: (cfg.mapsEn && cfg.mapsEn[realmIdx]) || cfg.maps[realmIdx],
    offsetSec: cfg.offsetSec,
    intervalSec: cfg.intervalSec,
    hasShardToday: !cfg.noShardWkDay.includes(weekdayIso),
  };
}

// PTでの「年月日＋その日の0:00からの経過秒」を、実際のUTC時刻（Dateオブジェクト）に変換する。
// （夏時間切替日をまたぐケースの補正込み。詳細はprofile/index.htmlの元コメント参照）
function ptDateFromSecOfDay(y, mo, d, secOfDay) {
  const h = Math.floor(secOfDay / 3600);
  const mi = Math.floor((secOfDay % 3600) / 60);
  const s = Math.floor(secOfDay % 60);
  const target = Date.UTC(y, mo - 1, d, h, mi, s);
  const matchesTarget = t => {
    const zp = getZoneParts(PT_ZONE, new Date(t));
    return Number(zp.y) === y && Number(zp.mo) === mo && Number(zp.d) === d &&
      zp.h === h && zp.mi === mi && zp.s === s;
  };
  let guess = target;
  const guesses = [guess];
  for (let i = 0; i < 2; i++) {
    const zp = getZoneParts(PT_ZONE, new Date(guess));
    const zpAsUtc = Date.UTC(Number(zp.y), Number(zp.mo) - 1, Number(zp.d), zp.h, zp.mi, zp.s);
    guess += target - zpAsUtc;
    guesses.push(guess);
  }
  for (const g of guesses) {
    if (matchesTarget(g)) return new Date(g);
  }
  return new Date(Math.max.apply(null, guesses));
}

// 現在の状況（今まさに出現中 or 次はいつ・何色・どこか）を、開始・終了の絶対時刻つきで求める。
// 戻り値: null（今後7日間発生予定なし）、または
// { active, color, place, placeEn, realmIdx, start, end }
export function findShardStatus() {
  const now = new Date();
  const pt = getZoneParts(PT_ZONE, now);
  const secOfDayNow = pt.h * 3600 + pt.mi * 60 + pt.s;
  const today = computeShardForDay(Number(pt.d), SHARD_WD_ISO[pt.weekday]);

  if (today.hasShardToday) {
    for (let i = 0; today.offsetSec + i * today.intervalSec < 86400; i++) {
      const startSec = today.offsetSec + i * today.intervalSec;
      const endSec = startSec + SHARD_DURATION_SEC;
      if (secOfDayNow < endSec) {
        const start = ptDateFromSecOfDay(Number(pt.y), Number(pt.mo), Number(pt.d), startSec);
        const end = new Date(start.getTime() + SHARD_DURATION_SEC * 1000);
        return { active: secOfDayNow >= startSec, color: today.color, place: today.place, placeEn: today.placeEn, realmIdx: today.realmIdx, start, end };
      }
    }
  }
  // 今日はもう終わった（or 今日は発生しない）→ 最大7日先まで探す
  for (let dayAhead = 1; dayAhead <= 7; dayAhead++) {
    const future = new Date(Date.UTC(Number(pt.y), Number(pt.mo) - 1, Number(pt.d) + dayAhead, 12, 0, 0));
    const fpt = getZoneParts(PT_ZONE, future);
    const info = computeShardForDay(Number(fpt.d), SHARD_WD_ISO[fpt.weekday]);
    if (info.hasShardToday) {
      const start = ptDateFromSecOfDay(Number(fpt.y), Number(fpt.mo), Number(fpt.d), info.offsetSec);
      const end = new Date(start.getTime() + SHARD_DURATION_SEC * 1000);
      return { active: false, color: info.color, place: info.place, placeEn: info.placeEn, realmIdx: info.realmIdx, start, end };
    }
  }
  return null;
}

// 残り時間を「あとN日／N時間／N分／N秒」の粗い単位に丸める（呼び出し側がi18n文言に当てはめる）
export function coarseRemain(ms) {
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return { unit: 'days', n: days };
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return { unit: 'hours', n: h };
  const mi = Math.floor(ms / 60000);
  if (mi >= 1) return { unit: 'minutes', n: mi };
  return { unit: 'seconds', n: Math.max(0, Math.floor(ms / 1000)) };
}
