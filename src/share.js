/* 今日前进：三套卡片模板、配套文案、本机战报夹。 */
(function (global) {
  'use strict';

  const TEMPLATES = [
    { id: 'strive', name: '上进', hint: '认真上进' },
    { id: 'slack', name: '摸鱼', hint: '幽默自嘲' },
    { id: 'minimal', name: '极简', hint: '只看数据' }
  ];
  const ARCHIVE_KEY = 'shareArchive';
  const ARCHIVE_MAX = 30;

  function roundRect(ctx, x, y, w, h, r, fill) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = String(text || '');
    const lines = [];
    let line = '';
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else line = test;
    }
    if (line) lines.push(line);
    const used = lines.slice(0, maxLines || 4);
    used.forEach((item, i) => ctx.fillText(item, x, y + i * lineHeight));
    return used.length;
  }

  function copyFor(snapshot) {
    const pct = Math.round((snapshot.progress || 0) * 100);
    const quote = snapshot.quote || '';
    const brand = '前进 MoneyUp，向钱，向上！';
    if (snapshot.phase === 'off') {
      if (snapshot.template === 'minimal') return '今日休息\n仓鼠不上班\n' + quote + '\n' + brand;
      if (snapshot.template === 'slack') return '今日休息，仓鼠不上班。摸鱼也要有仪式感。\n' + brand;
      return '今日休息。仓鼠先囤粮，人也该歇口气。\n' + quote + '\n' + brand;
    }
    if (snapshot.template === 'slack') {
      const money = snapshot.showAmount ? '口袋里已经有 ' + snapshot.earnedText + '。' : '';
      return '摸鱼可以，进账不停。我的带薪仓鼠今天钱进 ' + pct + '%。' + (money ? '\n' + money : '') + '\n前进 MoneyUp，向钱，向上！';
    }
    if (snapshot.template === 'minimal') {
      const lines = ['今日进度 ' + pct + '%'];
      if (snapshot.showAmount) lines.push('今日已到账 ' + snapshot.earnedText);
      if (snapshot.remainLabel) lines.push(snapshot.remainLabel);
      lines.push(quote, brand);
      return lines.join('\n');
    }
    if (snapshot.showAmount) {
      return '今日前进 ' + pct + '% · 已到账 ' + snapshot.earnedText + '。\n“' + quote + '”\n' + brand;
    }
    return '今日前进 ' + pct + '%。每一秒都在向上进账。\n“' + quote + '”\n' + brand;
  }

  function drawBrand(ctx, y) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';
    ctx.font = '700 32px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    ctx.fillText('前进 MoneyUp', 540, y);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.font = '500 23px sans-serif';
    ctx.fillText('向钱，向上', 540, y + 40);
  }

  function drawStrive(ctx, snap, hamster) {
    ctx.fillStyle = '#ededed';
    ctx.fillRect(0, 0, 1080, 1440);
    roundRect(ctx, 40, 40, 1000, 1360, 28, '#ffffff');
    ctx.fillStyle = '#111827';
    ctx.font = '700 54px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('前进 MoneyUp', 80, 122);
    roundRect(ctx, 80, 148, 188, 48, 12, '#ecfdf5');
    ctx.fillStyle = '#059669';
    ctx.font = '600 24px sans-serif';
    ctx.fillText('向钱，向上', 96, 180);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.font = '500 26px sans-serif';
    ctx.fillText(snap.dateLabel + ' · 今日前进', 1000, 122);
    if (hamster) ctx.drawImage(hamster, 310, 210, 460, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.font = '500 28px sans-serif';
    ctx.fillText(snap.phaseText, 540, 660);
    ctx.fillStyle = '#07c160';
    ctx.font = '700 112px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    ctx.fillText(snap.showAmount ? snap.earnedText : snap.percentText, 540, 790);
    ctx.fillStyle = '#111827';
    ctx.font = '600 34px sans-serif';
    ctx.fillText(snap.heroLine, 540, 848);
    roundRect(ctx, 100, 900, 880, 20, 10, '#f3f4f6');
    roundRect(ctx, 100, 900, 880 * snap.progress, 20, 10, '#07c160');
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.font = '600 26px sans-serif';
    ctx.fillText('今日进度 ' + snap.percentText, 100, 968);
    ctx.textAlign = 'right';
    ctx.fillText(snap.remainLabel, 980, 968);
    roundRect(ctx, 100, 1010, 420, 170, 18, '#fffbeb');
    roundRect(ctx, 560, 1010, 420, 170, 18, '#ecfdf5');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d97706';
    ctx.font = '600 26px sans-serif';
    ctx.fillText('工时', 140, 1064);
    ctx.fillStyle = '#111827';
    ctx.font = '700 38px sans-serif';
    ctx.fillText(snap.remainLabel || '—', 140, 1124);
    ctx.fillStyle = '#047857';
    ctx.font = '600 26px sans-serif';
    ctx.fillText('向上有迹可循', 600, 1064);
    ctx.fillStyle = '#111827';
    ctx.font = '700 36px sans-serif';
    ctx.fillText('一点点 Up', 600, 1124);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.font = '500 26px sans-serif';
    wrapText(ctx, '“' + snap.quote + '”', 540, 1248, 860, 36, 2);
    drawBrand(ctx, 1348);
  }

  function drawSlack(ctx, snap, hamster) {
    ctx.fillStyle = '#f6efe4';
    ctx.fillRect(0, 0, 1080, 1440);
    roundRect(ctx, 48, 48, 984, 1344, 36, '#fffaf3');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9a571d';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('带薪仓鼠出勤记录', 92, 128);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.font = '500 24px sans-serif';
    ctx.fillText(snap.dateLabel, 988, 128);
    if (hamster) ctx.drawImage(hamster, 270, 170, 540, 500);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c47b26';
    ctx.font = '700 40px PingFang SC, sans-serif';
    ctx.fillText(snap.phase === 'off' ? '今日休息，仓鼠不上班' : '摸鱼可以，进账不停', 540, 720);
    ctx.fillStyle = '#07c160';
    ctx.font = '700 120px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    ctx.fillText(snap.showAmount ? snap.earnedText : snap.percentText, 540, 860);
    ctx.fillStyle = '#6d4025';
    ctx.font = '600 30px sans-serif';
    ctx.fillText(snap.heroLine, 540, 918);
    roundRect(ctx, 120, 970, 840, 88, 20, '#fff3d6');
    ctx.fillStyle = '#9a571d';
    ctx.font = '600 28px sans-serif';
    ctx.fillText(snap.remainLabel || snap.phaseText, 540, 1026);
    ctx.fillStyle = 'rgba(109,64,37,.7)';
    ctx.font = '500 26px sans-serif';
    wrapText(ctx, snap.quote, 540, 1140, 820, 38, 2);
    drawBrand(ctx, 1320);
  }

  function drawMinimal(ctx, snap) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = '#07c160';
    ctx.fillRect(0, 0, 1080, 8);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.font = '500 24px sans-serif';
    ctx.fillText('MONEYUP', 80, 90);
    ctx.textAlign = 'right';
    ctx.fillText(snap.dateLabel, 1000, 90);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = '600 28px sans-serif';
    ctx.fillText('今日前进', 80, 280);
    ctx.font = '700 160px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    ctx.fillText(snap.showAmount ? snap.earnedText : snap.percentText, 80, 460);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.font = '500 28px sans-serif';
    ctx.fillText(snap.heroLine, 80, 520);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(80, 580, 920, 1);
    const rows = [
      ['状态', snap.phaseText],
      ['进度', snap.percentText],
      ['工时', snap.remainLabel]
    ];
    if (snap.showAmount) rows.splice(2, 0, ['今日已到账', snap.earnedText]);
    rows.forEach((row, i) => {
      const y = 660 + i * 88;
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.font = '500 24px sans-serif';
      ctx.fillText(row[0], 80, y);
      ctx.fillStyle = '#111827';
      ctx.font = '600 32px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(row[1], 1000, y);
      ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(80, 1160, 920, 1);
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.font = '500 26px sans-serif';
    wrapText(ctx, snap.quote, 80, 1220, 920, 36, 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('前进 MoneyUp', 80, 1360);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.font = '500 22px sans-serif';
    ctx.fillText('向钱，向上', 80, 1396);
  }

  function draw(ctx, snapshot, hamster) {
    const snap = snapshot || {};
    if (snap.template === 'slack') drawSlack(ctx, snap, hamster);
    else if (snap.template === 'minimal') drawMinimal(ctx, snap);
    else drawStrive(ctx, snap, hamster);
  }

  function hamsterMood(snapshot) {
    if (!snapshot) return 'work';
    if (snapshot.phase === 'off') return 'sleep';
    if (snapshot.template === 'slack') return 'coding';
    if (snapshot.template === 'minimal') return 'work';
    return snapshot.phase === 'after' ? 'rest' : 'work';
  }

  async function loadArchive() {
    if (!global.chrome || !chrome.storage || !chrome.storage.local) return [];
    const raw = await chrome.storage.local.get(ARCHIVE_KEY);
    return Array.isArray(raw[ARCHIVE_KEY]) ? raw[ARCHIVE_KEY] : [];
  }

  async function remember(snapshot) {
    if (!snapshot) return [];
    const item = {
      id: Date.now(),
      dateKey: snapshot.dateKey,
      dateLabel: snapshot.dateLabel,
      template: snapshot.template,
      showAmount: !!snapshot.showAmount,
      progress: snapshot.progress,
      earnedText: snapshot.showAmount ? snapshot.earnedText : '',
      percentText: snapshot.percentText,
      payoutLabel: snapshot.payoutLabel,
      remainLabel: snapshot.remainLabel,
      quote: snapshot.quote,
      phase: snapshot.phase,
      phaseText: snapshot.phaseText,
      heroLine: snapshot.heroLine
    };
    const list = await loadArchive();
    const next = [item, ...list.filter((row) => !(row.dateKey === item.dateKey && row.template === item.template))].slice(0, ARCHIVE_MAX);
    await chrome.storage.local.set({ [ARCHIVE_KEY]: next });
    return next;
  }

  global.QJShare = { TEMPLATES, copyFor, draw, hamsterMood, loadArchive, remember };
})(typeof globalThis !== 'undefined' ? globalThis : this);
