/* ================================================================
   star-candle-forecast.js — 赤闇(Red Shard)自動予測エンジン + 月表示
   カレンダーモーダル + 獲得履歴ログ(取り消し可能な一覧+推移グラフ) +
   「1年前の今日」バナー。

   移植元: star-candle/index.html のうち、以下のセクション
   （~行5632-6349、6352-6757、6679-6758）:
     - 赤闇予測エンジン: REALMS/CYCLE12/SKIP_WEEKDAYS/LOCATIONS/
       REWARD_MAX/REPEAT_HOURS、getDaySchedule/buildRedForecast/
       estimateGoalDateAllShards/sumExpectedShardRewards、
       7日間予測リスト(renderForecast)とそのカウントダウン
     - 赤闇カレンダー(月表示): getJstShardLandings/renderShardCalGrid/
       renderShardCalDayDetail
     - 獲得履歴ログ: loadHistory/saveHistory/addHistoryEntry/
       renderHistory/取り消し、ミニ推移グラフ(computeTrendPoints/
       computeRecentDailyPace/renderTrendChart)、「羽加算し忘れ」注記
     - 「1年前の今日」バナー

   このファイルの公開API: mount(container, ctx)/unmount()（tai-hubの
   ルーターが直接呼ぶmount/unmountはstar-candle-view.js側の2関数のみで、
   このファイルのmount/unmountはstar-candle-view.jsからだけ呼ばれる）。
   加えて、star-candle-view.js側（称号のストリーク計算・結果カードの
   試算・通知チェック）からも使う純粋関数を追加で公開している:
     getDaySchedule/getPTDateParts/buildRedForecast/
     estimateGoalDateAllShards/sumExpectedShardRewards/addHistoryEntry

   ctx（mount時にstar-candle-view.jsから渡されるコールバック束）:
     getCurrent()/setCurrent(n)/getTarget()/getFeathers()/getBuyDrink()/
     update()/saveState()/syncCurrentToSharedCurrency()/
     recordShardCheckin(dayKey)
   これにより、称号の恒久チェックインログ(TITLE_CHECKIN_LOG_KEY)や
   目標/現在本数の入力欄(DOM)はstar-candle-view.js側だけが持ち、この
   ファイルは直接それらに触れない（相互import循環を避けるための設計。
   view.js→forecast.jsの一方向importのみで完結する）。

   【意図的な簡略化】
   - 月表示カレンダーモーダル(元: 独自の固定中央ダイアログ
     `.shard-cal-overlay`、開くアニメーション無し)は、tai-hub共有chrome
     の `.modal-overlay`/`.modal-card` ボトムシート(js/chrome/dash-modal.js
     と同じ開閉パターン)に置き換えている。CLAUDE.mdの方針
     （新規モーダルはtransitionでなくanimationで開き、PC幅でも常に
     フルワイドの下端シートにする）に合わせるための意図的な適応で、
     計算ロジック・表示内容・チェック操作の挙動は完全に同一。
   - フォーカストラップ・Escキーでの閉じるは、tai-hubの既存モーダル
     (pf/dash/settings)がいずれも実装していない水準に合わせ、背景タップ
     での閉じるのみにしている（挙動が減る簡略化点）。
   ================================================================ */
import { nsKey } from '../../js/state.js';
import { CURRENT_LANG } from '../../js/i18n.js';
import { t } from './data/i18n-star-candle.js';
import { fmt, jpDate, weekdayLabel, formatDateValue, pad2 } from './date-utils.js';

/* ── 赤闇予測エンジンの設定値（星の実測に基づくコミュニティ推測ルール） ── */
const REALMS = ['草原', '雨林', '峡谷', '捨てられた地', '書庫'];
const CYCLE12 = [
  { time: '7:40', color: 'red' },
  { time: '2:10', color: 'black' },
  { time: '2:20', color: 'red' },
  { time: '1:50', color: 'black' },
  { time: '3:30', color: 'red' },
  { time: '2:10', color: 'black' },
  { time: '7:40', color: 'red' },
  { time: '1:50', color: 'black' },
  { time: '2:20', color: 'red' },
  { time: '2:10', color: 'black' },
  { time: '3:30', color: 'red' },
  { time: '1:50', color: 'black' },
];
const SKIP_WEEKDAYS = { '1:50': [6, 0], '2:10': [0, 1], '7:40': [1, 2], '2:20': [2, 3], '3:30': [3, 4] };
const LOCATIONS = {
  '草原': { '1:50': '蝶々の住処', '2:10': '草原の村', '7:40': '草原の洞窟', '2:20': '鳥の塔', '3:30': '楽園の島々' },
  '雨林': { '1:50': '雨林の小川', '2:10': '雨林の墓場', '7:40': '聖なる池', '2:20': 'ツリーハウス', '3:30': '高台広場' },
  '峡谷': { '1:50': 'アイスリンク', '2:10': 'アイスリンク', '7:40': '夢見の町', '2:20': '夢見の町', '3:30': '隠者の峠' },
  '捨てられた地': { '1:50': '倒壊した祠', '2:10': '戦場', '7:40': '墓所', '2:20': '蟹の沼地', '3:30': '忘れられた箱舟' },
  '書庫': { '1:50': '星月夜の砂漠', '2:10': '星月夜の砂漠', '7:40': '海月の入り江', '2:20': '海月の入り江', '3:30': '海月の入り江' },
};
const REWARD_MAX = {
  '草原': { '7:40': 2, '2:20': 2.5, '3:30': 3.5 },
  '雨林': { '7:40': 2.5, '2:20': 3.5, '3:30': 3.5 },
  '峡谷': { '7:40': 2.5, '2:20': 2.5, '3:30': 3.5 },
  '捨てられた地': { '7:40': 2, '2:20': 2.5, '3:30': 3.5 },
  '書庫': { '7:40': 3.5, '2:20': 3.5, '3:30': 3.5 },
};
const REPEAT_HOURS = { red: 6, black: 8 };
const LANDING_LAG_SEC = 8 * 60 + 40;
const END_LAG_SEC = 4 * 60 * 60; // 終了時刻 = 出現(ゲート)時刻から4時間後(着地時刻からではない)
const HISTORY_MAX_ENTRIES = 50;
const TREND_PACE_WINDOW_MS = 14 * 86400000;
const TREND_PACE_MIN_ELAPSED_MS = 86400000; // これ未満の経過期間では実績ペースを計算しない

/* レルムの日本語表記 -> 言語非依存キー。UI言語に応じた表示名はrealmLabel()で解決する。 */
const SHARD_REALM_JA = { prairie: '草原', forest: '雨林', valley: '峡谷', wasteland: '捨てられた地', vault: '書庫' };
const REALM_JA_TO_KEY = {};
Object.keys(SHARD_REALM_JA).forEach((k) => { REALM_JA_TO_KEY[SHARD_REALM_JA[k]] = k; });
function realmLabel(jaName) {
  const key = REALM_JA_TO_KEY[jaName];
  return key ? t('realm.' + key) : jaName;
}

