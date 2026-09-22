/* ================================================================
   tai-nomacan の「獲得履歴」カード（ストリーク帯+ヒートマップ・
   ミニ推移グラフ・目標フィルタ・一覧+取り消し）と「デイリークエスト
   記録」カード（別ストリーク帯・自由記述ログ+一覧）。

   移植元: tai-nomacan/index.html の renderHistory/renderTrendChart/
   renderStreak/renderStreakHeatmap/questLogSave/renderQuestLog/
   renderQuestStreak 系（~行4747-5320）。ロジック・マークアップは
   そのまま、DOMの取得元だけ document 全体ではなく mount() で渡された
   container に絞っている。

   nomacan-view.js から `hooks` 経由で、所持本数入力欄(els.current)の
   直接操作・共有ストレージ同期・ペース提案の再描画だけを橋渡ししてもらう
   （undo操作が所持本数欄を直接書き換えるため。原本のels.*への直接依存と
   同じ結合をここでも保つ）。
   ================================================================ */
import { escapeHtml } from '../../js/i18n.js';
import { t } from './data/i18n-nomacan.js';
import * as S from './nomacan-state.js';

let containerEl = null;
let hooksRef = null;
let historyGoalFilterId = null; // 一時的な表示状態(保存しない、goalIdまたはnull)

/* ================================================================
   🔥 ストリーク帯（獲得履歴用・デイリークエスト用で共通利用）
   ================================================================ */
function renderStreakStrip(elId, streakStorageKey, emptyTextKey) {
  const el = containerEl.querySelector('#' + elId);
  if (!el) return;
  const s = S.loadStreakData(streakStorageKey);
  const live = S.streakCurrentLive(s);
  const bestSuffix = s.longest > 0 ? t(s.longest === 1 ? 'streak.bestSuffixTemplateOne' : 'streak.bestSuffixTemplate', { n: s.longest }) : '';
  if (live > 0) {
    el.classList.remove('is-empty');
    el.innerHTML = '<span class="streak-main">' + t('streak.activeTemplate', { n: live }) + '</span>' + (s.longest > live ? '<span>' + bestSuffix + '</span>' : '');
  } else {
    el.classList.add('is-empty');
    el.innerHTML = '<span>' + t(emptyTextKey) + '</span>' + (s.longest > 0 ? '<span>' + bestSuffix + '</span>' : '');
  }
}
export function renderStreak() { renderStreakStrip('streakStrip', S.STREAK_KEY(), 'streak.emptyText'); }
export function renderQuestStreak() { renderStreakStrip('questStreakStrip', S.QUEST_STREAK_KEY(), 'dailyQuest.streakEmptyText'); }

/* ================================================================
   📅 連続記録カレンダーヒートマップ（獲得履歴のみ）
   ================================================================ */
export function renderStreakHeatmap() {
  const wrap = containerEl.querySelector('#streakHeatmapWrap');
  if (!wrap) return;
  const s = S.loadStreakData(S.STREAK_KEY());
  const range = S.computeHeatmapRange(s.days);
  const todayStr = S.streakDateStr(range.today);
  let lastMonth = null;
  let lastLabelCol = -99;
  let monthLabelsHtml = '';
  let cellsHtml = '';
  for (let w = 0; w < range.weeks; w++) {
    const colDate = new Date(range.start);
    colDate.setDate(colDate.getDate() + w * 7);
    const monthIdx = colDate.getMonth();
    if (monthIdx !== lastMonth) {
      lastMonth = monthIdx;
      if (w - lastLabelCol >= 2) {
        monthLabelsHtml += '<span class="heatmap-month-label" style="grid-column:' + (w + 1) + '">' + S.heatmapMonthShort(monthIdx) + '</span>';
        lastLabelCol = w;
      }
    }
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(range.start);
      cellDate.setDate(cellDate.getDate() + w * 7 + d);
      const dateStr = S.streakDateStr(cellDate);
      const isFuture = cellDate > range.today;
      const recorded = !!s.days[dateStr];
      const cls = 'heatmap-cell' + (isFuture ? ' is-future' : (recorded ? ' is-recorded' : ' is-empty')) + (dateStr === todayStr ? ' is-today' : '');
      let titleAttr = '';
      if (!isFuture) {
        const titleKey = recorded ? 'streak.heatmapCellRecordedTemplate' : 'streak.heatmapCellEmptyTemplate';
        titleAttr = ' title="' + escapeHtml(t(titleKey, { date: S.jpDateShort(cellDate) })) + '"';
      }
      cellsHtml += '<span class="' + cls + '" style="grid-column:' + (w + 1) + ';grid-row:' + (d + 1) + '" aria-hidden="true"' + titleAttr + '></span>';
    }
  }
  wrap.innerHTML =
    '<p class="heatmap-label">' + t('streak.heatmapLabel', { weeks: range.weeks }) + '</p>' +
    '<div class="heatmap-scroll" role="img" aria-label="' + escapeHtml(t('streak.heatmapAriaLabel')) + '">' +
      '<div class="heatmap-months" style="grid-template-columns:repeat(' + range.weeks + ', var(--hm-cell))">' + monthLabelsHtml + '</div>' +
      '<div class="heatmap-grid" style="grid-template-columns:repeat(' + range.weeks + ', var(--hm-cell)); grid-template-rows:repeat(7, var(--hm-cell))">' + cellsHtml + '</div>' +
    '</div>' +
    '<div class="heatmap-legend">' +
      '<span class="heatmap-legend-swatch"></span><span>' + t('streak.heatmapLegendEmpty') + '</span>' +
      '<span class="heatmap-legend-swatch is-recorded"></span><span>' + t('streak.heatmapLegendRecorded') + '</span>' +
    '</div>';
  const scrollEl = wrap.querySelector('.heatmap-scroll');
  if (scrollEl) scrollEl.scrollLeft = scrollEl.scrollWidth;
}

