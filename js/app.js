/* ================================================================
   起動処理：テーマ初期化・アイコンスプライト注入・chromeマウント・
   router.start()。
   ================================================================ */
import { applyThemeToDOM, resolveSkyTheme, getSkyThemeMode, pfDisplayName, ensureProfilesInit, getActiveProfileId } from './state.js';
import { injectIconSprite } from './icon-sprite.js';
import { initRouter, startRouter } from './router.js';
import { initShortcuts } from './shortcuts.js';
import * as siteDock from './chrome/site-dock.js';

// 🩹 applyThemeToDOM(isDark)は真偽値を受け取る（'light'/'dark'の文字列をそのまま
// 渡すと、'light'も空でない文字列なので常にtruthy判定され、常にダークになって
// しまうバグがあった。resolveSkyTheme()の返り値は必ず==='dark'で真偽値化すること
// ——state.jsのtoggleTheme()と同じ規約）
applyThemeToDOM(resolveSkyTheme(getSkyThemeMode() === 'system' ? null : getSkyThemeMode()) === 'dark');
injectIconSprite();
initShortcuts();

const dockMount = document.getElementById('dock-root');
siteDock.render(dockMount);
const activeProfile = ensureProfilesInit().find(p => p.id === getActiveProfileId());
siteDock.refreshProfileLabel(pfDisplayName(activeProfile));

initRouter(document.getElementById('app-root'), {
  onRouteChange(toolKey) { siteDock.setActiveRoute(toolKey); },
});
startRouter();
