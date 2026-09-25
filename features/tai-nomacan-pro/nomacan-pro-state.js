/* ================================================================
   tai-nomacan-pro（ノマキャン計算機プロ）のデータ層。DOMに一切触れない、
   localStorageの読み書き・純粋な計算関数だけをここに集約する
   （UIの組み立て・イベント配線は nomacan-pro-view.js）。

   移植元: tai-nomacan.pro/index.html のVue setup()内のロジック一式。
   Vueのref/computed/watchは、ここでは「プレーンなJSオブジェクト＋
   それを読み書きする純粋関数」に置き換えている（再描画は呼び出し側の
   責務。nomacan-state.jsと同じ設計）。

   ⚠️ localStorageキー名は元のものと完全一致させている(既存ユーザーの
   データ互換性のため)。nsKey()は必ずjs/state.jsの共有実装を使う。
   ================================================================ */
import { nsKey } from '../../js/state.js';
import { DEFAULT_AREAS, AREAS_DATA_VERSION } from './data/areas-data.js';

/* ── localStorage キー ── */
export const TRACKER_KEY = () => nsKey('sky_tracker_storage_v3');
export const CURRENCY_KEY = () => nsKey('wishOwnCurrency');
// 端末側の設定（プロフィール非依存。元実装と同じ扱い）
export const TIME_MULT_KEY = 'sky_current_time_mult';
export const SHARD_SYNC_DATE_KEY = 'sky_shard_sync_date';
export const SHARD_NOTIFY_KEY = 'sky_shard_notify_enabled';
export const DAILYRESET_NOTIFY_KEY = 'sky_dailyreset_notify_enabled';
export const AREA_TODAY_FILTER_KEY = 'sky_area_today_filter';
export const AREA_DETAIL_OPEN_KEY = 'sky_area_detail_open';

export function uuid() {
  return crypto.randomUUID();
}

/* ================================================================
   🌲 エリアツリーの初期化・モード判定
   ================================================================ */
export function getDefaultAreas(timeMult) {
  timeMult = timeMult == null ? 1.0 : timeMult;
  return DEFAULT_AREAS.map((area) => {
    const subAreas = Array.isArray(area.subAreas) ? area.subAreas : [];
    const baseAreaTime = Number(area.time) || 0;
    return {
      id: uuid(),
      name: area.name,
      isExpanded: !!area.isExpanded,
      light: Number(area.light) || 0,
      time: Math.round(baseAreaTime * timeMult),
      _baseTime: baseAreaTime,
      isSelected: false,
      subAreas: subAreas.map((sub) => {
        const spots = Array.isArray(sub.spots) ? sub.spots : [];
        const baseSubTime = Number(sub.time) || 0;
        return {
          id: uuid(),
          name: sub.name,
          isExpanded: !!sub.isExpanded,
          light: Number(sub.light) || 0,
          time: Math.round(baseSubTime * timeMult),
          _baseTime: baseSubTime,
          isSelected: false,
          spots: spots.map((spot) => {
            const baseSpotTime = Number(spot.time) || 0;
            return {
              id: uuid(),
              name: spot.name,
              light: Number(spot.light) || 0,
              time: Math.round(baseSpotTime * timeMult),
              _baseTime: baseSpotTime,
              isSelected: !!spot.isSelected,
              group: spot.group || '',
            };
          }),
        };
      }),
    };
  });
}

export function getAreaMode(mainArea) {
  if (!mainArea || !Array.isArray(mainArea.subAreas) || mainArea.subAreas.length === 0) return 'main';
  return 'sub';
}
export function getSubMode(subArea) {
  if (!subArea || !Array.isArray(subArea.spots) || subArea.spots.length === 0) return 'sub';
  return 'spot';
}

export function enforceSpotGroupExclusivity(spots) {
  if (!Array.isArray(spots)) return;
  const seenGroups = new Set();
  spots.forEach((s) => {
    if (!s || !s.isSelected) return;
    const g = s.group && s.group.trim();
    if (!g) return;
    if (seenGroups.has(g)) { s.isSelected = false; } else { seenGroups.add(g); }
  });
}

/* ================================================================
   📊 エリア/サブエリアの合計・統計
   ================================================================ */
