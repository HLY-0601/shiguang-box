/* ================================================================
   spirit-catalog-state.js — 精霊ツリー管理機能の永続化・計算レイヤー

   移植元: C:\Users\user\Downloads\skyツール\spirit-catalog\index.html
   （~6400行のスタンドアロンページ）のうち、localStorageの読み書き・
   ノード解放判定・ツリーレイアウト計算・一括操作のコア処理・item/emote/
   wingsとのクロスツール同期を担う部分。DOM構築・イベント配線は
   spirit-catalog-view.js 側に分離している。

   localStorageのキー名・JSON形状は元実装と完全に同一に保っている
   （既存ユーザーのデータをそのまま読めることが必須のため）。
   spirit-catalog自身が所有するキー（spiritCatalogUnlocked_v1 /
   spiritCatalogTitles_v1 / spiritCatalogStats_v1）は nsKey() 経由で
   プロフィール名前空間化する。item/emote/wings側の共有キー
   （gameItems_<cat> / wish_<cat> / emoteOwned_v1 / wingTracker_v1 /
   permWingTracker_v1）も同様に nsKey() を通す — これは元実装と同じ
   （taipak5000.github.io系ツールは全ツールが同一オリジンでlocalStorageを
   共有し、プロフィール機構も共通のため）。

   【意図的な簡略化（元の挙動を変えない範囲のスコープ調整。詳細は
   spirit-catalog-view.jsの冒頭コメント・最終報告のdeviationsFromSourceに
   まとめる）】
   - 所持通貨（キャンドル/ハート等）の自動増減（adjustOwnCurrency /
     wishOwnCurrency）は移植していない。ノード解放・解除・一括操作は
     コスト消費を伴わない（＝コスト表示はあくまで「残り必要数の目安」の
     まま、実際の所持通貨とは連動しない）。
   - 季節のペンダント所持による「シーズン中に入手済み（0扱い）」除外
     （getPendantOwnedSeasons/seasonAcquireMode_v1）は移植していない
     （item側のnecklaceカタログへの追加の依存を避けるため）。
   - ノードの実機画像解決（item/emoteの自HTMLをfetchして名前/ID照合する
     Stage1〜4のロジック）は移植していない。ツリーノードは常に種別ごとの
     線画アイコン（元実装でも画像読み込み失敗時のフォールバックとして
     使われているものと同じアイコン群）で表示する。
   ================================================================ */
import { nsKey, nsKeyFor, getActiveProfileId, removeWishItem } from '../../js/state.js';
import { CURRENT_LANG } from '../../js/i18n.js';
import { t } from './data/i18n-catalog.js';
import { SPIRIT_TREE_DATA } from './data/spirit-tree-data.js';
import { SPIRIT_YOMI } from './data/spirit-yomi-data.js';
import { REVISIT_SPIRIT_SCHEDULES } from '../item/data/season-data.js';

/* ================================================================
   季節名・種別のJA/EN対応表
   ================================================================ */
export const SEASON_JA_MAP = {
  'Season of Gratitude': '感謝の季節', 'Season of Lightseekers': '光の探求者の季節',
  'Season of Belonging': '想いを編む季節', 'Season of Rhythm': 'リズムが弾ける季節',
  'Season of Enchantment': '魔法の季節', 'Season of Sanctuary': '楽園の季節',
  'Season of Prophecy': '預言者の季節', 'Season of Dreams': '夢かなう季節',
  'Season of Assembly': '大樹に集う季節', 'Season of The Little Prince': '星の王子さまの季節',
  'Season of Flight': '羽ばたく季節', 'Season of Abyss': '深淵の季節',
  'Season of Performance': '表現者たちの季節', 'Season of Shattering': '砕ケル闇ノ季節',
  'Season of AURORA': 'AURORAの季節', 'Season of Remembrance': '追慕の季節',
  'Season of Passage': 'ならいの季節', 'Season of Moments': '瞬きの季節',
  'Season of Revival': '復古の季節', 'Season of the Nine-Colored Deer': '九色の鹿の季節',
  'Season of Nesting': '巣づくりの季節', 'Season of Duets': '重なる音色の季節',
  'Season of Moomin': 'ムーミンの季節', 'Season of Radiance': '光に染まる季節',
  'Season of the Blue Bird': '青い鳥の季節', 'Season of The Two Embers - Part 1': 'ふたつの灯火の季節　前編',
  'Season of Migration': '渡りの季節', 'Season of Lightmending': '光の修繕者の季節',
  'Season of Carnival': 'カーニバルの季節', 'Dear Van Gogh': 'ゴッホの季節',
};
export function seasonLabel(seasonKey) {
  if (!seasonKey) return seasonKey;
  return CURRENT_LANG === 'en' ? seasonKey : (SEASON_JA_MAP[seasonKey] || seasonKey);
}
const TYPE_JA = { Season: '季節精霊', Regular: '恒常精霊', Elder: '長老', Guide: '季節ガイド', Special: '特殊', Event: 'イベント' };
const TYPE_EN = { Season: 'Seasonal', Regular: 'Regular', Elder: 'Elder', Guide: 'Guide', Special: 'Special', Event: 'Event' };
export function typeLabel(type) { return (CURRENT_LANG === 'en' ? TYPE_EN[type] : TYPE_JA[type]) || type; }

