/* ================================================================
   calendar-view.js — 活动日历/倒计时

   上半：静态 EVENT_DATES（策划大事件）。
   下半：后台从 skyevent 实时排程拉「即将结束/即将开始」的有时间窗事件，
   失败静默（只显示静态日历）。
   ================================================================ */
import { EVENT_DATES } from '../shared/event-dates.js';
import { loadLiveEvents } from './live-events.js';

let container = null;

export function mount(cont) { container = cont; render(); }
export function unmount() { container = null; }

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function render() {
  if (!container) return;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const events = EVENT_DATES.map(e => ({
    ...e,
    startD: new Date(e.start),
    endD: new Date(e.end),
  }));

  const ongoing = events.filter(e => today >= e.startD && today <= e.endD);
  const upcoming = events.filter(e => e.startD > today).sort((a, b) => a.startD - b.startD).slice(0, 8);

  container.innerHTML = `
    <style>
      .cal-wrap { max-width: 600px; margin: 0 auto; padding: 20px; }
      .cal-title { font-size: 22px; font-weight: 700; margin: 0 0 16px; }
      .cal-section { font-size: 14px; opacity: .6; margin: 20px 0 8px; }
      .cal-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px 16px; border-radius: 10px; margin-bottom: 6px;
        background: rgba(255,255,255,.06);
      }
      .cal-item.ongoing { background: rgba(124,158,255,.2); }
      .cal-item.live { background: rgba(120,220,160,.12); }
      .cal-name { font-size: 15px; }
      .cal-date { font-size: 13px; opacity: .7; }
      .cal-count { font-size: 14px; font-weight: 600; color: #7c9eff; }
      .cal-live-meta { font-size: 12px; opacity: .55; margin-top: 6px; }
    </style>
    <div class="cal-wrap">
      <h1 class="cal-title">活动日历</h1>
      ${ongoing.length ? `<div class="cal-section">进行中</div>` : ''}
      ${ongoing.map(e => `
        <div class="cal-item ongoing">
          <div><div class="cal-name">${e.ja}</div><div class="cal-date">${e.start} ~ ${e.end}</div></div>
          <div class="cal-count">还剩 ${daysBetween(today, e.endD)}天</div>
        </div>
      `).join('')}
      <div class="cal-section">即将开始</div>
      ${upcoming.map(e => `
        <div class="cal-item">
          <div><div class="cal-name">${e.ja}</div><div class="cal-date">${e.start} ~ ${e.end}</div></div>
          <div class="cal-count">${daysBetween(today, e.startD)}天后</div>
        </div>
      `).join('')}

      <div id="calLiveRoot"></div>
    </div>
  `;

  // 实时活动（skyevent）后台填充
  loadLiveEvents().then(live => {
    const root = container?.querySelector('#calLiveRoot');
    if (!root || !live) return;
    const parts = [];
    if (live.endingSoon?.length) {
      parts.push(`<div class="cal-section" style="margin-top:24px">实时 · 即将结束</div>`);
      parts.push(live.endingSoon.map(e => `
        <div class="cal-item live">
          <div><div class="cal-name">${e.label}</div><div class="cal-date">${e.end}</div></div>
          <div class="cal-count">${Math.ceil(e.ms / 3600000)}h后</div>
        </div>`).join(''));
    }
    if (live.startingSoon?.length) {
      parts.push(`<div class="cal-section">实时 · 即将开始</div>`);
      parts.push(live.startingSoon.map(e => `
        <div class="cal-item live">
          <div><div class="cal-name">${e.label}</div><div class="cal-date">${e.start}</div></div>
          <div class="cal-count">${Math.ceil(e.ms / 3600000)}h后</div>
        </div>`).join(''));
    }
    if (parts.length) {
      parts.push(`<div class="cal-live-meta">数据源：skyevent · 更新于 ${live.fetchedAt || '—'}</div>`);
      root.innerHTML = parts.join('');
    }
  });
}