// 選択済みの分だけ合計する（実際の見込み表示用）
export function getMainAreaStats(mainArea) {
  let light = 0; let time = 0;
  const aMode = getAreaMode(mainArea);
  if (aMode === 'main') {
    if (mainArea && mainArea.isSelected) { light = mainArea.light || 0; time = mainArea.time || 0; }
  } else if (mainArea && Array.isArray(mainArea.subAreas) && mainArea.subAreas.length > 0) {
    const allSubTimeZero = mainArea.subAreas.every((s) => !s || !(s.time > 0));
    if (allSubTimeZero) {
      mainArea.subAreas.forEach((sub) => {
        if (!sub) return;
        const sMode = getSubMode(sub);
        if (sMode === 'sub') {
          if (sub.isSelected) light += sub.light || 0;
        } else if (Array.isArray(sub.spots)) {
          sub.spots.forEach((s) => { if (s && s.isSelected) light += s.light; });
        }
      });
      if (light > 0) time = mainArea.time || 0;
    } else {
      mainArea.subAreas.forEach((sub) => {
        const sMode = getSubMode(sub);
        if (sMode === 'sub') {
          if (sub && sub.isSelected) { light += sub.light || 0; time += sub.time || 0; }
        } else if (sub && Array.isArray(sub.spots)) {
          sub.spots.forEach((s) => { if (s && s.isSelected) light += s.light; });
          const hasSelected = sub.spots.some((s) => s && s.isSelected);
          if (hasSelected) time += sub.time || 0;
        }
      });
    }
  }
  return { light, eff: time > 0 ? (light / time) : 0.0 };
}
// 選択状態に関係なく、メインエリア配下の火種を無条件合計する（%スライダーの分母）
export function getMainAreaTotalLight(mainArea) {
  let light = 0;
  const aMode = getAreaMode(mainArea);
  if (aMode === 'main') {
    light = (mainArea && mainArea.light) || 0;
  } else if (mainArea && Array.isArray(mainArea.subAreas)) {
    mainArea.subAreas.forEach((sub) => {
      if (!sub) return;
      const sMode = getSubMode(sub);
      if (sMode === 'sub') { light += sub.light || 0; } else if (Array.isArray(sub.spots)) { sub.spots.forEach((s) => { if (s) light += (s.light || 0); }); }
    });
  }
  return light;
}
export function getMainAreaPercent(mainArea) {
  const total = getMainAreaTotalLight(mainArea);
  if (total <= 0) return 0;
  return Math.round((getMainAreaStats(mainArea).light / total) * 100);
}
export function getMainAreaSelectedCount(mainArea) {
  let n = 0;
  const aMode = getAreaMode(mainArea);
  if (aMode === 'main') { if (mainArea && mainArea.isSelected) n = 1; } else if (mainArea && Array.isArray(mainArea.subAreas)) {
    mainArea.subAreas.forEach((sub) => {
      const sMode = getSubMode(sub);
      if (sMode === 'sub') { if (sub && sub.isSelected) n++; } else if (sub && Array.isArray(sub.spots)) { sub.spots.forEach((s) => { if (s && s.isSelected) n++; }); }
    });
  }
  return n;
}
export function getSubAreaStats(subArea) {
  let light = 0; let time = 0;
  const sMode = getSubMode(subArea);
  if (sMode === 'sub') {
    if (subArea && subArea.isSelected) { light = subArea.light || 0; time = subArea.time || 0; }
  } else if (subArea && Array.isArray(subArea.spots)) {
    subArea.spots.forEach((s) => { if (s && s.isSelected) light += s.light; });
    if (light > 0) time = subArea.time || 0;
  }
  return { light, eff: time > 0 ? (light / time) : 0.0 };
}

/* ================================================================
   🎯 エリア%スライダー: 目標%に達するまで、データ記載順に自然に選んでいく
   ================================================================ */
