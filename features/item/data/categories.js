/* ================================================================
   CATEGORY_REGISTRY：item/index.htmlのCATS配列を移植（fileフィールドは
   廃止——SPAではファイルではなくルートで遷移する）。楽譜（music_sheet）は
   元のダッシュボードでも独立した「楽譜コンプリート管理」セクション扱い
   だったため section:'special' を付けている（他12件は section:'grid'）。
   MUSIC_SHEETSはITEMS_DATAと異なるフィールド（入手方法・難易度・音楽キー等）
   を持つため、router-registry.jsはsection:'special'のとき汎用category-view.js
   ではなく専用のmusic-sheet-view.jsへルーティングする（item_cost.htmlの
   cost-view.jsと同じ「関連するが別モジュール」という扱い）。
   iconのSVGフォールバックは元実装でも実質未使用（全カテゴリがimgを
   持つため）だったので、img（Wikia画像URL）だけを採用している。
   ================================================================ */
export const CATEGORY_REGISTRY = [
  { key: 'outfit', name: 'アウトフィット', nameEn: 'Outfit', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/a/aa/Icon_pants_default.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'shoes', name: 'シューズ', nameEn: 'Shoes', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/cc/Peeking-Postman-Shoes-icon.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'mask', name: 'マスク', nameEn: 'Mask', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/cf/Icon_mask_default.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'face_accessory', name: 'フェイスアクセサリー', nameEn: 'Face Accessory', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/b/bc/RejectingVoyager-3.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'necklace', name: 'ネックレス', nameEn: 'Necklace', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/7/73/1_Gratitude.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'hairstyle', name: 'ヘアスタイル', nameEn: 'Hairstyle', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/4/47/Icon_hair_default.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'hair_accessory', name: 'ヘアアクセサリー', nameEn: 'Hair Accessory', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/6d/Mimi-4117_07_chill_sunbather_hat.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'head_accessory', name: 'ヘッドアクセサリー', nameEn: 'Head Accessory', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/1/12/Mimi-4117_04_hairtousle_teen_hat.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'cape', name: 'ケープ', nameEn: 'Cape', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/9/9f/Cape-category-Ray.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'portable_item', name: '持ち運べるアイテム', nameEn: 'Props', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/c/c0/LaughingLightCatcher-2.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'large_placeable', name: '大きい設置アイテム', nameEn: 'Large Placeable Items', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/0/03/Sunlight-Manta-Float-icon.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'small_placeable', name: '小さい設置アイテム', nameEn: 'Small Placeable Items', img: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/6/6c/Icon_prop_vault_lantern.png/revision/latest/scale-to-width-down/51', section: 'grid' },
  { key: 'music_sheet', name: '楽譜', nameEn: 'Music Sheets', icon: 'i-sheet-music', section: 'special' },
];