/* 着地場所の固有名詞（日本語表記）→ 公式英語名。en表示のときだけ適用する。 */
const SHARD_LOCATION_EN = {
  '蝶々の住処': 'Butterfly Fields', '草原の村': 'Village Islands', '草原の洞窟': 'Cave', '鳥の塔': 'Bird Nest',
  '楽園の島々': 'Sanctuary Island', '雨林の小川': 'Brook', '雨林の墓場': 'Boneyard', '聖なる池': 'Forest Garden',
  'ツリーハウス': 'Treehouse', '高台広場': 'Elevated Clearing', 'アイスリンク': 'Ice Rink', '夢見の町': 'Village of Dreams',
  '隠者の峠': 'Hermit Valley', '倒壊した祠': 'Broken Temple', '戦場': 'Battlefield', '墓所': 'Graveyard',
  '蟹の沼地': 'Crab Field', '忘れられた箱舟': 'Forgotten Ark', '星月夜の砂漠': 'Starlight Desert', '海月の入り江': 'Jellyfish Cove',
};
function shardLocationName(jaName) {
  return CURRENT_LANG === 'en' ? (SHARD_LOCATION_EN[jaName] || jaName) : jaName;
}

/* ================================================================
   モジュール内状態（mount毎に張り直す）
   ================================================================ */
let containerEl = null;
let ctxRef = null;
let mountToken = 0;

let CHECKED_STORAGE_KEY = '';
let PREDICT_FILTER_KEY = '';
let HISTORY_STORAGE_KEY = '';
let ONE_YEAR_AGO_DISMISS_KEY = '';

let countdownTarget = null; // カウントダウン対象の時刻(Dateオブジェクト)
let countdownMode = null;   // 'land'=着地まで / 'end'=終了まで
let countdownIntervalId = null;

let shardCalViewDate = new Date();
let shardCalSelectedKey = null;
let shardCalOverlayEl = null;

let oneYearAgoMatch = null;

/* ================================================================
   公開API
   ================================================================ */
export function mount(container, ctx) {
  const myToken = ++mountToken;
  containerEl = container;
  ctxRef = ctx;

  CHECKED_STORAGE_KEY = nsKey('skyStarCandleCalc_checkedDays_v1');
  PREDICT_FILTER_KEY = nsKey('skyStarCandleForecastFilterHigh_v1');
  HISTORY_STORAGE_KEY = nsKey('skyStarCandleCalc_history_v1');
  ONE_YEAR_AGO_DISMISS_KEY = nsKey('skyStarCandleCalc_oneYearAgoDismiss_v1');

  countdownTarget = null;
  countdownMode = null;
  shardCalViewDate = new Date();
  shardCalViewDate.setDate(1);
  shardCalSelectedKey = null;
  oneYearAgoMatch = null;

  wireForecastEvents();
  wireHistoryEvents();
  wireOneYearAgoBanner();

  const filterEl = container.querySelector('#scPredictFilterHigh');
  if (filterEl) filterEl.checked = loadForecastFilterPref();
  try {
    renderForecast();
  } catch (err) {
    const listEl = container.querySelector('#scPredictList');
    if (listEl) listEl.innerHTML = `<p class="sc-predict-empty">${t('forecast.error')}</p>`;
  }
  if (myToken !== mountToken) return;
  countdownIntervalId = setInterval(updateCountdownDisplay, 1000);

  renderHistory();
  renderTrendChart();
  renderFeatherUnaddedNote();
  initOneYearAgoBanner();
}

export function unmount() {
  mountToken++;
  if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
  if (shardCalOverlayEl) { shardCalOverlayEl.remove(); shardCalOverlayEl = null; }
  containerEl = null;
  ctxRef = null;
  countdownTarget = null;
  countdownMode = null;
  oneYearAgoMatch = null;
}

/* ================================================================
   PT(太平洋時間)暦日ユーティリティ
   ================================================================ */
export function getPTDateParts(date) {
  const fmtr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
  });
  const obj = {};
  fmtr.formatToParts(date).forEach((p) => { if (p.type !== 'literal') obj[p.type] = p.value; });
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: parseInt(obj.year, 10),
    month: parseInt(obj.month, 10),
    day: parseInt(obj.day, 10),
    weekday: weekdayMap[obj.weekday],
  };
}

function getPTOffsetMinutes(refDate) {
  const fmtr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const obj = {};
  fmtr.formatToParts(refDate).forEach((p) => { if (p.type !== 'literal') obj[p.type] = p.value; });
  const hour = obj.hour === '24' ? 0 : parseInt(obj.hour, 10);
  const asUTC = Date.UTC(parseInt(obj.year, 10), parseInt(obj.month, 10) - 1, parseInt(obj.day, 10), hour, parseInt(obj.minute, 10), parseInt(obj.second, 10));
  return Math.round((asUTC - refDate.getTime()) / 60000);
}

function ptWallClockToDate(year, month, day, hour, minute, offsetMinutes) {
  const naiveUTCms = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(naiveUTCms - offsetMinutes * 60000);
}

// checkedDaysのプルーニング(renderForecast内)は、月表示カレンダーからさかのぼって
// 記録した過去日のチェックまで消してしまわないよう、PT暦日で見て「今日以前」の
// キーはプルーニング対象から除外する。
function isPtDayKeyPastOrToday(key) {
  const p = (key || '').split('-');
  const y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
  if (!y || !m || !d) return false;
  const todayPt = getPTDateParts(new Date());
  if (y !== todayPt.year) return y < todayPt.year;
  if (m !== todayPt.month) return m < todayPt.month;
  return d <= todayPt.day;
}

function formatCountdown(ms) {
  if (!(ms > 0)) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return (days > 0 ? days + t('misc.dayUnit') + ' ' : '') + pad2(hours) + ':' + pad2(mins) + ':' + pad2(secs);
}

// 着地・終了の各時刻を日本時間(JST)で表示するためのラベルを作る。
function jstLabel(date) {
  const fmtr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', hour12: false,
    year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
  });
  const obj = {};
  fmtr.formatToParts(date).forEach((p) => { if (p.type !== 'literal') obj[p.type] = p.value; });
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = obj.hour === '24' ? 0 : parseInt(obj.hour, 10);
  return {
    dateKey: obj.year + '-' + obj.month + '-' + obj.day,
    dateLabel: obj.month + '/' + obj.day + '(' + weekdayLabel(weekdayMap[obj.weekday]) + ')',
    shortDate: obj.month + '/' + obj.day,
    timeLabel: pad2(hour) + ':' + pad2(parseInt(obj.minute, 10)),
  };
}