export function applyAreaPercent(mainArea, pct) {
  if (!mainArea || !Array.isArray(mainArea.subAreas)) return;
  const total = getMainAreaTotalLight(mainArea);
  const targetLight = Math.round(total * pct / 100);
  const flat = [];
  mainArea.subAreas.forEach((sub) => {
    if (!sub) return;
    const sMode = getSubMode(sub);
    if (sMode === 'sub') {
      flat.push({ kind: 'sub', ref: sub });
    } else if (Array.isArray(sub.spots)) {
      sub.spots.forEach((sp) => flat.push({ kind: 'spot', ref: sp, subId: sub.id }));
    }
  });
  // リセット
  mainArea.subAreas.forEach((sub) => {
    if (!sub) return;
    if (getSubMode(sub) === 'sub') sub.isSelected = false;
    else if (Array.isArray(sub.spots)) sub.spots.forEach((sp) => { if (sp) sp.isSelected = false; });
  });
  let acc = 0;
  const usedGroups = new Set();
  for (const item of flat) {
    if (acc >= targetLight) break;
    if (item.kind === 'sub') {
      item.ref.isSelected = true;
      acc += item.ref.light || 0;
    } else {
      const g = item.ref.group && item.ref.group.trim();
      if (g) {
        const key = `${item.subId}::${g}`;
        if (usedGroups.has(key)) continue;
        usedGroups.add(key);
      }
      item.ref.isSelected = true;
      acc += item.ref.light || 0;
    }
  }
}
export function applyPresetToChecked(areas, pct) {
  areas.forEach((area) => {
    if (area && area.isSelected) applyAreaPercent(area, pct);
  });
}

/* ================================================================
   📅 曜日限定スポット（group:"曜日"）の「本日該当」判定
   ================================================================ */
const WEEKDAY_CHARS = ['日', '月', '火', '水', '木', '金', '土'];
export function isWeekdayRotationSpot(spot) {
  return !!(spot && spot.group && spot.group.trim() === '曜日');
}
function ptTodayWeekdayIdx() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === 'weekday').value;
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd];
}
export function isSpotActiveToday(spot) {
  if (!isWeekdayRotationSpot(spot)) return true;
  const todayIdx = ptTodayWeekdayIdx();
  const todayChar = WEEKDAY_CHARS[todayIdx];
  return spot.name.indexOf(todayChar) !== -1;
}

/* ================================================================
   ⚡ 効率自動最適化: 効率(火種/秒)の高い順に、目標火種量に達するまで選ぶ
   ================================================================ */
export function optimize(areas, targetLight) {
  const flat = [];
  areas.forEach((area) => {
    if (!area) return;
    const aMode = getAreaMode(area);
    if (aMode === 'main') {
      const eff = (area.time > 0) ? (area.light || 0) / area.time : 0;
      flat.push({ kind: 'main', ref: area, light: area.light || 0, time: area.time || 0, eff });
    } else if (Array.isArray(area.subAreas)) {
      area.subAreas.forEach((sub) => {
        if (!sub) return;
        const sMode = getSubMode(sub);
        if (sMode === 'sub') {
          const eff = (sub.time > 0) ? (sub.light || 0) / sub.time : 0;
          flat.push({ kind: 'sub', ref: sub, light: sub.light || 0, time: sub.time || 0, eff });
        } else if (Array.isArray(sub.spots)) {
          const activeSpots = sub.spots.filter((s) => s && isSpotActiveToday(s));
          const subLight = activeSpots.reduce((a, s) => a + (s.light || 0), 0);
          const eff = (sub.time > 0) ? subLight / sub.time : 0;
          flat.push({ kind: 'spotGroup', subRef: sub, spots: activeSpots, light: subLight, time: sub.time || 0, eff });
        }
      });
    }
  });
  flat.sort((a, b) => b.eff - a.eff);
  // リセット
  areas.forEach((area) => {
    const aMode = getAreaMode(area);
    if (aMode === 'main') { area.isSelected = false; } else if (Array.isArray(area.subAreas)) {
      area.subAreas.forEach((sub) => {
        if (!sub) return;
        if (getSubMode(sub) === 'sub') sub.isSelected = false;
        else if (Array.isArray(sub.spots)) sub.spots.forEach((s) => { if (s) s.isSelected = false; });
      });
    }
  });
  let acc = 0;
  for (const item of flat) {
    if (acc >= targetLight) break;
    if (item.kind === 'main') { item.ref.isSelected = true; acc += item.light; } else if (item.kind === 'sub') { item.ref.isSelected = true; acc += item.light; } else if (item.kind === 'spotGroup') {
      item.spots.forEach((s) => { s.isSelected = true; });
      enforceSpotGroupExclusivity(item.subRef.spots);
      acc += item.light;
    }
  }
}