/* ================================================================
   ═══ 履歴の「目標」絞り込み ═══
   ================================================================ */
export function renderHistoryGoalFilter() {
  const row = containerEl.querySelector('#historyGoalFilterRow');
  const sel = containerEl.querySelector('#historyGoalFilter');
  if (!row || !sel) return;
  const data = S.goalEnsureInit();
  const beforeFilterId = historyGoalFilterId;
  if (data.goals.length < 2) {
    row.style.display = 'none';
    historyGoalFilterId = null;
  } else {
    row.style.display = '';
    if (historyGoalFilterId && !data.goals.some((g) => g.id === historyGoalFilterId)) historyGoalFilterId = null;
    sel.innerHTML = '<option value="">' + t('history.filterAllOption') + '</option>' +
      data.goals.map((g) => '<option value="' + g.id + '">' + escapeHtml(S.goalDisplayName(g)) + '</option>').join('');
    sel.value = historyGoalFilterId || '';
  }
  if (historyGoalFilterId !== beforeFilterId) {
    renderHistory();
    renderTrendChart();
  }
}

function historyActiveGoalId() {
  try { return S.goalEnsureInit().activeGoalId || null; } catch (e) { return null; }
}
function loadFilteredHistory() {
  const list = S.loadHistory();
  if (!historyGoalFilterId) return list;
  return list.filter((e) => e.goalId === historyGoalFilterId);
}

/* ================================================================
   📜 獲得履歴一覧
   ================================================================ */
export function renderHistory() {
  const listEl = containerEl.querySelector('#historyList');
  if (!listEl) return;
  const list = loadFilteredHistory();
  let html;
  if (list.length === 0) {
    html = '<p class="history-empty">' + t(historyGoalFilterId ? 'history.emptyFiltered' : 'history.empty') + '</p>';
  } else {
    html = list.map((entry) => {
      const isPlus = entry.amount >= 0;
      const sign = isPlus ? '+' : '−';
      return '<div class="history-row">' +
        '<div class="history-main">' +
          '<span class="history-time">' + S.historyTimeLabel(entry.time) + '</span>' +
          '<span class="history-label">' + (entry.labelKey ? t(entry.labelKey) : escapeHtml(entry.label || '')) + '</span>' +
        '</div>' +
        '<span class="history-amount' + (isPlus ? ' is-plus' : ' is-minus') + '">' + t(S.isOnePlural(Math.abs(entry.amount)) ? 'history.amountTemplateOne' : 'history.amountTemplate', { sign, n: S.fmt(Math.abs(entry.amount)) }) + '</span>' +
        '<button type="button" class="history-undo-btn" data-history-id="' + entry.id + '">' + t('history.undoBtn') + '</button>' +
      '</div>';
    }).join('');
  }
  listEl.innerHTML = html;
}

/* ================================================================
   📈 ミニ推移グラフ
   ================================================================ */