export function getDaySchedule(dayOfMonth, weekday) {
  const realm = REALMS[(dayOfMonth - 1) % 5];
  const slot = CYCLE12[(dayOfMonth - 1) % 12];
  const skipList = SKIP_WEEKDAYS[slot.time] || [];
  return { realm, time: slot.time, color: slot.color, skipped: skipList.indexOf(weekday) !== -1 };
}

function getOccurrenceMinutes(startTime, color) {
  const hm = startTime.split(':');
  const startMin = parseInt(hm[0], 10) * 60 + parseInt(hm[1], 10);
  const interval = REPEAT_HOURS[color] * 60;
  // ルール上、1日の発生回数は常に3回。24時到達で打ち切る方式だと余分な4回目が
  // 発生してしまう日があるため、回数で区切る。
  const list = [];
  for (let i = 0; i < 3; i++) list.push(startMin + i * interval);
  return list;
}

export function buildRedForecast(daysAhead) {
  const now = new Date();
  const offset = getPTOffsetMinutes(now);
  const windowEnd = now.getTime() + daysAhead * 86400000;
  const seenDays = {};
  const byDay = [];

  for (let i = -1; i <= daysAhead; i++) {
    const probe = new Date(now.getTime() + i * 86400000);
    const pt = getPTDateParts(probe);
    const dayKey = pt.year + '-' + pt.month + '-' + pt.day;
    if (seenDays[dayKey]) continue;
    seenDays[dayKey] = true;

    const sched = getDaySchedule(pt.day, pt.weekday);
    if (sched.color !== 'red' || sched.skipped) continue;

    const location = (LOCATIONS[sched.realm] || {})[sched.time] || '?';
    const entries = [];

    getOccurrenceMinutes(sched.time, 'red').forEach((mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const gateDate = ptWallClockToDate(pt.year, pt.month, pt.day, h, m, offset);
      const endDate = new Date(gateDate.getTime() + END_LAG_SEC * 1000);
      // 表示を消すかどうかは「終了時刻」で判定する(開始時刻基準だと、1回目の時刻に
      // 到達した瞬間まだ受け取り可能な1回目が一覧から消えてしまうため)。
      if (endDate.getTime() >= now.getTime() && gateDate.getTime() <= windowEnd) {
        const landingDate = new Date(gateDate.getTime() + LANDING_LAG_SEC * 1000);
        const land = jstLabel(landingDate);
        const end = jstLabel(endDate);
        entries.push({
          date: gateDate,
          active: gateDate.getTime() <= now.getTime(),
          landingDate,
          endDate,
          landDateKey: land.dateKey,
          landDateLabel: land.dateLabel,
          landShortDate: land.shortDate,
          landLabel: land.timeLabel,
          endDateKey: end.dateKey,
          endShortDate: end.shortDate,
          endLabel: end.timeLabel,
        });
      }
    });

    if (entries.length > 0) {
      byDay.push({
        dayKey,
        dateLabel: entries[0].landDateLabel,
        realm: sched.realm,
        location,
        maxReward: (REWARD_MAX[sched.realm] || {})[sched.time] || null,
        entries,
      });
    }
  }

  byDay.sort((a, b) => a.entries[0].date - b.entries[0].date);
  return byDay;
}

// 目標本数に対して、今後発生するすべての赤闇を取得すると仮定した場合の達成予定日を試算する。
export function estimateGoalDateAllShards(current, target, totalWeekly) {
  if (!(target > 0) || current >= target) return null;
  const dailyPace = totalWeekly / 7;
  const checkedDays = loadCheckedDays();
  const now = new Date();
  let cumulative = current;
  const seenDays = {};
  const MAX_DAYS = 3650; // 安全のため約10年で打ち切る

  for (let i = 0; i <= MAX_DAYS; i++) {
    const probe = new Date(now.getTime() + i * 86400000);
    cumulative += dailyPace;

    const pt = getPTDateParts(probe);
    const dayKey = pt.year + '-' + pt.month + '-' + pt.day;
    if (!seenDays[dayKey]) {
      seenDays[dayKey] = true;
      const sched = getDaySchedule(pt.day, pt.weekday);
      if (sched.color === 'red' && !sched.skipped && !checkedDays[dayKey]) {
        const reward = (REWARD_MAX[sched.realm] || {})[sched.time] || 0;
        cumulative += reward;
      }
    }

    if (cumulative >= target) {
      return { date: probe, daysNeeded: i + 1 };
    }
  }
  return null;
}

// 指定した期間内に届く予定の赤闇報酬の合計(未チェックの分のみ)を試算する。
export function sumExpectedShardRewards(fromDate, untilDate) {
  let total = 0;
  const msSpan = untilDate.getTime() - fromDate.getTime();
  if (msSpan <= 0) return 0;
  const checkedDays = loadCheckedDays();
  const seenDays = {};
  const daysSpan = Math.min(3650, Math.ceil(msSpan / 86400000) + 1);
  for (let i = 0; i <= daysSpan; i++) {
    const probe = new Date(fromDate.getTime() + i * 86400000);
    if (probe.getTime() > untilDate.getTime()) break;
    const pt = getPTDateParts(probe);
    const dayKey = pt.year + '-' + pt.month + '-' + pt.day;
    if (seenDays[dayKey]) continue;
    seenDays[dayKey] = true;
    const sched = getDaySchedule(pt.day, pt.weekday);
    if (sched.color === 'red' && !sched.skipped && !checkedDays[dayKey]) {
      total += (REWARD_MAX[sched.realm] || {})[sched.time] || 0;
    }
  }
  return total;
}

/* ================================================================
   「獲得済み」チェックの保存(CHECKED_STORAGE_KEY)
   ================================================================ */