/* ================================================================
   🕯️ キャンドル計算（しきい値テーブル・繰越・日割り見込み）
   ================================================================ */
export const THRESHOLDS = [94, 188, 282, 376, 470, 609, 748, 887, 1026, 1165, 1304, 1443, 1582, 1721, 1860, 1999, 2138, 2277, 2416, 2555];
export function calcCandlesFromLight(totalLight) {
  let candles = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (totalLight >= THRESHOLDS[i]) candles = i + 1; else break;
  }
  return candles;
}

/* ================================================================
   🌋 闇の破片(黒)の自動判定（非公式のコミュニティ観測ルールに基づく推測）
   ================================================================ */
export const SHARD_REALMS = ['草原', '雨林', '峡谷', '捨て地', '書庫'];
export const SHARD_TIME_PATTERN = [
  { time: '7:40', color: 'red' },
  { time: '2:10', color: 'black' },
  { time: '2:20', color: 'red' },
  { time: '1:50', color: 'black' },
  { time: '3:30', color: 'red' },
];
function ptDateParts(d) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d);
  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
}
export function shardPredictionForDate(d) {
  const { d: day } = ptDateParts(d);
  const realm = SHARD_REALMS[(day - 1) % 5];
  const pattern = SHARD_TIME_PATTERN[(day - 1) % 5];
  return { realm, time: pattern.time, color: pattern.color };
}

/* ================================================================
   💾 本体の保存/読込
   ================================================================ */
export function saveState(state) {
  try {
    const dataToSave = {
      areasDataVersion: AREAS_DATA_VERSION,
      areas: state.areas,
      carryOverPercent: state.carryOverPercent,
      carryOverGap: state.carryOverGap,
      targetDate: state.targetDate,
      currentCandles: state.currentCandles,
      plannedUsage: state.plannedUsage,
      heartsToSend: state.heartsToSend,
      targetCandlesForOptimization: state.targetCandlesForOptimization,
      candleMemo: state.candleMemo,
      dailyBonusArea: state.dailyBonusArea,
      dailyShard: state.dailyShard,
      myRoutes: state.myRoutes.map((r) => ({
        id: r.id, name: r.name, memo: r.memo,
        selectedSpotIds: r.selectedSpotIds || [],
        actualSeconds: r.actualSeconds || 0,
        splitTimes: r.splitTimes || {},
        runHistory: Array.isArray(r.runHistory) ? r.runHistory : [],
      })),
    };
    localStorage.setItem(TRACKER_KEY(), JSON.stringify(dataToSave));
  } catch (e) { /* noop */ }
}

