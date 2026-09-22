/* ================================================================
   ROUTESテーブル：ツールキー -> {mount(container, sub), unmount(), title(sub)}
   ================================================================ */

import * as dashboardView from '../features/item/dashboard-view.js';
import * as categoryView from '../features/item/category-view.js';
import * as costView from '../features/item/cost-view.js';
import * as placeholderView from '../features/placeholder/placeholder-view.js';
import { CATEGORY_REGISTRY } from '../features/item/data/categories.js';
import { CURRENT_LANG } from './i18n.js';

export const DEFAULT_ROUTE = 'item';

const itemEntry = {
  mount(container, sub) {
    if (!sub) { dashboardView.mount(container); return; }
    if (sub === 'cost') { costView.mount(container); return; }
    const cat = CATEGORY_REGISTRY.find(c => c.key === sub);
    if (cat && cat.section === 'special') {
      // music_sheet は MUSIC_SHEETS という別形状のデータ（曲ごとの入手方法・
      // キャンドルコスト管理）を持ち、汎用category-view.jsの前提（ITEMS_DATA型の
      // 所持/お気に入りトグル）に合わないため、今回のプロトタイプでは
      // 明示的に未移植（emote等の4ツールと同じプレースホルダー扱い）とする。
      placeholderView.mount(container, { toolKey: 'item', nameJa: cat.name, nameEn: cat.nameEn, icon: cat.icon || 'i-sheet-music' });
      return;
    }
    if (cat) { categoryView.mount(container, cat); return; }
    // 未知のサブルートはダッシュボードへフォールバック
    location.hash = '#/item';
  },
  unmount() {
    dashboardView.unmount();
    categoryView.unmount();
    costView.unmount();
  },
  title(sub) {
    if (!sub) return CURRENT_LANG === 'en' ? 'Item Collection Tracker - tai-hub' : 'アイテム所持管理 - tai-hub';
    if (sub === 'cost') return CURRENT_LANG === 'en' ? 'Cost Calculator - tai-hub' : 'コスト集計 - tai-hub';
    const cat = CATEGORY_REGISTRY.find(c => c.key === sub);
    if (cat) return `${CURRENT_LANG === 'en' ? cat.nameEn : cat.name} - tai-hub`;
    return 'tai-hub';
  },
};

function placeholderEntry(toolKey, nameJa, nameEn, icon) {
  return {
    mount(container) { placeholderView.mount(container, { toolKey, nameJa, nameEn, icon }); },
    unmount() { placeholderView.unmount(); },
    title() { return `${CURRENT_LANG === 'en' ? nameEn : nameJa} - tai-hub`; },
  };
}

export const ROUTES = {
  item: itemEntry,
  emote: placeholderEntry('emote', 'エモート所持率管理', 'Emote Collection Tracker', 'i-masks'),
  share: placeholderEntry('share', '創作物管理ツール', 'Creation Manager', 'i-pin'),
  'tai-nomacan': placeholderEntry('tai-nomacan', 'ノマキャン計算機', 'Candle Calculator', 'i-candle'),
  'star-candle': placeholderEntry('star-candle', '星のキャンドル計算機', 'Star Candle Calculator', 'i-star-candle'),
};
