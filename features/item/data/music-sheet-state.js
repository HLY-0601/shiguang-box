/* ================================================================
   楽譜（Music Sheets）専用の状態読み書き。item/music_sheet.html の
   loadUserData()/saveUserData() を移植したもの。

   保存キー・データ形状は他12カテゴリの js/state.js#getCategoryState/
   saveCategoryState と同じ gameItems_<catKey> 系だが、楽譜は
   ownedItems（所持アイテムの詳細配列）を書かない点だけ異なる
   （移植元のsaveUserData()も itemOwned/itemFav のみで ownedItems を
   持たない——他機能がこのキーを読む際も owned/fav の2フィールドしか
   参照しないため、この差は互換性に影響しない）。この差を維持するため、
   js/state.js の saveCategoryState() は使わずここで直接書く。

   🔄 移行: お気に入り機能を追加する前（〜2026-08-29）は
   nsKey('musicSheets') に保存していたため、新キーにまだ何も無ければ
   そちらから読み込む（読み込みだけで旧キー自体は消さない）。
   ================================================================ */
import { nsKey } from '../../../js/state.js';

export const CAT_KEY = 'music_sheet';

const lsKey = () => nsKey('gameItems_' + CAT_KEY);
const legacyLsKey = () => nsKey('musicSheets');

export function loadMusicSheetState() {
  try {
    const saved = localStorage.getItem(lsKey()) || localStorage.getItem(legacyLsKey());
    if (saved) {
      const parsed = JSON.parse(saved);
      return { owned: parsed.itemOwned || {}, fav: parsed.itemFav || {} };
    }
  } catch (e) { console.error('楽譜データの読み込み失敗:', e); }
  return { owned: {}, fav: {} };
}

export function saveMusicSheetState(owned, fav, sheetsArray) {
  const total = sheetsArray.length;
  const ownedCount = sheetsArray.filter(s => owned[s.id]).length;
  localStorage.setItem(lsKey(), JSON.stringify({ total, owned: ownedCount, itemOwned: owned, itemFav: fav }));
  return { total, ownedCount };
}