// 保存済みデータを読み込む。無ければnullを返す（呼び出し側でloadInitialData相当を行う）
export function loadState() {
  let raw;
  try { raw = localStorage.getItem(TRACKER_KEY()); } catch (e) { return null; }
  if (!raw) return null;
  let decoded;
  try { decoded = JSON.parse(raw); } catch (e) { return null; }
  if (!decoded || !Array.isArray(decoded.areas)) return null;

  const baseMap = {};
  DEFAULT_AREAS.forEach((a) => {
    baseMap[a.name] = { time: Number(a.time) || 0, subs: {} };
    (a.subAreas || []).forEach((s) => {
      baseMap[a.name].subs[s.name] = { time: Number(s.time) || 0, spots: {} };
      (s.spots || []).forEach((sp) => { baseMap[a.name].subs[s.name].spots[sp.name] = Number(sp.time) || 0; });
    });
  });
  const areas = decoded.areas.map((area) => {
    const baseArea = baseMap[area.name];
    return {
      ...area,
      _baseTime: baseArea ? baseArea.time : (area._baseTime ?? Number(area.time) ?? 0),
      subAreas: (area.subAreas || []).map((sub) => {
        const baseSub = baseArea && baseArea.subs[sub.name];
        return {
          ...sub,
          _baseTime: baseSub ? baseSub.time : (sub._baseTime ?? Number(sub.time) ?? 0),
          spots: (sub.spots || []).map((spot) => ({
            ...spot,
            _baseTime: (baseSub && baseSub.spots[spot.name] !== undefined) ? baseSub.spots[spot.name] : (spot._baseTime ?? Number(spot.time) ?? 0),
          })),
        };
      }),
    };
  });

  // スポット構成マイグレーション: データバージョンが上がっていれば既定データへ置換する
  const savedDataVersion = Number(decoded.areasDataVersion) || 1;
  if (savedDataVersion < AREAS_DATA_VERSION) {
    const defaultsForMigration = getDefaultAreas(0);
    areas.forEach((area) => {
      if (!area) return;
      const defArea = defaultsForMigration.find((d) => d.name === area.name);
      if (!defArea) return;
      (area.subAreas || []).forEach((sub) => {
        if (!sub) return;
        const defSub = (defArea.subAreas || []).find((d) => d.name === sub.name);
        if (!defSub || !Array.isArray(defSub.spots) || defSub.spots.length === 0) return;
        const oldSpotsByName = new Map((sub.spots || []).filter((sp) => sp && sp.name).map((sp) => [sp.name, sp]));
        sub.spots = defSub.spots.map((sp) => {
          const existing = oldSpotsByName.get(sp.name);
          return existing ? { ...sp, id: existing.id, isSelected: !!existing.isSelected } : { ...sp, id: uuid(), isSelected: false };
        });
      });
    });
  }

  return {
    areas,
    carryOverPercent: decoded.carryOverPercent || 0,
    carryOverGap: Number(decoded.carryOverGap) || 94,
    candleMemo: decoded.candleMemo || '',
    targetDate: decoded.targetDate || '',
    currentCandles: Number(decoded.currentCandles) || 0,
    plannedUsage: Number(decoded.plannedUsage) || 0,
    heartsToSend: Number(decoded.heartsToSend) || 0,
    targetCandlesForOptimization: Number(decoded.targetCandlesForOptimization) || 20,
    dailyBonusArea: Number(decoded.dailyBonusArea) || 0,
    dailyShard: decoded.dailyShard || 'none',
    myRoutes: Array.isArray(decoded.myRoutes) ? decoded.myRoutes.map((r) => ({
      id: r.id || uuid(),
      name: r.name || '',
      memo: r.memo || '',
      isExpanded: false,
      selectedSpotIds: Array.isArray(r.selectedSpotIds) ? r.selectedSpotIds : [],
      actualSeconds: Number(r.actualSeconds) || 0,
      splitTimes: (r.splitTimes && typeof r.splitTimes === 'object') ? r.splitTimes : {},
      runHistory: Array.isArray(r.runHistory) ? r.runHistory : [],
      generatedSpell: '',
      generatedTextExport: '',
    })) : [],
  };
}

// 🩹 移植時に修正: 元実装はtimeMult=0で初期化し、後段のapplyTimeMult()
// （現在は削除済みの「習熟度アンケート」からしか呼ばれない設計）で本来の
// 秒数を書き込む二段構えだったが、アンケート機能が別作業で撤去された際に
// この初期化ロジックだけ取り残され、新規ユーザーは所要時間が常に0秒に
// なってしまう不具合が標準版（tai-nomacan.pro）に残っている。ここでは
// 最初から実際のtimeMultで初期化する一段構えにして、その不具合を踏襲しない。
export function loadInitialData(timeMult) {
  return {
    areas: getDefaultAreas(timeMult == null ? 1.7 : timeMult),
    carryOverPercent: 0,
    carryOverGap: 94,
    candleMemo: '',
    targetDate: '',
    currentCandles: 0,
    plannedUsage: 0,
    heartsToSend: 0,
    targetCandlesForOptimization: 20,
    dailyBonusArea: 0,
    dailyShard: 'none',
    myRoutes: [],
  };
}

/* ================================================================
   💰 所持通貨（他ツール横断で共有するキャンドル所持数）
   ================================================================ */