export function renderTrendChart() {
  const wrap = containerEl.querySelector('#trendChartWrap');
  if (!wrap) return;
  const current = hooksRef.getCurrentValue();
  const points = S.computeTrendPoints(S.loadHistory(), current, historyGoalFilterId);
  if (points.length < 2) {
    wrap.innerHTML = '<p class="trend-chart-empty">' + t('history.trendEmpty') + '</p>';
    return;
  }
  let target, plannedUsage;
  if (historyGoalFilterId) {
    const filterGoals = S.goalEnsureInit().goals;
    const filterGoal = filterGoals.find((g) => g.id === historyGoalFilterId) || null;
    target = filterGoal ? Math.max(0, parseFloat(filterGoal.target) || 0) : 0;
    plannedUsage = filterGoal ? Math.max(0, parseFloat(filterGoal.plannedUsage) || 0) : 0;
  } else {
    const fields = hooksRef.getTargetFields();
    target = fields.target;
    plannedUsage = fields.plannedUsage;
  }
  const effectiveTarget = target + plannedUsage;

  const H = 108;
  const W = wrap.getBoundingClientRect().width || 300;
  const padLeft = 26, padRight = 6, padTop = 14, padBottom = 16;
  const minT = points[0].time;
  const maxT = points[points.length - 1].time;
  const spanT = Math.max(1, maxT - minT);
  let maxV = 0;
  points.forEach((p) => { if (p.value > maxV) maxV = p.value; });
  if (effectiveTarget > 0 && effectiveTarget > maxV) maxV = effectiveTarget;
  maxV = (maxV || 1) * 1.08;
  const xOf = (time) => padLeft + ((time - minT) / spanT) * (W - padLeft - padRight);
  const yOf = (v) => H - padBottom - (v / maxV) * (H - padTop - padBottom);
  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + xOf(p.time).toFixed(1) + ',' + yOf(p.value).toFixed(1)).join(' ');
  const last = points[points.length - 1];
  const areaD = pathD + ' L' + xOf(last.time).toFixed(1) + ',' + (H - padBottom).toFixed(1) + ' L' + xOf(points[0].time).toFixed(1) + ',' + (H - padBottom).toFixed(1) + ' Z';

  function niceStep(roughStep) {
    if (roughStep <= 0) return 1;
    const exponent = Math.floor(Math.log(roughStep) / Math.LN10);
    const fraction = roughStep / Math.pow(10, exponent);
    const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return niceFraction * Math.pow(10, exponent);
  }
  const yStep = niceStep(maxV / 3);
  let yTicksSvg = '';
  for (let yv = 0; yv <= maxV - yStep * 0.01; yv += yStep) {
    const gy = yOf(yv).toFixed(1);
    yTicksSvg += '<line x1="' + padLeft + '" y1="' + gy + '" x2="' + (W - padRight).toFixed(1) + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1" />' +
      '<text x="' + (padLeft - 4) + '" y="' + (parseFloat(gy) + 3).toFixed(1) + '" text-anchor="end" font-size="8" fill="var(--text-dim)">' + t('history.trendYAxisLabel', { n: S.fmt(yv) }) + '</text>';
  }

  function shortDateLabel(time) {
    const d = new Date(time);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }
  const xTickTimes = [minT, minT + spanT / 2, maxT];
  const xAnchors = ['start', 'middle', 'end'];
  let xTicksSvg = '';
  for (let xi = 0; xi < xTickTimes.length; xi++) {
    const gx = xOf(xTickTimes[xi]).toFixed(1);
    xTicksSvg += '<line x1="' + gx + '" y1="' + (H - padBottom).toFixed(1) + '" x2="' + gx + '" y2="' + (H - padBottom + 3).toFixed(1) + '" stroke="var(--text-dim)" stroke-width="1" />' +
      '<text x="' + gx + '" y="' + (H - 3) + '" text-anchor="' + xAnchors[xi] + '" font-size="8" fill="var(--text-dim)">' + shortDateLabel(xTickTimes[xi]) + '</text>';
  }

  let targetLineSvg = '';
  if (effectiveTarget > 0 && effectiveTarget <= maxV) {
    const ty = yOf(effectiveTarget).toFixed(1);
    const labelAnchorX = W - padRight;
    targetLineSvg = '<line x1="' + padLeft + '" y1="' + ty + '" x2="' + labelAnchorX + '" y2="' + ty + '" stroke="var(--amber-deep)" stroke-width="1" stroke-dasharray="4 3" opacity="0.75" />' +
      '<text x="' + labelAnchorX + '" y="' + Math.max(8, parseFloat(ty) - 3) + '" text-anchor="end" font-size="8" fill="var(--amber-deep)">' + t('history.trendTargetLabel') + '</text>';
  }
  wrap.innerHTML =
    '<svg class="trend-chart-svg" viewBox="0 0 ' + W.toFixed(1) + ' ' + H + '" role="img" aria-label="' + t('history.trendAriaLabel') + '">' +
      yTicksSvg +
      '<path d="' + areaD + '" fill="var(--amber-light)" opacity="0.18" stroke="none"/>' +
      '<path d="' + pathD + '" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      targetLineSvg +
      xTicksSvg +
      '<circle cx="' + xOf(last.time).toFixed(1) + '" cy="' + yOf(last.value).toFixed(1) + '" r="3" fill="var(--amber-deep)" />' +
    '</svg>';
}