/* ================================================================
   並び順（種別→エリア/シーズン順）。読み込み時に1回だけ適用する。
   ================================================================ */
const REALM_ORDER = ['Isle of Dawn', 'Daylight Prairie', 'Hidden Forest', 'Valley of Triumph', 'Golden Wasteland', 'Vault of Knowledge'];
export const AREA_TO_REALM = {
  'Dawn Circle': 'Isle of Dawn', 'Temple of the Isle Entrance': 'Isle of Dawn',
  'Prairie Heights': 'Daylight Prairie', 'Prairie Village': 'Daylight Prairie', 'Prairie Cave': 'Daylight Prairie',
  'Butterfly Fields': 'Daylight Prairie', 'Bird Nest': 'Daylight Prairie',
  'Forest Brook': 'Hidden Forest', 'Forest Courtyard': 'Hidden Forest', 'Boneyard': 'Hidden Forest',
  'The Coliseum': 'Valley of Triumph', 'The Citadel': 'Valley of Triumph', 'Frozen Lake': 'Valley of Triumph',
  'The Graveyard': 'Golden Wasteland', 'Wasteland Battlefield': 'Golden Wasteland',
  'Crab Fields': 'Golden Wasteland', 'The Outer Bailey': 'Golden Wasteland',
  'Vault Rest': 'Vault of Knowledge', 'Upper Vault': 'Vault of Knowledge',
  'Lower Vault': 'Vault of Knowledge', 'Vault Second Floor': 'Vault of Knowledge',
  'Dawn Overlook': 'Isle of Dawn', 'Cave of Prophecies': 'Isle of Dawn', 'Passage Rock': 'Isle of Dawn',
  'Prairie Peaks': 'Daylight Prairie', 'Sanctuary Islands': 'Daylight Prairie',
  'Forest Cavern': 'Hidden Forest', 'The Treehouse': 'Hidden Forest',
  'The Wind Paths': 'Hidden Forest', 'Blue Bird theater': 'Hidden Forest',
  'Village of Dreams': 'Valley of Triumph', 'Temple of the Valley': 'Valley of Triumph',
  'Forgotten Ark': 'Golden Wasteland', 'Treasure Reef': 'Golden Wasteland',
  'Starlight Desert': 'Vault of Knowledge', 'Starlight Desert Jar': 'Vault of Knowledge',
  'Crescent Oasis': 'Vault of Knowledge', 'Vault Archive': 'Vault of Knowledge',
  'Jellyfish Beach': 'Vault of Knowledge',
};
export const OTHER_AREA_KEY = '__other_area__';
export const AREA_GROUP_ORDER = [...REALM_ORDER, OTHER_AREA_KEY];
const REALM_ORDER_JA = {
  'Isle of Dawn': '孤島', 'Daylight Prairie': '草原', 'Hidden Forest': '雨林',
  'Valley of Triumph': '峡谷', 'Golden Wasteland': '捨てられた地', 'Vault of Knowledge': '書庫',
};
export function realmOrderLabel(realmKey) { return CURRENT_LANG === 'en' ? realmKey : (REALM_ORDER_JA[realmKey] || realmKey); }
export function areaGroupLabel(key) { return key === OTHER_AREA_KEY ? t('browse.otherAreas') : realmOrderLabel(key); }
export function spiritRealmKey(s) { return (s.area && AREA_TO_REALM[s.area]) || OTHER_AREA_KEY; }
export const NO_SEASON_KEY = '__no_season__';
export function spiritSeasonKey(s) { return s.season || NO_SEASON_KEY; }
export function seasonGroupLabel(key) { return key === NO_SEASON_KEY ? t('browse.noSeasonGroup') : seasonLabel(key); }

const TYPE_GROUP_ORDER = { Guide: 0, Special: 1, Elder: 2, Regular: 3, Season: 4 };
(function sortSpiritsBySeasonOrder() {
  const seasonOrder = {};
  Object.keys(SEASON_JA_MAP).forEach((k, i) => { seasonOrder[k] = i; });
  const realmOrder = {};
  REALM_ORDER.forEach((r, i) => { realmOrder[r] = i; });
  SPIRIT_TREE_DATA.sort((a, b) => {
    const aGroup = TYPE_GROUP_ORDER[a.type] ?? 9;
    const bGroup = TYPE_GROUP_ORDER[b.type] ?? 9;
    if (aGroup !== bGroup) return aGroup - bGroup;
    if (a.type === 'Regular') {
      const aRealm = realmOrder[AREA_TO_REALM[a.area]] ?? 999;
      const bRealm = realmOrder[AREA_TO_REALM[b.area]] ?? 999;
      if (aRealm !== bRealm) return aRealm - bRealm;
      if (a.area !== b.area) return (a.area || '').localeCompare(b.area || '', 'en');
      return (a.nameJa || a.name).localeCompare(b.nameJa || b.name, 'ja');
    }
    if (a.type === 'Guide' || a.type === 'Season') {
      const aIdx = seasonOrder[a.season] ?? 999;
      const bIdx = seasonOrder[b.season] ?? 999;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return (a.seasonOrderIndex ?? 0) - (b.seasonOrderIndex ?? 0);
    }
    return (a.nameJa || a.name).localeCompare(b.nameJa || b.name, 'ja');
  });
})();

