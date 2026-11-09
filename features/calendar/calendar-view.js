/* ================================================================
   calendar-view.js — 活动日历/倒计时
   ================================================================ */
import { EVENT_DATES } from '../shared/event-dates.js';

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
      .cal-name { font-size: 15px; }
      .cal-date { font-size: 13px; opacity: .7; }
      .cal-count { font-size: 14px; font-weight: 600; color: #7c9eff; }
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
    </div>
  `;
}
