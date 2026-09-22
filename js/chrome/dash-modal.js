/* ================================================================
   ダッシュボードモーダル（ドックの「ダッシュボード」ボタンから、
   今どのツールを見ていても開ける軽量な予定サマリー）。
   item/profiles.js の pfDashOpen()は自サイトのindex.htmlを自己fetch+
   正規表現抽出していたが（pfDashLoadData）、tai-hubではそもそも
   season-data.jsを直接importしているためその仕組みごと不要になった
   ——fetchなしで同じ情報を即座に表示できる、というSPA化の具体的な改善点。

   スコープ簡略化：元実装の「今日/今週/今月」の3分割レイアウトまでは
   再現せず、現在のシーズン・開催中イベント・次回アップデート・
   再訪精霊の状態を1つのリストにまとめて表示する軽量版とする。
   ================================================================ */
import { CURRENT_LANG } from '../i18n.js';
import { trEvent } from '../i18n.js';
import {
  CURRENT_SEASON, EVENT_SCHEDULE, CANDLE_BONUS_SCHEDULE, NEXT_UPDATE,
  getCurrentEventNames, isRevisitSpiritCurrentlyActive,
} from '../../features/item/data/season-data.js';

function t(ja, en) { return CURRENT_LANG === 'en' ? en : ja; }
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(CURRENT_LANG === 'en' ? 'en-US' : 'ja-JP', { month: 'short', day: 'numeric' });
}

export function open() {
  document.getElementById('dashModalOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dashModalOverlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const now = new Date();
  const activeNames = getCurrentEventNames();
  const seasonActive = CURRENT_SEASON.endDate && now < new Date(CURRENT_SEASON.endDate);
  const activeCandleBonus = CANDLE_BONUS_SCHEDULE.filter(c => now <= new Date(c.end) && (!c.start || now >= new Date(c.start)));
  const nextUpdateActive = NEXT_UPDATE.date && now < new Date(NEXT_UPDATE.date);

  overlay.innerHTML = `
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="dashModalCloseBtn"><svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg></button>
      <div class="modal-title">${t('ダッシュボード', 'Dashboard')}</div>
      <div class="pf-row"><span class="pf-row-name">${t('シーズン', 'Season')}</span><span>${seasonActive ? `${trEvent(CURRENT_SEASON.name)}（${fmtDate(CURRENT_SEASON.endDate)}${t('まで', '')}）` : t('シーズン情報なし', 'No active season')}</span></div>
      <div class="pf-row"><span class="pf-row-name">${t('開催中のイベント', 'Active Events')}</span><span>${activeNames.length ? activeNames.map(trEvent).join('・') : t('なし', 'None')}</span></div>
      ${activeCandleBonus.length ? `<div class="pf-row"><span class="pf-row-name">${t('キャンドルボーナス', 'Candle Bonus')}</span><span>${activeCandleBonus.map(c => trEvent(c.name)).join('・')}</span></div>` : ''}
      <div class="pf-row"><span class="pf-row-name">${t('再訪精霊', 'Revisiting Spirit')}</span><span>${isRevisitSpiritCurrentlyActive() ? t('来訪中', 'Currently visiting') : t('来訪なし', 'None')}</span></div>
      ${nextUpdateActive ? `<div class="pf-row"><span class="pf-row-name">${t('次回アップデート', 'Next Update')}</span><span>${fmtDate(NEXT_UPDATE.date)}</span></div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('dashModalCloseBtn').addEventListener('click', close);
  requestAnimationFrame(() => overlay.classList.add('open'));
}

export function close() {
  document.getElementById('dashModalOverlay')?.classList.remove('open');
}
