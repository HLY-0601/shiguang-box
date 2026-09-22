/* ================================================================
   シーズン・イベント・アップデート予定・再訪精霊スケジュール。
   item/index.htmlの同名定数を実定数としてexportする（旧実装は
   index.htmlや各カテゴリページを自己fetch+正規表現で読み直して
   いたが、SPA化により直接importできるためその仕組みは廃止した）。

   ⚠️ 季節・イベントが切り替わったら、item/index.html側の更新と
   同じタイミングでここも手動更新すること（tai-hubは独立したデータ
   コピーであり、item本体の変更が自動反映されるわけではない）。
   ================================================================ */

export const CURRENT_SEASON = {
  name: '親愛なるファン・ゴッホへ',
  endDate: '2026-10-01T23:59:00-07:00',
};

export const EVENT_SCHEDULE = [
  { name: '光に染まるイベント', start: '2026-08-14T16:00:00+09:00', end: '2026-08-28T15:59:59+09:00' },
  { name: '来訪する精霊団', start: '2026-08-28T16:00:00+09:00', end: '2026-09-11T15:59:59+09:00' },
  { name: '夏のキャンプ', start: '2026-08-28T16:00:00+09:00', end: '2026-09-11T15:59:59+09:00' },
  { name: '月灯りの日々', start: '2026-09-19T16:00:00+09:00', end: '2026-10-10T15:59:59+09:00' },
];

export const CANDLE_BONUS_SCHEDULE = [
  { name: '大キャン２倍・シーズンキャンドル２倍', start: '2026-09-11T16:00:00+09:00', end: '2026-09-26T15:59:59+09:00' },
];

export const NEXT_UPDATE = {
  date: '2026-08-26T00:00:00-07:00',
};

export const REVISIT_SPIRIT_SCHEDULES = [
  {
    items: [
      { catKey: 'mask', id: 'mask_018' },
      { catKey: 'cape', id: 'cape_031' },
      { catKey: 'small_placeable', id: 'small_placeable_001' },
    ],
    anchorStart: '2026-09-10T16:00:00+09:00',
    anchorEnd: '2026-09-14T15:59:59+09:00',
    intervalDays: 14,
  },
  {
    items: [
      { catKey: 'outfit', id: 'outfit_024' },
      { catKey: 'outfit', id: 'outfit_025' },
      { catKey: 'outfit', id: 'outfit_091' },
      { catKey: 'hairstyle', id: 'hairstyle_119' },
      { catKey: 'hairstyle', id: 'hairstyle_120' },
      { catKey: 'hairstyle', id: 'hairstyle_121' },
      { catKey: 'hair_accessory', id: 'hair_accessory_015' },
      { catKey: 'mask', id: 'mask_075' },
      { catKey: 'mask', id: 'mask_076' },
      { catKey: 'small_placeable', id: 'small_placeable_022' },
      { catKey: 'cape', id: 'cape_092' },
      { catKey: 'cape', id: 'cape_093' },
      { catKey: 'cape', id: 'cape_094' },
    ],
    start: '2026-08-28T16:00:00+09:00',
    end: '2026-09-11T15:59:59+09:00',
  },
  {
    items: [
      { catKey: 'mask', id: 'mask_077' },
      { catKey: 'mask', id: 'mask_078' },
      { catKey: 'head_accessory', id: 'head_accessory_008' },
      { catKey: 'cape', id: 'cape_095' },
    ],
    start: '2026-09-19T16:00:00+09:00',
    end: '2026-10-10T15:59:59+09:00',
  },
];

export function getCurrentEventNames() {
  const now = new Date();
  const names = [];
  if (CURRENT_SEASON.endDate && now < new Date(CURRENT_SEASON.endDate)) {
    names.push(CURRENT_SEASON.name);
  }
  EVENT_SCHEDULE.forEach(ev => {
    const end = new Date(ev.end);
    const start = ev.start ? new Date(ev.start) : null;
    if (now <= end && (!start || now >= start)) names.push(ev.name);
  });
  return names;
}

export function isRevisitScheduleActive(schedule) {
  const now = new Date();
  if (schedule.intervalDays) {
    const start0 = new Date(schedule.anchorStart);
    const end0 = new Date(schedule.anchorEnd);
    const intervalMs = schedule.intervalDays * 86400000;
    const k = Math.floor((now - start0) / intervalMs);
    const start = new Date(start0.getTime() + k * intervalMs);
    const end = new Date(start.getTime() + (end0 - start0));
    return start <= now && now <= end;
  }
  return new Date(schedule.start) <= now && now <= new Date(schedule.end);
}

export function isRevisitSpiritCurrentlyActive() {
  return REVISIT_SPIRIT_SCHEDULES.some(isRevisitScheduleActive);
}
