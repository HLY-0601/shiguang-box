/* ================================================================
   account-store.js — 账号数据统一入口（本地 / 远程自动切换）

   未配置后端地址时使用浏览器本地账号（account-state.js）；
   配置了后端地址后使用远程 API（account-api.js）。
   对 account-view 暴露的函数与本地实现保持一致。
   ================================================================ */
import * as local from './account-state.js';
import * as remote from './account-api.js';

export function getBaseUrl() {
  return remote.getBaseUrl();
}
export function setBaseUrl(url) {
  remote.setBaseUrl(url);
}
export function isRemote() {
  return remote.isRemote();
}

function pick() {
  return remote.isRemote() ? remote : local;
}

export function register(username, password) {
  return pick().register(username, password);
}
export function login(username, password) {
  return pick().login(username, password);
}
export function logout() {
  return pick().logout();
}
export function currentUser() {
  return pick().currentUser();
}
export function updateProfile(patch) {
  return pick().updateProfile(patch);
}

// 挂载时刷新：远程模式校验并拉取，本地模式直接返回当前用户
export function refreshSession() {
  return remote.isRemote() ? remote.refresh() : Promise.resolve(local.currentUser());
}