function loadCheckedDays() {
  try {
    const raw = window.localStorage.getItem(CHECKED_STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch (err) { return {}; }
}
function saveCheckedDays(obj) {
  try { window.localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(obj)); } catch (err) { /* no-op */ }
}

function checkboxHtml(dayKey, reward, checked) {
  return `<label class="sc-predict-check"><input type="checkbox" class="sc-day-check" data-day-key="${dayKey}" data-reward="${reward}"${checked ? ' checked' : ''}><span>${t('forecast.collected')}</span></label>`;
}

// 「獲得済み」チェックの実処理(所持本数の増減・checkedDays更新・恒久ログ・履歴記録)。
// 7日間予測欄のチェックボックスと、月表示カレンダーの日別チェックボックスの両方から呼ばれる。
function applyShardCheckToggle(key, reward, checked) {
  const current = Math.max(0, ctxRef.getCurrent());
  const checkedDays = loadCheckedDays();
  let updated, delta;
  if (checked) {
    updated = current + reward;
    delta = reward;
    checkedDays[key] = true;
    ctxRef.recordShardCheckin(key);
  } else {
    updated = Math.max(0, current - reward);
    delta = updated - current; // 0未満に張り付いた場合も実際の増減分だけを記録する
    delete checkedDays[key];
  }
  ctxRef.setCurrent(Math.round(updated * 100) / 100);
  saveCheckedDays(checkedDays);
  ctxRef.update();
  ctxRef.saveState();
  ctxRef.syncCurrentToSharedCurrency();
  addHistoryEntry('shard', '赤闇 ' + shardDayLabel(key), delta, key);
}

// 「最高報酬」の基準値。REWARD_MAX表に出てくる最大値を動的に求める。
function getRewardHighThreshold() {
  let max = 0;
  Object.keys(REWARD_MAX).forEach((realm) => {
    Object.keys(REWARD_MAX[realm]).forEach((time) => {
      if (REWARD_MAX[realm][time] > max) max = REWARD_MAX[realm][time];
    });
  });
  return max;
}

function loadForecastFilterPref() {
  try { return localStorage.getItem(PREDICT_FILTER_KEY) === '1'; } catch (e) { return false; }
}
function saveForecastFilterPref(on) {
  try { localStorage.setItem(PREDICT_FILTER_KEY, on ? '1' : '0'); } catch (e) { /* no-op */ }
}

function renderForecast() {
  const forecast = buildRedForecast(7);
  const days = forecast.length;
  let html = '';

  const checkedDays = loadCheckedDays();
  const validKeys = {};
  forecast.forEach((day) => { validKeys[day.dayKey] = true; });
  let pruned = false;
  Object.keys(checkedDays).forEach((key) => {
    if (!validKeys[key] && !isPtDayKeyPastOrToday(key)) { delete checkedDays[key]; pruned = true; }
  });
  if (pruned) saveCheckedDays(checkedDays);

  const filterHighEl = containerEl.querySelector('#scPredictFilterHigh');
  const filterHigh = !!(filterHighEl && filterHighEl.checked);
  const highThreshold = getRewardHighThreshold();
  const isHighValue = (day) => highThreshold > 0 && (day.maxReward || 0) >= highThreshold;
  const badgeHtml = (day) => {
    if (!day.maxReward) return '';
    return `<span class="sc-max-badge">${isHighValue(day) ? '<svg class="inline-icon" width="14" height="14"><use href="#i-gem"/></svg> ' : ''}${t('forecast.maxReward', { n: day.maxReward })}</span>`;
  };

  if (forecast.length === 0) {
    html = `<p class="sc-predict-empty">${t('forecast.empty')}</p>`;
    countdownTarget = null;
    countdownMode = null;
  } else {
    const nextDay = forecast[0];
    const restDays = forecast.slice(1);
    const nextChecked = !!checkedDays[nextDay.dayKey];

    html += `<div class="sc-predict-next${nextChecked ? ' is-checked' : ''}${isHighValue(nextDay) ? ' is-high-value' : ''}">`;
    html += '<div class="sc-predict-next-top">';
    html += `<span class="sc-predict-next-badge">${t('forecast.nextRedShard')}</span>`;
    html += checkboxHtml(nextDay.dayKey, nextDay.maxReward || 0, nextChecked);
    html += '</div>';

    const firstEntry = nextDay.entries[0];
    countdownMode = firstEntry.active ? 'end' : 'land';
    countdownTarget = firstEntry.active ? firstEntry.endDate : firstEntry.landingDate;
    html += '<div class="sc-predict-countdown-row">';
    html += `<span class="sc-predict-countdown-label">${countdownMode === 'end' ? t('forecast.timeUntilEnd') : t('forecast.timeUntilLanding')}</span>`;
    html += `<span class="sc-predict-countdown" id="scPredictCountdown">${formatCountdown(countdownTarget.getTime() - new Date().getTime())}</span>`;
    html += '</div>';

    html += `<div class="sc-predict-next-date-row"><span class="sc-predict-next-date">${nextDay.dateLabel}</span>${badgeHtml(nextDay)}</div>`;
    html += `<div class="sc-predict-next-place">${realmLabel(nextDay.realm)}${t('forecast.realmLocationSep')}${shardLocationName(nextDay.location)}</div>`;
    html += `<div class="sc-predict-next-times-header"><span>${t('forecast.headerLanding')}</span><span>${t('forecast.headerEnd')}</span></div>`;
    nextDay.entries.forEach((e) => {
      html += `<div class="sc-predict-next-time-row${e.active ? ' is-active' : ''}">` +
        `<span class="sc-land"><span class="sc-date-mini">${e.landShortDate}</span><span>${e.landLabel}</span></span>` +
        '<span class="sc-arrow">→</span>' +
        `<span class="sc-end"><span class="sc-date-mini">${e.endShortDate}</span><span>${e.endLabel}</span></span>` +
        (e.active ? `<span class="sc-active-badge">${t('forecast.active')}</span>` : '') +
        '</div>';
    });
    html += `<p class="sc-predict-next-note">${t('forecast.nextNote')}</p>`;
    html += '</div>';

    if (restDays.length > 0) {
      const visibleRestDays = filterHigh ? restDays.filter(isHighValue) : restDays;
      if (filterHigh && visibleRestDays.length === 0) {
        html += `<p class="sc-predict-empty">${t('forecast.filterEmpty')}</p>`;
      } else {
        visibleRestDays.forEach((day) => {
          const dChecked = !!checkedDays[day.dayKey];
          html += `<div class="sc-predict-day${dChecked ? ' is-checked' : ''}${isHighValue(day) ? ' is-high-value' : ''}">`;
          html += '<div class="sc-predict-day-head">';
          html += `<span>${day.dateLabel}${badgeHtml(day)}<span class="sc-realm-tag">${realmLabel(day.realm)}${t('forecast.realmLocationSep')}${shardLocationName(day.location)}</span></span>`;
          html += checkboxHtml(day.dayKey, day.maxReward || 0, dChecked);
          html += '</div>';
          html += `<div class="sc-predict-occ">${t('forecast.candidatesPrefix')}`;
          html += day.entries.map((e) => `<span class="sc-land-mini">${e.landShortDate} ${e.landLabel}</span><span class="sc-arrow-mini">→</span><span class="sc-end-mini">${e.endShortDate} ${e.endLabel}</span>`).join(t('forecast.listSep'));
          html += `<span style="opacity:.7;">${t('forecast.jstAnyOne')}</span></div>`;
          html += '</div>';
        });
      }
    }
  }
  containerEl.querySelector('#scPredictList').innerHTML = html;
  containerEl.querySelector('#scPredictDays').textContent = days;
  containerEl.querySelector('#scPredictRange').textContent = t('forecast.range');
}

// 1秒ごとにカウントダウン表示だけを更新する(一覧全体は作り直さない)。
function updateCountdownDisplay() {
  try {
    if (!containerEl || !countdownTarget) return;
    const remainingMs = countdownTarget.getTime() - new Date().getTime();
    if (remainingMs <= 0) { renderForecast(); return; }
    const el = containerEl.querySelector('#scPredictCountdown');
    if (el) el.textContent = formatCountdown(remainingMs);
  } catch (err) { /* no-op */ }
}

function wireForecastEvents() {
  const filterEl = containerEl.querySelector('#scPredictFilterHigh');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      saveForecastFilterPref(filterEl.checked);
      try { renderForecast(); } catch (e) { /* no-op */ }
    });
  }
  // 「獲得済み」チェック:イベント委譲のため、renderForecast()が予測リストを
  // 再描画しても再登録は不要。
  containerEl.querySelector('#scPredictList').addEventListener('change', (ev) => {
    const cb = ev.target.closest ? ev.target.closest('.sc-day-check') : null;
    if (!cb) return;
    try {
      const key = cb.getAttribute('data-day-key');
      const reward = parseFloat(cb.getAttribute('data-reward')) || 0;
      applyShardCheckToggle(key, reward, cb.checked);
      const container = cb.closest('.sc-predict-next, .sc-predict-day');
      if (container) container.classList.toggle('is-checked', cb.checked);
      if (shardCalOverlayEl && shardCalOverlayEl.classList.contains('open')) renderShardCalGrid();
    } catch (err) { /* no-op */ }
  });
  const calBtn = containerEl.querySelector('#scShardCalBtn');
  if (calBtn) calBtn.addEventListener('click', openShardCal);
}

