/* 进账飞入时间轴：按视觉生理窗口校准，弹窗与网页仓鼠共用。
 *
 * 眨眼：一次自发眨眼约 250–400ms，眼睑闭合相约 100–150ms。
 * 静止可见必须长于闭合相，否则眨眼会整段吃掉「+金额」。
 * 读数：短数字标签（+12.34 元）扫一眼约 200–300ms。
 * 追踪：平滑追随舒适约 5–30°/s；弹窗内 200–280px / 500ms 落在可追随区间，
 * 避免短于一次扫视抑制（约 20–70ms）的闪切。
 * 视听绑定：声音与落地应落在约 100–200ms 窗口内，故翻动+金币声在到达时触发，而不是起飞时。
 */
(function (global) {
  'use strict';

  const DURATION = 1080;
  const ROLL_AT = 800;
  const SETTLE = 1450;
  const PET_DURATION = 1680;
  const PET_ROLL_AT = 780;

  function at(x, y, scale) {
    return 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  }

  function keyframes(sx, sy, mx, my, ex, ey) {
    return [
      { transform: at(sx, sy, 0.74), opacity: 0, offset: 0, easing: 'ease-out' },
      { transform: at(sx, sy, 1), opacity: 1, offset: 0.09, easing: 'linear' },
      { transform: at(sx, sy, 1), opacity: 1, offset: 0.3, easing: 'cubic-bezier(.42,.02,.18,1)' },
      { transform: at(mx, my, 1.06), opacity: 1, offset: 0.54, easing: 'cubic-bezier(.2,.72,.18,1)' },
      { transform: at(ex, ey, 0.94), opacity: 1, offset: 0.76, easing: 'ease-in' },
      { transform: at(ex, ey, 0.42), opacity: 0, offset: 1 }
    ];
  }

  function petKeyframes(sx, sy, ex, ey) {
    const mx = sx * 0.28 + ex * 0.72;
    const my = sy * 0.28 + ey * 0.72;
    return [
      { transform: at(sx, sy, 0.9), opacity: 0, offset: 0, easing: 'ease-out' },
      { transform: at(sx, sy, 1), opacity: 1, offset: 0.08, easing: 'linear' },
      { transform: at(sx, sy, 1), opacity: 1, offset: 0.3, easing: 'cubic-bezier(.45,.05,.2,1)' },
      { transform: at(mx, my, 0.78), opacity: 0.95, offset: 0.48, easing: 'ease-in' },
      { transform: at(ex, ey, 0.42), opacity: 0.55, offset: 0.68, easing: 'linear' },
      { transform: at(ex, ey, 0.18), opacity: 0, offset: 1 }
    ];
  }

  function play(el, frames, duration) {
    if (!el || !el.animate || !frames) return null;
    return el.animate(frames, { duration: duration || DURATION, easing: 'linear', fill: 'forwards' });
  }

  global.QJPayoutMotion = { DURATION, ROLL_AT, SETTLE, PET_DURATION, PET_ROLL_AT, keyframes, petKeyframes, play };
})(typeof globalThis !== 'undefined' ? globalThis : this);
