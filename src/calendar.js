/* 钱进 v0.3 离线节假日与周末倒计时。2026 日期来自各地区政府公开日历。 */
(function (global) {
  'use strict';

  const REGIONS = Object.freeze({
    CN: '中国大陆', HK: '中国香港', TW: '中国台湾', JP: '日本',
    SG: '新加坡', US: '美国', GB: '英国'
  });
  const HOLIDAYS = Object.freeze({
    CN: [
      ['2026-01-01','2026-01-03','元旦'],['2026-02-15','2026-02-23','春节'],
      ['2026-04-04','2026-04-06','清明节'],['2026-05-01','2026-05-05','劳动节'],
      ['2026-06-19','2026-06-21','端午节'],['2026-09-25','2026-09-27','中秋节'],
      ['2026-10-01','2026-10-07','国庆节'],['2027-01-01','2027-01-01','元旦']
    ],
    HK: [
      ['2026-01-01','2026-01-01','元旦'],['2026-02-17','2026-02-19','农历新年'],
      ['2026-04-03','2026-04-07','复活节及清明假期'],['2026-05-01','2026-05-01','劳动节'],
      ['2026-05-25','2026-05-25','佛诞翌日'],['2026-06-19','2026-06-19','端午节'],
      ['2026-07-01','2026-07-01','香港特别行政区成立纪念日'],['2026-09-26','2026-09-26','中秋节翌日'],
      ['2026-10-01','2026-10-01','国庆日'],['2026-10-19','2026-10-19','重阳节翌日'],
      ['2026-12-25','2026-12-26','圣诞假期']
    ],
    TW: [
      ['2026-01-01','2026-01-01','元旦'],['2026-02-14','2026-02-22','农历春节'],
      ['2026-02-28','2026-03-02','和平纪念日'],['2026-04-03','2026-04-06','儿童节及清明节'],
      ['2026-05-01','2026-05-01','劳动节'],['2026-06-19','2026-06-19','端午节'],
      ['2026-09-25','2026-09-25','中秋节'],['2026-09-28','2026-09-28','教师节'],
      ['2026-10-10','2026-10-12','国庆日'],['2026-10-25','2026-10-26','光复节'],
      ['2026-12-25','2026-12-25','行宪纪念日']
    ],
    JP: [
      ['2026-01-01','2026-01-01','元日'],['2026-01-12','2026-01-12','成人の日'],
      ['2026-02-11','2026-02-11','建国記念の日'],['2026-02-23','2026-02-23','天皇誕生日'],
      ['2026-03-20','2026-03-20','春分の日'],['2026-04-29','2026-04-29','昭和の日'],
      ['2026-05-03','2026-05-06','ゴールデンウィーク'],['2026-07-20','2026-07-20','海の日'],
      ['2026-08-11','2026-08-11','山の日'],['2026-09-21','2026-09-23','シルバーウィーク'],
      ['2026-10-12','2026-10-12','スポーツの日'],['2026-11-03','2026-11-03','文化の日'],
      ['2026-11-23','2026-11-23','勤労感謝の日'],['2027-01-01','2027-01-01','元日']
    ],
    SG: [
      ['2026-01-01','2026-01-01','New Year’s Day'],['2026-02-17','2026-02-18','Chinese New Year'],
      ['2026-03-21','2026-03-21','Hari Raya Puasa'],['2026-04-03','2026-04-03','Good Friday'],
      ['2026-05-01','2026-05-01','Labour Day'],['2026-05-27','2026-05-27','Hari Raya Haji'],
      ['2026-06-01','2026-06-01','Vesak Day holiday'],['2026-08-10','2026-08-10','National Day holiday'],
      ['2026-11-09','2026-11-09','Deepavali holiday'],['2026-12-25','2026-12-25','Christmas Day'],
      ['2027-01-01','2027-01-01','New Year’s Day']
    ],
    US: [
      ['2026-01-01','2026-01-01','New Year’s Day'],['2026-01-19','2026-01-19','Martin Luther King Jr. Day'],
      ['2026-02-16','2026-02-16','Washington’s Birthday'],['2026-05-25','2026-05-25','Memorial Day'],
      ['2026-06-19','2026-06-19','Juneteenth'],['2026-07-03','2026-07-03','Independence Day holiday'],
      ['2026-09-07','2026-09-07','Labor Day'],['2026-10-12','2026-10-12','Columbus Day'],
      ['2026-11-11','2026-11-11','Veterans Day'],['2026-11-26','2026-11-26','Thanksgiving'],
      ['2026-12-25','2026-12-25','Christmas Day'],['2027-01-01','2027-01-01','New Year’s Day']
    ],
    GB: [
      ['2026-01-01','2026-01-01','New Year’s Day'],['2026-04-03','2026-04-06','Easter holiday'],
      ['2026-05-04','2026-05-04','Early May bank holiday'],['2026-05-25','2026-05-25','Spring bank holiday'],
      ['2026-08-31','2026-08-31','Summer bank holiday'],['2026-12-25','2026-12-28','Christmas bank holiday'],
      ['2027-01-01','2027-01-01','New Year’s Day']
    ]
  });

  function localDate(text, endOfDay) {
    const parts = String(text).split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2] + (endOfDay ? 1 : 0), 0, 0, 0, 0);
  }
  function countdown(milliseconds) {
    let seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(seconds / 86400); seconds %= 86400;
    const hours = Math.floor(seconds / 3600); seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    if (days > 0) return days + '天' + hours + '小时';
    if (hours > 0) return hours + '小时' + minutes + '分';
    return Math.max(1, minutes) + '分钟';
  }
  function nextHoliday(now, region) {
    const current = new Date(now || Date.now());
    const entries = HOLIDAYS[REGIONS[region] ? region : 'CN'] || [];
    for (const item of entries) {
      const start = localDate(item[0], false), end = localDate(item[1], true);
      if (current < end) {
        const active = current >= start;
        return {
          name: item[2], start, end, active,
          milliseconds: active ? end - current : start - current,
          text: active ? '假期进行中 · 还剩 ' + countdown(end - current) : '还有 ' + countdown(start - current)
        };
      }
    }
    return { name: '下一次假期', active: false, milliseconds: 0, text: '等待新年度日历' };
  }
  function weekend(now) {
    const current = new Date(now || Date.now());
    const day = current.getDay();
    if (day === 6 || day === 0) {
      const end = new Date(current); end.setDate(end.getDate() + (day === 6 ? 2 : 1)); end.setHours(0,0,0,0);
      return { active: true, milliseconds: end - current, text: '周末进行中 · 还剩 ' + countdown(end - current) };
    }
    const start = new Date(current); start.setDate(start.getDate() + (6 - day)); start.setHours(0,0,0,0);
    return { active: false, milliseconds: start - current, text: '还有 ' + countdown(start - current) };
  }

  global.QJCalendar = { REGIONS, HOLIDAYS, localDate, countdown, nextHoliday, weekend };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.QJCalendar;
})(typeof globalThis !== 'undefined' ? globalThis : this);