/* ================================================================
   赤闇カレンダー(月表示モーダル)
   ================================================================ */
// 指定したJST暦日(year, month[1-12], day)に実際に着地する赤闇の候補一覧を返す。
function getJstShardLandings(year, month, day) {
  const results = [];
  [-1, 0].forEach((ptDayOffset) => {
    const ptProbe = new Date(year, month - 1, day + ptDayOffset, 12, 0, 0);
    const ptY = ptProbe.getFullYear(), ptM = ptProbe.getMonth() + 1, ptD = ptProbe.getDate();
    const weekday = new Date(ptY, ptM - 1, ptD).getDay();
    const sched = getDaySchedule(ptD, weekday);
    if (sched.color !== 'red' || sched.skipped) return;
    const targetKey = year + '-' + month + '-' + day;
    const ptDayKey = ptY + '-' + ptM + '-' + ptD;
    const offset = getPTOffsetMinutes(ptProbe);
    getOccurrenceMinutes(sched.time, 'red').forEach((mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const gateDate = ptWallClockToDate(ptY, ptM, ptD, h, m, offset);
      const endDate = new Date(gateDate.getTime() + END_LAG_SEC * 1000);
      const landingDate = new Date(gateDate.getTime() + LANDING_LAG_SEC * 1000);
      const land = jstLabel(landingDate);
      if (land.dateKey !== targetKey) return; // このJST暦日には着地しない候補は除外
      const end = jstLabel(endDate);
      results.push({ sched, ptDayKey, landShortDate: land.shortDate, landLabel: land.timeLabel, endShortDate: end.shortDate, endLabel: end.timeLabel });
    });
  });
  return results;
}

function renderShardCalDayDetail() {
  const detailEl = shardCalOverlayEl.querySelector('#scShardCalDayDetail');
  if (!shardCalSelectedKey) {
    detailEl.style.display = 'none';
    detailEl.innerHTML = '';
    return;
  }
  const parts = shardCalSelectedKey.split('-');
  const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
  const landings = getJstShardLandings(y, m, d);
  if (!landings.length) { detailEl.style.display = 'none'; return; }
  const sched = landings[0].sched;
  const location = (LOCATIONS[sched.realm] || {})[sched.time] || '?';
  const maxReward = (REWARD_MAX[sched.realm] || {})[sched.time] || null;
  const checkedDaysForDetail = loadCheckedDays();
  const isCollected = landings.every((e) => !!checkedDaysForDetail[e.ptDayKey]);
  const occText = landings.map((e) => e.landShortDate + ' ' + e.landLabel + '→' + e.endShortDate + ' ' + e.endLabel).join(t('forecast.listSep'));

  const todayStr = formatDateValue(new Date());
  let checkboxesHtml = '';
  if (shardCalSelectedKey <= todayStr) {
    const seenPtKeys = {};
    landings.forEach((e) => {
      if (seenPtKeys[e.ptDayKey]) return;
      seenPtKeys[e.ptDayKey] = true;
      const groupReward = (REWARD_MAX[e.sched.realm] || {})[e.sched.time] || 0;
      checkboxesHtml += checkboxHtml(e.ptDayKey, groupReward, !!checkedDaysForDetail[e.ptDayKey]);
    });
    checkboxesHtml = `<div class="sc-shard-cal-check-row">${checkboxesHtml}</div>`;
  }

  detailEl.style.display = 'block';
  detailEl.innerHTML =
    `<strong>${jpDate(new Date(y, m - 1, d))}</strong>` +
    (isCollected ? ` <span style="color:var(--gold-light); font-weight:700;"><svg class="inline-icon ok" width="13" height="13"><use href="#i-check"/></svg> ${t('forecast.collected')}</span>` : '') + '<br>' +
    realmLabel(sched.realm) + t('forecast.realmLocationSep') + shardLocationName(location) + (maxReward ? t('shardCal.maxRewardShort', { n: maxReward }) : '') + '<br>' +
    `<span style="opacity:.85; font-size:11.5px;">${t('shardCal.candidatesLabel')}${occText}</span>` +
    checkboxesHtml;
}

function renderShardCalGrid() {
  const year = shardCalViewDate.getFullYear();
  const month = shardCalViewDate.getMonth(); // 0-11
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDateValue(new Date());
  const checkedDays = loadCheckedDays();

  shardCalOverlayEl.querySelector('#scShardCalWeekdays').innerHTML =
    Array.from({ length: 7 }, (_, i) => `<span>${weekdayLabel(i)}</span>`).join('');
  shardCalOverlayEl.querySelector('#scShardCalMonthLabel').textContent = monthLabelText(year, month + 1);

  let html = '';
  for (let i = 0; i < firstWeekday; i++) html += '<span class="sc-shard-cal-cell is-empty"></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const cellStr = formatDateValue(new Date(year, month, d));
    const landings = getJstShardLandings(year, month + 1, d);
    let cls = 'sc-shard-cal-cell';
    if (cellStr === todayStr) cls += ' is-today';
    if (landings.length) {
      const sched = landings[0].sched;
      const maxReward = (REWARD_MAX[sched.realm] || {})[sched.time] || null;
      const isCollected = landings.every((e) => !!checkedDays[e.ptDayKey]);
      cls += ' is-red';
      if (isCollected) cls += ' is-collected';
      if (cellStr === shardCalSelectedKey) cls += ' is-selected';
      html += `<button type="button" class="${cls}" data-date="${cellStr}">` +
        `<span>${d}</span>` +
        (maxReward ? `<span class="sc-shard-cal-reward">${maxReward}${CURRENT_LANG === 'ja' ? '本' : ' ' + t('goal.unit')}</span>` : '') +
        (isCollected ? '<span class="sc-shard-cal-check" aria-hidden="true"><svg class="inline-icon ok" width="12" height="12"><use href="#i-check"/></svg></span>' : '') +
        '</button>';
    } else {
      html += `<span class="${cls}">${d}</span>`;
    }
  }
  shardCalOverlayEl.querySelector('#scShardCalGrid').innerHTML = html;

  if (shardCalSelectedKey) {
    const selParts = shardCalSelectedKey.split('-');
    if (parseInt(selParts[0], 10) !== year || parseInt(selParts[1], 10) !== (month + 1)) {
      shardCalSelectedKey = null;
    }
  }
  renderShardCalDayDetail();
}

