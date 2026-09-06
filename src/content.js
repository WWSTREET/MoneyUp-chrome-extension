/* 前进 MoneyUp 网页仓鼠：可选授权、隐私偷看、老板键、站点暂停、归一化位置。 */
(function () {
  'use strict';
  if (window.__QJ_V2_LOADED__) return;
  window.__QJ_V2_LOADED__ = true;

  const E = window.QJEngine;
  const H = window.QJHamster;
  const C = window.QJCurrency;
  const Cal = window.QJCalendar;
  const host = location.hostname;
  let data = QJStorage.freshData();
  let root = null, shadow = null, box = null, incomePop = null;
  let mode = 'pet', state = null, cardRefs = null, timer = null, hideTimer = null, enterTimer = null, leaveTimer = null;
  let revealBase = null, drag = null, lastPayout = null, petMood = '';
  let amountRolling = false, amountRollTimer = null, flyerAnim = null;

  const CSS = `
    :host,*{box-sizing:border-box}button{font:inherit}
    #qj-v2-box{position:fixed;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Noto Sans CJK SC","Microsoft YaHei",Arial,sans-serif;color:rgba(0,0,0,.9);user-select:none;pointer-events:auto}
    .pet{width:86px;cursor:grab;filter:drop-shadow(0 6px 12px rgba(0,0,0,.16));outline:none}
    .pet:focus-visible{border-radius:24px;box-shadow:0 0 0 4px rgba(7,193,96,.28)}
    .pet .qj-hamster{width:86px;height:81px;display:block}
    .bubble{position:absolute;left:50%;top:-8px;transform:translateX(-50%);background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:999px;padding:4px 9px;color:rgba(0,0,0,.55);font-size:11px;font-weight:500;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.12)}
    .bubble:empty{display:none}.qj-line{fill:none;stroke:#6d4025;stroke-width:3;stroke-linecap:round}.qj-eye{fill:#47301f}
    .qj-wave{transform-origin:119px 103px;animation:qjWave 1.7s ease-in-out infinite}
    .qj-breathe{transform-origin:80px 118px;animation:qjBreathe 4s ease-in-out infinite}
    .qj-type-left{transform-origin:52px 105px;animation:qjTypeLeft 2.6s ease-in-out infinite}
    .qj-type-right{transform-origin:108px 105px;animation:qjTypeRight 2.6s ease-in-out infinite}
    .qj-laptop{transform-origin:80px 128px;animation:qjLaptopTap 2.6s ease-in-out infinite}
    .qj-blink-l{transform-origin:62px 62px;animation:qjBlink 4.2s cubic-bezier(.2,0,.15,1) infinite}
    .qj-blink-r{transform-origin:98px 62px;animation:qjBlink 4.2s cubic-bezier(.2,0,.15,1) infinite}
    .qj-coin{opacity:0}.qj-coin.drop{animation:qjCoin 2.6s ease-in-out both}.qj-seed{animation:qjSeed 2.8s ease-in-out infinite}.qj-zzz{animation:qjZzz 1.8s ease-in-out infinite}
    .qj-cheek-left{transform-origin:49px 82px;transform:scale(var(--cheek,1))}.qj-cheek-right{transform-origin:111px 82px;transform:scale(var(--cheek,1))}.qj-cheek{transition:transform .45s ease}
    .pet.qj-ingest .qj-cheek-left,.pet.qj-ingest .qj-cheek-right,.card.qj-ingest .qj-cheek-left,.card.qj-ingest .qj-cheek-right{transform:scale(1.26)}
    @keyframes qjBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,1.045)}}
    @keyframes qjWave{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(12deg)}}
    @keyframes qjTypeLeft{0%,10%{transform:translateY(0)}14%{transform:translateY(3.5px)}20%{transform:translateY(0)}32%{transform:translateY(3.2px)}38%{transform:translateY(0)}46%{transform:translateY(2.4px)}52%,100%{transform:translateY(0)}}
    @keyframes qjTypeRight{0%,16%{transform:translateY(0)}22%{transform:translateY(3.5px)}28%{transform:translateY(0)}40%{transform:translateY(3.2px)}46%{transform:translateY(0)}52%,100%{transform:translateY(0)}}
    @keyframes qjLaptopTap{0%,12%,20%,30%,38%,50%,100%{transform:rotate(0)}14%,22%,32%,40%{transform:rotate(.55deg) translateY(.35px)}}
    @keyframes qjBlink{0%,91%,100%{transform:scaleY(1)}93.6%{transform:scaleY(.08)}}
    @keyframes qjCoin{0%{opacity:0;transform:translateY(-8px) rotate(0deg)}10%{opacity:1;transform:translateY(30px) rotate(60deg)}30%{opacity:1;transform:translateY(70px) rotate(180deg)}60%{opacity:.8;transform:translateY(80px) rotate(300deg)}100%{opacity:0;transform:translateY(80px) rotate(360deg)}}
    @keyframes qjSeed{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
    @keyframes qjZzz{0%,100%{opacity:.35;transform:translateY(4px)}50%{opacity:1;transform:translateY(-3px)}}
    .card{width:288px;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:16px;padding:14px;box-shadow:0 12px 36px rgba(0,0,0,.18);cursor:default}
    .sheet{width:380px;height:min(560px,calc(100vh - 24px));background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column;cursor:default}
    .sheet iframe{flex:1 1 auto;width:100%;min-height:0;height:100%;border:0;background:#f7f7f7}
    .head{display:flex;align-items:center;gap:9px}.head .qj-hamster{width:60px;height:56px}.eyebrow{font-size:11px;color:rgba(0,0,0,.55);font-weight:500}
    .amount{display:inline-flex;align-items:flex-end;height:32px;font-size:26px;line-height:32px;color:#07c160;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.5px;transform-origin:left bottom;transition:color .2s,transform .25s}
    .amount.is-rolling{color:#059a4c;transform:scale(1.05)}
    .od-sym{display:inline-block;padding:0 1px}.od-digit{display:inline-block;width:.62em;height:32px;overflow:hidden;text-align:center;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 18%,#000 82%,transparent);mask-image:linear-gradient(to bottom,transparent,#000 18%,#000 82%,transparent)}
    .od-reel{display:flex;flex-direction:column;will-change:transform}.od-reel b{display:block;height:32px;line-height:32px;font-weight:700}
    .progress{height:6px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;margin:11px 0 5px}.progress i{display:block;height:100%;background:#07c160;border-radius:inherit;transition:width .35s}.sub{display:flex;justify-content:space-between;color:rgba(0,0,0,.55);font-size:10px}
    .expect{margin-top:8px;border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.5;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}.quote{border-top:1px solid rgba(0,0,0,.1);margin-top:9px;padding-top:8px;color:rgba(0,0,0,.55);font-size:11px;line-height:1.55}.delta{display:inline-block;margin-top:3px;color:#059a4c;font-size:10px;font-weight:700}
    .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.actions button{min-height:36px;border:0;border-radius:8px;padding:8px 5px;background:rgba(0,0,0,.05);color:rgba(0,0,0,.9);font-size:11px;font-weight:500;cursor:pointer}.actions button:hover{background:rgba(0,0,0,.1)}.actions button:focus-visible{outline:2px solid rgba(7,193,96,.45);outline-offset:2px}.actions [data-act=settings]{background:#07c160;color:#fff}.actions [data-act=settings]:hover{background:#059a4c}
    #qj-v2-box.clock{min-width:168px;padding:12px 16px 10px;background:#fff;color:#111;border:1px solid rgba(0,0,0,.12);border-radius:14px;text-align:center;box-shadow:0 12px 28px rgba(0,0,0,.16);cursor:pointer;outline:none;color-scheme:light}
    #qj-v2-box.clock:focus-visible{box-shadow:0 0 0 4px rgba(7,193,96,.28),0 12px 28px rgba(0,0,0,.16)}
    #qj-v2-box.clock strong{display:block;color:#111;font-size:28px;line-height:1.15;letter-spacing:1px;font-weight:700;font-variant-numeric:tabular-nums}
    #qj-v2-box.clock span{display:block;color:rgba(17,17,17,.55);font-size:11px;margin-top:4px}
    #qj-v2-box.clock small{display:block;color:#059a4c;font-size:10px;font-weight:500;margin-top:8px}
    .income-pop{position:fixed;left:0;top:0;z-index:2147483647;padding:7px 13px;background:#07c160;color:#fff;border-radius:999px;box-shadow:0 10px 24px rgba(7,193,96,.36);font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.02em;white-space:nowrap;opacity:0;pointer-events:none;will-change:transform,opacity}
    @media(prefers-reduced-motion:reduce){.qj-wave,.qj-type-left,.qj-type-right,.qj-seed,.qj-zzz,.qj-coin.drop,.qj-breathe,.qj-laptop,.qj-blink-l,.qj-blink-r{animation:none!important}.qj-cheek,.progress i,.amount{transition:none!important}}
  `;

  function shouldMount() {
    return data.settings.widget.enabled && !data.settings.widget.pausedHosts.includes(host);
  }
  function money(value, digits) {
    const currency = data.settings.currency;
    return C.format(value, currency.baseCode, currency.displayCode, Number.isInteger(digits) ? { digits } : undefined);
  }
  function payoutFeedback(amount) {
    const currency = data.settings.currency;
    return C.plusLabel(amount, currency.baseCode, currency.displayCode);
  }
  function maskedMoney() {
    const mode = data.settings.privacyMode;
    if (mode === 'exact') return money(state.earned);
    if (mode === 'rough') {
      const currency = data.settings.currency;
      const converted = C.convert(state.earned, currency.baseCode, currency.displayCode);
      return '≈' + C.format(Math.round(converted / 10) * 10, currency.displayCode, currency.displayCode, { digits: 0 });
    }
    if (mode === 'percent') return '今日 ' + Math.round(state.dayTotal > 0 ? state.earned / state.dayTotal * 100 : 0) + '%';
    return '';
  }
  function getPosition() {
    const pos = data.settings.widget.position;
    const width = box ? box.offsetWidth : 86, height = box ? box.offsetHeight : 82;
    if (!pos) return { x: Math.max(8, innerWidth - width - 24), y: Math.max(8, innerHeight - height - 100) };
    return {
      x: Math.round(E.clamp(pos.xRatio, 0, 1) * Math.max(0, innerWidth - width - 8)) + 4,
      y: Math.round(E.clamp(pos.yRatio, 0, 1) * Math.max(0, innerHeight - height - 8)) + 4
    };
  }
  function applyPosition() {
    if (!box) return;
    const p = getPosition(); box.style.left = p.x + 'px'; box.style.top = p.y + 'px';
  }
  function mount() {
    if (root || !shouldMount()) return;
    root = document.createElement('div'); root.id = 'qj-v2-root';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    shadow = root.attachShadow({ mode: 'open' });
    const style = document.createElement('style'); style.textContent = CSS; shadow.appendChild(style);
    box = document.createElement('div'); box.id = 'qj-v2-box'; shadow.appendChild(box);
    incomePop = document.createElement('div'); incomePop.className = 'income-pop'; shadow.appendChild(incomePop);
    document.documentElement.appendChild(root);
    bind(); setMode('pet'); tick();
    if (window.QJAudio) {
      QJAudio.unlock();
      if (QJAudio.warm) QJAudio.warm();
    }
  }
  function destroy() {
    clearTimeout(timer); clearTimeout(hideTimer); clearTimeout(enterTimer); clearTimeout(leaveTimer); clearTimeout(amountRollTimer);
    if (flyerAnim) { flyerAnim.cancel(); flyerAnim = null; }
    if (root) root.remove();
    root = shadow = box = incomePop = cardRefs = null; mode = 'pet'; petMood = ''; amountRolling = false;
  }
  function renderPet() {
    petMood = state && state.phase === 'off' ? 'rest' : 'coding';
    cardRefs = null; box.className = 'pet'; box.tabIndex = 0; box.setAttribute('role', 'button'); box.setAttribute('aria-label', '正在努力工作的带薪仓鼠，打开钱进详情');
    box.innerHTML = `<div class="bubble"></div>${H.svg(petMood)}`;
    applyPosition(); updatePet();
  }
  function renderCard() {
    box.className = 'card'; box.removeAttribute('tabindex'); box.removeAttribute('role');
    box.innerHTML = `<div class="head">${H.svg('coding')}<div><div class="eyebrow">今天截至当前共收入</div><div class="amount" data-r="amount"></div><div class="delta" data-r="delta"></div></div></div>
      <div class="progress"><i data-r="bar"></i></div><div class="sub"><span data-r="pct"></span><span data-r="remainTime"></span></div>
      <div class="expect" data-r="expect"></div><div class="quote" data-r="quote"></div>
      <div class="actions"><button data-act="settings" aria-label="打开前进 MoneyUp 设置面板">⚙ 设置</button><button data-act="boss">伪装时钟</button><button data-act="pause">本站暂停</button><button data-act="pet">收起</button></div>`;
    cardRefs = {}; box.querySelectorAll('[data-r]').forEach((el) => { cardRefs[el.dataset.r] = el; });
    box.querySelector('[data-act=boss]').onclick = (event) => { event.stopPropagation(); setMode('boss'); };
    box.querySelector('[data-act=pet]').onclick = (event) => { event.stopPropagation(); setMode('pet'); };
    box.querySelector('[data-act=settings]').onclick = (event) => { event.stopPropagation(); setMode('settings'); };
    box.querySelector('[data-act=pause]').onclick = async (event) => {
      event.stopPropagation();
      const settings = QJStorage.normalizeSettings(data.settings);
      settings.widget.pausedHosts = [...new Set([...settings.widget.pausedHosts, host])];
      data.settings = settings; await chrome.storage.local.set({ settings }); destroy();
    };
    updateCard(); requestAnimationFrame(keepInView);
  }
  function renderClock() {
    cardRefs = null; box.className = 'clock'; box.tabIndex = 0; box.setAttribute('role', 'button'); box.setAttribute('aria-label', '伪装时钟，点击恢复仓鼠');
    box.innerHTML = '<strong data-clock>00:00:00</strong><span data-date></span><small>点击恢复仓鼠</small>';
    applyPosition(); updateClock();
  }
  function updateClock() {
    if (!box || mode !== 'boss') return;
    const now = new Date(); const week = '日一二三四五六'[now.getDay()];
    box.querySelector('[data-clock]').textContent = E.pad2(now.getHours()) + ':' + E.pad2(now.getMinutes()) + ':' + E.pad2(now.getSeconds());
    box.querySelector('[data-date]').textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日 周' + week + ' · 专注中';
  }
  function updatePet() {
    if (!box || mode !== 'pet' || !state) return;
    const bubble = box.querySelector('.bubble'); if (bubble) bubble.textContent = maskedMoney();
    box.style.setProperty('--cheek', (1 + state.progress * .23).toFixed(3));
  }
  function updateCard() {
    if (!cardRefs || !state) return;
    const holiday = Cal.nextHoliday(new Date(), data.settings.calendar.region), weekend = Cal.weekend(new Date());
    const pct = Math.round(state.progress * 100);
    if (!amountRolling) setAmountDisplay(state.earned, false);
    if (state.phase === 'working') {
      cardRefs.delta.textContent = '下一笔，' + E.fmtDuration(state.untilNextPayoutSec) + ' 后到账';
    } else {
      cardRefs.delta.textContent = state.phaseText;
    }
    cardRefs.bar.style.width = pct + '%'; cardRefs.pct.textContent = '今日 ' + pct + '%';
    cardRefs.remainTime.textContent = state.phase === 'after' ? '已收工' : '距下班 ' + E.fmtDuration(state.remainSec);
    cardRefs.expect.textContent = '✦ ' + holiday.name + ' ' + holiday.text + ' · ' + weekend.text;
    cardRefs.quote.textContent = E.quoteOfDay();
  }
  function renderSettings() {
    cardRefs = null;
    box.className = 'sheet';
    box.removeAttribute('tabindex');
    box.removeAttribute('role');
    const src = chrome.runtime.getURL('src/popup.html?view=Settings&embed=1');
    box.innerHTML = '<iframe title="前进 MoneyUp 设置" src="' + src + '" scrolling="yes"></iframe>';
    applyPosition();
    requestAnimationFrame(keepInView);
  }
  function keepInView() {
    if (!box || (mode !== 'reveal' && mode !== 'settings')) return;
    const rect = box.getBoundingClientRect(); let x = rect.left, y = rect.top;
    if (rect.right > innerWidth - 6) x -= rect.right - innerWidth + 6;
    if (rect.bottom > innerHeight - 6) y -= rect.bottom - innerHeight + 6;
    x = Math.max(6, x); y = Math.max(6, y); box.style.left = x + 'px'; box.style.top = y + 'px';
  }
  function setMode(next, source) {
    if (!box) return;
    clearTimeout(hideTimer); mode = next;
    if (next === 'reveal') { renderCard(); if (source !== 'hover') scheduleHide(); }
    else if (next === 'settings') { renderSettings(); }
    else if (next === 'boss') { revealBase = state ? state.earned : revealBase; renderClock(); }
    else { revealBase = state ? state.earned : revealBase; renderPet(); }
    schedule();
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (mode === 'reveal') setMode('pet'); }, data.settings.widget.autoHideSec * 1000);
  }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function paintOdometer(el, text, animate) {
    const DIGIT_H = 32;
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
  function setAmountDisplay(value, animate) {
    if (!cardRefs || !cardRefs.amount) return;
    paintOdometer(cardRefs.amount, money(value), animate && !reduceMotion());
  }
  function flyPayout(label) {
    if (!incomePop || !box) return;
    if (flyerAnim) { flyerAnim.cancel(); flyerAnim = null; }
    incomePop.textContent = label;
    const motion = window.QJPayoutMotion;
    incomePop.style.opacity = '0';
    incomePop.style.transform = 'translate(0,0)';
    const fw = incomePop.offsetWidth || 92, fh = incomePop.offsetHeight || 32;
    const boxRect = box.getBoundingClientRect();
    if (mode === 'pet' && motion && motion.petKeyframes) {
      const startX = boxRect.left + boxRect.width / 2 - fw / 2;
      const startY = Math.max(8, boxRect.top - fh - 6);
      const endX = startX;
      const endY = boxRect.top + boxRect.height * 0.5 - fh / 2;
      incomePop.style.transform = 'translate(' + startX + 'px,' + startY + 'px) scale(.9)';
      if (reduceMotion()) {
        incomePop.style.opacity = '1';
        window.setTimeout(() => { incomePop.style.opacity = '0'; }, 1200);
        return;
      }
      flyerAnim = motion.play(incomePop, motion.petKeyframes(startX, startY, endX, endY), motion.PET_DURATION);
      if (flyerAnim) flyerAnim.onfinish = () => { incomePop.style.opacity = '0'; flyerAnim = null; };
      return;
    }
    if (mode === 'reveal' && motion && motion.petKeyframes && cardRefs && cardRefs.amount) {
      const hamster = box.querySelector('.qj-hamster');
      const amountRect = cardRefs.amount.getBoundingClientRect();
      const hamRect = hamster ? hamster.getBoundingClientRect() : boxRect;
      const startX = Math.min(innerWidth - fw - 8, amountRect.right + 8);
      const startY = amountRect.top + amountRect.height / 2 - fh / 2;
      const endX = hamRect.left + hamRect.width * 0.5 - fw / 2;
      const endY = hamRect.top + hamRect.height * 0.52 - fh / 2;
      incomePop.style.transform = 'translate(' + startX + 'px,' + startY + 'px) scale(.9)';
      if (reduceMotion()) {
        incomePop.style.opacity = '1';
        window.setTimeout(() => { incomePop.style.opacity = '0'; }, 1200);
        return;
      }
      flyerAnim = motion.play(incomePop, motion.petKeyframes(startX, startY, endX, endY), motion.PET_DURATION);
      if (flyerAnim) flyerAnim.onfinish = () => { incomePop.style.opacity = '0'; flyerAnim = null; };
      return;
    }
    const target = box;
    const targetRect = target.getBoundingClientRect();
    const startX = innerWidth - fw - 16;
    const startY = 14;
    const endX = targetRect.left + targetRect.width / 2 - fw / 2;
    const endY = targetRect.top + targetRect.height / 2 - fh / 2;
    const midX = startX * 0.22 + endX * 0.78;
    const midY = Math.max(8, Math.min(startY, endY) - 18);
    incomePop.style.transform = 'translate(' + startX + 'px,' + startY + 'px) scale(.74)';
    if (reduceMotion() || !motion) return;
    flyerAnim = motion.play(incomePop, motion.keyframes(startX, startY, midX, midY, endX, endY));
    if (flyerAnim) flyerAnim.onfinish = () => { incomePop.style.opacity = '0'; flyerAnim = null; };
  }
  function showPayout(amount) {
    if (!box || !state) return;
    const fromValue = Math.max(0, state.earned - amount);
    const motion = window.QJPayoutMotion || { ROLL_AT: 800, SETTLE: 1450, PET_ROLL_AT: 1100, PET_DURATION: 2000 };
    const ingest = mode === 'pet' || mode === 'reveal';
    const rollAt = ingest ? motion.PET_ROLL_AT : motion.ROLL_AT;
    const settle = ingest ? (motion.PET_DURATION || 1680) : motion.SETTLE;
    amountRolling = true;
    clearTimeout(amountRollTimer);
    if (cardRefs && cardRefs.amount) setAmountDisplay(fromValue, false);
    flyPayout(payoutFeedback(amount));
    if (window.QJAudio) {
      QJAudio.unlock();
      if (QJAudio.warm) QJAudio.warm();
    }
    const playSound = state.payoutIntervalSec >= 60 && data.settings.soundMode !== 'mute';
    if (playSound) QJAudio.coinDrop(reduceMotion() ? 0 : rollAt);
    const startRoll = () => {
      if (cardRefs && cardRefs.amount) setAmountDisplay(state.earned, true);
      const coin = box.querySelector('.qj-coin');
      if (coin) { coin.classList.remove('drop'); void coin.getBoundingClientRect(); coin.classList.add('drop'); }
      if (ingest) {
        box.classList.add('qj-ingest');
        window.setTimeout(() => { if (box) box.classList.remove('qj-ingest'); }, 700);
      }
    };
    if (reduceMotion()) startRoll();
    else window.setTimeout(startRoll, rollAt);
    amountRollTimer = setTimeout(() => {
      amountRolling = false;
      if (cardRefs && cardRefs.amount) setAmountDisplay(state.earned, false);
    }, (reduceMotion() ? 0 : rollAt) + settle);
  }
  function payoutEvent() {
    if (!state) return;
    if (lastPayout === null) { lastPayout = state; return; }
    const previous = lastPayout; lastPayout = state;
    if (document.hidden || previous.anchorKey !== state.anchorKey || state.payoutIndex <= previous.payoutIndex || state.latestPayoutAmount <= 0) return;
    chrome.runtime.sendMessage({ type: 'QJ_CLAIM_PAYOUT', key: state.payoutKey }).then((answer) => {
      if (!answer || !answer.play || !box) return;
      const coin = box.querySelector('.qj-coin'); if (coin) { coin.classList.remove('drop'); void coin.getBoundingClientRect(); coin.classList.add('drop'); }
      showPayout(state.latestPayoutAmount);
    }).catch(() => {});
  }
  function tick() {
    if (!root) return;
    state = E.getState(new Date(), data.settings); payoutEvent();
    if (mode === 'pet') {
      const nextMood = state.phase === 'off' ? 'rest' : 'coding';
      if (nextMood !== petMood) renderPet(); else updatePet();
    } else if (mode === 'reveal') updateCard(); else updateClock();
    schedule();
  }
  function schedule() {
    clearTimeout(timer); if (!root) return;
    const delay = document.hidden ? 30000 : mode === 'reveal' ? 250 : 1000;
    timer = setTimeout(tick, delay);
  }
  function bind() {
    box.addEventListener('mouseenter', () => {
      clearTimeout(leaveTimer); clearTimeout(hideTimer); QJAudio.unlock();
      if (mode === 'pet') enterTimer = setTimeout(() => setMode('reveal', 'hover'), 150);
    });
    box.addEventListener('mouseleave', () => {
      clearTimeout(enterTimer); clearTimeout(hideTimer);
      if (mode === 'reveal') leaveTimer = setTimeout(() => setMode('pet'), 80);
    });
    box.addEventListener('keydown', (event) => {
      if (mode === 'pet' && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setMode('reveal', 'keyboard'); }
      if (mode === 'boss' && (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape')) { event.preventDefault(); setMode('pet'); }
      else if (event.key === 'Escape' && mode === 'settings') { event.preventDefault(); setMode('reveal', 'keyboard'); }
      else if (event.key === 'Escape') setMode('pet');
    });
    box.addEventListener('pointerdown', (event) => {
      clearTimeout(enterTimer); QJAudio.unlock();
      if (mode === 'reveal' || mode === 'settings') return;
      const rect = box.getBoundingClientRect();
      drag = { startX: event.clientX, startY: event.clientY, dx: event.clientX - rect.left, dy: event.clientY - rect.top, moved: false };
      box.setPointerCapture(event.pointerId);
    });
    box.addEventListener('pointermove', (event) => {
      if (!drag) return;
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) drag.moved = true;
      const x = E.clamp(event.clientX - drag.dx, 4, Math.max(4, innerWidth - box.offsetWidth - 4));
      const y = E.clamp(event.clientY - drag.dy, 4, Math.max(4, innerHeight - box.offsetHeight - 4));
      box.style.left = x + 'px'; box.style.top = y + 'px';
    });
    box.addEventListener('pointerup', async () => {
      if (!drag) return;
      if (!drag.moved && mode === 'pet') setMode('reveal', 'click');
      else if (!drag.moved && mode === 'boss') setMode('pet');
      else if (drag.moved) {
        const rect = box.getBoundingClientRect(); const settings = QJStorage.normalizeSettings(data.settings);
        settings.widget.position = {
          xRatio: E.clamp((rect.left - 4) / Math.max(1, innerWidth - rect.width - 8), 0, 1),
          yRatio: E.clamp((rect.top - 4) / Math.max(1, innerHeight - rect.height - 8), 0, 1)
        };
        data.settings = settings; await chrome.storage.local.set({ settings });
      }
      drag = null;
    });
  }

  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('pointerdown', () => { if (window.QJAudio) QJAudio.unlock(); }, true);
  window.addEventListener('resize', () => { applyPosition(); keepInView(); });
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'QJ_CLOSE_SETTINGS' && mode === 'settings') setMode('reveal', 'keyboard');
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      data.settings = QJStorage.normalizeSettings(changes.settings.newValue);
      lastPayout = E.getState(new Date(), data.settings);
    }
    if (shouldMount()) { if (!root) mount(); else tick(); } else destroy();
  });
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'QJ_DESTROY') destroy();
    if (message && message.type === 'QJ_TOGGLE_BOSS' && root) setMode(mode === 'boss' ? 'pet' : 'boss');
  });

  QJStorage.load().then((value) => { data = value; if (shouldMount()) mount(); });
})();
