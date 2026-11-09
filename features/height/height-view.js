/* ================================================================
   height-view.js — 身高查询工具
   ================================================================ */
import { decodeAndCalculate, heightLabel } from './height-data.js';

let container = null;

export function mount(cont) {
  container = cont;
  render();
}
export function unmount() { container = null; }

function render() {
  if (!container) return;
  container.innerHTML = `
    <style>
      .ht-wrap { max-width: 560px; margin: 0 auto; padding: 20px; }
      .ht-title { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
      .ht-sub { font-size: 13px; opacity: .6; margin: 0 0 20px; line-height: 1.6; }
      .ht-input {
        width: 100%; min-height: 100px; padding: 12px; border-radius: 10px;
        border: 1px solid rgba(255,255,255,.15); background: rgba(0,0,0,.2);
        color: inherit; font-size: 14px; resize: vertical; box-sizing: border-box;
      }
      .ht-btn {
        margin-top: 10px; padding: 10px 24px; border-radius: 10px; border: none;
        background: #7c9eff; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
      }
      .ht-result { margin-top: 20px; padding: 20px; border-radius: 14px; background: rgba(255,255,255,.06); display: none; }
      .ht-result.show { display: block; }
      .ht-big { font-size: 48px; font-weight: 800; text-align: center; margin: 10px 0; }
      .ht-label { text-align: center; font-size: 16px; opacity: .8; margin-bottom: 16px; }
      .ht-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-top: 1px solid rgba(255,255,255,.08); }
      .ht-error { color: #ff7c7c; margin-top: 12px; font-size: 14px; }
    </style>
    <div class="ht-wrap">
      <h1 class="ht-title">身高查询</h1>
      <p class="ht-sub">粘贴光遇穿搭分享码（设置→分享穿搭→复制），自动解析身高数值。所有计算在本地完成，不上传任何数据。</p>
      <textarea class="ht-input" id="htInput" placeholder="粘贴分享码，例如：o=eyJjb2RlIjoi..."></textarea>
      <button class="ht-btn" id="htBtn">解析身高</button>
      <div class="ht-error" id="htError" style="display:none"></div>
      <div class="ht-result" id="htResult">
        <div class="ht-big" id="htBig">--</div>
        <div class="ht-label" id="htLabel"></div>
        <div class="ht-row"><span>原始 height</span><span id="htRawH"></span></div>
        <div class="ht-row"><span>原始 scale</span><span id="htRawS"></span></div>
        <div class="ht-row"><span>当前身高</span><span id="htCur"></span></div>
        <div class="ht-row"><span>最矮 (-2.0)</span><span id="htMin"></span></div>
        <div class="ht-row"><span>最高 (+2.0)</span><span id="htMax"></span></div>
      </div>
    </div>
  `;

  document.getElementById('htBtn').addEventListener('click', () => {
    const raw = document.getElementById('htInput').value;
    const errEl = document.getElementById('htError');
    const resEl = document.getElementById('htResult');
    errEl.style.display = 'none';
    resEl.classList.remove('show');
    if (!raw.trim()) { errEl.textContent = '请先粘贴分享码'; errEl.style.display = 'block'; return; }

    const r = decodeAndCalculate(raw);
    if (r.error) {
      const msgs = { out_of_bounds: '身高超出范围，解析失败', no_height: '未找到身高数据', no_scale: '未找到体型数据', decode_failed: '解析失败，请确认分享码正确' };
      errEl.textContent = msgs[r.error] || '解析失败';
      errEl.style.display = 'block';
      return;
    }
    document.getElementById('htBig').textContent = r.current.toFixed(2);
    document.getElementById('htLabel').textContent = heightLabel(r.current);
    document.getElementById('htRawH').textContent = r.height;
    document.getElementById('htRawS').textContent = r.scale;
    document.getElementById('htCur').textContent = r.current.toFixed(2);
    document.getElementById('htMin').textContent = r.shortest.toFixed(2);
    document.getElementById('htMax').textContent = r.tallest.toFixed(2);
    resEl.classList.add('show');
  });
}
