/* ================================================================
   height-data.js — 身高计算逻辑
   融合自: KoRifCan/sky-cotl-height-tool
   公式: currentHeight = 7.6 - 8.3*scale - 3*height
   ================================================================ */

export function calculateStats(height, scale) {
  const currentHeight = 7.6 - (8.3 * scale) - (3 * height);
  if (currentHeight < -1 || currentHeight > 15) return { error: 'out_of_bounds' };
  const shortest = 7.6 - (8.3 * scale) - (3 * -2.0);
  const tallest = 7.6 - (8.3 * scale) - (3 * 2.0);
  return { current: currentHeight, tallest, shortest, scale, height };
}

export function decodeAndCalculate(rawData) {
  try {
    let b64Str = rawData.trim();

    // 找到数据起点
    const startMarker = 'ImJvZHki';
    const startIndex = b64Str.indexOf(startMarker);
    if (startIndex !== -1) {
      b64Str = b64Str.substring(startIndex);
    } else {
      const oIndex = b64Str.indexOf('o=');
      if (oIndex !== -1) b64Str = b64Str.substring(oIndex + 2);
    }

    b64Str = b64Str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = b64Str.length % 4;
    if (padding) b64Str += '='.repeat(4 - padding);

    const decoded = atob(b64Str);

    let height, scale;

    // 找 height
    const hMatch = decoded.match(/eigh/i);
    if (!hMatch) return { error: 'no_height' };
    const hNum = decoded.substring(hMatch.index).match(/-?\d*\.?\d+/);
    if (!hNum) return { error: 'no_height' };
    height = parseFloat(hNum[0]);

    // 找 scale
    const sMatch = decoded.match(/scale/i);
    if (!sMatch) return { error: 'no_scale' };
    const sSub = decoded.substring(sMatch.index + sMatch[0].length);
    const sNums = sSub.match(/-?\d+\.?\d*(?:[eE][-+]?\d+)?/gi) || [];
    for (const s of sNums) {
      const val = parseFloat(s);
      if (s.includes('.') || s.toLowerCase().includes('e')) { scale = val; break; }
      if (Math.abs(val) >= 1000) { scale = val / 1e9; break; }
    }
    if (scale === undefined) return { error: 'no_scale' };

    return calculateStats(height, scale);
  } catch (e) {
    return { error: 'decode_failed' };
  }
}

export function heightLabel(h) {
  if (h <= -0.5) return '超矮 (0 号)';
  if (h <= 0.5) return '矮 (1 号)';
  if (h <= 1.5) return '偏矮 (2 号)';
  if (h <= 2.5) return '中矮 (3 号)';
  if (h <= 3.5) return '中等 (4 号)';
  if (h <= 4.5) return '中高 (5 号)';
  if (h <= 5.5) return '偏高 (6 号)';
  if (h <= 6.5) return '高 (7 号)';
  if (h <= 7.5) return '很高 (8 号)';
  if (h <= 8.5) return '超高 (9 号)';
  if (h <= 9.5) return '巨人 (10 号)';
  return '最高 (11号+)';
}
