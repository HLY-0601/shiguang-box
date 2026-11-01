/* ================================================================
   デイリーチェックシートの画像保存・共有。
   チェックの付いていない（配布用の）シートを画面外に組み立て、html2canvas（CDN。wings-share.js と同じ版）で
   PNGにする。画像の下端にはサイトのURLを小さく入れる。
   スマホは共有シート（navigator.share）で、そうでなければプレビューを出して「画像を保存」とXへの投稿を選べる。
   PDFで保存（savePrintPdf）は、印刷と同じ紙面をjsPDFでA4のPDFにする（ファイル末尾）。
   ================================================================ */
import { CURRENT_LANG, escapeHtml } from '../../js/i18n.js';
import { HUB_BASE_URL } from '../../js/site-config.js';

const t = (ja, en) => (CURRENT_LANG === 'en' ? en : ja);
const H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const SITE_LABEL = HUB_BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

let h2cLoading = null;
function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve();
  if (h2cLoading) return h2cLoading;
  h2cLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = H2C_URL;
    s.onload = () => resolve();
    s.onerror = () => { h2cLoading = null; reject(new Error('html2canvas load failed')); };
    document.head.appendChild(s);
  });
  return h2cLoading;
}

function isMobileDevice() {
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') return navigator.userAgentData.mobile;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPod|iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}
function safeFilename(str) { return String(str).replace(/[\\/:*?"<>|]/g, '_').trim() || 'daily-check'; }

/**
 * root: .daily-check-view（シートのスタイルが効く場所）。paperHtml: 配布用（空欄）のシートのHTML。
 * title: シート名（ファイル名と投稿文に使う）。onToast: (msg) => void（null でお知らせを消す）
 */
export async function shareSheetImage(root, paperHtml, title, onToast) {
  onToast(t('画像を作っています…', 'Creating the image…'));
  const stage = document.createElement('div');
  stage.className = 'dc-share-stage';
  stage.innerHTML = `<div class="dc-share-card">${paperHtml}<div class="dc-share-url">${escapeHtml(t('Sky 星を紡ぐ子どもたち 非公式ファンサイト', 'Unofficial Sky: CotL fan site'))}　${escapeHtml(SITE_LABEL)}</div></div>`;
  root.appendChild(stage);
  try {
    await ensureHtml2Canvas();
    const card = stage.querySelector('.dc-share-card');
    const canvas = await window.html2canvas(card, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
    const filename = `${safeFilename(title)}.png`;
    const text = t(`チェックシート「${title}」を作りました\n${HUB_BASE_URL}`, `My checklist "${title}"\n${HUB_BASE_URL}`);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (blob && isMobileDevice() && navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        onToast(null);
        try { await navigator.share({ files: [file], text }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
      }
    }
    onToast(null); // 「作っています…」を消してからプレビューを出す
    showPreview(canvas.toDataURL('image/png'), filename, text);
  } catch (err) {
    console.error('[daily-check-share] failed to create image', err);
    onToast(t('画像を作れませんでした。通信状況を確かめて、もう一度お試しください', 'Could not create the image. Check your connection and try again'));
  } finally {
    stage.remove();
  }
}

// 画像のプレビュー（ページ内。確認ダイアログと同じ作り）。保存とXへの投稿を選べる
function showPreview(dataUrl, filename, text) {
  document.querySelector('.dc-share-overlay')?.remove();
  const el = document.createElement('div');
  el.className = 'dc-confirm-overlay dc-share-overlay';
  el.innerHTML = `
    <div class="dc-confirm-card dc-share-modal" role="dialog" aria-modal="true" aria-labelledby="dcShareTitle">
      <h2 class="dc-confirm-title" id="dcShareTitle">${escapeHtml(t('画像で保存・共有', 'Save & share as an image'))}</h2>
      <p class="dc-confirm-msg">${escapeHtml(t('「画像を保存」で端末に保存できます。Xに投稿する時は、保存した画像を添付してください。', 'Use "Save image" to download it. To post on X, attach the saved image.'))}</p>
      <img class="dc-share-img" src="${dataUrl}" alt="${escapeHtml(t('共有用のチェックシートの画像', 'Checklist image for sharing'))}">
      <div class="dc-confirm-actions dc-share-actions">
        <a class="dc-confirm-btn ok" href="${dataUrl}" download="${escapeHtml(filename)}">${escapeHtml(t('画像を保存', 'Save image'))}</a>
        <a class="dc-confirm-btn dc-share-x" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('Xに投稿', 'Post on X'))}</a>
      </div>
      <button type="button" class="dc-confirm-btn dc-share-close" data-share-close>${escapeHtml(t('閉じる', 'Close'))}</button>
    </div>`;
  const close = () => {
    document.removeEventListener('keydown', onKey);
    el.classList.add('closing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  };
  const onKey = (ev) => { if (ev.key === 'Escape') close(); };
  el.addEventListener('click', (ev) => { if (ev.target === el || ev.target.closest('[data-share-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  el.querySelector('[data-share-close]').focus();
}

/* ================================================================
   PDFで保存。印刷と同じ紙面（preparePrintArea() が組み立てた .dc-print-sheet）を画像にし、
   jsPDF（CDN）でA4（縦・横）の余白の内側にぴったり貼る。ブラウザの印刷画面を経由しないので、
   スマホでもそのままPDFファイルになる
   ================================================================ */
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
let jspdfLoading = null;
function ensureJsPdf() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
  if (jspdfLoading) return jspdfLoading;
  jspdfLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSPDF_URL;
    s.onload = () => resolve();
    s.onerror = () => { jspdfLoading = null; reject(new Error('jsPDF load failed')); };
    document.head.appendChild(s);
  });
  return jspdfLoading;
}

/** area: .dc-print-area（中身は組み立て済み）。landscape: 横向き。marginMm: 印刷と同じ余白 */
export async function savePrintPdf(area, { landscape, marginMm, filename, onToast }) {
  onToast(t('PDFを作っています…', 'Creating the PDF…'));
  const html = document.documentElement;
  html.classList.add('dc-capturing'); // 画面外に、見える状態で出す（画像化のため）
  try {
    await Promise.all([ensureHtml2Canvas(), ensureJsPdf()]);
    const sheetEl = area.querySelector('.dc-print-sheet');
    // 約300dpi相当で画像にする（96dpi×3）
    const canvas = await window.html2canvas(sheetEl, { backgroundColor: '#ffffff', scale: 3, useCORS: true });
    const pageW = landscape ? 297 : 210;
    const pageH = landscape ? 210 : 297;
    const pdf = new window.jspdf.jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    // 紙面の大きさ（mm）は .dc-print-sheet の幅・高さそのもの
    const wMm = (sheetEl.offsetWidth / 96) * 25.4;
    const hMm = (sheetEl.offsetHeight / 96) * 25.4;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginMm, marginMm, Math.min(wMm, pageW - marginMm * 2), Math.min(hMm, pageH - marginMm * 2), undefined, 'FAST');
    // jsPDFのsave()はファイル名が付かない環境があるので、自分でリンクを作って保存する
    const url = URL.createObjectURL(pdf.output('blob'));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(filename)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    onToast(t('PDFを保存しました', 'Saved the PDF'));
  } catch (err) {
    console.error('[daily-check-share] failed to create PDF', err);
    onToast(t('PDFを作れませんでした。通信状況を確かめて、もう一度お試しください', 'Could not create the PDF. Check your connection and try again'));
  } finally {
    html.classList.remove('dc-capturing');
  }
}
