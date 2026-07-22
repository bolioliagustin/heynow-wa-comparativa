/* ============================================================
   Heynow — Demo Engine
   Motor de animación reutilizado por builder.html y player.html.
   Reproduce exactamente el comportamiento de index.html y
   flow-webchat.html (teléfono WA, WhatsApp Flow multi-pantalla,
   navegador webchat a pantalla completa) a partir de un objeto
   de configuración declarativo, para cualquier número de columnas.

   Uso:
     const controller = DemoEngine.mount(containerEl, demoConfig, {
       onStateChange(state){ ... } // 'idle' | 'running' | 'paused' | 'done'
     });
     controller.play();
     controller.togglePause();
     controller.destroy();
   ============================================================ */
(function (global) {
  'use strict';

  const TICK = '<span class="tick"><svg viewBox="0 0 18 12" fill="none"><path d="M1 6.5l3 3L10 3" stroke="#53BDEB" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 9.5L12.5 3" stroke="#53BDEB" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  const FLOW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h5"/></svg>';
  const SEND_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.39 1.2L4 11.5l9 .5-9 .5-1.99 6.7a1 1 0 0 0 1.39 1.2z"/></svg>';

  function shieldIcon(cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="currentColor"><path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2zm-8 0V7a3 3 0 0 1 6 0v2H9z"/></svg>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clock(h, m) {
    return function () {
      const t = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      m++; if (m >= 60) { m = 0; h++; }
      return t;
    };
  }

  function initialsFrom(name) {
    if (!name) return 'HN';
    const parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w[0]; }).join('').toUpperCase() || 'HN';
  }

  function renderCard(card) {
    card = card || {};
    if (card.style === 'kb') {
      const items = (card.items || []).map(function (it) {
        return '<div class="kb-item' + (it.highlight ? ' hl' : '') + '">' +
          '<div class="kb-name">' + escapeHtml(it.name) + '</div>' +
          '<div class="kb-meta">' + escapeHtml(it.meta) + '</div>' +
          '</div>';
      }).join('');
      return '<div class="kb-block"><div class="kb-label">' + escapeHtml(card.label || '📚 Base de conocimiento') + '</div>' + items + '</div>';
    }
    const bullets = (card.items || []).map(function (li) { return '<li>' + escapeHtml(li) + '</li>'; }).join('');
    return '<div class="plan-card"><div class="pt">' + escapeHtml(card.title) + '</div>' +
      escapeHtml(card.description) +
      (bullets ? '<ul>' + bullets + '</ul>' : '') +
      '</div>';
  }

  function withCard(block) {
    if (!block.card) return { html: false, content: block.text || '' };
    const cardHtml = renderCard(block.card);
    const textEsc = block.text ? escapeHtml(block.text).replace(/\n/g, '<br>') : '';
    return { html: true, content: (textEsc ? textEsc + '<br>' : '') + cardHtml };
  }

  function screenShell(track, step, total, question, help) {
    const sc = document.createElement('div');
    sc.className = 'flow-screen';
    sc.innerHTML =
      '<div class="flow-step">Paso ' + step + ' de ' + total + '</div>' +
      '<div class="flow-q">' + escapeHtml(question) + '</div>' +
      (help ? '<div class="flow-help">' + escapeHtml(help) + '</div>' : '') +
      '<div class="flow-controls"></div>';
    track.appendChild(sc);
    return sc.querySelector('.flow-controls');
  }

  /* ---------------- DOM: construcción de una columna ---------------- */
  function buildColumn(grid, cfg) {
    const accent = cfg.accent || 'var(--hn-orange)';
    const el = document.createElement('div');
    el.className = 'phone-col hn-card hn-card--accent';
    el.style.setProperty('--c', accent);
    el.style.setProperty('--c-flow', accent);
    grid.appendChild(el);

    const metric = cfg.metric || {};
    const head = document.createElement('div');
    head.className = 'col-head';

    const nameEl = document.createElement('span');
    nameEl.className = 'col-name';
    nameEl.style.color = accent;
    nameEl.textContent = cfg.name || '';
    head.appendChild(nameEl);

    const metricRow = document.createElement('div');
    metricRow.className = 'col-metric';
    const countEl = document.createElement('span');
    countEl.className = 'hn-stat';
    countEl.style.setProperty('--c', accent);
    countEl.textContent = '0';
    metricRow.appendChild(countEl);

    const side = document.createElement('div');
    side.className = 'col-metric-side';
    const unitEl = document.createElement('span');
    unitEl.className = 'col-unit';
    unitEl.textContent = metric.unit != null ? metric.unit : 'msgs salientes';
    side.appendChild(unitEl);

    let timeEl = null;
    if (metric.showTimer !== false) {
      const cap = document.createElement('span');
      cap.className = 'hn-meta col-cap';
      cap.innerHTML = 'tiempo <b>0.0s</b>';
      timeEl = cap.querySelector('b');
      side.appendChild(cap);
    }
    metricRow.appendChild(side);
    head.appendChild(metricRow);

    let channelEl = null;
    if (metric.showChannel) {
      const ch = document.createElement('div');
      ch.className = 'col-channel';
      ch.innerHTML = escapeHtml(metric.channelLabel || 'Canal de recomendación:') + ' <b>—</b>';
      channelEl = ch.querySelector('b');
      head.appendChild(ch);
    }
    el.appendChild(head);

    const frame = document.createElement('div');
    frame.className = 'phone-frame';
    const screen = document.createElement('div');
    screen.className = 'phone-screen';
    frame.appendChild(screen);
    el.appendChild(frame);

    const brand = cfg.brand || {};
    const avatarText = brand.avatar || initialsFrom(brand.name);
    screen.innerHTML =
      '<div class="statusbar"><span>' + escapeHtml(cfg.statusTime || '10:02') + '</span><span class="sb-icons">▮▮▮ 4G 84%</span></div>' +
      '<div class="wa-header">' +
        '<span class="wa-back">‹</span>' +
        '<div class="wa-avatar">' + escapeHtml(avatarText) + '</div>' +
        '<div class="wa-id"><span class="name">' + escapeHtml(brand.name || '') + '</span><span class="status" data-role="status">en línea</span></div>' +
      '</div>' +
      '<div class="wa-body" data-role="body"><div class="wa-daytag">HOY</div></div>' +
      '<div class="wa-inputbar"><div class="field"><span class="emoji">☺</span>Mensaje</div><div class="send">' + SEND_ICON + '</div></div>';

    const mainBody = screen.querySelector('[data-role="body"]');
    const mainStatus = screen.querySelector('[data-role="status"]');

    const script = cfg.script || [];
    const hasFlow = script.some(function (b) { return b.type === 'flow'; });
    const hasWeb = script.some(function (b) { return b.type === 'handoff' || b.type === 'webBot' || b.type === 'webUser'; });

    let flowRefs = null;
    if (hasFlow) {
      const overlay = document.createElement('div');
      overlay.className = 'flow-overlay';
      overlay.innerHTML =
        '<div class="flow-topbar">' +
          '<span class="fx">✕</span>' +
          '<div class="flow-brand">' +
            '<span class="t" data-role="flow-title"></span>' +
            '<span class="s">' + shieldIcon() + '<span data-role="flow-brandline"></span></span>' +
          '</div>' +
        '</div>' +
        '<div class="flow-progress"><i data-role="flow-bar"></i></div>' +
        '<div class="flow-viewport"><div class="flow-track" data-role="flow-track"></div></div>' +
        '<div class="flow-foot">' +
          '<button class="flow-next" data-role="flow-next">Continuar</button>' +
          '<div class="flow-secure">' + shieldIcon() + '<span data-role="flow-secure"></span></div>' +
        '</div>';
      screen.appendChild(overlay);
      flowRefs = {
        overlay: overlay,
        titleEl: overlay.querySelector('[data-role="flow-title"]'),
        brandLineEl: overlay.querySelector('[data-role="flow-brandline"]'),
        secureEl: overlay.querySelector('[data-role="flow-secure"]'),
        bar: overlay.querySelector('[data-role="flow-bar"]'),
        track: overlay.querySelector('[data-role="flow-track"]'),
        next: overlay.querySelector('[data-role="flow-next"]')
      };
    }

    let webRefs = null;
    if (hasWeb) {
      const webBrand = cfg.webBrand || brand;
      const webAvatar = webBrand.avatar || avatarText;
      const popup = document.createElement('div');
      popup.className = 'wc-popup';
      popup.setAttribute('aria-hidden', 'true');
      popup.innerHTML =
        '<div class="statusbar"><span>' + escapeHtml(cfg.webStatusTime || '10:04') + '</span><span class="sb-icons">▮▮▮ 4G 84%</span></div>' +
        '<div class="wc-chrome"><div class="wc-chrome-row">' +
          '<span class="done">Listo</span>' +
          '<div class="url">' + shieldIcon('lock') + '<span class="host" data-role="wc-host"></span></div>' +
          '<span class="aa">aA</span>' +
        '</div></div>' +
        '<div class="wc-screen">' +
          '<span class="wc-badge">Canal web</span>' +
          '<div class="wa-header"><span class="wa-back">‹</span><div class="wa-avatar">' + escapeHtml(webAvatar) + '</div>' +
          '<div class="wa-id"><span class="name">' + escapeHtml(webBrand.name || brand.name || '') + '</span><span class="status" data-role="wc-status">en línea</span></div></div>' +
          '<div class="wa-body" data-role="wc-body"><div class="wa-daytag">HOY</div></div>' +
          '<div class="wa-inputbar"><div class="field"><span class="emoji">☺</span>Mensaje</div><div class="send">' + SEND_ICON + '</div></div>' +
        '</div>' +
        '<div class="wc-toolbar">' +
          '<span title="Atrás">‹</span><span title="Adelante" class="muted">›</span><span title="Compartir">⬆︎</span><span title="Marcadores">☆</span><span title="Pestañas">▢</span>' +
        '</div>';
      screen.appendChild(popup);
      webRefs = {
        popup: popup,
        hostEl: popup.querySelector('[data-role="wc-host"]'),
        body: popup.querySelector('[data-role="wc-body"]'),
        statusEl: popup.querySelector('[data-role="wc-status"]')
      };
    }

    return {
      cfg: cfg,
      el: el,
      countEl: countEl,
      timeEl: timeEl,
      channelEl: channelEl,
      mainBody: mainBody,
      mainStatus: mainStatus,
      flowRefs: flowRefs,
      webRefs: webRefs
    };
  }

  /* ---------------- Motor de reproducción (por instancia) ---------------- */
  function mount(container, demo, opts) {
    opts = opts || {};
    demo = demo || { columns: [] };
    const onStateChange = typeof opts.onStateChange === 'function' ? opts.onStateChange : function () {};
    const reduceMotion = opts.reduceMotion != null ? opts.reduceMotion : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = typeof opts.speed === 'number' ? opts.speed : 1.85;

    let paused = false;
    let pauseResolvers = [];
    let pausedAt = 0;
    let pausedTotal = 0;
    let running = false;
    let runToken = 0;

    function setPaused(v) {
      if (v === paused) return;
      paused = v;
      if (paused) {
        pausedAt = performance.now();
      } else {
        pausedTotal += performance.now() - pausedAt;
        const q = pauseResolvers.splice(0);
        q.forEach(function (r) { r(); });
      }
    }
    function waitWhilePaused() {
      if (!paused) return Promise.resolve();
      return new Promise(function (r) { pauseResolvers.push(r); });
    }
    async function sleep(ms) {
      const target = reduceMotion ? Math.min(ms, 20) : ms * SPEED;
      let left = target;
      while (left > 0) {
        await waitWhilePaused();
        const slice = Math.min(40, left);
        const t0 = performance.now();
        await new Promise(function (r) { setTimeout(r, slice); });
        left -= Math.max(slice, performance.now() - t0);
      }
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'phones-grid';
    container.appendChild(grid);

    const columns = (demo.columns || []).map(function (cfg) { return buildColumn(grid, cfg); });

    /* ---- Flow builders (dependen de sleep/reduceMotion de esta instancia) ---- */
    function buildText(host, finalText) {
      const box = document.createElement('div');
      box.className = 'f-text';
      host.appendChild(box);
      return async function () {
        box.classList.add('active');
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        const text = finalText || '';
        for (let i = 1; i <= text.length; i++) {
          box.textContent = text.slice(0, i);
          box.appendChild(cursor);
          await sleep(reduceMotion ? 1 : 34);
        }
        if (!text.length) box.appendChild(cursor);
      };
    }
    function buildRadio(host, options, pick) {
      const rows = (options || []).map(function (o) {
        const r = document.createElement('div');
        r.className = 'f-opt f-radio';
        r.innerHTML = '<i></i><span>' + escapeHtml(o) + '</span>';
        host.appendChild(r);
        return r;
      });
      return async function () {
        await sleep(480);
        if (!rows[pick]) return;
        rows[pick].classList.add('checked');
        rows[pick].querySelector('i').innerHTML = '●';
      };
    }
    function buildCheck(host, options, picks) {
      const rows = (options || []).map(function (o) {
        const r = document.createElement('div');
        r.className = 'f-opt f-check';
        r.innerHTML = '<i></i><span>' + escapeHtml(o) + '</span>';
        host.appendChild(r);
        return r;
      });
      return async function () {
        for (const i of (picks || [])) {
          await sleep(320);
          if (!rows[i]) continue;
          rows[i].classList.add('checked');
          rows[i].querySelector('i').innerHTML = '✓';
        }
      };
    }
    function buildNps(host, value) {
      const row = document.createElement('div');
      row.className = 'f-nps';
      const spans = [];
      for (let i = 0; i <= 10; i++) {
        const s = document.createElement('span');
        s.textContent = String(i);
        row.appendChild(s);
        spans.push(s);
      }
      host.appendChild(row);
      const scale = document.createElement('div');
      scale.className = 'f-nps-scale';
      scale.innerHTML = '<span>Nada probable</span><span>Muy probable</span>';
      host.appendChild(scale);
      return async function () {
        await sleep(450);
        const v = Math.max(0, Math.min(10, value != null ? value : 5));
        spans[v].classList.add('checked');
      };
    }
    function buildControl(host, control) {
      control = control || {};
      switch (control.type) {
        case 'check': return buildCheck(host, control.options, control.picks || []);
        case 'nps': return buildNps(host, control.value);
        case 'text': return buildText(host, control.text);
        case 'radio':
        default: return buildRadio(host, control.options, control.pick || 0);
      }
    }

    /* ---- Chat (WhatsApp o webchat) ---- */
    function makeChat(bodyEl, statusEl, chatOpts) {
      chatOpts = chatOpts || {};
      const countEl = chatOpts.countEl || null;
      const timeEl = chatOpts.timeEl || null;
      const channelEl = chatOpts.channelEl || null;
      const countOutgoing = chatOpts.countOutgoing !== false;
      const startHour = chatOpts.startHour != null ? chatOpts.startHour : 10;
      const startMinute = chatOpts.startMinute != null ? chatOpts.startMinute : 2;
      let count = 0, startTs = null, timer = null, tk = clock(startHour, startMinute);

      function scrollBottom() { bodyEl.scrollTop = bodyEl.scrollHeight; }
      function elapsedSec() {
        if (startTs == null) return 0;
        const freeze = paused ? (performance.now() - pausedAt) : 0;
        return (performance.now() - startTs - pausedTotal - freeze) / 1000;
      }
      function startTimer() {
        startTs = performance.now();
        if (timeEl) timer = setInterval(function () {
          if (paused) return;
          timeEl.textContent = elapsedSec().toFixed(1) + 's';
        }, 100);
      }
      function stopTimer() { if (timer) clearInterval(timer); timer = null; }
      function setStatus(t) { if (statusEl) statusEl.textContent = t; }
      function setChannel(t) { if (channelEl) channelEl.textContent = t; }
      function reset() {
        bodyEl.innerHTML = '<div class="wa-daytag">HOY</div>';
        count = 0;
        if (countEl) countEl.textContent = '0';
        if (timeEl) timeEl.textContent = '0.0s';
        tk = clock(startHour, startMinute);
        setStatus('en línea');
        if (channelEl) setChannel('—');
        stopTimer();
      }
      function bump() {
        if (!countOutgoing || !countEl) return;
        count++; countEl.textContent = String(count);
      }

      async function typing(ms) {
        setStatus('escribiendo…');
        const el = document.createElement('div');
        el.className = 'typing';
        el.innerHTML = '<i></i><i></i><i></i>';
        bodyEl.appendChild(el); scrollBottom();
        await sleep(ms);
        el.remove(); setStatus('en línea');
      }
      async function botMsg(text, msgOpts) {
        msgOpts = msgOpts || {};
        const typingMs = msgOpts.typingMs != null ? msgOpts.typingMs : 1400;
        await typing(typingMs);
        if (msgOpts.count !== false) bump();
        const el = document.createElement('div');
        el.className = 'bubble bot';
        const html = msgOpts.html ? text : escapeHtml(text).replace(/\n/g, '<br>');
        el.innerHTML = html +
          '<span class="meta"><span class="ts">' + tk() + '</span></span>' +
          (msgOpts.cta ? '<div class="cta-btn">' + FLOW_ICON + escapeHtml(msgOpts.cta) + '</div>' : '');
        bodyEl.appendChild(el); scrollBottom();
        await sleep(420);
        return el;
      }
      async function userMsg(text, delay) {
        await sleep(delay != null ? delay : 1100);
        const el = document.createElement('div');
        el.className = 'bubble user';
        el.innerHTML = escapeHtml(text).replace(/\n/g, '<br>') + '<span class="meta"><span class="ts">' + tk() + '</span>' + TICK + '</span>';
        bodyEl.appendChild(el); scrollBottom();
        await sleep(550);
        return el;
      }
      async function systemMsg(text, delay) {
        await sleep(delay != null ? delay : 700);
        const el = document.createElement('div');
        el.className = 'bubble system';
        el.textContent = text || '';
        bodyEl.appendChild(el); scrollBottom();
        return el;
      }

      return {
        body: bodyEl,
        reset: reset,
        startTimer: startTimer,
        stopTimer: stopTimer,
        setStatus: setStatus,
        setChannel: setChannel,
        bump: bump,
        botMsg: botMsg,
        userMsg: userMsg,
        systemMsg: systemMsg,
        get lastCtaEl() { return bodyEl.querySelector('.cta-btn:last-of-type'); }
      };
    }

    /* ---- Bloque: flow ---- */
    async function runFlowBlock(flowRefs, block, mainChat) {
      if (!flowRefs) return;
      block = block || {};
      flowRefs.titleEl.textContent = block.title || '';
      flowRefs.brandLineEl.textContent = block.brandLine || '';
      flowRefs.secureEl.textContent = 'Datos protegidos · ' + (block.brandLine || '');

      const intro = block.intro || {};
      await mainChat.botMsg(intro.text || '', { typingMs: intro.typingMs != null ? intro.typingMs : 1300, cta: intro.ctaLabel || 'Continuar' });
      await sleep(900);
      const ctaEl = mainChat.lastCtaEl;
      if (ctaEl) ctaEl.classList.add('pressed');
      await sleep(420);
      flowRefs.overlay.classList.add('open');
      await sleep(780);

      flowRefs.track.innerHTML = '';
      const screens = block.screens || [];
      const total = screens.length;
      const fills = screens.map(function (sc, i) {
        return buildControl(screenShell(flowRefs.track, i + 1, total, sc.question, sc.help), sc.control);
      });

      function goTo(i) {
        flowRefs.track.style.transform = 'translateX(-' + (i * 100) + '%)';
        flowRefs.bar.style.width = (((i + 1) / total) * 100) + '%';
        flowRefs.next.textContent = (i === total - 1) ? (block.submitLabel || 'Enviar respuestas') : 'Continuar';
      }
      async function pressNext() {
        flowRefs.next.classList.add('pressed');
        await sleep(320);
        flowRefs.next.classList.remove('pressed');
      }

      if (total > 0) {
        flowRefs.track.style.transition = 'none';
        goTo(0);
        flowRefs.track.offsetHeight;
        flowRefs.track.style.transition = '';
      }

      for (let i = 0; i < total; i++) {
        goTo(i);
        await sleep(620);
        await fills[i]();
        await sleep(780);
        if (i < total - 1) await pressNext();
      }
      await sleep(450);
      await pressNext();
      await sleep(450);
      flowRefs.overlay.classList.remove('open');
      await sleep(620);

      const success = block.success || {};
      if (success.text) await mainChat.systemMsg(success.text, success.delay != null ? success.delay : 200);
    }

    /* ---- Bloque: handoff ---- */
    async function runHandoffBlock(mainChat, webRefs, block, ctx) {
      block = block || {};
      const linkText = block.linkText || block.url || '';
      const textEsc = block.text ? escapeHtml(block.text).replace(/\n/g, '<br>') : '';
      const html = textEsc + (textEsc ? '<br><br>' : '') + '<a class="wa-link" data-handoff-link>' + escapeHtml(linkText) + '</a>';
      await mainChat.botMsg(html, { typingMs: block.typingMs != null ? block.typingMs : 1600, html: true });

      await sleep(block.highlightDelay != null ? block.highlightDelay : 1100);
      const linkEl = mainChat.body.querySelector('[data-handoff-link]');
      if (linkEl) {
        linkEl.style.background = 'rgba(83,189,235,.15)';
        linkEl.style.borderRadius = '3px';
        linkEl.style.padding = '0 2px';
      }
      await sleep(520);
      if (webRefs) {
        if (webRefs.hostEl) webRefs.hostEl.textContent = block.url || linkText;
        webRefs.popup.classList.add('open');
        webRefs.popup.setAttribute('aria-hidden', 'false');
      }
      if (ctx && ctx.channelEl) ctx.channelEl.textContent = block.channelLabel || 'Webchat';
      await sleep(900);
    }

    /* ---- Ejecuta el guion completo de una columna ---- */
    async function runColumn(col) {
      const cfg = col.cfg;
      const metric = cfg.metric || {};
      const main = makeChat(col.mainBody, col.mainStatus, {
        countEl: col.countEl,
        timeEl: col.timeEl,
        channelEl: col.channelEl,
        countOutgoing: metric.countOutgoing !== false,
        startHour: cfg.startHour,
        startMinute: cfg.startMinute
      });
      main.reset();
      if (metric.showTimer !== false) main.startTimer();
      if (metric.showChannel) main.setChannel(metric.initialChannel || '—');

      let web = null;
      if (col.webRefs) {
        web = makeChat(col.webRefs.body, col.webRefs.statusEl, {
          countOutgoing: false,
          startHour: cfg.startHour != null ? cfg.startHour : 10,
          startMinute: (cfg.startMinute != null ? cfg.startMinute : 2) + 2
        });
        web.reset();
        col.webRefs.popup.classList.remove('open');
        col.webRefs.popup.setAttribute('aria-hidden', 'true');
      }
      if (col.flowRefs) col.flowRefs.overlay.classList.remove('open');

      for (const block of (cfg.script || [])) {
        switch (block.type) {
          case 'bot': {
            const c = withCard(block);
            await main.botMsg(c.content, { typingMs: block.typingMs, cta: block.cta, count: block.count, html: c.html });
            break;
          }
          case 'user':
            await main.userMsg(block.text || '', block.delay);
            break;
          case 'system':
            await main.systemMsg(block.text || '', block.delay);
            break;
          case 'flow':
            await runFlowBlock(col.flowRefs, block, main);
            break;
          case 'handoff':
            await runHandoffBlock(main, col.webRefs, block, { channelEl: col.channelEl });
            break;
          case 'webBot': {
            if (!web) break;
            const cw = withCard(block);
            await web.botMsg(cw.content, { typingMs: block.typingMs, cta: block.cta, count: false, html: cw.html });
            break;
          }
          case 'webUser':
            if (web) await web.userMsg(block.text || '', block.delay);
            break;
          default:
            break;
        }
      }

      main.setStatus('en línea');
      if (web) web.setStatus('en línea');
      main.stopTimer();
    }

    function status() {
      if (!running) return 'idle';
      return paused ? 'paused' : 'running';
    }
    function notify(state) {
      try { onStateChange(state, controller); } catch (e) { /* no-op */ }
    }

    const controller = {
      play: async function () {
        if (running) {
          if (paused) { setPaused(false); notify('running'); }
          return;
        }
        running = true;
        setPaused(false);
        pausedTotal = 0;
        const token = ++runToken;
        notify('running');
        await Promise.all(columns.map(function (col) { return runColumn(col); }));
        if (token !== runToken) return;
        running = false;
        setPaused(false);
        notify('done');
      },
      pause: function () {
        if (!running || paused) return;
        setPaused(true);
        notify('paused');
      },
      resume: function () {
        if (!running || !paused) return;
        setPaused(false);
        notify('running');
      },
      togglePause: function () {
        if (paused) this.resume(); else this.pause();
      },
      isRunning: function () { return running; },
      isPaused: function () { return paused; },
      getState: status,
      destroy: function () {
        runToken++;
        running = false;
        paused = false;
        container.innerHTML = '';
      }
    };

    return controller;
  }

  const BLOCK_TYPES = [
    { value: 'bot', label: 'Mensaje del bot (WhatsApp)' },
    { value: 'user', label: 'Mensaje del usuario (WhatsApp)' },
    { value: 'system', label: 'Mensaje de sistema (WhatsApp)' },
    { value: 'flow', label: 'WhatsApp Flow (formulario multi-pantalla)' },
    { value: 'handoff', label: 'Handoff → link al canal web' },
    { value: 'webBot', label: 'Mensaje del bot (canal web)' },
    { value: 'webUser', label: 'Mensaje del usuario (canal web)' }
  ];
  const CONTROL_TYPES = [
    { value: 'radio', label: 'Opción única' },
    { value: 'check', label: 'Selección múltiple' },
    { value: 'nps', label: 'Escala 0–10 (NPS)' },
    { value: 'text', label: 'Texto libre' }
  ];
  const CARD_STYLES = [
    { value: 'plan', label: 'Tarjeta de plan' },
    { value: 'kb', label: 'Base de conocimiento' }
  ];

  const OPTS5 = ['Muy insatisfecho/a', 'Insatisfecho/a', 'Ni satisfecho/a ni insatisfecho/a', 'Satisfecho/a', 'Muy satisfecho/a'];
  const SERVICIOS = ['Restaurante', 'Servicio a la habitación', 'Piscina', 'Spa', 'Gimnasio', 'Bar', 'Desayuno', 'Estacionamiento', 'Salones / Eventos', 'Ninguno'];
  function numbered(list) { return list.map(function (o, i) { return (i + 1) + '. ' + o; }).join('\n'); }

  const TEMPLATES = {
    cascadaVsFlow: {
      v: 1,
      title: 'La misma encuesta, resuelta de tres formas.',
      subtitle: 'Bot en cascada y Agente IA arman la charla pregunta por pregunta: cada una es un mensaje saliente de la empresa. El Flow de WhatsApp resuelve la misma encuesta con un solo mensaje y un formulario nativo.',
      columns: [
        {
          name: 'Bot en cascada',
          accent: 'var(--hn-blue)',
          brand: { name: 'Hotel Vista Mar', avatar: 'HV' },
          metric: { unit: 'de 6 mensajes', showTimer: true },
          script: [
            { type: 'bot', text: '¡Hola! Gracias por elegirnos en Hotel Vista Mar 🙌 Queremos conocer tu experiencia, te toma menos de 2 min.\n\n¿Qué tan satisfecho/a quedaste con el check-in?\n' + numbered(OPTS5) + '\n\nRespondé con el número.', typingMs: 1500 },
            { type: 'user', text: '4' },
            { type: 'bot', text: '¿Cómo calificarías la atención de nuestro personal durante tu estadía?\n' + numbered(OPTS5), typingMs: 1300 },
            { type: 'user', text: '5' },
            { type: 'bot', text: '¿Qué servicios utilizaste? (podés poner varios números separados por coma)\n' + numbered(SERVICIOS), typingMs: 1300 },
            { type: 'user', text: '1, 3, 7' },
            { type: 'bot', text: 'En general, ¿qué tan satisfecho/a quedaste con esos servicios?\n' + numbered(OPTS5), typingMs: 1200 },
            { type: 'user', text: '4' },
            { type: 'bot', text: 'De 0 a 10, ¿qué tan probable es que nos recomiendes a un familiar o amigo?', typingMs: 1200 },
            { type: 'user', text: '9' },
            { type: 'bot', text: 'Por último, ¿algo que quieras destacar o sugerir? ✍️', typingMs: 1200 },
            { type: 'user', text: 'Todo muy bien, el desayuno podría tener más opciones dulces' }
          ]
        },
        {
          name: 'Agente IA',
          accent: 'var(--hn-violet)',
          brand: { name: 'Hotel Vista Mar', avatar: 'HV' },
          metric: { unit: 'de 6 mensajes', showTimer: true },
          script: [
            { type: 'bot', text: '¡Hola! Soy el asistente virtual de Hotel Vista Mar 😊 ¿Tenés 2 minutos para contarme cómo fue tu estadía? Para arrancar: ¿qué tan conforme quedaste con el check-in?', typingMs: 1500 },
            { type: 'user', text: 'Todo perfecto, fue muy rápido' },
            { type: 'bot', text: '¡Qué bueno! Y con la atención de nuestro personal durante tu estadía, ¿cómo la calificarías?', typingMs: 1300 },
            { type: 'user', text: 'Excelente, muy atentos en todo momento' },
            { type: 'bot', text: 'Genial 🙌 ¿Qué servicios usaste? (restaurante, spa, piscina, desayuno...)', typingMs: 1300 },
            { type: 'user', text: 'Desayuno, piscina y el restaurante' },
            { type: 'bot', text: '¿Y en general qué tan conforme quedaste con esos servicios?', typingMs: 1200 },
            { type: 'user', text: 'Muy conforme, todo buenísimo' },
            { type: 'bot', text: 'Última: del 0 al 10, ¿qué tan probable es que nos recomiendes a alguien?', typingMs: 1200 },
            { type: 'user', text: '9, sin dudas' },
            { type: 'bot', text: '¡Excelente! ¿Algo que quieras destacar o sugerir para mejorar? ✍️', typingMs: 1200 },
            { type: 'user', text: 'El desayuno podría tener más opciones dulces' }
          ]
        },
        {
          name: 'WhatsApp Flow',
          accent: 'var(--hn-orange)',
          brand: { name: 'Hotel Vista Mar', avatar: 'HV' },
          metric: { unit: 'de 1 mensaje', showTimer: true },
          script: [
            {
              type: 'flow',
              title: 'Encuesta de satisfacción',
              brandLine: 'Hotel Vista Mar',
              submitLabel: 'Enviar respuestas',
              intro: { text: '¡Hola! 👋 Gracias por elegirnos en Hotel Vista Mar. Nos encantaría conocer tu experiencia — te toma menos de 2 minutos ⏱️', ctaLabel: 'Completar encuesta', typingMs: 1300 },
              screens: [
                { question: '¿Qué tan satisfecho/a quedaste con el check-in?', control: { type: 'radio', options: OPTS5, pick: 4 } },
                { question: '¿Cómo calificarías la atención de nuestro personal?', control: { type: 'radio', options: OPTS5, pick: 4 } },
                { question: '¿Qué servicios utilizaste?', help: 'Podés elegir varios.', control: { type: 'check', options: SERVICIOS, picks: [0, 2, 6] } },
                { question: 'En general, ¿qué tan satisfecho/a quedaste con esos servicios?', control: { type: 'radio', options: OPTS5, pick: 3 } },
                { question: 'Del 0 al 10, ¿qué tan probable es que nos recomiendes?', control: { type: 'nps', value: 9 } },
                { question: '¿Algo que quieras destacar o sugerir?', help: 'Opcional.', control: { type: 'text', text: 'Todo excelente, el desayuno podría tener más opciones dulces 🙂' } }
              ],
              success: { text: '✅ Respuesta enviada — ¡gracias por tu tiempo!', delay: 200 }
            }
          ]
        }
      ]
    },
    flowWebchat: {
      v: 1,
      title: 'Lo transaccional en WhatsApp. Lo consultivo, afuera.',
      subtitle: 'Misma solicitud de seguro: un camino lo fuerza todo en WhatsApp. El otro completa el formulario con Flow y, cuando aparece una pregunta compleja, abre un webchat estilo WhatsApp con base de conocimiento para recomendar el plan.',
      columns: [
        {
          name: 'Solo WhatsApp',
          accent: 'var(--hn-blue)',
          brand: { name: 'Seguros Aurora', avatar: 'SA' },
          metric: { unit: 'msgs salientes WA', showTimer: true, showChannel: true, initialChannel: 'WhatsApp' },
          script: [
            { type: 'bot', text: '¡Hola! Soy el asistente de Seguros Aurora 🛡️ Para cotizar tu cobertura necesito unos datos.\n\n¿Cuál es tu nombre completo?', typingMs: 1500 },
            { type: 'user', text: 'Martina López' },
            { type: 'bot', text: '¿Número de documento?', typingMs: 1100 },
            { type: 'user', text: '38451209' },
            { type: 'bot', text: '¿A qué destino viajás?', typingMs: 1100 },
            { type: 'user', text: 'España' },
            { type: 'bot', text: '¿Fechas de ida y vuelta?', typingMs: 1100 },
            { type: 'user', text: '12/08 al 28/08' },
            { type: 'bot', text: 'Perfecto, ya registré tu solicitud ✅', typingMs: 1200 },
            { type: 'user', text: 'cobertura de viajes para familias?', delay: 1400 },
            { type: 'bot', text: 'Sí — en la base tenemos Individual, Pareja y Familiar. Familiar cubre hasta 4 personas, con asistencia médica, cancelación y equipaje.', typingMs: 1700 },
            { type: 'bot', text: 'Para recomendarte la mejor: ¿cuántas personas son y qué edades tienen?', typingMs: 1400 },
            { type: 'user', text: 'Somos 4: 38, 36, 10 y 7', delay: 1300 },
            { type: 'bot', text: 'Con ese grupo te conviene esto:', typingMs: 1800, card: { style: 'plan', title: 'Plan Familiar Viajero', description: 'Cobertura médica + cancelación + equipaje para el grupo.', items: ['Hasta 4 personas · 30 días', 'Asistencia 24/7 y repatriación', 'Franquicia reducida para menores'] } },
            { type: 'bot', text: 'Si querés, te dejo el link de contratación por acá mismo.', typingMs: 1300 }
          ]
        },
        {
          name: 'Flow + Webchat',
          accent: 'var(--hn-orange)',
          brand: { name: 'Seguros Aurora', avatar: 'SA' },
          metric: { unit: 'msgs salientes WA', showTimer: true, showChannel: true },
          script: [
            {
              type: 'flow',
              title: 'Solicitud de cobertura',
              brandLine: 'Seguros Aurora',
              submitLabel: 'Enviar solicitud',
              intro: { text: '¡Hola! 👋 Soy Seguros Aurora. Completá tu solicitud de cobertura acá — es rápido y seguro.', ctaLabel: 'Completar solicitud', typingMs: 1300 },
              screens: [
                { question: 'Nombre completo', help: 'Como figura en el documento.', control: { type: 'text', text: 'Martina López' } },
                { question: 'Número de documento', control: { type: 'text', text: '38451209' } },
                { question: 'Destino del viaje', control: { type: 'radio', options: ['España', 'Brasil', 'EE.UU.', 'Otro'], pick: 0 } },
                { question: 'Fechas de ida y vuelta', help: 'Formato DD/MM.', control: { type: 'text', text: '12/08 — 28/08' } }
              ],
              success: { text: '✅ Solicitud enviada — gracias, Martina', delay: 200 }
            },
            { type: 'user', text: 'cobertura de viajes para familias?', delay: 1400 },
            { type: 'handoff', text: 'Buena pregunta — para mostrarte bien las opciones de la base de coberturas, seguimos por el canal web 👇', linkText: 'chat.segurosaurora.com/coberturas', url: 'chat.segurosaurora.com', typingMs: 1600, highlightDelay: 1100, channelLabel: 'Webchat' },
            { type: 'webBot', text: '¡Hola Martina! Continuamos acá 🧭 Traje la ficha de coberturas desde la base de conocimiento:', typingMs: 1400 },
            { type: 'webBot', text: '', typingMs: 1600, card: { style: 'kb', label: '📚 Base de conocimiento · Coberturas', items: [
              { name: 'Individual', meta: '1 persona · médica hasta USD 50.000 · cancelación · equipaje' },
              { name: 'Pareja', meta: '2 adultos · misma cobertura · descuento 15%' },
              { name: 'Familiar', meta: 'Hasta 4 · menores sin cargo extra · franquicia reducida · asistencia 24/7', highlight: true }
            ] } },
            { type: 'webBot', text: 'Para familias suele cerrar mejor el plan Familiar. ¿Cuántas personas son y qué edades tienen?', typingMs: 1300 },
            { type: 'webUser', text: 'Somos 4: 38, 36, 10 y 7', delay: 1300 },
            { type: 'webBot', text: 'Con ese grupo, el match de la KB es este:', typingMs: 1700, card: { style: 'plan', title: 'Plan Familiar Viajero', description: 'Cobertura médica + cancelación + equipaje para el grupo.', items: ['Hasta 4 personas · 30 días', 'Asistencia 24/7 y repatriación', 'Franquicia reducida para menores'] } },
            { type: 'webBot', text: 'Cuando quieras contratar, volvés a WhatsApp y lo cerramos con tus datos ya cargados.', typingMs: 1300 }
          ]
        }
      ]
    },
    blank: {
      v: 1,
      title: 'Nueva demo',
      subtitle: '',
      columns: [
        {
          name: 'Columna 1',
          accent: 'var(--hn-orange)',
          brand: { name: 'Mi empresa', avatar: '' },
          metric: { unit: 'msgs salientes', showTimer: true },
          script: [
            { type: 'bot', text: 'Escribí el primer mensaje del bot acá.' }
          ]
        }
      ]
    }
  };

  global.DemoEngine = {
    mount: mount,
    escapeHtml: escapeHtml,
    renderCard: renderCard,
    BLOCK_TYPES: BLOCK_TYPES,
    CONTROL_TYPES: CONTROL_TYPES,
    CARD_STYLES: CARD_STYLES,
    TEMPLATES: TEMPLATES,
    SPEED_DEFAULT: 1.85
  };
})(window);