function monthLabelText(year, month1) {
  return CURRENT_LANG === 'ja' ? `${year}年${month1}月` : new Date(year, month1 - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function shardCalModalHtml() {
  return `
    <div class="modal-card sc-shard-cal-card">
      <button type="button" class="modal-close-btn" id="scShardCalCloseBtn"><svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg></button>
      <div class="modal-title">${t('shardCal.title')}</div>
      <div class="sc-shard-cal-grid-wrap">
        <div class="sc-shard-cal-nav-row">
          <button type="button" class="sc-date-picker-nav" id="scShardCalPrevBtn" aria-label="${t('goal.prevMonth')}">‹</button>
          <span class="sc-shard-cal-month" id="scShardCalMonthLabel"></span>
          <button type="button" class="sc-date-picker-nav" id="scShardCalNextBtn" aria-label="${t('goal.nextMonth')}">›</button>
        </div>
        <div class="sc-shard-cal-weekdays" id="scShardCalWeekdays"></div>
        <div class="sc-shard-cal-grid" id="scShardCalGrid"></div>
        <div class="sc-shard-cal-legend">
          <span class="sc-shard-cal-legend-dot"></span><span>${t('shardCal.legend')}</span>
          <span class="sc-shard-cal-legend-check" aria-hidden="true"><svg class="inline-icon ok" width="12" height="12"><use href="#i-check"/></svg></span><span>${t('forecast.collected')}</span>
        </div>
        <div class="sc-shard-cal-day-detail" id="scShardCalDayDetail" style="display:none;"></div>
      </div>
    </div>`;
}

function openShardCal() {
  document.getElementById('scShardCalOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'scShardCalOverlay';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeShardCal(); });
  overlay.innerHTML = shardCalModalHtml();
  document.body.appendChild(overlay);
  shardCalOverlayEl = overlay;

  overlay.querySelector('#scShardCalCloseBtn').addEventListener('click', closeShardCal);
  overlay.querySelector('#scShardCalPrevBtn').addEventListener('click', () => {
    shardCalViewDate.setMonth(shardCalViewDate.getMonth() - 1);
    renderShardCalGrid();
  });
  overlay.querySelector('#scShardCalNextBtn').addEventListener('click', () => {
    shardCalViewDate.setMonth(shardCalViewDate.getMonth() + 1);
    renderShardCalGrid();
  });
  overlay.querySelector('#scShardCalGrid').addEventListener('click', (ev) => {
    const cell = ev.target.closest ? ev.target.closest('.sc-shard-cal-cell.is-red') : null;
    if (!cell) return;
    const key = cell.getAttribute('data-date');
    shardCalSelectedKey = (shardCalSelectedKey === key) ? null : key;
    renderShardCalGrid();
  });
  overlay.querySelector('#scShardCalDayDetail').addEventListener('change', (ev) => {
    const cb = ev.target.closest ? ev.target.closest('.sc-day-check') : null;
    if (!cb) return;
    try {
      const key = cb.getAttribute('data-day-key');
      const reward = parseFloat(cb.getAttribute('data-reward')) || 0;
      applyShardCheckToggle(key, reward, cb.checked);
      renderShardCalGrid();
      renderForecast(); // 予測欄が同じ日を表示していれば同期させる
    } catch (err) { /* no-op */ }
  });

  shardCalViewDate = new Date();
  shardCalViewDate.setDate(1);
  shardCalSelectedKey = null;
  renderShardCalGrid();
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function closeShardCal() {
  shardCalOverlayEl?.classList.remove('open');
}

/* ================================================================
   獲得履歴ログ
   ================================================================ */
function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (err) { return []; }
}
function saveHistory(list) {
  try { window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list)); } catch (err) { /* no-op */ }
}

// dayKey("年-月-日"形式)を "7/23(木)" のような短い表示に変換する
function shardDayLabel(dayKey) {
  const p = (dayKey || '').split('-');
  const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  if (isNaN(d.getTime())) return dayKey;
  return (d.getMonth() + 1) + '/' + d.getDate() + '(' + weekdayLabel(d.getDay()) + ')';
}

function historyTimeLabel(ms) {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(ms));
  const map = {};
  parts.forEach((part) => { map[part.type] = part.value; });
  return map.month + '/' + map.day + ' ' + map.hour + ':' + map.minute;
}

// 「羽加算」ボタンをしばらく押していないかもしれない、という気付き表示。
// star-candle-view.js の update()（週の集め方カードの読み出し表示更新）からも呼ばれる。
export function renderFeatherUnaddedNote() {
  const noteEl = containerEl.querySelector('#scFeatherUnaddedNote');
  if (!noteEl) return;
  const list = loadHistory(); // 新しい順
  let lastFeatherTime = null;
  for (let i = 0; i < list.length; i++) {
    if (list[i].source === 'feather') { lastFeatherTime = list[i].time; break; }
  }
  if (lastFeatherTime === null) {
    noteEl.style.display = 'none';
    noteEl.textContent = '';
    return;
  }
  const elapsedMs = Date.now() - lastFeatherTime;
  const weeks = Math.floor(elapsedMs / (7 * 86400000));
  if (weeks < 1) {
    noteEl.style.display = 'none';
    noteEl.textContent = '';
    return;
  }
  const feathers = ctxRef.getFeathers();
  const edenWeekly = feathers * 0.25;
  const estAmount = weeks * edenWeekly;
  noteEl.innerHTML = t('weekly.unaddedNote', { weeks, amount: fmt(estAmount), lastDate: historyTimeLabel(lastFeatherTime) });
  noteEl.style.display = 'block';
}

