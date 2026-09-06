/* 钱进 v0.4.3 数据模型：本地设置、到账节奏与兼容迁移。 */
(function (global) {
  'use strict';

  const DEFAULT_META = Object.freeze({ schemaVersion: 5, onboardingCompleted: false, onboardingStep: 0 });
  const DEFAULT_SETTINGS = Object.freeze({
    monthlySalary: null,
    billingDays: 21.75,
    startMinute: 9 * 60,
    endMinute: 18 * 60,
    payout: Object.freeze({ mode: 'thirty', intervalSeconds: 30 * 60 }),
    currency: Object.freeze({ auto: true, baseCode: 'CNY', displayCode: 'CNY' }),
    calendar: Object.freeze({ auto: true, region: 'CN' }),
    workdays: [1, 2, 3, 4, 5],
    privacyMode: 'pet',
    soundMode: 'soft',
    widget: Object.freeze({ enabled: false, autoHideSec: 3, position: null, pausedHosts: [] }),
    share: Object.freeze({ includeAmount: false })
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function number(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }
  function minutes(value, fallback) { return Math.round(number(value, fallback, 0, 1439)); }
  function uniqueDays(value) {
    if (!Array.isArray(value)) return clone(DEFAULT_SETTINGS.workdays);
    return [...new Set(value.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
  }
  function normalizePosition(value) {
    if (!value || typeof value !== 'object') return null;
    const x = Number(value.xRatio), y = Number(value.yRatio);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { xRatio: Math.min(1, Math.max(0, x)), yRatio: Math.min(1, Math.max(0, y)) };
  }
  function randomPayout() {
    return Math.random() < 0.5
      ? { mode: 'breath', intervalSeconds: 8 }
      : { mode: 'thirty', intervalSeconds: 30 * 60 };
  }
  function normalizePayout(value) {
    const payout = value && typeof value === 'object' ? value : {};
    const mode = ['breath', 'thirty', 'custom'].includes(payout.mode) ? payout.mode : 'thirty';
    const intervalSeconds = mode === 'breath' ? 8 : mode === 'thirty' ? 30 * 60
      : Math.round(number(payout.intervalSeconds, 30 * 60, 1, 24 * 60 * 60));
    return { mode, intervalSeconds };
  }

  function normalizeSettings(input) {
    const src = input && typeof input === 'object' ? input : {};
    const widget = src.widget && typeof src.widget === 'object' ? src.widget : {};
    const share = src.share && typeof src.share === 'object' ? src.share : {};
    const currency = src.currency && typeof src.currency === 'object' ? src.currency : {};
    const calendar = src.calendar && typeof src.calendar === 'object' ? src.calendar : {};
    const currencyCodes = ['CNY','USD','EUR','GBP','JPY','KRW','IDR','VND','HKD','TWD','SGD','INR','AUD','CAD'];
    const regionCodes = ['CN','HK','TW','JP','SG','US','GB'];
    const baseCode = currencyCodes.includes(String(currency.baseCode || '').toUpperCase()) ? String(currency.baseCode).toUpperCase() : 'CNY';
    const salaryRaw = src.monthlySalary;
    const salary = salaryRaw === null || salaryRaw === '' || salaryRaw === undefined ? null : number(salaryRaw, null, 0, 1000000000);
    return {
      monthlySalary: salary,
      billingDays: number(src.billingDays, 21.75, 1, 31),
      startMinute: minutes(src.startMinute, 9 * 60),
      endMinute: minutes(src.endMinute, 18 * 60),
      payout: normalizePayout(src.payout),
      currency: {
        auto: currency.auto !== false,
        baseCode,
        displayCode: currencyCodes.includes(String(currency.displayCode || '').toUpperCase()) ? String(currency.displayCode).toUpperCase() : baseCode
      },
      calendar: { auto: calendar.auto !== false, region: regionCodes.includes(String(calendar.region || '').toUpperCase()) ? String(calendar.region).toUpperCase() : 'CN' },
      workdays: uniqueDays(src.workdays),
      privacyMode: ['pet', 'percent', 'rough', 'exact'].includes(src.privacyMode) ? src.privacyMode : 'pet',
      soundMode: ['mute', 'soft', 'all'].includes(src.soundMode) ? src.soundMode : 'soft',
      widget: {
        enabled: widget.enabled === true,
        autoHideSec: number(widget.autoHideSec, 3, 1, 60),
        position: normalizePosition(widget.position),
        pausedHosts: Array.isArray(widget.pausedHosts) ? [...new Set(widget.pausedHosts.map(String).filter(Boolean))].slice(0, 500) : []
      },
      share: { includeAmount: share.includeAmount === true }
    };
  }

  function onboardingStep(value) {
    const step = Math.round(Number(value));
    return Number.isFinite(step) ? Math.min(2, Math.max(0, step)) : 0;
  }
  function freshData() {
    const settings = normalizeSettings(DEFAULT_SETTINGS);
    settings.payout = randomPayout();
    return { meta: clone(DEFAULT_META), settings };
  }
  function inferLocalProfile() {
    const language = global.navigator && navigator.language ? navigator.language : '';
    let timeZone = ''; let region = '';
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    try { region = new Intl.Locale(language).region || ''; } catch (e) {}
    const zones = { 'Asia/Shanghai':'CN','Asia/Chongqing':'CN','Asia/Hong_Kong':'HK','Asia/Taipei':'TW','Asia/Tokyo':'JP','Asia/Singapore':'SG','Europe/London':'GB','America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US' };
    region = zones[timeZone] || region || 'CN';
    const supportedRegion = ['CN','HK','TW','JP','SG','US','GB'].includes(region) ? region : 'CN';
    const currencies = { CN:'CNY',HK:'HKD',TW:'TWD',JP:'JPY',SG:'SGD',US:'USD',GB:'GBP' };
    return { region: supportedRegion, currency: currencies[supportedRegion] || 'CNY' };
  }
  function applyAutoProfile(input) {
    const settings = normalizeSettings(input); const profile = inferLocalProfile();
    if (settings.currency.auto) { settings.currency.baseCode = profile.currency; settings.currency.displayCode = profile.currency; }
    if (settings.calendar.auto) settings.calendar.region = profile.region;
    return settings;
  }
  function legacyLooksUntouched(raw) {
    if (!raw || Number(raw.monthlySalary) !== 10000) return false;
    const workdays = Array.isArray(raw.workdays) ? raw.workdays.map(Number).join(',') : '';
    return Number(raw.startHour) === 9 && Number(raw.startMinute || 0) === 0 && Number(raw.endHour) === 18 && Number(raw.endMinute || 0) === 0 && Number(raw.billingDays) === 21.75 && workdays === '1,2,3,4,5';
  }
  function migrate(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    if (raw.meta && Number(raw.meta.schemaVersion) >= 2) {
      const previous = raw.settings && typeof raw.settings === 'object' ? clone(raw.settings) : {};
      if (Number(raw.meta.schemaVersion) < 3 && !previous.currency) previous.currency = { auto: false, baseCode: 'CNY', displayCode: 'CNY' };
      if (Number(raw.meta.schemaVersion) < 5 && !previous.payout) previous.payout = { mode: 'custom', intervalSeconds: Math.round(number(previous.payoutIntervalMinutes, 30, 1, 1440) * 60) };
      return { meta: { schemaVersion: 5, onboardingCompleted: raw.meta.onboardingCompleted === true, onboardingStep: raw.meta.onboardingCompleted === true ? 0 : onboardingStep(raw.meta.onboardingStep) }, settings: normalizeSettings(previous) };
    }
    const hasLegacy = ['monthlySalary', 'startHour', 'privacyMode', 'billingDays'].some((key) => raw[key] !== undefined);
    if (!hasLegacy) return freshData();
    const untouched = legacyLooksUntouched(raw);
    const legacySettings = { monthlySalary: untouched ? null : raw.monthlySalary, billingDays: raw.billingDays, startMinute: number(raw.startHour, 9, 0, 23) * 60 + number(raw.startMinute, 0, 0, 59), endMinute: number(raw.endHour, 18, 0, 23) * 60 + number(raw.endMinute, 0, 0, 59), workdays: raw.workdays, privacyMode: raw.privacyMode, soundMode: raw.soundMode, payout: randomPayout(), widget: { enabled: false, autoHideSec: raw.autoHideSec, position: null, pausedHosts: [] } };
    return { meta: { schemaVersion: 5, onboardingCompleted: !untouched && Number(raw.monthlySalary) >= 0, onboardingStep: 0 }, settings: normalizeSettings(legacySettings) };
  }
  async function load() {
    if (!global.chrome || !chrome.storage || !chrome.storage.local) return freshData();
    const raw = await chrome.storage.local.get(null); const data = migrate(raw); data.settings = applyAutoProfile(data.settings);
    if (!raw.meta || Number(raw.meta.schemaVersion) < 5) await chrome.storage.local.set(data);
    return data;
  }
  async function saveData(patch) { if (global.chrome && chrome.storage && chrome.storage.local) await chrome.storage.local.set(patch); }
  global.QJStorage = { DEFAULT_META, DEFAULT_SETTINGS, clone, normalizeSettings, normalizePayout, randomPayout, freshData, inferLocalProfile, applyAutoProfile, legacyLooksUntouched, migrate, load, saveData };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.QJStorage;
})(typeof globalThis !== 'undefined' ? globalThis : this);
