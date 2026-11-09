/* ================================================================
   friendship-tree-view.js — 新好友树（Ver.33.5）表示
   ================================================================ */
import { FRIENDSHIP_TREE, TOTAL_COST } from './friendship-tree-data.js';

let container = null;

export function mount(cont) {
  container = cont;
  render();
}

export function unmount() {
  container = null;
}

function render() {
  if (!container) return;
  container.innerHTML = `
    <style>
      .ft-wrap { padding: 16px; max-width: 900px; margin: 0 auto; }
      .ft-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
      .ft-sub { font-size: 13px; opacity: .6; margin: 0 0 20px; }
      .ft-total {
        display: flex; gap: 24px; padding: 12px 16px; border-radius: 12px;
        background: rgba(255,255,255,.06); margin-bottom: 20px; font-size: 15px; font-weight: 600;
      }
      .ft-level { margin-bottom: 16px; border-radius: 14px; overflow: hidden; background: rgba(255,255,255,.04); }
      .ft-level-head {
        display: flex; align-items: center; gap: 10px; padding: 12px 16px;
        background: rgba(255,255,255,.06); font-weight: 700;
      }
      .ft-level-badge {
        width: 28px; height: 28px; border-radius: 50%; background: #7c9eff; color: #fff;
        display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;
      }
      .ft-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1px; background: rgba(255,255,255,.06); }
      .ft-action { padding: 12px 16px; background: rgba(0,0,0,.2); display: flex; justify-content: space-between; align-items: center; }
      .ft-action-name { font-size: 14px; }
      .ft-action-cost { font-size: 13px; opacity: .8; }
      .ft-ac { color: #ffd97c; }
    </style>
    <div class="ft-wrap">
      <h1 class="ft-title">フレンドツリー <span style="font-size:14px;opacity:.5">Ver.33.5</span></h1>
      <p class="ft-sub">友達との絆を深めるツリー。全解放に必要な総数</p>
      <div class="ft-total">
        <span>🕯 ${TOTAL_COST.candles} 白キャンドル</span>
        <span>✨ ${TOTAL_COST.ascended} 昇華</span>
      </div>
      ${FRIENDSHIP_TREE.map(lv => `
        <div class="ft-level">
          <div class="ft-level-head">
            <div class="ft-level-badge">${lv.level}</div>
            <span>${lv.title} · ${lv.titleJa}</span>
          </div>
          <div class="ft-actions">
            ${lv.actions.map(a => `
              <div class="ft-action">
                <span class="ft-action-name">${a.nameJa}</span>
                <span class="ft-action-cost ${a.ac ? 'ft-ac' : ''}">${a.ac ? '✨' + a.ac : a.cost > 0 ? '🕯' + a.cost : '無料'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
