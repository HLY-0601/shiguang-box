/* ================================================================
   motion.js — Apple「Designing Fluid Interfaces」(WWDC 2018) 準拠の
   最小スプリング物理ユーティリティ。参照: tai-hub/CLAUDE.md
   「UIの設計方針: Apple Design (Fluid Interfaces)」セクション。

   tai-hubはビルドツールなしのネイティブES Modulesのため、Motion/Framer
   Motion等のnpm依存は追加せず、この1ファイルで完結する自前実装にしている。
   既存のどのファイルからもまだimportされていない、新規UIを作る際に
   使うための土台（=このファイル単体では見た目に何の変化も起きない）。

   ダンピング比(damping)とレスポンス秒数(response)からバネの物理定数
   (剛性stiffness・減衰係数dampingCoef)を導出する式は、Apple/Framer Motion
   が採用しているものと同じ標準的な変換（臨界減衰時にちょうどresponse秒で
   収束するように設計されている）。
   ================================================================ */

// 減衰比1.0=オーバーシュートなしで滑らかに収束（メニュー・フェード等の既定値）。
// 0.8前後=わずかに弾む（フリック・ドラッグ解放などモメンタムがある操作の既定値）。
const DEFAULT_DAMPING = 1.0;
const DEFAULT_RESPONSE = 0.4;

/**
 * バネアニメーションを1本走らせる。中断可能性(interruptibility)が核心：
 * redirect()を呼べば「その瞬間の現在値・現在速度」から新しい目標値へ
 * 継ぎ目なく繋がる（アニメーションを止めて最初からやり直す、をしない）。
 *
 * @param {() => number} getValue 開始時の現在値（＝表示中の値）を読む関数
 * @param {(v: number) => void} setValue 毎フレーム呼ばれる更新関数
 * @param {number} target 目標値
 * @param {{damping?: number, response?: number, velocity?: number, mass?: number, onComplete?: () => void}} opts
 */
export function animateSpring(getValue, setValue, target, opts = {}) {
  const { damping = DEFAULT_DAMPING, response = DEFAULT_RESPONSE, velocity: initialVelocity = 0, mass = 1, onComplete } = opts;
  const omega0 = (2 * Math.PI) / response;
  const stiffness = mass * omega0 * omega0;
  const dampingCoef = 2 * damping * mass * omega0;

  let current = getValue();
  let velocity = initialVelocity;
  let rafId = null;
  let lastTime = null;
  let done = false;

  function tick(now) {
    if (lastTime === null) lastTime = now;
    // タブが背面に回っていた場合等の大きなdtジャンプで暴れないようクランプ
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;

    const force = -stiffness * (current - target) - dampingCoef * velocity;
    velocity += (force / mass) * dt;
    current += velocity * dt;
    setValue(current);

    if (Math.abs(target - current) < 0.01 && Math.abs(velocity) < 0.01) {
      current = target;
      setValue(target);
      done = true;
      if (onComplete) onComplete();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return {
    // 実行中に目標値・初速を差し替える（＝ジェスチャーの再中断・方向転換用）。
    // current/velocityは引き継がれるため「ブチッと切れる」段差が出ない。
    redirect(newTarget, newVelocity) {
      target = newTarget;
      if (typeof newVelocity === 'number') velocity = newVelocity;
      if (done) { done = false; lastTime = null; rafId = requestAnimationFrame(tick); }
    },
    stop() { if (rafId !== null) cancelAnimationFrame(rafId); rafId = null; },
    get current() { return current; },
    get velocity() { return velocity; },
  };
}

/**
 * ドラッグが境界を越えた分だけ効きが弱まる「ラバーバンド」抵抗。
 * 境界のハードクランプ(Math.max/min)の代わりに使う。
 * @param {number} overshoot 境界を越えた量（符号付き、px）
 * @param {number} dimension 抵抗の基準になる長さ（要素の幅/高さ等、px）
 * @param {number} constant 大きいほど強く抵抗する（Appleのデフォルトは0.55）
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * フリック（指を離した瞬間の速度）から、慣性で落ち着く先の位置を予測する。
 * Appleの実装は物理教科書のv²/(2·decel)ではなく指数減衰モデル。
 * @param {number} initialVelocity 解放時点の速度（px/秒）
 * @param {number} decelerationRate 0.998=通常のスクロール感、0.99=キビキビ
 */
export function project(initialVelocity, decelerationRate = 0.998) {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * pointermoveの履歴から離脱速度(px/秒)を推定する。「最後の2点」ではなく
 * 直近の短い履歴(既定80ms)から算出し、最後の1フレームのノイズに引っ張られ
 * にくくする。呼び出し側はpointermoveのたびに{t: performance.now(), v: 値}
 * を配列にpushし続け、pointerup時にこの関数へ渡す。
 * @param {{t: number, v: number}[]} history 時系列順の{time, value}履歴
 * @param {number} windowMs 直近何msぶんを速度推定に使うか
 */
export function velocityFromHistory(history, windowMs = 80) {
  if (history.length < 2) return 0;
  const last = history[history.length - 1];
  const cutoff = last.t - windowMs;
  let base = history[0];
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].t <= cutoff) { base = history[i]; break; }
    base = history[i];
  }
  const dt = (last.t - base.t) / 1000;
  if (dt <= 0) return 0;
  return (last.v - base.v) / dt;
}
