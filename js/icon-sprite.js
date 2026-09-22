/* ================================================================
   共有インラインSVGアイコンスプライト。姉妹サイト（emote/share/
   tai-nomacan/star-candle等）で使われている #pf-icon-sprite と
   同一のsymbol定義を移植（サブセット：ハブとitem機能で実際に
   使うものだけ）。<use href="#i-xxx"/> で参照する。
   ================================================================ */

const SPRITE_HTML = `
<svg id="pf-icon-sprite" style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true"><defs>
<symbol id="i-folder" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l1.6 2H18.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/></g></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.458) translate(-12 -12)"><path d="M6 6l12 12M18 6L6 18"/></g></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"/><path d="M21 21l-4.8-4.8"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><path d="M4.5 5.5h15a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/><path d="M8 3.5v4M16 3.5v4M3.5 10h17"/></symbol>
<symbol id="i-warning" viewBox="0 0 24 24"><path d="M12 4L3 20h18L12 4Z"/><path d="M12 10v4M12 17h.01"/></symbol>
<symbol id="i-edit" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.149) translate(-11.615 -12.385)"><path d="M4 20l1-4.2L15.6 5.2a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20Z"/><path d="M13.8 6.8l3.4 3.4"/></g></symbol>
<symbol id="i-candle" viewBox="0 0 24 24"><path d="M9.5 21h5a1 1 0 0 0 1-1v-7.5a3 3 0 0 0-3-3h-1a3 3 0 0 0-3 3V20a1 1 0 0 0 1 1Z"/><path d="M12 9.5V5M10.3 5.2C10.3 3.7 12 3.5 12 2c0 1.5 1.7 1.7 1.7 3.2 0 .9-.75 1.3-1.7 1.3s-1.7-.4-1.7-1.3Z"/></symbol>
<symbol id="i-star-candle" viewBox="0 0 24 24"><path d="M9.5 21h5a1 1 0 0 0 1-1v-7.5a3 3 0 0 0-3-3h-1a3 3 0 0 0-3 3V20a1 1 0 0 0 1 1Z"/><path d="M12 9.5V5M10.3 5.2C10.3 3.7 12 3.5 12 2c0 1.5 1.7 1.7 1.7 3.2 0 .9-.75 1.3-1.7 1.3s-1.7-.4-1.7-1.3Z"/><path fill="currentColor" stroke="none" d="M18 4.7L18.7 6.3L20.3 7L18.7 7.7L18 9.3L17.3 7.7L15.7 7L17.3 6.3Z"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.129) translate(-12.25 -12)"><path d="M4.5 12.5l5 5L20 6.5"/></g></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.5l2.5 5.6 6.1.6-4.6 4.1 1.3 6-5.3-3.2-5.3 3.2 1.3-6-4.6-4.1 6.1-.6Z"/></symbol>
<symbol id="i-masks" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/><path d="M9 10v.01M15 10v.01"/><path d="M8.5 14.5q3.5 3 7 0"/></g></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11Z"/><path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></symbol>
<symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.5 6L20 12l-6.5 1.5L12 21l-1.5-6L4 12l6.5-1.5Z"/></symbol>
<symbol id="i-wing" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.281) translate(-10.5 -12.83)"><path d="M4 19c2-6 6-11 13-13-1 6-2 9-6 12-3 2-5 2-7 1Z"/><path d="M7 17c3-2 6-5 8-9"/></g></symbol>
<symbol id="i-music-note" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.207) translate(-13.75 -10.75)"><path d="M9 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M11.5 15.5V5l7-1.5v9"/><path d="M18.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></g></symbol>
<symbol id="i-card" viewBox="0 0 24 24"><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="9" cy="10.5" r="2"/><path d="M6 16c.4-1.7 1.7-2.8 3-2.8s2.6 1.1 3 2.8M14 9.5h4M14 12.5h3"/></symbol>
<symbol id="i-sync" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M17 7h-8a4 4 0 0 0-4 4"/><path d="M11 4l-2 3 2 3"/><path d="M7 17h8a4 4 0 0 0 4-4"/><path d="M13 20l2-3-2-3"/></g></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></symbol>
<symbol id="i-person" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></g></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M4 7h16M4 12h16M4 17h16"/></g></symbol>
<symbol id="i-sheet-music" viewBox="0 0 24 24"><path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 10h8M8 13h8M8 16h5"/></symbol>
<symbol id="i-hanger" viewBox="0 0 24 24"><path d="M12 4.2a1.8 1.8 0 1 0-1.8 1.8"/><path d="M12 6v1.6"/><path d="M3.5 17.5 12 11l8.5 6.5"/><path d="M3.5 17.5h17"/></symbol>
<symbol id="i-monitor" viewBox="0 0 24 24"><path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/><path d="M9 20.5h6M12 17v3.5"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><path d="M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.049) translate(-11.66 -12.34)"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></g></symbol>
<symbol id="i-crown" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M4 10l4 3 4-6 4 6 4-3v7H4Z"/></g></symbol>
<symbol id="i-map" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.074) translate(-12 -12.15)"><path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2Z"/><path d="M10 4.3v14M14 6.3v14"/></g></symbol>
<symbol id="i-compass" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M14.5 9.5l-1.8 4.2-4.2 1.8 1.8-4.2Z"/></g></symbol>
<symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 21c4 0 6-3 6-6.5 0-2-1-3.5-2-5 0 2-1.5 3-2.5 2C14 9 13 6 10 4c1 3-1 5-2.5 7-1 1.3-1.5 2.5-1.5 3.5C6 18 8 21 12 21Z"/></symbol>
<symbol id="i-palette" viewBox="0 0 24 24"><path d="M12 4a8 8 0 0 0 0 16c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.9 1.8-1.9H16a4 4 0 0 0 4-4c0-3.9-3.6-7-8-7Z"/><path d="M9 9v.01M13 7.5v.01M16.5 10v.01M9.5 13.5v.01"/></symbol>
<symbol id="i-dice" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.25) translate(-12 -12)"><path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5Z"/><path d="M8.5 8.5v.01M15.5 8.5v.01M12 12v.01M8.5 15.5v.01M15.5 15.5v.01"/></g></symbol>
<symbol id="i-image" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.167) translate(-12 -12)"><path d="M4.5 4.5h15v15h-15Z"/><path d="M4.5 15.5l4.2-4.5a1 1 0 0 1 1.5 0l2.3 2.5 2.5-3a1 1 0 0 1 1.5 0l3 4.5"/><path d="M9 9.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"/></g></symbol>
<symbol id="i-gem" viewBox="0 0 24 24"><path d="M6.5 9L12 3l5.5 6L12 20Z"/><path d="M6.5 9h11"/></symbol>
<symbol id="i-building" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12.75)"><path d="M4 20.5h16"/><path d="M5.5 20.5V10L12 5l6.5 5v10.5"/><path d="M8 20.5v-6M12 20.5v-6M16 20.5v-6"/></g></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.097) translate(-12 -12.475)"><path d="M5 7h14"/><path d="M9 7V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7"/><path d="M7 7l1 12.5a1 1 0 0 0 1 .95h6a1 1 0 0 0 1-.95L17 7"/><path d="M10 11v5M14 11v5"/></g></symbol>
<symbol id="i-upload" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></g></symbol>
<symbol id="i-cart" viewBox="0 0 24 24"><path d="M3 4h2l2.5 11h10L20 8H6"/><path d="M9 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20.5c-5-3.5-9-7-9-11.2C3 6 5 4 7.7 4c1.7 0 3.3.9 4.3 2.4C13 4.9 14.6 4 16.3 4 19 4 21 6 21 9.3c0 4.2-4 7.7-9 11.2Z"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><g transform="translate(12 12) scale(1.094) translate(-12 -12)"><path d="M9.5 9.5A1.5 1.5 0 0 1 11 8h6.5A1.5 1.5 0 0 1 19 9.5V16a1.5 1.5 0 0 1-1.5 1.5H11A1.5 1.5 0 0 1 9.5 16Z"/><path d="M6.5 14.5H6A1.5 1.5 0 0 1 4.5 13V6.5A1.5 1.5 0 0 1 6 5h6.5A1.5 1.5 0 0 1 14 6.5v.5"/></g></symbol>
</defs></svg>`;

let injected = false;
export function injectIconSprite() {
  if (injected) return;
  document.body.insertAdjacentHTML('afterbegin', SPRITE_HTML);
  injected = true;
}
