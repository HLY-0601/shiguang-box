/* ================================================================
   titles.js — 称号（実績）の定義

   移植元: C:\Users\user\Downloads\skyツール\emote\index.html の
   TITLES配列（旧実装の行3847-3863）。id・name/nameEn・desc/descEn・
   check(stats) の判定ロジックまで完全に同一（実際のJS関数として維持し、
   JSON化はしていない）。

   icon: 元実装は共有スプライト（自サイト内の<svg class="inline-icon" id="pf-icon-sprite">）の
   #i-star・#i-masks・#i-crown・#i-map・#i-compass を<use>で参照していた。
   tai-hub側の共有スプライト（js/icon-sprite.js）には i-star/i-masks/i-crown は
   既にあるためそのまま<use>参照できるが、i-map・i-compassは無い。他の機能も
   並行編集中のため共有スプライト自体は変更せず（features/item/cost-view.js と
   同じ方針）、この2つだけ元サイトの同じsymbol定義（path形状）をインラインSVGとして
   直接埋め込むことで見た目を完全に維持している。
   ================================================================ */

const ICON_STAR = '<svg class="inline-icon" width="16" height="16"><use href="#i-star"/></svg>';
const ICON_MASKS = '<svg class="inline-icon" width="16" height="16"><use href="#i-masks"/></svg>';
const ICON_CROWN = '<svg class="inline-icon" width="16" height="16"><use href="#i-crown"/></svg>';
// 共有スプライトに無いため、元サイトのi-map/i-compassと同じpath形状をそのままインライン化
const ICON_MAP = '<svg class="inline-icon" width="16" height="16" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.074) translate(-12 -12.15)"><path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2Z"/><path d="M10 4.3v14M14 6.3v14"/></g></svg>';
const ICON_COMPASS = '<svg class="inline-icon" width="16" height="16" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M14.5 9.5l-1.8 4.2-4.2 1.8 1.8-4.2Z"/></g></svg>';

export const TITLES = [
  { id: 'apprentice', icon: ICON_STAR, name: '一芸見習い', nameEn: 'Emote Apprentice',
    desc: '所持レベル数が全体の10%に到達', descEn: 'Owned levels reached 10% of the total',
    check: s => s.pct >= 10 },
  { id: 'performer', icon: ICON_MASKS, name: '芸達者', nameEn: 'Skilled Performer',
    desc: '所持レベル数が全体の50%に到達', descEn: 'Owned levels reached 50% of the total',
    check: s => s.pct >= 50 },
  { id: 'grandmaster', icon: ICON_CROWN, name: 'エモート完全制覇', nameEn: 'Emote Grandmaster',
    desc: '全エモートの全レベルを所持', descEn: 'Owns every level of every emote',
    check: s => s.total > 0 && s.owned >= s.total },
  { id: 'completionist', icon: ICON_MAP, name: '全種踏破', nameEn: 'Full Collection',
    desc: '全エモートを最低1レベルずつ所持', descEn: 'Owns at least one level of every emote',
    check: s => s.emoteCount > 0 && s.ownedEmoteCount >= s.emoteCount },
  { id: 'guideFan', icon: ICON_COMPASS, name: '案内人めぐり', nameEn: 'Guide’s Companion',
    desc: '「案内人」エモートを全種最低1レベルずつ所持', descEn: 'Owns at least one level of every Guide emote',
    check: s => s.guideCount > 0 && s.ownedGuideCount >= s.guideCount },
];