export function addHistoryEntry(source, label, amount, dayKey) {
  if (!amount) return;
  let list = loadHistory();
  list.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    time: Date.now(),
    source, // 'feather' | 'shard' | 'manual'
    label,
    amount, // 符号付き(増加はプラス、減少はマイナス)
    dayKey: dayKey || null,
  });
  if (list.length > HISTORY_MAX_ENTRIES) list = list.slice(0, HISTORY_MAX_ENTRIES);
  saveHistory(list);
  if (!containerEl) return; // unmount後の呼び出しに対する保険
  renderHistory();
  renderTrendChart();
  renderFeatherUnaddedNote();
}

// entryのsource/dayKeyから、現在の表示言語で正しい語順のラベルを組み立てる。
function historyEntryLabel(entry) {
  if (entry.source === 'shard' && entry.dayKey) {
    return t('history.shardEntry', { day: shardDayLabel(entry.dayKey) });
  }
  if (entry.source === 'feather') {
    const m = /([\d.]+)/.exec(entry.label || '');
    return t('history.featherEntry', { n: m ? m[1] : '' });
  }
  if (entry.source === 'manual') {
    return t('history.manualEntry');
  }
  return entry.label;
}

function renderHistory() {
  const list = loadHistory();
  let html;
  if (list.length === 0) {
    html = `<p class="sc-history-empty">${t('history.empty')}</p>`;
  } else {
    html = list.map((entry) => {
      const isPlus = entry.amount >= 0;
      const sign = isPlus ? '+' : '−';
      return '<div class="sc-history-row">' +
        '<div class="sc-history-main">' +
          `<span class="sc-history-time">${historyTimeLabel(entry.time)}</span>` +
          `<span class="sc-history-label">${historyEntryLabel(entry)}</span>` +
        '</div>' +
        `<span class="sc-history-amount${isPlus ? ' is-plus' : ' is-minus'}">${sign}${fmt(Math.abs(entry.amount))}<span class="sc-history-amount-unit">${(CURRENT_LANG === 'ja' ? '' : ' ')}${t('goal.unit')}</span></span>` +
        `<button type="button" class="sc-history-undo-btn" data-history-id="${entry.id}">${t('history.undoBtn')}</button>` +
      '</div>';
    }).join('');
  }
  containerEl.querySelector('#scHistoryList').innerHTML = html;
}

/* ── ミニ推移グラフ(獲得履歴からの所持本数の推移スパークライン) ── */
function computeTrendPoints() {
  const list = loadHistory(); // 新しい順
  const currentVal = Math.max(0, ctxRef.getCurrent());
  const points = [];
  let running = currentVal;
  for (let i = 0; i < list.length; i++) {
    points.push({ time: list[i].time, value: Math.max(0, running) });
    running -= (list[i].amount || 0);
  }
  if (list.length > 0) {
    points.push({ time: list[list.length - 1].time - 1, value: Math.max(0, running) });
  }
  points.push({ time: Date.now(), value: currentVal });
  points.sort((a, b) => a.time - b.time);
  return points;
}

// 「現在ペース」= 直近の獲得履歴から逆算した、実際の1日あたりの増減量。
// star-candle-view.js の update()（結果カードの実績ペース表示）からも呼ばれる。
export function computeRecentDailyPace() {
  const list = loadHistory(); // 新しい順
  if (list.length === 0) return null;
  const now = Date.now();
  const windowStart = now - TREND_PACE_WINDOW_MS;
  let sample = list.filter((e) => e.time >= windowStart);
  if (sample.length === 0) sample = list; // 直近14日に記録が無ければ全履歴を対象にする
  const oldestTime = sample[sample.length - 1].time;
  const elapsedMs = now - oldestTime;
  if (!(elapsedMs >= TREND_PACE_MIN_ELAPSED_MS)) return null;
  let netGain = 0;
  for (let i = 0; i < sample.length; i++) netGain += (sample[i].amount || 0);
  return netGain / (elapsedMs / 86400000);
}

