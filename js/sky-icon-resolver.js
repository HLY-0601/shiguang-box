/* ================================================================
   本地游戏图标解析器（拾光匣）。
   把自托管的 assets/sky-icons 里的 CharSkyKid 图标，按「类别 + 名称 token」
   保守地匹配到物品；只有在唯一且全部 token 命中时才返回路径，否则返回 null，
   由调用方回退到外部图或内置 SVG，保证绝不显示错图 / 竖排文字。
   ================================================================ */

const ICON_BASE = 'assets/sky-icons/';

// 物品目录类别 -> 本地图标类别（文件名第二段）
const CAT2ICON = {
  cape: 'Wing', hairstyle: 'Hair', mask: 'Mask', outfit: 'Body', shoes: 'Feet',
  hair_accessory: 'Hat', head_accessory: 'Hat', necklace: 'Neck',
  portable_item: 'Prop', small_placeable: 'Prop', large_placeable: 'Prop', face_accessory: 'Face',
};

const GENERIC = new Set([
  'cape', 'wing', 'hair', 'hairstyle', 'mask', 'outfit', 'body', 'shoes', 'feet', 'hat', 'horn',
  'neck', 'necklace', 'prop', 'face', 'accessory', 'item', 'placeable', 'portable', 'small',
  'large', 'head', 'onesie', 'char', 'sky', 'kid', 'icon', 'the', 'of', 'a', 'an', 'one', 'g',
  's', 'classic', 'anniv', 'anniversary', 'pack', 'pendant',
]);

function splitCamel(s) {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
function toTokens(s) {
  return splitCamel(String(s))
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !GENERIC.has(t) && !/^ap\d+$/.test(t) && !/^\d+$/.test(t));
}

let indexPromise = null;
function loadIndex() {
  if (indexPromise) return indexPromise;
  indexPromise = (async () => {
    const files = await fetch(ICON_BASE + 'manifest.json', { cache: 'no-cache' }).then((r) => r.json());
    return files.map((file) => ({
      file,
      cat: file.split('_')[1],
      toks: new Set(toTokens(file)),
    }));
  })();
  return indexPromise;
}

// 主入口：按物品英文名 + 目录类别解析本地图标，唯一强匹配才返回
export async function resolveLocalIcon(nameEn, category) {
  const wantCat = CAT2ICON[category] || category;
  const itemToks = toTokens(nameEn);
  if (itemToks.length === 0) return null;
  const index = await loadIndex();
  const hits = [];
  for (const ic of index) {
    if (ic.cat !== wantCat) continue;
    if (itemToks.every((t) => ic.toks.has(t))) hits.push(ic.file);
  }
  return hits.length === 1 ? ICON_BASE + hits[0] : null;
}

// 通用入口：给任意文本 + 期望的本地图标类别，返回唯一强匹配
export async function resolveLocalIconByText(text, iconCategory) {
  const itemToks = toTokens(text);
  if (itemToks.length === 0) return null;
  const index = await loadIndex();
  const hits = [];
  for (const ic of index) {
    if (iconCategory && ic.cat !== iconCategory) continue;
    if (itemToks.every((t) => ic.toks.has(t))) hits.push(ic.file);
  }
  return hits.length === 1 ? ICON_BASE + hits[0] : null;
}