export function readOwnedCandle() {
  try {
    const wish = JSON.parse(localStorage.getItem(CURRENCY_KEY())) || {};
    return Math.max(0, wish.candle || 0);
  } catch (e) { return 0; }
}
export function writeOwnedCandle(rawValue) {
  const n = Math.max(0, Number(rawValue) || 0);
  let wish;
  try { wish = JSON.parse(localStorage.getItem(CURRENCY_KEY())) || {}; } catch (e) { wish = {}; }
  wish.candle = n;
  try { localStorage.setItem(CURRENCY_KEY(), JSON.stringify(wish)); } catch (e) { /* noop */ }
}

/* ================================================================
   🧭 マイルート
   ================================================================ */
export function buildSelectedSpotIds(areas) {
  const selectedIds = [];
  areas.forEach((area) => {
    if (!area) return;
    const aMode = getAreaMode(area);
    if (aMode === 'main') {
      if (area.isSelected) selectedIds.push(area.id);
    } else if (Array.isArray(area.subAreas)) {
      area.subAreas.forEach((sub) => {
        if (!sub) return;
        const sMode = getSubMode(sub);
        if (sMode === 'sub') { if (sub.isSelected) selectedIds.push(sub.id); } else if (Array.isArray(sub.spots)) {
          sub.spots.forEach((s) => { if (s && s.isSelected) selectedIds.push(s.id); });
        }
      });
    }
  });
  return selectedIds;
}

export function applyRoute(areas, route) {
  if (!route || !Array.isArray(route.selectedSpotIds)) return;
  areas.forEach((area) => {
    if (!area) return;
    const aMode = getAreaMode(area);
    if (aMode === 'main') {
      area.isSelected = route.selectedSpotIds.includes(area.id);
    } else if (Array.isArray(area.subAreas)) {
      area.subAreas.forEach((sub) => {
        if (!sub) return;
        const sMode = getSubMode(sub);
        if (sMode === 'sub') {
          sub.isSelected = route.selectedSpotIds.includes(sub.id);
        } else if (Array.isArray(sub.spots)) {
          sub.spots.forEach((s) => { if (s) s.isSelected = route.selectedSpotIds.includes(s.id); });
          enforceSpotGroupExclusivity(sub.spots);
        }
      });
    }
  });
}

export function getRouteStats(areas, route) {
  let light = 0; let time = 0;
  if (route && Array.isArray(route.selectedSpotIds)) {
    areas.forEach((area) => {
      if (!area) return;
      if (route.selectedSpotIds.includes(area.id)) { light += area.light || 0; time += area.time || 0; return; }
      if (Array.isArray(area.subAreas)) {
        area.subAreas.forEach((sub) => {
          if (!sub) return;
          if (route.selectedSpotIds.includes(sub.id)) { light += sub.light || 0; time += sub.time || 0; return; }
          if (Array.isArray(sub.spots)) {
            let subHasSelected = false;
            sub.spots.forEach((s) => {
              if (s && route.selectedSpotIds.includes(s.id)) { light += s.light || 0; subHasSelected = true; }
            });
            if (subHasSelected) time += (sub.time || 0);
          }
        });
      }
    });
  }
  const eff = time > 0 ? (light / time) : 0.0;
  return { light, time, eff };
}

export function getRouteAreaNames(areas, route, displayName) {
  const names = [];
  if (!route || !Array.isArray(route.selectedSpotIds)) return '';
  route.selectedSpotIds.forEach((id) => {
    for (const area of areas) {
      if (!area) continue;
      if (area.id === id) { names.push(displayName(area.name)); break; }
      if (Array.isArray(area.subAreas)) {
        let found = false;
        for (const sub of area.subAreas) {
          if (!sub) continue;
          if (sub.id === id) { names.push(`${displayName(area.name)}・${displayName(sub.name)}`); found = true; break; }
          if (Array.isArray(sub.spots)) {
            const sp = sub.spots.find((s) => s.id === id);
            if (sp) { names.push(`${displayName(sub.name)}(${displayName(sp.name)})`); found = true; break; }
          }
        }
        if (found) break;
      }
    }
  });
  return names.join(' → ');
}

