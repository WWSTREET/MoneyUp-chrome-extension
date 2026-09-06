(function () {
  'use strict';
  const E = window.QJEngine, S = window.QJStorage, H = window.QJHamster, C = window.QJCurrency, Cal = window.QJCalendar;
  if (window.QJAudio) QJAudio.unlock();
  const $ = (id) => document.getElementById(id);
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  const CHEERS = ['摸鱼可以，进账不停', '叮，金币到账，等级 Up', '工位一坐，Money Up', '摸摸头，继续帮你看着进度'];
  let data = S.freshData(), activeHost = '', refreshTimer = null, heroMood = '', lastPayout = null;
  let shareViewing = null;
  let earnedRolling = false, earnedRollTimer = null, flyerAnim = null;
  const money = (value) => { const c = data.settings.currency; return C.format(value, c.baseCode, c.displayCode); };
  const plusMoney = (value) => { const c = data.settings.currency; return C.plusLabel(value, c.baseCode, c.displayCode); };
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeValue = (minutes) => E.fmtTime(Number(minutes) || 0);
  function parseTime(value, fallback) { const match = /^(\d{2}):(\d{2})$/.exec(value || ''); return match ? Number(match[1]) * 60 + Number(match[2]) : fallback; }
  function go(name) {
    if (document.documentElement.classList.contains('embed') && name !== 'Settings' && name !== 'Share') {
      try { window.parent.postMessage({ type: 'QJ_CLOSE_SETTINGS' }, '*'); } catch (e) {}
      return;
    }
    document.querySelectorAll('.view').forEach((view) => view.classList.remove('show'));
    $('view' + name).classList.add('show');
    if (name === 'Share') { $('shareAmount').checked = data.settings.share.includeAmount === true; drawShare(); renderArchive(); }
    if (name === 'Settings') { fillSettings(); refreshPermissionUI(); }
  }
  async function saveSettings() {
    data.settings = S.normalizeSettings(data.settings);
    lastPayout = E.getState(new Date(), data.settings);
    await chrome.storage.local.set({ settings: data.settings });
  }
  async function hasPermission() { try { return await chrome.permissions.contains({ origins: ['<all_urls>'] }); } catch (e) { return false; } }
  async function requestPermission() {
    try {
      const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
      if (granted) chrome.runtime.sendMessage({ type: 'QJ_REFRESH_REGISTRATION' }).catch(() => { });
      return granted;
    } catch (e) { return false; }
  }
  async function removePermission() { try { return await chrome.permissions.remove({ origins: ['<all_urls>'] }); } catch (e) { return false; } }
  async function loadActiveHost() { try { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (tab && /^https?:/i.test(tab.url || '')) activeHost = new URL(tab.url).hostname; } catch (e) { } }
  function renderWeekdays(containerId, onChange) {
    const container = $(containerId); container.innerHTML = '';
    WEEK.forEach((label, day) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.classList.toggle('on', data.settings.workdays.includes(day));
      button.setAttribute('aria-pressed', String(data.settings.workdays.includes(day)));
      button.onclick = async () => {
        const days = [...data.settings.workdays]; const index = days.indexOf(day);
        if (index >= 0) days.splice(index, 1); else days.push(day);
        data.settings.workdays = days.sort((a, b) => a - b);
        renderWeekdays('weekdayPicker', saveSettings);
        renderWeekdays('onboardWeekdays', containerId === 'onboardWeekdays' ? onChange : undefined);
        if (onChange) await onChange();
      };
      container.appendChild(button);
    });
  }
  function showOnboardingStep(index) {
    document.querySelectorAll('.onboard-step').forEach((step) => step.classList.toggle('show', Number(step.dataset.step) === index));
    document.querySelectorAll('.onboard-progress i').forEach((dot, i) => dot.classList.toggle('on', i <= index));
  }
  async function persistOnboarding(step) {
    data.settings = S.normalizeSettings(data.settings);
    data.meta = { schemaVersion: 6, onboardingCompleted: false, onboardingStep: Math.min(2, Math.max(0, Number(step) || 0)), widgetPrompted: data.meta.widgetPrompted === true };
    await chrome.storage.local.set({ meta: data.meta, settings: data.settings });
  }
  function setupOnboarding() {
    $('onboardHamster').innerHTML = H.svg('work'); $('onboardSalary').value = data.settings.monthlySalary === null ? '' : data.settings.monthlySalary;
    $('onboardStart').value = timeValue(data.settings.startMinute); $('onboardEnd').value = timeValue(data.settings.endMinute);
    $('salaryCurrencyHint').textContent = data.settings.currency.baseCode;
    renderWeekdays('onboardWeekdays', () => persistOnboarding(1));
    $('onboardNext1').onclick = async () => {
      const value = Number($('onboardSalary').value);
      if (!Number.isFinite(value) || value < 0 || $('onboardSalary').value.trim() === '') { $('salaryError').textContent = '请填写月工资，0 也可以'; return; }
      $('salaryError').textContent = ''; data.settings.monthlySalary = value; await persistOnboarding(1); showOnboardingStep(1);
    };
    document.querySelectorAll('[data-preset]').forEach((button) => {
      button.onclick = async () => {
        const [start, end] = button.dataset.preset.split(',').map(Number);
        data.settings.startMinute = start; data.settings.endMinute = end;
        $('onboardStart').value = timeValue(start); $('onboardEnd').value = timeValue(end);
        document.querySelectorAll('[data-preset]').forEach((item) => item.classList.toggle('on', item === button));
        await persistOnboarding(1);
      };
    });
    $('onboardStart').onchange = async () => { data.settings.startMinute = parseTime($('onboardStart').value, data.settings.startMinute); await persistOnboarding(1); };
    $('onboardEnd').onchange = async () => { data.settings.endMinute = parseTime($('onboardEnd').value, data.settings.endMinute); await persistOnboarding(1); };
    $('onboardNext2').onclick = async () => {
      data.settings.startMinute = parseTime($('onboardStart').value, data.settings.startMinute);
      data.settings.endMinute = parseTime($('onboardEnd').value, data.settings.endMinute);
      await persistOnboarding(2); showOnboardingStep(2);
    };
    document.querySelectorAll('[data-onboard-back]').forEach((button) => {
      button.onclick = async () => { const step = Number(button.dataset.onboardBack); await persistOnboarding(step); showOnboardingStep(step); };
    });
    async function finish(requestHost) {
      data.settings.widget.enabled = true;
      data.settings = S.normalizeSettings(data.settings);
      data.meta = { schemaVersion: 6, onboardingCompleted: true, onboardingStep: 0, widgetPrompted: !!requestHost };
      await chrome.storage.local.set({ meta: data.meta, settings: data.settings });
      $('onboarding').hidden = true; fillSettings(); refreshHome();
      if (requestHost) await requestPermission();
      chrome.runtime.sendMessage({ type: 'QJ_REFRESH_REGISTRATION' }).catch(() => {});
      fillSettings(); refreshPermissionUI();
    }
    $('grantOnboarding').onclick = () => finish(true);
    $('skipOnboarding').onclick = () => finish(false);
  }
  function payoutParts(seconds) { const value = Math.max(0, Math.round(seconds)); return { hours: Math.floor(value / 3600), minutes: Math.floor(value % 3600 / 60), seconds: value % 60 }; }
  function fillPayout() {
    const payout = data.settings.payout, parts = payoutParts(payout.intervalSeconds);
    document.querySelectorAll('#payoutPicker button').forEach((button) => button.classList.toggle('on', button.dataset.value === payout.mode));
    $('payoutHours').value = parts.hours; $('payoutMinutes').value = parts.minutes; $('payoutSeconds').value = parts.seconds;
    const custom = payout.mode === 'custom';
    $('payoutFields').classList.toggle('is-custom', custom);
    ['payoutHours', 'payoutMinutes', 'payoutSeconds'].forEach((id) => { $(id).disabled = !custom; });
    if (payout.mode === 'breath') {
      $('payoutHint').textContent = '心跳到账：约 8 秒结算一次，节奏接近呼吸灯，仅视觉变化不播放声音。';
    } else if (payout.mode === 'thirty') {
      $('payoutHint').textContent = '30 分钟到账：每笔到账显示增量动画和金币碰撞音效。';
    } else if (payout.intervalSeconds < 60) {
      $('payoutHint').textContent = '自定义到账少于 1 分钟：仅显示金额变化，不播放声音。';
    } else {
      $('payoutHint').textContent = '自定义到账：每笔到账显示增量动画和金币碰撞音效。';
    }
  }
  function fillLocaleSettings() {
    const currency = data.settings.currency, calendar = data.settings.calendar, region = $('regionSelect'), base = $('baseCurrency'), display = $('displayCurrency');
    region.innerHTML = '<option value="AUTO">自动识别</option>'; Object.entries(Cal.REGIONS).forEach(([code, name]) => region.add(new Option(name, code)));
    region.value = calendar.auto ? 'AUTO' : calendar.region;
    base.innerHTML = '<option value="AUTO">自动</option>'; display.innerHTML = '';
    Object.entries(C.CURRENCIES).forEach(([code, item]) => {
      base.add(new Option(code, code));
      display.add(new Option((item.boost ? '🔥 ' : '') + item.name + ' · ' + code, code));
    });
    base.value = currency.auto ? 'AUTO' : currency.baseCode; display.value = currency.displayCode;
    base.title = currency.auto ? '按地区自动选择工资币种' : (C.CURRENCIES[currency.baseCode] || {}).name + ' · ' + currency.baseCode;
    $('currencyPreview').textContent = currency.baseCode === currency.displayCode ? '当前按 ' + C.CURRENCIES[currency.baseCode].name + ' 显示。' : '爽感换算示例：' + C.format(1000, currency.baseCode, currency.baseCode) + ' ≈ ' + C.format(1000, currency.baseCode, currency.displayCode) + '。离线参考汇率 ' + C.SNAPSHOT + '。';
    $('salaryCurrencyHint').textContent = currency.baseCode;
  }
  function fillSettings() {
    const settings = data.settings; $('salaryInput').value = settings.monthlySalary === null ? '' : settings.monthlySalary;
    $('startTime').value = timeValue(settings.startMinute); $('endTime').value = timeValue(settings.endMinute);
    $('billingDays').value = settings.billingDays;
    $('widgetEnabled').checked = settings.widget.enabled; $('autoHide').value = settings.widget.autoHideSec;
    renderWeekdays('weekdayPicker', saveSettings);
    document.querySelectorAll('#privacyPicker button').forEach((button) => button.classList.toggle('on', button.dataset.value === settings.privacyMode));
    document.querySelectorAll('#soundPicker button').forEach((button) => button.classList.toggle('on', button.dataset.value === settings.soundMode));
    fillLocaleSettings();
    fillPayout();
  }
  function bindSettings() {
    $('salaryInput').onchange = async () => { data.settings.monthlySalary = $('salaryInput').value === '' ? null : Math.max(0, Number($('salaryInput').value) || 0); await saveSettings(); };
    $('startTime').onchange = async () => { data.settings.startMinute = parseTime($('startTime').value, data.settings.startMinute); await saveSettings(); };
    $('endTime').onchange = async () => { data.settings.endMinute = parseTime($('endTime').value, data.settings.endMinute); await saveSettings(); };
    $('billingDays').onchange = async () => { data.settings.billingDays = Number($('billingDays').value); await saveSettings(); fillSettings(); };
    document.querySelectorAll('#payoutPicker button').forEach((button) => {
      button.onclick = async () => {
        const mode = button.dataset.value; const current = data.settings.payout.intervalSeconds;
        data.settings.payout = { mode, intervalSeconds: mode === 'breath' ? 8 : mode === 'thirty' ? 1800 : current };
        await saveSettings(); fillSettings(); refreshHome();
      };
    });
    async function saveCustomPayout() {
      const seconds = Number($('payoutHours').value || 0) * 3600 + Number($('payoutMinutes').value || 0) * 60 + Number($('payoutSeconds').value || 0);
      data.settings.payout = { mode: 'custom', intervalSeconds: Math.max(1, seconds) };
      await saveSettings(); fillSettings(); refreshHome();
    }
    ['payoutHours', 'payoutMinutes', 'payoutSeconds'].forEach((id) => { $(id).onchange = saveCustomPayout; });
    $('autoHide').onchange = async () => { data.settings.widget.autoHideSec = Number($('autoHide').value); await saveSettings(); fillSettings(); };
    document.querySelectorAll('#privacyPicker button').forEach((button) => {
      button.onclick = async () => { data.settings.privacyMode = button.dataset.value; await saveSettings(); fillSettings(); };
    });
    document.querySelectorAll('#soundPicker button').forEach((button) => {
      button.onclick = async () => { data.settings.soundMode = button.dataset.value; await saveSettings(); fillSettings(); };
    });
    $('regionSelect').onchange = async () => {
      const value = $('regionSelect').value; data.settings.calendar.auto = value === 'AUTO';
      if (value === 'AUTO') data.settings = S.applyAutoProfile(data.settings); else data.settings.calendar.region = value;
      await saveSettings(); fillSettings(); refreshHome();
    };
    $('baseCurrency').onchange = async () => {
      const value = $('baseCurrency').value, previous = data.settings.currency.baseCode;
      if (value === 'AUTO') data.settings = S.applyAutoProfile({ ...data.settings, currency: { ...data.settings.currency, auto: true } });
      else { data.settings.currency.auto = false; data.settings.currency.baseCode = value; if (data.settings.currency.displayCode === previous) data.settings.currency.displayCode = value; }
      await saveSettings(); fillSettings(); refreshHome();
    };
    $('displayCurrency').onchange = async () => {
      data.settings.currency.auto = false; data.settings.currency.displayCode = $('displayCurrency').value;
      await saveSettings(); fillSettings(); refreshHome();
    };
    $('widgetEnabled').onchange = async () => {
      let enabled = $('widgetEnabled').checked;
      if (enabled && !(await hasPermission())) enabled = await requestPermission();
      data.settings.widget.enabled = enabled; await saveSettings(); fillSettings(); refreshPermissionUI();
    };
    $('permissionAction').onclick = async () => {
      if (await hasPermission()) { await removePermission(); data.settings.widget.enabled = false; await saveSettings(); }
      else { const granted = await requestPermission(); data.settings.widget.enabled = granted; await saveSettings(); }
      fillSettings(); refreshPermissionUI();
    };
    $('pauseHost').onclick = async () => {
      if (!activeHost) return;
      const hosts = [...data.settings.widget.pausedHosts], index = hosts.indexOf(activeHost);
      if (index >= 0) hosts.splice(index, 1); else hosts.push(activeHost);
      data.settings.widget.pausedHosts = hosts; await saveSettings(); refreshPermissionUI();
    };
    $('resetAll').onclick = async () => {
      if (!confirm('恢复默认设置并重新进入首次引导？')) return;
      data = S.freshData(); data.settings = S.applyAutoProfile(data.settings); await chrome.storage.local.set(data);
      fillSettings(); setupOnboarding(); $('onboarding').hidden = false; showOnboardingStep(0);
    };
  }
  async function refreshPermissionUI() {
    const granted = await hasPermission();
    $('permissionTitle').textContent = granted ? '网页显示权限已开启' : '尚未授权网页显示';
    $('permissionText').textContent = granted ? '仓鼠只绘制自己的悬浮界面，不读取、记录或上传网页内容。' : '网页模式默认开启。点一次授权后，仓鼠会出现在网页角落。';
    $('permissionAction').textContent = granted ? '撤销网站访问' : '启用网页仓鼠';
    $('pauseHost').hidden = !granted || !activeHost;
    if (activeHost) $('pauseHost').textContent = data.settings.widget.pausedHosts.includes(activeHost) ? '恢复当前网站' : '暂停当前网站';
  }
  function renderHeroMood(mood) { if (heroMood === mood) return; heroMood = mood; $('heroHamster').innerHTML = H.svg(mood); }
  function refreshHome() {
    const now = new Date(), state = E.getState(now, data.settings), holiday = Cal.nextHoliday(now, data.settings.calendar.region), weekend = Cal.weekend(now);
    renderHeroMood(state.phase === 'off' ? 'rest' : 'work');
    $('stateChip').textContent = state.phaseText;
    $('cheer').textContent = $('cheer').dataset.manual || '每一秒，都在向上进账';
    const payoutHappened = lastPayout && lastPayout.anchorKey === state.anchorKey && state.payoutIndex > lastPayout.payoutIndex && state.latestPayoutAmount > 0;
    if (!earnedRolling && !payoutHappened) setEarnedDisplay(state.configured ? state.earned : null, false);
    if (!state.configured) {
      $('rate').textContent = '完成设置后开始前进';
    } else if (state.phase === 'working') {
      $('rate').textContent = '下一笔，' + E.fmtDuration(state.untilNextPayoutSec) + ' 后到账';
    } else {
      $('rate').textContent = state.phaseText;
    }
    const pct = Math.round(state.progress * 100); $('progressFill').style.width = pct + '%'; $('progressText').textContent = '今日 ' + pct + '%';
    $('remainText').textContent = state.phase === 'after' ? '今天辛苦了' : state.phase === 'working' || state.phase === 'before' ? '距下班 ' + E.fmtDuration(state.remainSec) : '--';
    $('holidayName').textContent = holiday.name; $('holidayCountdown').textContent = holiday.text; $('weekendCountdown').textContent = weekend.text;
    $('heroHamster').style.setProperty('--cheek', (1 + state.progress * 0.23).toFixed(3));
    $('quote').textContent = E.quoteOfDay(now);
    updateShareNudge(state);
    handlePayout(state);
  }
  function handlePayout(state) {
    if (lastPayout === null) { lastPayout = state; return; }
    const previous = lastPayout; lastPayout = state;
    if (previous.anchorKey !== state.anchorKey || state.payoutIndex <= previous.payoutIndex || state.latestPayoutAmount <= 0) return;
    chrome.runtime.sendMessage({ type: 'QJ_CLAIM_PAYOUT', key: state.payoutKey }).then((answer) => {
      if (answer && answer.play) showPayout(state.latestPayoutAmount, state.payoutIntervalSec);
    }).catch(() => showPayout(state.latestPayoutAmount, state.payoutIntervalSec));
  }
  function setEarnedDisplay(value, animate) {
    const el = $('earned');
    if (value === null || !Number.isFinite(Number(value))) {
      el.dataset.layout = '';
      el.textContent = C.CURRENCIES[data.settings.currency.displayCode].name + ' --';
      return;
    }
    paintOdometer(el, money(value), animate && !reduceMotion());
  }
  function paintOdometer(el, text, animate) {
    const DIGIT_H = 46;
    const copies = 6;
    const parts = [...String(text)].map((ch) => ({ ch, digit: /\d/.test(ch) }));
    const layout = parts.map((p) => p.digit ? 'd' : p.ch).join('');
    if (el.dataset.layout !== layout) {
      const reelHtml = Array.from({ length: copies }, () => '0123456789').join('').split('').map((d) => '<b>' + d + '</b>').join('');
      el.innerHTML = parts.map((p) => p.digit
        ? '<span class="od-digit"><span class="od-reel">' + reelHtml + '</span></span>'
        : '<span class="od-sym">' + p.ch + '</span>'
      ).join('');
      el.dataset.layout = layout;
    }
    const reels = el.querySelectorAll('.od-reel');
    const digitTotal = parts.filter((p) => p.digit).length;
    let i = 0;
    parts.forEach((p) => {
      if (!p.digit) return;
      const reel = reels[i];
      const placeFromRight = digitTotal - 1 - i;
      i += 1;
      if (!reel) return;
      const n = Number(p.ch);
      const prev = Number(reel.dataset.n);
      const rolling = !!animate && (!Number.isFinite(prev) || prev !== n);
      const restSlot = 10 + n;
      const startSlot = Number.isFinite(prev) ? 10 + prev : restSlot;
      const extraTurns = rolling ? 2 + Math.min(2, placeFromRight) : 0;
      const endSlot = rolling ? 10 + extraTurns * 10 + n : restSlot;
      const delay = rolling ? placeFromRight * 55 : 0;
      reel.style.transition = 'none';
      reel.style.transform = 'translateY(' + (-(rolling ? startSlot : restSlot) * DIGIT_H) + 'px)';
      reel.dataset.n = String(n);
      if (rolling) {
        requestAnimationFrame(() => {
          reel.style.transition = 'transform ' + (1.05 + placeFromRight * 0.08) + 's cubic-bezier(.12,.82,.08,1) ' + delay + 'ms';
          reel.style.transform = 'translateY(' + (-endSlot * DIGIT_H) + 'px)';
        });
      }
    });
    el.classList.toggle('is-rolling', !!animate);
  }
  function flyPayout(label) {
    const flyer = $('payoutFlyer'), target = $('earned'), home = $('viewHome');
    if (!flyer || !target || !home) return;
    if (flyerAnim) { flyerAnim.cancel(); flyerAnim = null; }
    flyer.textContent = label;
    const homeRect = home.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    flyer.style.opacity = '0';
    flyer.style.transform = 'translate(0,0)';
    const fw = flyer.offsetWidth || 92, fh = flyer.offsetHeight || 32;
    const startX = Math.min(homeRect.width - fw - 8, targetRect.right - homeRect.left + 8);
    const startY = targetRect.top - homeRect.top + targetRect.height / 2 - fh / 2;
    const endX = targetRect.left - homeRect.left + targetRect.width / 2 - fw / 2;
    const endY = startY;
    const midX = startX * 0.42 + endX * 0.58;
    const midY = startY - 8;
    flyer.style.transform = 'translate(' + startX + 'px,' + startY + 'px) scale(.74)';
    if (reduceMotion() || !window.QJPayoutMotion) return;
    flyerAnim = QJPayoutMotion.play(flyer, QJPayoutMotion.keyframes(startX, startY, midX, midY, endX, endY));
    if (flyerAnim) flyerAnim.onfinish = () => { flyer.style.opacity = '0'; flyerAnim = null; };
  }
  function showPayout(amount, intervalSeconds) {
    const delta = plusMoney(amount);
    const state = E.getState(new Date(), data.settings);
    const fromValue = Math.max(0, state.earned - amount);
    const motion = window.QJPayoutMotion || { ROLL_AT: 800, SETTLE: 1450 };
    earnedRolling = true;
    clearTimeout(earnedRollTimer);
    setEarnedDisplay(fromValue, false);
    flyPayout(delta);
    if (window.QJAudio) {
      QJAudio.unlock();
      if (QJAudio.warm) QJAudio.warm();
    }
    const playSound = intervalSeconds >= 60 && data.settings.soundMode !== 'mute';
    if (playSound) QJAudio.coinDrop(reduceMotion() ? 0 : motion.ROLL_AT);
    const startRoll = () => {
      setEarnedDisplay(state.earned, true);
      const coin = $('heroHamster').querySelector('.qj-coin');
      if (coin) { coin.classList.remove('drop'); void coin.getBoundingClientRect(); coin.classList.add('drop'); }
    };
    if (reduceMotion()) startRoll();
    else window.setTimeout(startRoll, motion.ROLL_AT);
    earnedRollTimer = setTimeout(() => {
      earnedRolling = false;
      setEarnedDisplay(state.earned, false);
    }, (reduceMotion() ? 0 : motion.ROLL_AT) + motion.SETTLE);
  }
  function remainLabel(state) {
    if (state.phase === 'after') return '已收工';
    if (state.phase === 'off') return '今日休息';
    if (state.phase === 'before') return '尚未开工';
    return '距下班 ' + E.fmtDuration(state.remainSec);
  }
  function heroLine(state, showAmount, template) {
    if (state.phase === 'off') return '今日休息，仓鼠不上班';
    if (state.phase === 'after') return showAmount ? '今天已经稳稳装进口袋' : '今天收工，进账到位';
    if (template === 'slack') return showAmount ? '摸鱼时金币也没停' : '工位电量还在涨';
    if (template === 'minimal') return showAmount ? '今日已到账' : '看得见的进度';
    return showAmount ? '今天已经稳稳装进口袋' : '今天已经稳稳钱进';
  }
  function liveShareSnapshot() {
    const now = new Date();
    const state = E.getState(now, data.settings);
    const showAmount = data.settings.share.includeAmount === true;
    const template = data.settings.share.template || 'strive';
    const pct = Math.round(state.progress * 100);
    return {
      dateKey: E.dateKey(now),
      dateLabel: (now.getMonth() + 1) + '月' + now.getDate() + '日',
      template,
      showAmount,
      progress: state.phase === 'off' ? 0 : state.progress,
      earnedText: money(state.earned),
      percentText: pct + '%',
      payoutLabel: state.payoutLabel,
      remainLabel: remainLabel(state),
      quote: E.quoteOfDay(now),
      phase: state.phase,
      phaseText: state.phaseText,
      heroLine: heroLine(state, showAmount, template)
    };
  }
  function updateShareNudge(state) {
    const box = $('shareNudge');
    if (!box) return;
    const key = E.dateKey(new Date());
    const show = !document.documentElement.classList.contains('embed') && state && state.configured && state.phase === 'after' && data.settings.share.lastSharePromptKey !== key;
    box.hidden = !show;
  }
  function shareText() {
    return window.QJShare ? QJShare.copyFor(shareViewing || liveShareSnapshot()) : '';
  }
  async function drawShare() {
    const canvas = $('shareCanvas'), ctx = canvas.getContext('2d');
    const snap = shareViewing || liveShareSnapshot();
    $('shareFallback').value = window.QJShare ? QJShare.copyFor(snap) : '';
    document.querySelectorAll('#shareTemplates button').forEach((button) => button.classList.toggle('on', button.dataset.template === snap.template));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1080, 1440);
    const mood = window.QJShare ? QJShare.hamsterMood(snap) : 'work';
    let hamster = null;
    if (snap.template !== 'minimal') {
      try { hamster = await hamsterImage(mood); } catch (e) {}
    }
    if (window.QJShare) QJShare.draw(ctx, snap, hamster);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = 'left';
  }
  async function hamsterImage(mood) {
    const source = H.svg(mood); const blob = new Blob([source], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob);
    try { const image = new Image(); await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; }); return image; } finally { setTimeout(() => URL.revokeObjectURL(url), 500); }
  }
  async function renderArchive() {
    const list = $('shareArchiveList');
    if (!list || !window.QJShare) return;
    const rows = await QJShare.loadArchive();
    if (!rows.length) { list.innerHTML = '<div class="empty">还没有归档。下载或复制后会出现在这里。</div>'; return; }
    const names = { strive: '上进', slack: '摸鱼', minimal: '极简' };
    list.innerHTML = rows.map((row) => '<button type="button" data-id="' + row.id + '"><b>' + (row.dateLabel || row.dateKey) + ' · ' + (names[row.template] || '上进') + '</b><span>' + (row.showAmount ? '含金额 · ' : '') + (row.percentText || '') + (row.remainLabel ? ' · ' + row.remainLabel : '') + '</span></button>').join('');
    list.querySelectorAll('button').forEach((button) => {
      button.onclick = () => {
        const item = rows.find((row) => String(row.id) === button.dataset.id);
        if (!item) return;
        shareViewing = item;
        $('shareAmount').checked = !!item.showAmount;
        drawShare();
        $('shareStatus').textContent = '正在回看 ' + (item.dateLabel || item.dateKey);
      };
    });
  }
  function bindShare() {
    const box = $('shareTemplates');
    box.innerHTML = QJShare.TEMPLATES.map((item) => '<button type="button" data-template="' + item.id + '"><b>' + item.name + '</b><small>' + item.hint + '</small></button>').join('');
    box.querySelectorAll('button').forEach((button) => {
      button.onclick = async () => {
        shareViewing = null;
        data.settings.share.template = button.dataset.template;
        await saveSettings();
        drawShare();
      };
    });
    $('shareAmount').onchange = async () => {
      shareViewing = null;
      data.settings.share.includeAmount = $('shareAmount').checked;
      await saveSettings();
      drawShare();
    };
    $('downloadShare').onclick = () => {
      shareViewing = null;
      drawShare().then(() => $('shareCanvas').toBlob((blob) => {
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = '前进-今日前进-' + E.dateKey(new Date()) + '.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        QJShare.remember(liveShareSnapshot()).then(renderArchive);
        $('shareStatus').textContent = '卡片已开始下载';
      }, 'image/png'));
    };
    $('copyShare').onclick = async () => {
      shareViewing = null;
      const text = shareText(); $('shareFallback').value = text;
      try { await navigator.clipboard.writeText(text); $('shareStatus').textContent = '文案已复制，可直接发朋友圈或同事群'; }
      catch (e) { $('shareFallback').focus(); $('shareFallback').select(); document.execCommand('copy'); $('shareStatus').textContent = '已选中文案，可手动复制'; }
      await QJShare.remember(liveShareSnapshot());
      renderArchive();
    };
  }
  function bindHome() {
    renderHeroMood('work');
    $('heroHamster').onclick = (event) => {
      QJAudio.unlock();
      if (event.shiftKey) { showPayout(8.88, 1800); return; }
      const box = $('heroHamster'); box.classList.remove('bounce'); void box.offsetWidth; box.classList.add('bounce');
      const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)]; $('cheer').dataset.manual = cheer; $('cheer').textContent = cheer;
      if (data.settings.soundMode === 'all') QJAudio.coin();
    };
    $('openSettings').onclick = () => go('Settings');
    $('openShare').onclick = () => { shareViewing = null; go('Share'); };
    $('shareNudgeGo').onclick = async () => {
      shareViewing = null;
      data.settings.share.lastSharePromptKey = E.dateKey(new Date());
      await saveSettings();
      go('Share');
    };
    $('shareNudgeDismiss').onclick = async () => {
      data.settings.share.lastSharePromptKey = E.dateKey(new Date());
      await saveSettings();
      $('shareNudge').hidden = true;
    };
    $('touchWidget').onclick = async () => {
      if (!(await hasPermission())) await requestPermission();
      go('Settings');
    };
    document.querySelectorAll('[data-back]').forEach((button) => { button.onclick = () => { shareViewing = null; go(button.dataset.back); }; });
    QJAudio.unlock();
  }
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) data.settings = S.normalizeSettings(changes.settings.newValue);
    if (changes.meta) data.meta = changes.meta.newValue;
    refreshHome();
  });
  S.load().then(async (value) => {
    data = value; lastPayout = E.getState(new Date(), data.settings); await loadActiveHost();
    bindHome(); bindSettings(); bindShare();
    setupOnboarding(); fillSettings(); refreshHome();
    QJAudio.unlock();
    if (QJAudio.warm) QJAudio.warm();
    const params = new URLSearchParams(location.search);
    const embedded = params.get('embed') === '1';
    if (embedded) document.documentElement.classList.add('embed');
    $('onboarding').hidden = embedded || data.meta.onboardingCompleted;
    if (!embedded && !data.meta.onboardingCompleted) showOnboardingStep(data.meta.onboardingStep || 0);
    if (!embedded && data.meta.onboardingCompleted && data.settings.widget.enabled && !data.meta.widgetPrompted) {
      const granted = await hasPermission();
      if (!granted) {
        data.meta.widgetPrompted = true;
        await chrome.storage.local.set({ meta: data.meta });
        await requestPermission();
        chrome.runtime.sendMessage({ type: 'QJ_REFRESH_REGISTRATION' }).catch(() => {});
        refreshPermissionUI();
      } else {
        data.meta.widgetPrompted = true;
        await chrome.storage.local.set({ meta: data.meta });
      }
    }
    const previewView = params.get('view');
    if (['Home', 'Settings', 'Share'].includes(previewView)) go(previewView);
    if (params.get('demo') === 'payout') {
      window.setTimeout(() => showPayout(Math.max(1.23, (E.getState(new Date(), data.settings).latestPayoutAmount || 12.34)), 1800), 700);
    }
    clearInterval(refreshTimer); refreshTimer = setInterval(refreshHome, 1000);
  });
  document.addEventListener('pointerdown', () => { if (window.QJAudio) QJAudio.unlock(); });
})();