export { SPIRIT_TREE_DATA };
export const spiritByGuid = {};
SPIRIT_TREE_DATA.forEach((s) => { spiritByGuid[s.guid] = s; });

export function spiritName(s) {
  if (CURRENT_LANG === 'en') return s.name;
  return s.nameJa || s.name;
}

export function normalizeSearchText(str) {
  return String(str).toLowerCase().replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}
export function spiritYomi(s) { return SPIRIT_YOMI[s.nameJa] || ''; }

/* ================================================================
   チェックリスト対象外ノード（ワープ/連れ歩くボタン）
   ================================================================ */
export function isWarpNode(node) { return node.itemType === 'Special' && /Warp$/.test(node.itemName || ''); }
export function isAccompanyNode(node) { return /^Accompany /.test(node.itemName || ''); }
export function isChecklistExcludedNode(node) { return isWarpNode(node) || isAccompanyNode(node); }
export function isQuestNode(node) { return /^Quest \d+/.test(node.itemName || ''); }
export function isHeartNode(node) { return node.itemType === 'Special' && (node.itemName === 'Heart' || node.itemName === 'Season Heart'); }

/* ================================================================
   ノード解放状況の保存（プロフィールごとに名前空間化）
   spiritCatalogUnlocked_v1 = { [nodeGuid]: true }
   （元実装はコスト実額記録用に {spentC,spentH} オブジェクトも書き得るが、
   通貨連動を移植していないtai-hub版では常に boolean true のみを書く。
   読み込み側はtruthyかどうかしか見ないため、元サイトが書いた
   {spentC,spentH} 形式のデータも引き続き「解放済み」として正しく読める）。
   ================================================================ */
const UNLOCK_KEY_RAW = 'spiritCatalogUnlocked_v1';
let unlockedMapCache = null;
export function getUnlockedMap() {
  if (unlockedMapCache) return unlockedMapCache;
  try { unlockedMapCache = JSON.parse(localStorage.getItem(nsKey(UNLOCK_KEY_RAW))) || {}; }
  catch (_) { unlockedMapCache = {}; }
  return unlockedMapCache;
}
export function saveUnlockedMap(map) {
  localStorage.setItem(nsKey(UNLOCK_KEY_RAW), JSON.stringify(map));
  unlockedMapCache = map;
}
export function invalidateUnlockedMapCache() { unlockedMapCache = null; }

/* ================================================================
   🏆 称号（実績）— スプリットツリー全体の解放率で段階的に獲得。
   一度獲得した称号は、後でノードのチェックを外しても取り消されない。
   ================================================================ */
const TITLES_KEY_RAW = 'spiritCatalogTitles_v1';
export const TITLES = [
  { id: 'pct1', icon: 'sc-i-leaf', threshold: 1 },
  { id: 'pct10', icon: 'i-candle', threshold: 10 },
  { id: 'pct25', icon: 'sc-i-leaf', threshold: 25 },
  { id: 'pct50', icon: 'i-tree', threshold: 50 },
  { id: 'pct100', icon: 'i-crown', threshold: 100 },
];
export function loadEarnedTitles() {
  try { return JSON.parse(localStorage.getItem(nsKey(TITLES_KEY_RAW))) || {}; }
  catch (_) { return {}; }
}
export function saveEarnedTitles(map) { localStorage.setItem(nsKey(TITLES_KEY_RAW), JSON.stringify(map)); }
// 戻り値: { earned, newlyEarned: TITLES[] }
export function checkTitleUnlocks(doneNodes, totalNodes) {
  if (!totalNodes) return { earned: loadEarnedTitles(), newlyEarned: [] };
  const earned = loadEarnedTitles();
  const pct = (doneNodes / totalNodes) * 100;
  const newlyEarned = [];
  TITLES.forEach((def) => {
    if (earned[def.id]) return;
    const reached = def.threshold >= 100 ? doneNodes >= totalNodes : pct >= def.threshold;
    if (!reached) return;
    earned[def.id] = { earnedAt: new Date().toISOString() };
    newlyEarned.push(def);
  });
  if (newlyEarned.length) saveEarnedTitles(earned);
  return { earned, newlyEarned };
}

/* ================================================================
   🔄 item/emote/wingsの所持データを読む（逆方向同期の判定用）
   ================================================================ */