export function getSpotNameById(areas, id, displayName, unknownLabel) {
  for (const area of areas) {
    if (!area) continue;
    if (area.id === id) return displayName(area.name);
    if (Array.isArray(area.subAreas)) {
      for (const sub of area.subAreas) {
        if (!sub) continue;
        if (sub.id === id) return `${displayName(area.name)}・${displayName(sub.name)}`;
        if (Array.isArray(sub.spots)) {
          const sp = sub.spots.find((s) => s.id === id);
          if (sp) return `${displayName(sub.name)}・${displayName(sp.name)}`;
        }
      }
    }
  }
  return unknownLabel;
}

/* 📤 ルート呪文（base64エンコードされたJSON）のエンコード/デコード */
export function generateRouteSpell(areas, route) {
  const packedSpots = [];
  if (Array.isArray(route.selectedSpotIds)) {
    route.selectedSpotIds.forEach((id) => {
      let found = false;
      for (const area of areas) {
        if (!area) continue;
        if (area.id === id) {
          packedSpots.push({ mainName: area.name, subName: area.name, spotName: area.name, light: area.light, time: area.time, group: area.group || '' });
          found = true; break;
        }
        if (Array.isArray(area.subAreas)) {
          for (const sub of area.subAreas) {
            if (!sub) continue;
            if (sub.id === id) {
              packedSpots.push({ mainName: area.name, subName: sub.name, spotName: sub.name, light: sub.light, time: sub.time, group: sub.group || '' });
              found = true; break;
            }
            if (Array.isArray(sub.spots)) {
              const sp = sub.spots.find((s) => s.id === id);
              if (sp) {
                packedSpots.push({ mainName: area.name, subName: sub.name, spotName: sp.name, light: sp.light, time: sp.time, group: sp.group || '' });
                found = true; break;
              }
            }
          }
        }
        if (found) break;
      }
    });
  }
  const exportData = { name: route.name, memo: route.memo, actualSeconds: route.actualSeconds || 0, spots: packedSpots };
  const uint8array = new TextEncoder().encode(JSON.stringify(exportData));
  let binString = '';
  for (let i = 0; i < uint8array.length; i++) binString += String.fromCharCode(uint8array[i]);
  return btoa(binString);
}

export function applyRouteSpell(areas, spellText, importedNamePrefix) {
  const binString = atob(spellText.trim());
  const uint8array = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) uint8array[i] = binString.charCodeAt(i);
  const decoded = JSON.parse(new TextDecoder().decode(uint8array));
  if (!decoded.name || !Array.isArray(decoded.spots)) throw new Error('Invalid format');

  const importedSpotIds = [];
  const SHARED_AREA_NAME_JA = '📥 共有された外部エリア';
  decoded.spots.forEach((spInfo) => {
    let foundSpotId = null;
    for (const area of areas) {
      if (!area || area.name !== spInfo.mainName) continue;
      if (spInfo.subName === spInfo.mainName && spInfo.spotName === spInfo.mainName) { foundSpotId = area.id; break; }
      if (Array.isArray(area.subAreas)) {
        for (const sub of area.subAreas) {
          if (!sub || sub.name !== spInfo.subName) continue;
          if (spInfo.spotName === spInfo.subName) { foundSpotId = sub.id; break; }
          if (Array.isArray(sub.spots)) {
            const sp = sub.spots.find((s) => s && s.name === spInfo.spotName);
            if (sp) { foundSpotId = sp.id; break; }
          }
        }
      }
      if (foundSpotId) break;
    }
    if (!foundSpotId) {
      let sharedMain = areas.find((a) => a && a.name === SHARED_AREA_NAME_JA);
      if (!sharedMain) { sharedMain = { id: uuid(), name: SHARED_AREA_NAME_JA, isExpanded: true, subAreas: [] }; areas.push(sharedMain); }
      let sharedSub = sharedMain.subAreas.find((s) => s && s.name === spInfo.subName);
      if (!sharedSub) { sharedSub = { id: uuid(), name: spInfo.subName, isExpanded: true, spots: [] }; sharedMain.subAreas.push(sharedSub); }
      const newSpot = { id: uuid(), name: spInfo.spotName, light: Number(spInfo.light) || 0, time: Number(spInfo.time) || 0, isSelected: false, group: spInfo.group || '' };
      sharedSub.spots.push(newSpot);
      foundSpotId = newSpot.id;
    }
    importedSpotIds.push(foundSpotId);
  });

  return {
    id: uuid(),
    name: `${importedNamePrefix} ${decoded.name}`,
    memo: decoded.memo || '',
    selectedSpotIds: importedSpotIds,
    isExpanded: true,
    actualSeconds: decoded.actualSeconds || 0,
    splitTimes: {},
    runHistory: [],
    generatedSpell: '',
    generatedTextExport: '',
  };
}

