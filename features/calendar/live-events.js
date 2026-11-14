/* ================================================================
   live-events.js — 活动日历实时数据（对接 VoidCipher3/skyevent）

   skyevent 每 30 分钟抓一次官方活动排程，产出 docs/data/schedule.json。
   本模块在日历页后台拉这份 JSON，挑出「即将结束 / 即将开始」的
   有时间窗事件追加到静态日历下方。常驻任务（end 为 null）和未翻译的
   snake_case 内部事件名过滤掉，避免噪音。
   ================================================================ */

const SCHEDULE_URL = 'https://raw.githubusercontent.com/VoidCipher3/skyevent/main/docs/data/schedule.json';
const STATUS_URL = 'https://raw.githubusercontent.com/VoidCipher3/skyevent/main/docs/data/status.json';
const TIMEOUT_MS = 6000;
const DAY = 86400000;

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'default' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseDT(s) {
  if (!s) return NaN;
  // 上游是 "YYYY-MM-DD HH:MM:SS"（UTC）
  return new Date(s.replace(' ', 'T') + 'Z').getTime();
}

/**
 * @returns {Promise<{endingSoon:Array, startingSoon:Array, fetchedAt:string|null}|null>}
 */
export async function loadLiveEvents() {
  try {
    const [schedule, status] = await Promise.all([
      fetchJson(SCHEDULE_URL),
      fetchJson(STATUS_URL),
    ]);
    const evts = schedule?.data?.events;
    if (!Array.isArray(evts)) return null;

    const now = Date.now();
    const endingSoon = [];
    const startingSoon = [];

    for (const e of evts) {
      // 跳过常驻任务（end 为空 / 时长超过 10 万分钟）
      if (!e.end || (e.duration_minutes || 0) > 100000) continue;
      const start = parseDT(e.start);
      const end = parseDT(e.end);
      if (!start || !end) continue;

      // 只显示有正经翻译名的事件（label 等于内部 snake_case 名 = 未翻译，噪音）
      const cn = e.label?.cn;
      if (!cn || cn === e.name || /^[a-z0-9_]+$/.test(cn)) continue;

      if (now <= end && end - now <= DAY) {
        endingSoon.push({ label: cn, start: e.start, end: e.end, ms: end - now });
      } else if (start > now && start - now <= DAY * 3) {
        startingSoon.push({ label: cn, start: e.start, end: e.end, ms: start - now });
      }
    }

    endingSoon.sort((a, b) => a.ms - b.ms);
    startingSoon.sort((a, b) => a.ms - b.ms);

    const fetchedAt = schedule?.meta?.fetched_at_fmt
      || status?.snapshots?.event_schedule?.fetched_at_fmt || null;

    return {
      endingSoon: endingSoon.slice(0, 10),
      startingSoon: startingSoon.slice(0, 10),
      fetchedAt,
    };
  } catch {
    return null;
  }
}
