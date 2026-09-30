/* ================================================================
   ダッシュボードモーダル（ドックの「ダッシュボード」ボタンから、
   今どのツールを見ていても開ける予定パネル）。

   従来はスコープ簡略化した独自の軽量リスト（シーズン・開催中イベント・
   次回アップデート・再訪精霊のみ）を自前でレンダリングしていたが、
   全ツール共通の「今日/今週/今月」フル機能パネル（カレンダー・カウント
   ダウン・通知リマインダー・.icsエクスポートまで含む）は既に
   features/shared/event-dashboard.js として実装済みで、companion/
   profile/spirit-catalog/wingsの4ツールが自分のページ内で個別に
   mount()していた。ドックのダッシュボードボタンだけこの資産を使わず
   簡易版のままだったため、他の全ツール（item/star-candle/tai-card/
   tai-score/tai-info/tai-nomacan/tai-nomacan-pro/emote/share/
   data-transfer/tai-revisit）はこのフル機能パネルに到達できなかった。
   wings-view.jsのopenDashboardModal()と同じパターンでmount/unmountする
   ことで、どのツールからでも同じフル機能ダッシュボードを開けるようにする。
   ================================================================ */
import { CURRENT_LANG } from '../i18n.js';
import * as eventDashboard from '../../features/shared/event-dashboard.js';

function t(ja, en) { return CURRENT_LANG === 'en' ? en : ja; }

export function open() {
  document.getElementById('dashModalOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dashModalOverlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.innerHTML = `
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="dashModalCloseBtn"><svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg></button>
      <div class="modal-title">${t('今日・今週・今月', 'Today / This Week / This Month')}</div>
      <div id="dashModalBody"></div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('dashModalCloseBtn').addEventListener('click', close);
  eventDashboard.mount(overlay.querySelector('#dashModalBody'), { icsExport: true });
  requestAnimationFrame(() => overlay.classList.add('open'));
}

export function close() {
  document.getElementById('dashModalOverlay')?.classList.remove('open');
  eventDashboard.unmount();
}