const ITEM_CATS_FOR_TREE = [
  'cape', 'mask', 'necklace', 'hairstyle', 'hair_accessory', 'head_accessory',
  'outfit', 'shoes', 'face_accessory', 'portable_item', 'large_placeable', 'small_placeable',
];
let externalOwnCache = null;
export function getExternalOwnCache() {
  if (externalOwnCache) return externalOwnCache;
  const itemOwnedByCat = {};
  ITEM_CATS_FOR_TREE.forEach((catKey) => {
    try {
      const d = JSON.parse(localStorage.getItem(nsKey('gameItems_' + catKey)));
      itemOwnedByCat[catKey] = (d && d.itemOwned) || {};
    } catch (_) { itemOwnedByCat[catKey] = {}; }
  });
  let emoteOwned = {};
  try { emoteOwned = JSON.parse(localStorage.getItem(nsKey('emoteOwned_v1'))) || {}; } catch (_) { /* noop */ }

  const wingUnlockedGuids = new Set();
  let seasonWingTracker = {};
  let permWingTracker = {};
  try { seasonWingTracker = JSON.parse(localStorage.getItem(nsKey('wingTracker_v1'))) || {}; } catch (_) { /* noop */ }
  try { permWingTracker = JSON.parse(localStorage.getItem(nsKey('permWingTracker_v1'))) || {}; } catch (_) { /* noop */ }
  SPIRIT_TREE_DATA.forEach((spirit) => {
    if (!spirit.nameJa) return;
    const wingBuffNodes = (spirit.nodes || []).filter((n) => n.itemType === 'WingBuff');
    if (wingBuffNodes.length === 0) return;
    if (spirit.type === 'Season') {
      const seasonJa = spirit.season ? SEASON_JA_MAP[spirit.season] : null;
      if (!seasonJa) return;
      if (seasonWingTracker[seasonJa] && seasonWingTracker[seasonJa][spirit.nameJa]) {
        wingBuffNodes.forEach((n) => wingUnlockedGuids.add(n.guid));
      }
    } else if (spirit.type === 'Regular') {
      const entry = permWingTracker[spirit.nameJa];
      if (!entry) return;
      wingBuffNodes.forEach((n, idx) => {
        const tierKey = idx === 0 ? 'tier1' : 'tier2';
        if (entry[tierKey]) wingUnlockedGuids.add(n.guid);
      });
    }
  });

  externalOwnCache = { itemOwnedByCat, emoteOwned, wingUnlockedGuids };
  return externalOwnCache;
}
export function invalidateExternalOwnCache() { externalOwnCache = null; }

/* ================================================================
   ツリーレイアウト（非段階ツリーの枝分かれ座標計算。nw/n/neから算出）
   ================================================================ */
export function computeTreeLayout(s) {
  const nodeMap = {};
  s.nodes.forEach((n) => { nodeMap[n.guid] = n; });
  const root = s.rootNodeGuid;
  if (!root || !nodeMap[root]) return null;

  const depthOf = {};
  const xOf = {};
  const parentOf = {};
  function assign(guid, depth, x) {
    depthOf[guid] = depth;
    xOf[guid] = x;
    const node = nodeMap[guid];
    if (node.nw && nodeMap[node.nw]) { parentOf[node.nw] = guid; assign(node.nw, depth + 1, x - 1); }
    if (node.n && nodeMap[node.n]) { parentOf[node.n] = guid; assign(node.n, depth + 1, x); }
    if (node.ne && nodeMap[node.ne]) { parentOf[node.ne] = guid; assign(node.ne, depth + 1, x + 1); }
  }
  assign(root, 0, 0);

  const xs = Object.values(xOf);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  Object.keys(xOf).forEach((g) => { xOf[g] -= minX; });
  const maxDepth = Math.max(...Object.values(depthOf));
  return { nodeMap, depthOf, xOf, parentOf, maxDepth, leafCount: (maxX - minX + 1) };
}

let blessingWingBuffCache = null;
function getBlessingWingBuffMap() {
  if (blessingWingBuffCache) return blessingWingBuffCache;
  const map = {};
  SPIRIT_TREE_DATA.forEach((s) => {
    const layout = computeTreeLayout(s);
    if (!layout) return;
    const { nodeMap, parentOf } = layout;
    s.nodes.forEach((n) => {
      if (n.itemType !== 'WingBuff') return;
      let cur = parentOf[n.guid];
      while (cur) {
        const ancestor = nodeMap[cur];
        if (ancestor && ancestor.itemNameJa === '祝福') {
          (map[cur] = map[cur] || []).push(n);
        }
        cur = parentOf[cur];
      }
    });
  });
  blessingWingBuffCache = map;
  return map;
}

/* ================================================================
   ノード解放状況の判定: 'own'(このツールで解放) / 'sync'(item/emote/wings
   側の所持データから自動解放) / null(未解放)
   ================================================================ */
export function getUnlockSource(node) {
  if (getUnlockedMap()[node.guid]) return 'own';
  const ext = getExternalOwnCache();
  if (node.itemCatKey && node.itemCostId && ext.itemOwnedByCat[node.itemCatKey] && ext.itemOwnedByCat[node.itemCatKey][node.itemCostId]) return 'sync';
  if (node.emoteId && node.emoteLevel && (ext.emoteOwned[node.emoteId] || []).includes(node.emoteLevel)) return 'sync';
  if (node.itemType === 'WingBuff' && ext.wingUnlockedGuids.has(node.guid)) return 'sync';
  if (node.itemNameJa === '祝福') {
    const wingNodes = getBlessingWingBuffMap()[node.guid];
    if (wingNodes) {
      for (const wn of wingNodes) {
        if (getUnlockSource(wn) === 'sync') return 'sync';
      }
    }
  }
  return null;
}
export function isNodeUnlocked(node) { return !!getUnlockSource(node); }
export function isPrereqNodeSatisfied(parentNode) {
  if (!parentNode) return true;
  return isChecklistExcludedNode(parentNode) || isNodeUnlocked(parentNode);
}

/* ================================================================
   wings（羽トラッカー）と自動同期（Wing Buffノードのみ）
   ================================================================ */
