/* ================================================================
   「近日対応予定」プレースホルダービュー。emote/share/tai-nomacan/
   star-candleの4ツール共通で使う（今回はナビ項目のみ用意し、実機能は
   移植しない——tai-hubプランのスコープ外事項）。
   ================================================================ */
import { CURRENT_LANG } from '../../js/i18n.js';

export function mount(container, { nameJa, nameEn, icon }) {
  const name = CURRENT_LANG === 'en' ? nameEn : nameJa;
  container.innerHTML = `
    <div class="placeholder-view">
      <div class="placeholder-icon"><svg width="48" height="48"><use href="#${icon}"/></svg></div>
      <h2 class="placeholder-title">${name}</h2>
      <p class="placeholder-msg">${CURRENT_LANG === 'en'
        ? 'This tool has not been ported into tai-hub yet. It is still fully available as its own separate site.'
        : 'このツールはまだtai-hubに移植されていません。引き続き独立したサイトとしてご利用いただけます。'}</p>
    </div>`;
}

export function unmount() {}