// star-candle-view.js の update()（目標/所持本数の変更のたびにグラフの目標ラインや
// 基準点を追従させる）からも呼ばれる。
export function renderTrendChart() {
  const wrap = containerEl.querySelector('#scTrendChartWrap');
  if (!wrap) return;
  const points = computeTrendPoints();
  if (points.length < 2) {
    wrap.innerHTML = `<p class="sc-trend-chart-empty">${t('history.trendEmpty')}</p>`;
    return;
  }
  const target = Math.max(0, ctxRef.getTarget());
  const W = 300, H = 84, padX = 4, padY = 10;
  const renderedW = wrap.getBoundingClientRect().width || W;
  const textUnstretchX = (72 * W) / (H * renderedW);
  const minT = points[0].time;
  const maxT = points[points.length - 1].time;
  const last = points[points.length - 1];

  let dailyPace = null, paceProjection = null;
  if (target > 0 && last.value < target) {
    dailyPace = computeRecentDailyPace();
    if (dailyPace > 0) {
      const daysNeeded = (target - last.value) / dailyPace;
      if (isFinite(daysNeeded) && daysNeeded > 0 && daysNeeded <= 3650) {
        paceProjection = { date: new Date(last.time + daysNeeded * 86400000) };
      }
    }
  }

  const histSpan = maxT - minT;
  const lookaheadCap = Math.max(histSpan, 7 * 86400000);
  const maxTExt = paceProjection ? Math.min(paceProjection.date.getTime(), maxT + lookaheadCap) : maxT;
  const spanT = Math.max(1, maxTExt - minT);

  let maxV = 0;
  for (let i = 0; i < points.length; i++) { if (points[i].value > maxV) maxV = points[i].value; }
  if (target > 0 && target > maxV) maxV = target;
  maxV = (maxV || 1) * 1.08;
  const xOf = (tm) => padX + ((tm - minT) / spanT) * (W - padX * 2);
  const yOf = (v) => H - padY - (v / maxV) * (H - padY * 2);
  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + xOf(p.time).toFixed(1) + ',' + yOf(p.value).toFixed(1)).join(' ');
  const areaD = pathD + ' L' + xOf(last.time).toFixed(1) + ',' + (H - padY).toFixed(1) + ' L' + xOf(points[0].time).toFixed(1) + ',' + (H - padY).toFixed(1) + ' Z';
  let targetLineSvg = '';
  if (target > 0 && target <= maxV) {
    const ty = yOf(target).toFixed(1);
    const targetLabelAnchorX = W - padX;
    targetLineSvg = `<line x1="${padX}" y1="${ty}" x2="${targetLabelAnchorX}" y2="${ty}" stroke="var(--crimson-light)" stroke-width="1" stroke-dasharray="4 3" opacity="0.85" />` +
      `<g transform="translate(${targetLabelAnchorX},0) scale(${textUnstretchX.toFixed(4)},1) translate(-${targetLabelAnchorX},0)">` +
      `<text x="${targetLabelAnchorX}" y="${Math.max(8, parseFloat(ty) - 3)}" text-anchor="end" font-size="8" fill="var(--crimson-light)">${t('history.trendTargetLabel')}</text>` +
      '</g>';
  }

  let paceLineSvg = '';
  let paceNoteHtml = '';
  if (paceProjection) {
    const reachTime = Math.min(paceProjection.date.getTime(), maxTExt);
    const reachValue = Math.min(maxV, last.value + dailyPace * ((reachTime - last.time) / 86400000));
    const x1 = xOf(last.time).toFixed(1), y1 = yOf(last.value).toFixed(1);
    const x2 = xOf(reachTime).toFixed(1), y2 = yOf(reachValue).toFixed(1);
    const reachedTarget = reachTime >= paceProjection.date.getTime() - 1000;
    paceLineSvg = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--lavender)" stroke-width="1.6" stroke-dasharray="2 2.5" opacity="0.9" />`;
    if (reachedTarget) paceLineSvg += `<circle cx="${x2}" cy="${y2}" r="2.6" fill="var(--lavender)" />`;
    paceLineSvg += `<g transform="translate(${x2},0) scale(${textUnstretchX.toFixed(4)},1) translate(-${x2},0)">` +
      `<text x="${x2}" y="${Math.max(8, parseFloat(y2) - 4)}" text-anchor="end" font-size="8" fill="var(--lavender)">${t('history.paceLineLabel')}</text>` +
      '</g>';
    paceNoteHtml = `<p class="sc-trend-pace-note">${t('history.paceProjectionNote', { date: jpDate(paceProjection.date) })}</p>`;
  } else if (target > 0 && last.value < target && dailyPace !== null && dailyPace <= 0) {
    paceNoteHtml = `<p class="sc-trend-pace-note is-warn">${t('history.paceProjectionNone')}</p>`;
  }

  wrap.innerHTML =
    `<svg class="sc-trend-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${t('history.trendAriaLabel')}">` +
      `<path d="${areaD}" fill="var(--gold-light)" opacity="0.18" stroke="none"/>` +
      `<path d="${pathD}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
      targetLineSvg + paceLineSvg +
      `<circle cx="${xOf(last.time).toFixed(1)}" cy="${yOf(last.value).toFixed(1)}" r="3" fill="var(--gold-light)" />` +
    '</svg>' + paceNoteHtml;
}

function wireHistoryEvents() {
  containerEl.querySelector('#scHistoryList').addEventListener('click', (ev) => {
    const btn = ev.target.closest ? ev.target.closest('.sc-history-undo-btn') : null;
    if (!btn) return;
    try {
      const id = btn.getAttribute('data-history-id');
      const list = loadHistory();
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) return;
      const entry = list[idx];

      const current = Math.max(0, ctxRef.getCurrent());
      ctxRef.setCurrent(Math.round(Math.max(0, current - entry.amount) * 100) / 100);

      if (entry.source === 'shard' && entry.dayKey) {
        const checkedDays = loadCheckedDays();
        if (entry.amount > 0) {
          delete checkedDays[entry.dayKey]; // 加算だった→チェックを外した状態に戻す
        } else {
          checkedDays[entry.dayKey] = true; // 減算(チェック解除)だった→再度チェック済みに戻す
          ctxRef.recordShardCheckin(entry.dayKey); // 称号用の恒久ログにも反映(取り消しでは消さない)
        }
        saveCheckedDays(checkedDays);
        renderForecast();
        if (shardCalOverlayEl && shardCalOverlayEl.classList.contains('open')) renderShardCalGrid();
      }

      list.splice(idx, 1);
      saveHistory(list);
      renderHistory();
      ctxRef.update();
      ctxRef.saveState();
      ctxRef.syncCurrentToSharedCurrency();
    } catch (err) { /* no-op */ }
  });

  const clearBtn = containerEl.querySelector('#scHistoryClearBtn');
  clearBtn.addEventListener('click', () => {
    if (!window.confirm(t('history.confirmClear'))) return;
    saveHistory([]);
    renderHistory();
    renderTrendChart();
    renderFeatherUnaddedNote();
  });
}

/* ================================================================
   「1年前の今日」バナー
   ================================================================ */
function tokyoDateParts(ms) {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date(ms));
  const map = {};
  parts.forEach((part) => { map[part.type] = part.value; });
  return { year: parseInt(map.year, 10), month: parseInt(map.month, 10), day: parseInt(map.day, 10) };
}
function tokyoDateKey(ms) {
  const p = tokyoDateParts(ms);
  return p.year + '-' + p.month + '-' + p.day;
}

function findOneYearAgoEntry() {
  const list = loadHistory();
  if (list.length === 0) return null;
  const today = tokyoDateParts(Date.now());
  let best = null;
  for (let i = 0; i < list.length; i++) {
    const p = tokyoDateParts(list[i].time);
    if (p.month === today.month && p.day === today.day && p.year < today.year) {
      const yearsAgo = today.year - p.year;
      if (!best || yearsAgo < best.yearsAgo) best = { entry: list[i], yearsAgo };
    }
  }
  return best;
}

function renderOneYearAgoBanner() {
  const textEl = containerEl.querySelector('#scOneYearAgoText');
  if (!oneYearAgoMatch || !textEl) return;
  const entry = oneYearAgoMatch.entry;
  const isPlus = entry.amount >= 0;
  textEl.textContent = t('oneYearAgo.banner', {
    years: oneYearAgoMatch.yearsAgo,
    label: historyEntryLabel(entry),
    sign: isPlus ? '+' : '−',
    amount: fmt(Math.abs(entry.amount)),
    unit: (CURRENT_LANG === 'ja' ? '' : ' ') + t('goal.unit'),
  });
}

function initOneYearAgoBanner() {
  const bannerEl = containerEl.querySelector('#scOneYearAgoBanner');
  if (!bannerEl) return;
  const todayKey = tokyoDateKey(Date.now());
  let dismissedKey = null;
  try { dismissedKey = window.localStorage.getItem(ONE_YEAR_AGO_DISMISS_KEY); } catch (err) { dismissedKey = null; }
  if (dismissedKey === todayKey) return;
  oneYearAgoMatch = findOneYearAgoEntry();
  if (!oneYearAgoMatch) return;
  renderOneYearAgoBanner();
  bannerEl.classList.add('is-visible');
}

function wireOneYearAgoBanner() {
  const closeBtn = containerEl.querySelector('#scOneYearAgoCloseBtn');
  if (!closeBtn) return;
  closeBtn.addEventListener('click', () => {
    try { window.localStorage.setItem(ONE_YEAR_AGO_DISMISS_KEY, tokyoDateKey(Date.now())); } catch (err) { /* no-op */ }
    containerEl.querySelector('#scOneYearAgoBanner')?.classList.remove('is-visible');
  });
}