/* ================================================================
   🗒️ デイリークエスト記録
   ================================================================ */
export function renderQuestLog() {
  const el = containerEl.querySelector('#questLogList');
  if (!el) return;
  const list = S.loadQuestLog();
  let html;
  if (list.length === 0) {
    html = '<p class="history-empty">' + t('dailyQuest.empty') + '</p>';
  } else {
    html = list.map((entry) => '<div class="history-row"><div class="history-main">' +
      '<span class="history-time">' + S.questDateLabel(entry.date) + '</span>' +
      '<span class="quest-log-text">' + escapeHtml(entry.text) + '</span>' +
    '</div></div>').join('');
  }
  el.innerHTML = html;
}

/* ================================================================
   初期化：イベント配線（history/questどちらも1回だけ）
   hooks = { getCurrentValue, getCurrentInputEl, getTargetFields, onCurrentEditedExternally, renderPaceSuggestion, refreshTitlesUI }
   ================================================================ */
export function initSections(container, hooks) {
  containerEl = container;
  hooksRef = hooks;
  historyGoalFilterId = null;

  const historyListEl = containerEl.querySelector('#historyList');
  if (historyListEl) {
    historyListEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest ? ev.target.closest('.history-undo-btn') : null;
      if (!btn) return;
      const id = btn.getAttribute('data-history-id');
      const list = S.loadHistory();
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) return;
      const entry = list[idx];
      const currentInput = hooksRef.getCurrentInputEl();
      const current = Math.max(0, parseFloat(currentInput.value) || 0);
      currentInput.value = Math.round(Math.max(0, current - entry.amount) * 100) / 100;
      list.splice(idx, 1);
      S.saveHistory(list);
      renderHistory();
      hooksRef.renderPaceSuggestion();
      hooksRef.onCurrentEditedExternally();
    });
  }
  const historyClearBtn = containerEl.querySelector('#historyClearBtn');
  if (historyClearBtn) {
    historyClearBtn.addEventListener('click', () => {
      if (!window.confirm(t('history.confirmClear'))) return;
      S.saveHistory([]);
      renderHistory();
      hooksRef.renderPaceSuggestion();
    });
  }
  const historyGoalFilterSel = containerEl.querySelector('#historyGoalFilter');
  if (historyGoalFilterSel) {
    historyGoalFilterSel.addEventListener('change', () => {
      historyGoalFilterId = historyGoalFilterSel.value || null;
      renderHistory();
      renderTrendChart();
    });
  }

  const questLogInput = containerEl.querySelector('#questLogInput');
  const questLogSaveBtn = containerEl.querySelector('#questLogSaveBtn');
  if (questLogSaveBtn) {
    questLogSaveBtn.addEventListener('click', () => {
      const result = S.questLogSave(questLogInput ? questLogInput.value : '');
      if (!result) return;
      renderQuestLog();
      renderQuestStreak();
    });
  }
  const questLogClearBtn = containerEl.querySelector('#questLogClearBtn');
  if (questLogClearBtn) {
    questLogClearBtn.addEventListener('click', () => {
      if (!window.confirm(t('dailyQuest.confirmClear'))) return;
      S.saveQuestLog([]);
      renderQuestLog();
    });
  }
  if (questLogInput) questLogInput.value = S.questLogTodayText();
}

export function resetFilterState() {
  historyGoalFilterId = null;
}

export function teardownSections() {
  containerEl = null;
  hooksRef = null;
}
