/* ================================================================
   プロフィール切替モーダル（CRUD）。item/profiles.js の
   pfOpenModal/pfRenderModal系を移植したもの。

   スコープ簡略化：元実装が持つ「プロフィールごとの称号一覧の展開表示」
   （かなり大きなUIブロック）は今回のプロトタイプでは実装せず、代わりに
   このツール自身の実績数だけを軽量に表示する（保存レイヤー自体は
   state.jsのloadTitleStore/CROSS_TOOL_TITLE_CATALOGとして完全に維持
   済みなので、後日フルの実績パネルを足すのは容易）。
   ================================================================ */
import { CURRENT_LANG } from '../i18n.js';
import {
  ensureProfilesInit, getActiveProfileId, pfDisplayName,
  createProfile, renameProfile, deleteProfile, switchProfile,
  loadTitleStore, DEFAULT_PROFILE_ID,
} from '../state.js';
import { refreshProfileLabel } from './site-dock.js';

let editingId = null;

function t(ja, en) { return CURRENT_LANG === 'en' ? en : ja; }

export function open() {
  document.getElementById('pfModalOverlay')?.remove();
  editingId = null;
  const overlay = document.createElement('div');
  overlay.className = 'pf-modal-overlay';
  overlay.id = 'pfModalOverlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.innerHTML = `
    <div class="pf-modal-card">
      <button type="button" class="modal-close-btn" id="pfModalCloseBtn"><svg class="inline-icon" width="16" height="16"><use href="#i-close"/></svg></button>
      <div class="modal-title">${t('プロフィール切替', 'Switch Profile')}</div>
      <div id="pfModalList"></div>
      <div class="pf-add-row">
        <input type="text" id="pfNewNameInput" maxlength="30" placeholder="${t('新しいプロフィール名', 'New profile name')}">
        <button type="button" class="pf-icon-btn pf-row-btn-ok" id="pfAddBtn">${t('追加', 'Add')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('pfModalCloseBtn').addEventListener('click', close);
  document.getElementById('pfAddBtn').addEventListener('click', () => {
    const input = document.getElementById('pfNewNameInput');
    if (input.value.trim()) createProfile(input.value);
  });
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    renderList();
  });
}

export function close() {
  document.getElementById('pfModalOverlay')?.classList.remove('open');
}

function renderList() {
  const area = document.getElementById('pfModalList');
  if (!area) return;
  const list = ensureProfilesInit();
  const activeId = getActiveProfileId();
  area.innerHTML = list.map(p => {
    const isActive = p.id === activeId;
    if (editingId === p.id) {
      return `
        <div class="pf-row">
          <input type="text" class="pf-row-input" id="pfEditInput" value="${escapeAttr(pfDisplayName(p))}" maxlength="30">
          <button type="button" class="pf-icon-btn pf-row-btn-ok" data-act="save-rename" data-id="${p.id}">${t('保存', 'Save')}</button>
          <button type="button" class="pf-icon-btn" data-act="cancel">${t('取消', 'Cancel')}</button>
        </div>`;
    }
    const titleCount = Object.keys(loadTitleStoreFor(p.id).earned || {}).length;
    return `
      <div class="pf-row">
        <span class="pf-row-name${isActive ? ' is-active' : ''}" data-act="switch" data-id="${p.id}">
          ${isActive ? '<svg class="inline-icon" width="13" height="13"><use href="#i-check"/></svg> ' : ''}${escapeAttr(pfDisplayName(p))}
          <span style="color:var(--hub-text-2);font-weight:400;font-size:12px;"> (${t('実績', 'titles')}: ${titleCount})</span>
        </span>
        <button type="button" class="pf-icon-btn" data-act="rename" data-id="${p.id}" title="${t('名前変更', 'Rename')}"><svg class="inline-icon" width="14" height="14"><use href="#i-edit"/></svg></button>
        ${list.length > 1 ? `<button type="button" class="pf-icon-btn pf-row-btn-danger" data-act="delete" data-id="${p.id}" title="${t('削除', 'Delete')}"><svg class="inline-icon" width="14" height="14"><use href="#i-trash"/></svg></button>` : ''}
      </div>`;
  }).join('');

  area.querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const act = el.dataset.act;
      if (act === 'switch') { switchProfile(id); }
      else if (act === 'rename') { editingId = id; renderList(); }
      else if (act === 'cancel') { editingId = null; renderList(); }
      else if (act === 'save-rename') {
        const val = document.getElementById('pfEditInput').value;
        renameProfile(id, val);
        editingId = null;
        renderList();
        refreshProfileLabel(pfDisplayName(ensureProfilesInit().find(p => p.id === getActiveProfileId())));
      } else if (act === 'delete') {
        if (confirm(t('このプロフィールを削除しますか？', 'Delete this profile?'))) { deleteProfile(id); renderList(); }
      }
    });
  });
}

function loadTitleStoreFor(profileId) {
  // loadTitleStore()は「現在アクティブなプロフィール」しか読めないため、
  // 一覧表示用にprofileId指定版を簡易実装する
  try {
    const key = profileId === DEFAULT_PROFILE_ID ? 'itemTitles_v1' : `itemTitles_v1__p_${profileId}`;
    const d = JSON.parse(localStorage.getItem(key));
    return { earned: (d && d.earned) || {} };
  } catch { return { earned: {} }; }
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
