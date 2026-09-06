/* 钱进 v0.3 离线币种与展示换算。参考汇率快照：ECB 2026-08-28；仅用于激励展示。 */
(function (global) {
  'use strict';

  const SNAPSHOT = '2026-08-28';
  const CURRENCIES = Object.freeze({
    CNY: { name: '人民币', perEUR: 7.8258, digits: 2 },
    USD: { name: '美元', perEUR: 1.1643, digits: 2 },
    EUR: { name: '欧元', perEUR: 1, digits: 2 },
    GBP: { name: '英镑', perEUR: 0.8572, digits: 2 },
    JPY: { name: '日元', perEUR: 185.92, digits: 0 },
    KRW: { name: '韩元', perEUR: 1614.39, digits: 0, boost: true },
    IDR: { name: '印尼盾', perEUR: 20628.08, digits: 0, boost: true },
    VND: { name: '越南盾', perEUR: 30500, digits: 0, boost: true },
    HKD: { name: '港币', perEUR: 9.13, digits: 2 },
    TWD: { name: '新台币', perEUR: 35.7, digits: 0 },
    SGD: { name: '新加坡元', perEUR: 1.49, digits: 2 },
    INR: { name: '印度卢比', perEUR: 103.1, digits: 0 },
    AUD: { name: '澳元', perEUR: 1.78, digits: 2 },
    CAD: { name: '加元', perEUR: 1.60, digits: 2 }
  });
  const REGION_CURRENCY = Object.freeze({
    CN: 'CNY', HK: 'HKD', TW: 'TWD', JP: 'JPY', KR: 'KRW', SG: 'SGD',
    ID: 'IDR', VN: 'VND', US: 'USD', GB: 'GBP', IN: 'INR', AU: 'AUD', CA: 'CAD',
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR'
  });
  const TIMEZONE_REGION = Object.freeze({
    'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Hong_Kong': 'HK',
    'Asia/Taipei': 'TW', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
    'Asia/Singapore': 'SG', 'Asia/Jakarta': 'ID', 'Asia/Ho_Chi_Minh': 'VN',
    'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'Australia/Sydney': 'AU', 'Asia/Kolkata': 'IN'
  });

  function supported(code, fallback) {
    const value = String(code || '').toUpperCase();
    return CURRENCIES[value] ? value : (fallback || 'CNY');
  }
  function inferRegion(language, timeZone) {
    let region = '';
    try { region = new Intl.Locale(language || '').region || ''; } catch (e) {}
    return TIMEZONE_REGION[timeZone] || region || 'CN';
  }
  function inferProfile(language, timeZone) {
    const region = inferRegion(language, timeZone);
    return { region, currency: REGION_CURRENCY[region] || 'USD' };
  }
  function convert(value, fromCode, toCode) {
    const from = CURRENCIES[supported(fromCode)], to = CURRENCIES[supported(toCode)];
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return number / from.perEUR * to.perEUR;
  }
  function format(value, fromCode, toCode, options) {
    const code = supported(toCode || fromCode);
    const currency = CURRENCIES[code];
    const converted = convert(value, fromCode, code);
    const digits = options && Number.isInteger(options.digits) ? options.digits : currency.digits;
    try {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: digits, maximumFractionDigits: digits
      }).format(converted);
    } catch (e) {
      return code + ' ' + converted.toFixed(digits);
    }
  }
  function plusLabel(value, fromCode, toCode) {
    const code = supported(toCode || fromCode);
    const converted = convert(value, fromCode, code);
    const digits = CURRENCIES[code].digits;
    const num = Math.abs(converted).toLocaleString('zh-CN', {
      minimumFractionDigits: digits, maximumFractionDigits: digits
    });
    return code === 'CNY' ? '+' + num + ' 元' : '+' + format(Math.abs(value), fromCode, code);
  }

  global.QJCurrency = { SNAPSHOT, CURRENCIES, REGION_CURRENCY, TIMEZONE_REGION, supported, inferRegion, inferProfile, convert, format, plusLabel };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.QJCurrency;
})(typeof globalThis !== 'undefined' ? globalThis : this);