export function syncWingBuff(spirit, node, nowUnlocked) {
  if (!spirit.nameJa || !node || node.itemType !== 'WingBuff') return;
  const wingBuffNodes = spirit.nodes.filter((n) => n.itemType === 'WingBuff');
  const idx = wingBuffNodes.findIndex((n) => n.guid === node.guid);
  if (idx === -1) return;

  if (spirit.type === 'Season') {
    const seasonJa = spirit.season ? SEASON_JA_MAP[spirit.season] : null;
    if (!seasonJa) return;
    const key = nsKey('wingTracker_v1');
    let tracker;
    try { tracker = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { tracker = {}; }
    if (!tracker[seasonJa]) tracker[seasonJa] = {};
    tracker[seasonJa][spirit.nameJa] = nowUnlocked;
    localStorage.setItem(key, JSON.stringify(tracker));
  } else if (spirit.type === 'Regular') {
    const tierKey = idx === 0 ? 'tier1' : 'tier2';
    const key = nsKey('permWingTracker_v1');
    let tracker;
    try { tracker = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { tracker = {}; }
    const entry = { ...(tracker[spirit.nameJa] || {}) };
    if (nowUnlocked) { entry[tierKey] = true; } else { delete entry[tierKey]; }
    if (Object.keys(entry).length === 0) { delete tracker[spirit.nameJa]; } else { tracker[spirit.nameJa] = entry; }
    localStorage.setItem(key, JSON.stringify(tracker));
  }
}

/* ================================================================
   item（アイテム所持管理）の所持アイテムと自動同期
   ================================================================ */
export function syncItemOwned(node, nowUnlocked) {
  if (!node.itemCatKey || !node.itemCostId) return;
  const key = nsKey('gameItems_' + node.itemCatKey);
  let data;
  try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { data = {}; }
  if (!data.itemOwned) data.itemOwned = {};
  if (nowUnlocked) { data.itemOwned[node.itemCostId] = true; } else { delete data.itemOwned[node.itemCostId]; }
  localStorage.setItem(key, JSON.stringify(data));
  if (nowUnlocked) removeWishItem(node.itemCatKey, node.itemCostId);
}

/* ================================================================
   emote（エモート所持率管理）の所持データと自動同期
   emoteOwned_v1 = { [emoteId]: [所持レベル番号の配列] }
   ================================================================ */
export function syncEmoteOwned(node, nowUnlocked) {
  if (!node.emoteId || !node.emoteLevel) return;
  const key = nsKey('emoteOwned_v1');
  let data;
  try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { data = {}; }
  const owned = new Set(data[node.emoteId] || []);
  if (nowUnlocked) { owned.add(node.emoteLevel); } else { owned.delete(node.emoteLevel); }
  const arr = Array.from(owned).sort((a, b) => a - b);
  if (arr.length === 0) { delete data[node.emoteId]; } else { data[node.emoteId] = arr; }
  localStorage.setItem(key, JSON.stringify(data));
}

/* ================================================================
   進捗集計
   ================================================================ */
export function spiritProgress(spirit) {
  const trackable = spirit.nodes.filter((n) => !isChecklistExcludedNode(n));
  const total = trackable.length;
  const done = trackable.filter((n) => isNodeUnlocked(n)).length;
  return { done, total };
}
export function spiritNodesRemaining(spirit, predicate) {
  return spirit.nodes.filter((n) => !isChecklistExcludedNode(n) && predicate(n) && !isNodeUnlocked(n)).length;
}

/* ================================================================
   ノード単体のトグル（コスト消費なし版）
   ================================================================ */
export function toggleNode(spiritGuid, nodeGuid) {
  const spirit = spiritByGuid[spiritGuid];
  if (!spirit) return null;
  const node = spirit.nodes.find((n) => n.guid === nodeGuid);
  if (!node) return null;

  const wasDisplayedUnlocked = isNodeUnlocked(node);
  const nowUnlocked = !wasDisplayedUnlocked;

  const unlocked = getUnlockedMap();
  if (nowUnlocked) { unlocked[nodeGuid] = true; } else { delete unlocked[nodeGuid]; }
  saveUnlockedMap(unlocked);

  if (node.itemType === 'WingBuff') syncWingBuff(spirit, node, nowUnlocked);
  syncItemOwned(node, nowUnlocked);
  syncEmoteOwned(node, nowUnlocked);
  invalidateExternalOwnCache();
  return { spirit, node, nowUnlocked };
}

function unlockNodeForBulk(spirit, unlocked, node) {
  unlocked[node.guid] = true;
  syncItemOwned(node, true);
  syncEmoteOwned(node, true);
  if (node.itemType === 'WingBuff') syncWingBuff(spirit, node, true);
}

export function markTreeCompleteCore(spiritGuid) {
  const spirit = spiritByGuid[spiritGuid];
  if (!spirit) return 0;
  const unlocked = getUnlockedMap();
  let changedCount = 0;
  spirit.nodes.forEach((node) => {
    if (isChecklistExcludedNode(node)) return;
    if (isNodeUnlocked(node)) return;
    unlockNodeForBulk(spirit, unlocked, node);
    changedCount++;
  });
  saveUnlockedMap(unlocked);
  invalidateExternalOwnCache();
  return changedCount;
}

export function markNodesByPredicateCore(spiritGuid, predicate) {
  const spirit = spiritByGuid[spiritGuid];
  if (!spirit) return 0;
  const unlocked = getUnlockedMap();
  let changedCount = 0;
  spirit.nodes.forEach((node) => {
    if (isChecklistExcludedNode(node)) return;
    if (isNodeUnlocked(node)) return;
    if (!predicate(node)) return;
    unlockNodeForBulk(spirit, unlocked, node);
    changedCount++;
  });
  saveUnlockedMap(unlocked);
  invalidateExternalOwnCache();
  return changedCount;
}

export function resetTreeToLocked(spiritGuid) {
  const spirit = spiritByGuid[spiritGuid];
  if (!spirit) return 0;
  const unlocked = getUnlockedMap();
  let changedCount = 0;
  spirit.nodes.forEach((node) => {
    if (isChecklistExcludedNode(node)) return;
    if (!isNodeUnlocked(node)) return;
    if (unlocked[node.guid]) {
      delete unlocked[node.guid];
    } else if (node.itemNameJa === '祝福') {
      return; // 羽ロックの解放状況から動的導出されるのみ。次の再描画で自動的に未解放へ戻る
    }
    syncItemOwned(node, false);
    syncEmoteOwned(node, false);
    if (node.itemType === 'WingBuff') syncWingBuff(spirit, node, false);
    changedCount++;
  });
  saveUnlockedMap(unlocked);
  invalidateExternalOwnCache();
  return changedCount;
}

/* ================================================================
   統計スナップショット（他サイトが直接読めるようにする）
   ================================================================ */
export function saveStatsSnapshot(totalNodes, doneNodes) {
  try { localStorage.setItem(nsKey('spiritCatalogStats_v1'), JSON.stringify({ totalNodes, doneNodes })); }
  catch (_) { /* ストレージ不可時は無視 */ }
}

/* ================================================================
   ノード名・アイコン解決（実機画像フェッチは行わず、アイテム名の
   日本語補完＋種別アイコンのみ。GENERIC_ITEM_NAME_JAは元実装の同名
   辞書をそのまま移植）
   ================================================================ */
const GENERIC_ITEM_NAME_JA = {
  'Belonging Ultimate Fireplace': 'ぬくもりの焚火', 'High Five': 'ハイタッチ', 'Hug': 'ハグ',
  'Double-Five': 'ダブルタッチ', 'Assembly Jar': '壺', 'Assembly Pillow': 'クッション',
  'Little Prince Ultimate Outfit': '星の王子さまの究極のアウトフィット', 'Sword Outfit': '王子さまの剣士服',
  'Flight Ultimate Outfit': '羽ばたく究極アウトフィット', 'Duet Dance': 'ペアダンス',
  'Performance Flower Pot Prop': '花瓶の花束', 'Shattering Ultimate Manta Cape': '究極のマンタケープ',
  'Shattering Ultimate Krill Cape': '究極の暗黒竜ケープ', 'Remembrance Potted Plant': '植木鉢',
  'Remembrance Kettle': 'ケトル', 'Nesting Ultimate Outfit': '巣づくりの究極アウトフィット',
  'Nesting Ultimate Prop': 'フィギュア', 'Duets Ultimate Instrument': '重なる音色のグランドピアノ',
  'Duet Bow': '仲良しお辞儀', 'The Two Embers - Part 1 Ultimate Pendant': 'ふたつの灯火の季節 −前篇−のペンダント',
  'Two Embers - Part 1 Ultimate Hair Accessory': 'ふたつの灯火−前篇の究極ヘアアクセサリー',
  'Two Embers - Part 1 Ultimate Cape': 'ふたつの灯火−前篇の究極ケープ',
  'Challenge Ball Dispenser': 'チャレンジボール供給機', 'Challenge Target': 'チャレンジの的',
  'Challenge Token': 'チャレンジトークン', 'Challenge Bounce Pad': 'チャレンジ跳躍パッド',
  'Challenge Platform': 'チャレンジの台座', 'Forest Elder Hair': '究極のヘアスタイル',
  'Forest Elder Ultimate Face Accessory': '究極のシールドフェイスアクセサリー',
  'Valley Elder Hair 2': '2つ目の究極のヘアスタイル', 'Valley Ultimate Mask B': '2つ目の究極のシールドフェイスアクセサリー',
  'Valley Elder Hair 1': '1つ目の究極のヘアスタイル', 'Valley Ultimate Mask A': '1つ目の究極のシールドフェイスアクセサリー',
  'Isle Elder Hair': '究極のヘアスタイル（あごひげ）', 'Isle Elder Ultimate Face Accessory': '究極のシールドフェイスアクセサリー',
  'Wasteland Elder Hair': '究極のヘアスタイル', 'Vault Elder Hair': '究極のヘアスタイル',
  'Prairie Elder Hair': '究極のヘアスタイル', 'Prairie Elder Ultimate Face Accessory': '究極のシールドフェイスアクセサリー',
  'Meditating Monastic Table Prop': 'チャットテーブル', 'Piggyback': 'おんぶ', 'Hair Tousle': 'なでなで',
  'Play Fight': 'けんかごっこ', 'Bearhug': 'くまハグ', 'Voila': 'ジャジャーン', 'Handshake': '握手',
  'Side Hug': '肩組み', 'Herb Gatherer Prop': '薬草壺', 'Cradle Carry': 'ゆりかご抱っこ',
  'Nesting Nook Shelf': '木製棚', 'Nesting Nook Spice Rack': '木製スパイスラック', 'Nesting Nook Couch': '木製カウチ',
  'Nesting Solarium Hanging Planter': '木製ハンギングプランター', 'Nesting Solarium Table': '木製テーブル',
  'Nesting Solarium Bathtub': '木製浴槽', 'Nesting Solarium Painting': '木製絵画大',
  'Nesting Atrium Floor Light': '木製フロアライト', 'Nesting Atrium Branch': '枝',
  'Nesting Atrium Hanging Lamp': '木製ハンギングランプ', 'Nesting Loft Chair': '木製チェア',
  'Nesting Loft Paintings': '木製絵画セット', 'Nesting Loft Bed': '木製ベッド',
  "The Pianist's Beginnings Rug": 'ピアニストの小さな長方形ラグ', "The Pianist's Beginnings Poster": 'ピアノ鍵盤ポスター',
  "The Cellist's Beginnings Poster": 'チェリストの巻貝ポスター', "The Musicians' Legacy Piano": 'グランドピアノ',
  "The Pianist's Flourishing Poster": 'ピアノポスター', "The Cellist's Flourishing Rug": 'チェリストの小さな長方形ラグ',
  "The Cellist's Flourishing Poster": 'チェロポスター', 'Comfort of Kindness Chandelier': 'シャンデリア',
  'Comfort of Kindness Painting': '橋の絵画', 'Spirit Of Adventure Prop': 'スナフキンテント',
  'Inspiration Of Inclusion Clock': 'おじいさんの時計', 'Inspiration Of Inclusion Painting': 'ムーミンやしきの絵画',
  'Radiance Leaping Dancer Prop': 'カーテンウォール', 'Resourceful Recluse Tea Table': '茶店',
  'Resourceful Recluse Tree Prop': '蔓植物', 'Whispering': 'ないしょ話', 'Secret Handshake': 'ひみつの握手',
  'Revolving Dance': 'くるくるダンス', 'Vase with Sunflowers': '15本のひまわり（持ち物アイテム）',
  'Vase with Blue Flowers': 'アイリスの花瓶', 'Jellyfish Cape': '海月ケープ', 'Jellyfish Hair': '海月ヘアスタイル',
  'Manta Cape': 'マンタケープ', 'Manta Hair': 'マンタヘアスタイル',
};
export function resolveNodeNameJa(n, spirit) {
  if (!n.itemName) return null;
  if (spirit && spirit.nameJa && /^Accompany /.test(n.itemName)) return `${spirit.nameJa}と連れ歩く`;
  const challengeMatch = /^Challenge (\d+)$/.exec(n.itemName);
  if (challengeMatch) return `チャレンジ${challengeMatch[1]}`;
  const questMatch = /^Quest (\d+)/.exec(n.itemName);
  if (questMatch) return `クエスト${questMatch[1]}`;
  return GENERIC_ITEM_NAME_JA[n.itemName] || null;
}
export function itemDisplayName(n, spirit) {
  if (n.itemType === 'Music' && n.itemName) return n.itemName;
  if (CURRENT_LANG === 'en') return n.itemName || n.itemNameJa || resolveNodeNameJa(n, spirit) || t('detail.noItemName');
  return n.itemNameJa || resolveNodeNameJa(n, spirit) || n.itemName || t('detail.noItemName');
}

/* ================================================================
   ノード種別アイコン（実機画像は使わず線画アイコンで統一。
   i-*** は共有スプライト(js/icon-sprite.js)、sc-i-*** はこのツール
   固有のローカルスプライト(spirit-catalog-view.jsが注入)を指す）
   ================================================================ */
export const NODE_TYPE_ICON = {
  Call: 'sc-i-bell', Cape: 'i-hanger', Emote: 'i-person', FaceAccessory: 'sc-i-glasses',
  Furniture: 'sc-i-sofa', Hair: 'sc-i-scissors', HairAccessory: 'sc-i-ribbon', HeadAccessory: 'sc-i-hat',
  Held: 'sc-i-balloon', Mask: 'i-masks', Music: 'i-music-note', Necklace: 'sc-i-necklace',
  Outfit: 'i-hanger', OutfitShoes: 'i-hanger', Prop: 'sc-i-flower', Quest: 'sc-i-scroll', Shoes: 'sc-i-shoe',
  Special: 'i-star', Spell: 'i-sparkle', Stance: 'i-person', WingBuff: 'i-wing',
};
export const NODE_NAME_ICON_OVERRIDE = {
  'ハート': 'i-heart', 'シーズンハート': 'i-heart', 'Heart': 'i-heart', 'Season Heart': 'i-heart',
  'カットシーン': 'sc-i-question', 'Cutscene': 'sc-i-question',
};
export function nodeIconId(node, spirit, isQuest) {
  const name = itemDisplayName(node, spirit);
  return NODE_NAME_ICON_OVERRIDE[name] || (isQuest ? NODE_TYPE_ICON.Quest : NODE_TYPE_ICON[node.itemType]) || 'i-sparkle';
}

function nodeCostSum(n) {
  const cost = n.cost || {};
  return Object.keys(cost).reduce((sum, k) => sum + (cost[k] || 0), 0);
}
// 「コスト違いバリエーション」「エモートのレベル違いバリエーション」判定バッジ（表示専用）
export function getCostTierBadge(spirit, node) {
  if (!spirit) return null;
  if (node.itemType === 'Emote') {
    if (node.emoteId == null || node.emoteLevel == null) return null;
    const group = spirit.nodes.filter((n) => n.itemType === 'Emote' && n.emoteId === node.emoteId);
    if (group.length < 2) return null;
    return { n: node.emoteLevel, total: group.length, mode: 'emote' };
  }
  if (!node.itemCostId || !node.itemType) return null;
  const group = spirit.nodes.filter((n) => n.itemCostId === node.itemCostId && n.itemType === node.itemType);
  if (group.length < 2) return null;
  const sorted = group.slice().sort((a, b) => nodeCostSum(a) - nodeCostSum(b) || (a.guid < b.guid ? -1 : 1));
  const idx = sorted.findIndex((n) => n.guid === node.guid);
  if (idx === -1) return null;
  return { n: idx + 1, total: sorted.length, mode: 'cost' };
}

/* ================================================================
   コスト表示（テスト機能・既定オフ）: 残りコスト集計
   ================================================================ */
export const COST_DISPLAY_KEY = 'sky_catalog_cost_display_enabled';
export function getCostDisplayEnabled() {
  try { return localStorage.getItem(COST_DISPLAY_KEY) === '1'; } catch (_) { return false; }
}
export function setCostDisplayEnabled(on) {
  try { localStorage.setItem(COST_DISPLAY_KEY, on ? '1' : '0'); } catch (_) { /* noop */ }
}
export const COST_ICON = { c: 'i-candle', h: 'i-heart', sc: 'i-candle', sh: 'i-heart', ac: 'i-star-candle', ec: 'sc-i-ticket' };
export function sumRemainingCost(list) {
  const totals = {};
  list.forEach((s) => {
    s.nodes.forEach((n) => {
      if (isChecklistExcludedNode(n)) return;
      if (isNodeUnlocked(n)) return;
      Object.keys(n.cost || {}).forEach((k) => { totals[k] = (totals[k] || 0) + (n.cost[k] || 0); });
    });
  });
  return totals;
}

/* ================================================================
   🕊️ 再訪カウントダウン（item/data/season-data.js のREVISIT_SPIRIT_
   SCHEDULESを直接importして使う。固有名詞は特定できないため、開催有無・
   タイミングのみを算出する — 元実装のpfDashRevisitStatus/
   pfDashPickRevisitStatus/pfDashCountdownと同じ計算式）。
   ================================================================ */
function revisitScheduleStatus(schedule) {
  const now = new Date();
  if (schedule.intervalDays) {
    if (!schedule.anchorStart || !schedule.anchorEnd) return null;
    const start0 = new Date(schedule.anchorStart);
    const end0 = new Date(schedule.anchorEnd);
    const intervalMs = schedule.intervalDays * 86400000;
    const k = Math.floor((now - start0) / intervalMs);
    const start = new Date(start0.getTime() + k * intervalMs);
    const end = new Date(start.getTime() + (end0 - start0));
    if (start <= now && now <= end) return { active: true, target: end };
    const nextStart = now < start ? start : new Date(start.getTime() + intervalMs);
    return { active: false, target: nextStart };
  }
  if (!schedule.start || !schedule.end) return null;
  const start = new Date(schedule.start);
  const end = new Date(schedule.end);
  if (start <= now && now <= end) return { active: true, target: end };
  if (now < start) return { active: false, target: start };
  return null;
}
export function pickRevisitStatus() {
  const statuses = REVISIT_SPIRIT_SCHEDULES.map(revisitScheduleStatus).filter(Boolean);
  const active = statuses.filter((s) => s.active);
  if (active.length) return active.sort((a, b) => a.target - b.target)[0];
  const upcoming = statuses.filter((s) => !s.active);
  return upcoming.length ? upcoming.sort((a, b) => a.target - b.target)[0] : null;
}
export function formatCountdown(target) {
  const ms = target - new Date();
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hh = String(Math.floor((totalSec % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return days > 0 ? `${days}${t('revisitBadge.dayUnit')} ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

/* ================================================================
   グループ分け（エリア別／シーズン別ビュー）
   ================================================================ */
export function computeGroups(mode, list) {
  const order = [];
  const bucket = new Map();
  const pushKey = (k) => { if (!bucket.has(k)) { bucket.set(k, []); order.push(k); } };
  if (mode === 'area') {
    AREA_GROUP_ORDER.forEach(pushKey);
    list.forEach((s) => { const k = spiritRealmKey(s); pushKey(k); bucket.get(k).push(s); });
  } else {
    const seasonsInData = [...new Set(SPIRIT_TREE_DATA.filter((s) => s.season).map((s) => s.season))];
    seasonsInData.forEach(pushKey);
    pushKey(NO_SEASON_KEY);
    list.forEach((s) => { const k = spiritSeasonKey(s); pushKey(k); bucket.get(k).push(s); });
  }
  return order.filter((k) => bucket.get(k).length > 0).map((k) => ({ key: k, spirits: bucket.get(k) }));
}

/* nsKeyFor/getActiveProfileId を再exportしておく（view側で直接使うことがあるため） */
export { nsKeyFor, getActiveProfileId };
