/* ================================================================
   season-calc ツール固有 i18n 辞書。
   夜月の外壳言語（CURRENT_LANG: zh / ja / en / zh-TW / ko）に追従し、
   ツール内に独立した言語切替は持たない。
   辞書は { ja, en, zh } を持ち、zh は原 test_trust の簡中文案を採用。
   ================================================================ */
import { CURRENT_LANG } from '../../../js/i18n.js';

const CALC_I18N = {
  title:            { ja: '季節精霊計算機', en: 'Season Spirit Calculator', zh: '季节先祖计算器' },
  addProf:          { ja: '方案を追加', en: 'Add Profile', zh: '新增方案' },
  delProf:          { ja: '削除', en: 'Delete', zh: '删除' },
  totalReq:         { ja: '総需求', en: 'Required', zh: '总需求' },
  totalExp:         { ja: '総好感度', en: 'Total Affection', zh: '总好感度' },
  spent:            { ja: '已花', en: 'Spent', zh: '已花' },
  daysLeft:         { ja: '残り日数', en: 'Days Left', zh: '还需天数' },
  resetSeason:      { ja: '今季をリセット', en: 'Reset Season', zh: '重置当前季节' },
  compExp:          { ja: '陪伴好感度', en: 'Companion Aff.', zh: '陪伴好感度' },
  resetSpirit:      { ja: '進度をリセット', en: 'Reset Progress', zh: '重置进度' },
  cst:              { ja: 'コスト', en: 'Cost', zh: '消耗' },
  exp:              { ja: '好感', en: 'Aff.', zh: '好感' },
  profPrompt:       { ja: '方案名を入力してください', en: 'Enter profile name:', zh: '请输入方案名称：' },
  errReq:           { ja: '解放できません', en: 'Cannot unlock', zh: '你还不能解锁' },
  errReq2:          { ja: '必要好感度', en: 'Requires affection', zh: '需要总好感度达到' },
  export:          { ja: 'エクスポート', en: 'Export', zh: '导出' },
  import:          { ja: 'インポート', en: 'Import', zh: '导入' },
  addExp:           { ja: '追加', en: 'Add', zh: '增加' },
  day:              { ja: '日', en: 'd', zh: '天' },
  guide:            { ja: '（ガイド）', en: '(Guide)', zh: '(向导)' },
  tierLbl:          { ja: '到達Lv', en: 'Max tier', zh: '可达等级' },
  partialNote:      { ja: '今季は旧形式の精霊が{n}体未収録です', en: '{n} more legacy-format spirits are not yet included', zh: '本季另有 {n} 只旧版格式先祖尚未收录' },
  pass:             { ja: 'シーズンパス所持（進行中）', en: 'Have Season Pass and Season In Progress', zh: '拥有季卡且季节进行中' },
  hideReward:       { ja: '卒業礼と季節ハートを隠す', en: 'Hide Season Heart items', zh: '隐藏毕业礼与季节项链' },
  daily:            { ja: '1日の季節キャンドル', en: 'Candles/day', zh: '每日季蜡' },
  initial:          { ja: '所持キャンドル', en: 'Starting', zh: '起始季蜡' },
  noPassNote:       { ja: 'パスなし：パス限定アイテム（季節ハート含む）は取得できません', en: 'No pass: pass-exclusive items (incl. Season Heart) are unobtainable', zh: '无季卡：季卡限定项目（含季心）无法取得' },
  importBad:        { ja: 'インポートに不正な項目があり、除外しました', en: 'Import contained invalid keys; they were skipped', zh: '导入档含不合法栏位，已略过' },
  defaultProfile:   { ja: '既定の方案', en: 'Default', zh: '预设方案' },
  delProfileConfirm:{ ja: 'この方案を削除しますか？', en: 'Delete this profile?', zh: '确定要删除当前方案吗？' },
  delLast:          { ja: '最後の方案は削除できません', en: 'Cannot delete the last profile', zh: '无法删除最后一个方案' },
  addProfileOk:     { ja: '方案を追加しました', en: 'Profile added', zh: '新增方案成功' },
  profileDeleted:   { ja: '方案を削除しました', en: 'Profile deleted', zh: '方案已删除' },
  importOk:         { ja: 'インポートしました', en: 'Imported', zh: '导入成功' },
  exportOk:         { ja: 'エクスポートしました', en: 'Exported', zh: '导出成功' },
  resetSpiritConfirm:{ ja: 'この精霊の進度をリセットしますか？', en: 'Reset this spirit\'s progress?', zh: '确定要重置这位先祖的进度吗？' },
  resetSeasonConfirm:{ ja: '今季のすべての進度をリセットしますか？', en: 'Reset all progress for this season?', zh: '确定要重置当前季节的所有进度吗？' },
  seasonReset:     { ja: '今季をリセットしました', en: 'Season reset', zh: '季节已重置' },
  loadError:        { ja: 'データを読み込めませんでした', en: 'Failed to load data', zh: '数据加载失败' },
  currency: {
    season_candle: { ja: '季節キャンドル', en: 'S.Candle', zh: '季蜡' },
    candles:       { ja: 'キャンドル', en: 'Candle', zh: '蜡烛' },
    heart:         { ja: 'ハート', en: 'Heart', zh: '爱心' },
    season_heart:  { ja: '季節ハート', en: 'S.Heart', zh: '季节之心' },
    prestige:      { ja: '昇華キャンドル', en: 'Ascended', zh: '升华蜡烛' },
  },
};

function pick(node) {
  if (!node) return '';
  if (CURRENT_LANG === 'en') return node.en || node.ja || '';
  if (CURRENT_LANG === 'zh' || CURRENT_LANG === 'zh-TW') return node.zh || node.en || node.ja || '';
  return node.ja || node.en || '';
}

export function t(key, vars) {
  const parts = key.split('.');
  let node = CALC_I18N;
  for (const p of parts) node = node ? node[p] : undefined;
  let str = pick(node);
  if (vars) Object.keys(vars).forEach(k => { str = str.split('{' + k + '}').join(vars[k]); });
  return str;
}

/* 原 spirits.i18n.json の言語コードを夜月 CURRENT_LANG にマップ */
function dataLang() {
  if (CURRENT_LANG === 'en') return 'en';
  if (CURRENT_LANG === 'zh-TW') return 'zh-hant';
  return 'zh';
}

/* 先祖／グループ／アイテム名の查表（欠落は繁中→キー末尾に兜底） */
export function dataName(table, key) {
  const langs = [dataLang(), 'zh-hant'];
  for (const l of langs) {
    const v = table[l] && table[l][key];
    if (v) return v;
  }
  return key.split('.').slice(1).join('.') || key;
}
