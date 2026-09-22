/* ================================================================
   起動処理：テーマ初期化・アイコンスプライト注入・chromeマウント・
   router.start()。
   ================================================================ */
import { applyThemeToDOM, resolveSkyTheme, getSkyThemeMode, pfDisplayName, ensureProfilesInit, getActiveProfileId } from './state.js';
import { injectIconSprite } from './icon-sprite.js';
import { initRouter, startRouter } from './router.js';
import * as siteDock from './chrome/site-dock.js';

applyThemeToDOM(resolveSkyTheme(getSkyThemeMode() === 'system' ? null : getSkyThemeMode()));
injectIconSprite();

const dockMount = document.getElementById('dock-root');
siteDock.render(dockMount);
const activeProfile = ensureProfilesInit().find(p => p.id === getActiveProfileId());
siteDock.refreshProfileLabel(pfDisplayName(activeProfile));

initRouter(document.getElementById('app-root'), {
  onRouteChange(toolKey) { siteDock.setActiveRoute(toolKey); },
});
startRouter();
