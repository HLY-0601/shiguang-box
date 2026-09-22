/* ================================================================
   ROUTESテーブル：ツールキー -> {mount(container, sub), unmount(), title(sub)}
   ================================================================ */

import * as dashboardView from '../features/item/dashboard-view.js';
import * as categoryView from '../features/item/category-view.js';
import * as costView from '../features/item/cost-view.js';
import * as musicSheetView from '../features/item/music-sheet-view.js';
import * as placeholderView from '../features/placeholder/placeholder-view.js';
import * as emoteView from '../features/emote/emote-view.js';
import * as nomacanView from '../features/tai-nomacan/nomacan-view.js';
import * as starCandleView from '../features/star-candle/star-candle-view.js';
import * as shareView from '../features/share/share-view.js';
import * as wingsView from '../features/wings/wings-view.js';
import * as companionView from '../features/companion/companion-view.js';
import * as spiritCatalogView from '../features/spirit-catalog/spirit-catalog-view.js';
import * as taiRevisitView from '../features/tai-revisit/tai-revisit-view.js';
import * as taiScoreView from '../features/tai-score/tai-score-view.js';
import * as taiCardView from '../features/tai-card/tai-card-view.js';
import * as dataTransferView from '../features/data-transfer/data-transfer-view.js';
import * as taiInfoView from '../features/tai-info/tai-info-view.js';
import * as profileView from '../features/profile/profile-view.js';
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
      // 難易度・音楽キー等）を持ち、汎用category-view.jsの前提（ITEMS_DATA型の
      // フィールド）に合わないため、item_cost.html同様に専用ビューとして移植した。
      musicSheetView.mount(container);
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
    musicSheetView.unmount();
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

// 単一ページ系ツール共通のROUTESエントリ。subは常にそのままビューへ渡す
// （サブルートを持たないビューのmount(container)はJSの仕様上、余分な第2引数を
// 単に無視するだけなので安全——item以外の全ツールをこの1関数で統一できる）。
function simpleToolEntry(viewModule, nameJa, nameEn) {
  return {
    mount(container, sub) { viewModule.mount(container, sub); },
    unmount() { viewModule.unmount(); },
    title() { return `${CURRENT_LANG === 'en' ? nameEn : nameJa} - tai-hub`; },
  };
}

export const ROUTES = {
  item: itemEntry,
  emote: simpleToolEntry(emoteView, 'エモート所持率管理', 'Emote Collection Tracker'),
  share: simpleToolEntry(shareView, '創作物管理ツール', 'Creation Manager'),
  'tai-nomacan': simpleToolEntry(nomacanView, 'ノマキャン計算機', 'Candle Calculator'),
  'star-candle': simpleToolEntry(starCandleView, '星のキャンドル計算機', 'Star Candle Calculator'),
  wings: simpleToolEntry(wingsView, '羽トラッカー', 'Wing Tracker'),
  companion: simpleToolEntry(companionView, '精霊同行ツール', 'Spirit Companion Tool'),
  'spirit-catalog': simpleToolEntry(spiritCatalogView, '精霊ツリー管理', 'Spirit Tree Catalog'),
  'tai-revisit': simpleToolEntry(taiRevisitView, '再訪精霊データベース', 'Revisit Spirit Database'),
  'tai-score': simpleToolEntry(taiScoreView, '楽譜づくり', 'Sheet Music Maker'),
  'tai-card': simpleToolEntry(taiCardView, '星紡ぎカード', 'Self-Intro Card Maker'),
  'data-transfer': simpleToolEntry(dataTransferView, 'データ引継ぎ', 'Data Transfer'),
  'tai-info': simpleToolEntry(taiInfoView, '設定・更新情報', 'Settings & Updates'),
  profile: simpleToolEntry(profileView, '作者プロフィール', 'Creator Profile'),
};
