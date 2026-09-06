/* 钱进 v0.4.3 纯计算引擎：按到账节奏结算当日工资。 */
(function (global) {
  'use strict';
  const FALLBACK = { monthlySalary: null, billingDays: 21.75, startMinute: 540, endMinute: 1080, workdays: [1, 2, 3, 4, 5], payout: { mode: 'thirty', intervalSeconds: 1800 } };
  const QUOTES = ['今天也在一点点靠近想要的生活。', '先把这一小时，稳稳装进口袋。', '慢一点没关系，仓鼠也在认真囤粮。', '带薪呼吸，也是正经收入。', '看得见的进度，会让漫长的一天短一点。', '时间有价格，也有你自己的意义。', '复利从来不轰动，它只是一直发生。', '把钱换成选择权，而不是一时冲动。', '今天的钱进一小步，未来就多一个选项。'];
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function fmtDuration(seconds) {
    let value = Math.max(0, Math.round(Number(seconds) || 0)); const days = Math.floor(value / 86400); value %= 86400;
    const hours = Math.floor(value / 3600); value %= 3600; const minutes = Math.floor(value / 60); const secs = value % 60;
    if (days) return days + '天' + hours + '小时'; if (hours) return hours + '小时' + pad2(minutes) + '分'; if (minutes) return minutes + '分' + pad2(secs) + '秒'; return secs + '秒';
  }
  function fmtTime(minutes) { return pad2(Math.floor(minutes / 60)) + ':' + pad2(minutes % 60); }
  function dateKey(date) { const d = new Date(date); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function config(input) { return Object.assign({}, FALLBACK, input || {}); }
  function payoutPlan(settings) {
    const raw = settings.payout || FALLBACK.payout; const mode = ['breath', 'thirty', 'custom'].includes(raw.mode) ? raw.mode : 'thirty';
    const intervalSeconds = mode === 'breath' ? 8 : mode === 'thirty' ? 1800 : clamp(Math.round(Number(raw.intervalSeconds) || 1800), 1, 86400);
    return { mode, intervalSeconds, label: mode === 'breath' ? '心跳到账' : mode === 'thirty' ? '30 分钟到账' : '自定义到账' };
  }
  function dayBounds(anchor, settings) {
    const start = new Date(anchor); start.setHours(Math.floor(settings.startMinute / 60), settings.startMinute % 60, 0, 0);
    const end = new Date(anchor); end.setHours(Math.floor(settings.endMinute / 60), settings.endMinute % 60, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1); return { start, end, totalSec: Math.max(60, (end - start) / 1000) };
  }
  function anchorFor(now, settings) { const anchor = new Date(now); const crosses = settings.endMinute <= settings.startMinute; const minute = now.getHours() * 60 + now.getMinutes(); if (crosses && minute < settings.endMinute) anchor.setDate(anchor.getDate() - 1); return anchor; }
  function getState(now, input) {
    now = now ? new Date(now) : new Date(); const settings = config(input); const salary = settings.monthlySalary === null || settings.monthlySalary === '' ? null : Number(settings.monthlySalary);
    const configured = Number.isFinite(salary) && salary >= 0; const anchor = anchorFor(now, settings); const bounds = dayBounds(anchor, settings);
    const isWorkday = Array.isArray(settings.workdays) && settings.workdays.map(Number).includes(anchor.getDay()); const dayTotal = configured ? salary / (Number(settings.billingDays) || 21.75) : 0; const perSecond = dayTotal / bounds.totalSec;
    let phase = 'unconfigured', elapsedSec = 0;
    if (configured) { if (!isWorkday) phase = 'off'; else if (now < bounds.start) phase = 'before'; else if (now >= bounds.end) { phase = 'after'; elapsedSec = bounds.totalSec; } else { phase = 'working'; elapsedSec = (now - bounds.start) / 1000; } }
    const payout = payoutPlan(settings); const payoutIntervalSec = payout.intervalSeconds;
    const payoutIndex = phase === 'after' ? Math.ceil(bounds.totalSec / payoutIntervalSec) : Math.floor(elapsedSec / payoutIntervalSec);
    const settledSec = Math.min(bounds.totalSec, payoutIndex * payoutIntervalSec); const earned = configured && isWorkday ? perSecond * settledSec : 0;
    const previousBoundary = Math.max(0, (payoutIndex - 1) * payoutIntervalSec); const latestPayoutAmount = payoutIndex > 0 ? perSecond * Math.min(payoutIntervalSec, bounds.totalSec - previousBoundary) : 0;
    const nextBoundary = Math.min(bounds.totalSec, (payoutIndex + 1) * payoutIntervalSec); const nextPayoutAmount = phase === 'working' ? perSecond * Math.max(0, nextBoundary - settledSec) : 0;
    return { now, anchorDate: anchor, anchorKey: dateKey(anchor), configured, isWorkday, phase, phaseText: ({ unconfigured: '等待设置', off: '今日休息', before: '尚未开工', working: '进账中', after: '今日收工' })[phase], dayTotal, perSecond, perMinute: perSecond * 60, hourlyRate: perSecond * 3600, payoutMode: payout.mode, payoutLabel: payout.label, payoutIntervalSec, payoutIndex, payoutKey: dateKey(anchor) + ':' + payout.mode + ':' + payoutIndex, latestPayoutAmount, nextPayoutAmount, untilNextPayoutSec: phase === 'working' ? Math.max(0, nextBoundary - elapsedSec) : 0, workSeconds: bounds.totalSec, elapsedSec, earned, progress: clamp(elapsedSec / bounds.totalSec, 0, 1), remainSec: Math.max(bounds.totalSec - elapsedSec, 0), startAt: bounds.start, endAt: bounds.end };
  }
  function getMonthEstimate(now, input) {
    now = now ? new Date(now) : new Date(); const settings = config(input); const current = getState(now, settings); if (!current.configured) return 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0); let total = 0;
    while (cursor < now) { if (cursor.toDateString() === now.toDateString()) break; if (settings.workdays.map(Number).includes(cursor.getDay())) total += current.dayTotal; cursor.setDate(cursor.getDate() + 1); }
    if (current.anchorDate.getMonth() === now.getMonth() && current.anchorDate.getFullYear() === now.getFullYear()) total += current.earned; return total;
  }
  function quoteOfDay(date) { const d = date ? new Date(date) : new Date(); return QUOTES[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % QUOTES.length]; }
  global.QJEngine = { QUOTES, clamp, pad2, fmtDuration, fmtTime, dateKey, payoutPlan, getState, getMonthEstimate, quoteOfDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.QJEngine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