/* ================================================================
   🌟 有名プレイヤー公開の「ソロ・試練なし 20本ルート」テンプレート
   ================================================================ */
export const TEMPLATE_ROUTE_AREA_NAME = '20本ルート（ソロ・試練なし）';
export const FAMOUS_ROUTE_TEMPLATE = {
  routeName: '20本ルート（ソロ・試練なし）',
  memo: '有名プレイヤー公開のルートを再現したテンプレートです。※チャレスペ・パン焼きはシーズンパスやフレンドのハート等の条件付きのため、状況により獲得できないことがあります（その場合は個別にチェックを外してください）。',
  subAreas: [
    { name: '雨林（固定）', time: 990, spots: [
      { name: '開拓地〜3門', light: 45 },
      { name: '小川', light: 227 },
      { name: '晴れ間', light: 42 },
      { name: '※チャレスペ', light: 750 },
      { name: 'パン焼き', light: 540 },
      { name: '神殿前', light: 173 },
    ] },
    { name: '草原', time: 480, spots: [
      { name: '入ってすぐ', light: 10 },
      { name: '蝶々の住処', light: 30 },
      { name: '鳥の巣', light: 30 },
      { name: '楽園', light: 299 },
      { name: 'カメの大闇', light: 51 },
      { name: '二枚貝', light: 100 },
      { name: '貝（小）×n', light: 200 },
    ] },
    { name: '書庫', time: 240, spots: [
      { name: '1F ベンチ近く', light: 5 },
      { name: '1F DC', light: 49 },
      { name: '1F 台座の近く', light: 11 },
      { name: '2F DC1', light: 48 },
      { name: '2F DC2', light: 48 },
      { name: '2F 4人扉前', light: 10 },
      { name: '4F DC1', light: 47 },
      { name: '4F DC2', light: 47 },
      { name: '4F DC3', light: 47 },
      { name: '4F DC4', light: 50 },
      { name: '4F その他', light: 18 },
    ] },
    { name: '花鳥卿', time: 390, spots: [
      { name: 'ホーム', light: 27 },
      { name: 'カフェ', light: 50 },
      { name: 'アリスカフェ', light: 284 },
      { name: 'カーニバル', light: 210 },
    ] },
    { name: '雨林→峡谷', time: 390, spots: [
      { name: '風の街道 DC', light: 50 },
      { name: '風の街道 諸々', light: 25 },
      { name: '隠者の峠 DC', light: 50 },
      { name: 'レースキャンドル', light: 38 },
      { name: '隠者レース', light: 200 },
      { name: '夢見DC1', light: 50 },
      { name: '夢見DC2', light: 50 },
      { name: '音楽', light: 100 },
    ] },
    { name: '他', time: 0, spots: [
      { name: 'DDC', light: 200 },
    ] },
    { name: '峡谷', time: 288, spots: [
      { name: 'スライダー', light: 40 },
      { name: 'スケートリンク', light: 39 },
      { name: '陸レ', light: 140 },
      { name: '神殿内', light: 75 },
    ] },
  ],
};

export function ensureTemplateArea(areas) {
  let templateArea = areas.find((a) => a && a.name === TEMPLATE_ROUTE_AREA_NAME);
  if (!templateArea) {
    templateArea = {
      id: uuid(),
      name: TEMPLATE_ROUTE_AREA_NAME,
      isExpanded: true,
      subAreas: FAMOUS_ROUTE_TEMPLATE.subAreas.map((sub) => ({
        id: uuid(),
        name: sub.name,
        isExpanded: true,
        light: 0,
        time: sub.time,
        isSelected: false,
        spots: sub.spots.map((sp) => ({ id: uuid(), name: sp.name, light: sp.light, time: 0, isSelected: false, group: '' })),
      })),
    };
    areas.push(templateArea);
  }
  return templateArea;
}
