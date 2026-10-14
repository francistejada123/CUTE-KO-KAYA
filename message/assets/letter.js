/* Page 2 + 3 + finale — cinematic intro, envelope, letter, last surprise */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;

  var HEART_SVG = '<svg viewBox="0 0 32 30" aria-hidden="true"><path fill="currentColor" d="M16 29C7 22 1 16.6 1 9.6 1 4.8 4.7 1 9.3 1c2.8 0 5.2 1.4 6.7 3.6C17.5 2.4 19.9 1 22.7 1 27.3 1 31 4.8 31 9.6 31 16.6 25 22 16 29z"/></svg>';

  // ---------- timers ----------
  var timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, reduce ? Math.min(ms, ms * .35) : ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // ---------- sky ----------
  var sky = null;
  if (window.Sky && $('sky')) { sky = new window.Sky($('sky'), { startAlpha: 0 }); sky.start(); }

  // ---------- intro ----------
  var intro = $('intro'), introLine = $('introLine'), introHeart = $('introHeart');
  var envStage = $('envStage'), envelope = $('envelope'), envActions = $('envActions');
  var openBtn = $('openLetter'), skipBtn = $('skipIntro');
  var stage = 'intro';

  function lineOn(text, isTitle) {
    introLine.textContent = text;
    introLine.classList.toggle('title', !!isTitle);
    // force reflow so the transition restarts
    void introLine.offsetWidth;
    introLine.classList.add('on');
  }
  function lineOff() { introLine.classList.remove('on'); }

  function runIntro() {
    stage = 'intro';
    at(400, function () { body.classList.add('sky-on'); if (sky) sky.fadeTo(1); });
    at(1700, function () { introHeart.classList.add('on'); });
    at(2200, function () { if (window.LoveMusic) window.LoveMusic.show(); });
    at(3400, function () { lineOn('Some stories begin with a simple glance...'); });
    at(6600, lineOff);
    at(7600, function () { lineOn('But ours became something special.'); });
    at(10600, lineOff);
    at(11600, function () { lineOn('Almost six years of knowing you...'); });
    at(14600, lineOff);
    at(15600, function () { lineOn('To My Jess ❤️', true); });
    at(18600, goEnvelope);
  }

  function goEnvelope() {
    clearTimers();
    stage = 'envelope';
    body.classList.add('sky-on');
    if (sky) sky.fadeTo(1);
    if (window.LoveMusic) window.LoveMusic.show();
    skipBtn.classList.add('is-hidden');
    intro.classList.add('is-hidden');
    envStage.classList.remove('is-hidden');
    envelope.classList.remove('open');
    openBtn.disabled = false;
    at(350, function () { envelope.classList.add('on'); });
    at(1700, function () { envelope.classList.add('idle'); envActions.classList.add('on'); });
  }

  skipBtn.addEventListener('click', goEnvelope);

  // ---------- floating hearts ----------
  function burst(x, y, n) {
    if (reduce) n = Math.min(n, 4);
    for (var i = 0; i < n; i++) {
      (function (i) {
        setTimeout(function () {
          var h = document.createElement('span');
          h.className = 'float-heart';
          h.innerHTML = HEART_SVG;
          var size = 10 + Math.random() * 14;
          h.style.width = h.style.height = size + 'px';
          h.style.left = (x + (Math.random() - .5) * 140) + 'px';
          h.style.top = (y + (Math.random() - .5) * 40) + 'px';
          h.style.setProperty('--x', ((Math.random() - .5) * 160) + 'px');
          h.style.setProperty('--r', ((Math.random() - .5) * 60) + 'deg');
          h.style.setProperty('--d', (2.4 + Math.random() * 1.8) + 's');
          h.style.color = ['#f6c9d8', '#ffdfe8', '#e3b39c', '#f08aa8'][i % 4];
          document.body.appendChild(h);
          h.addEventListener('animationend', function () { h.remove(); });
        }, i * 90);
      })(i);
    }
  }

  // ---------- open the envelope ----------
  openBtn.addEventListener('click', function () {
    if (stage !== 'envelope') return;
    stage = 'opening';
    if (window.LoveMusic) window.LoveMusic.start(); // song starts with the envelope
    openBtn.disabled = true;
    envelope.classList.remove('idle');
    envelope.classList.add('open');
    var r = envelope.getBoundingClientRect();
    at(500, function () { burst(r.left + r.width / 2, r.top + r.height * .3, 22); });
    at(2300, function () { envStage.classList.add('is-hidden'); envActions.classList.remove('on'); });
    at(3000, showLetter);
  });

  // ---------- letter ----------
  var letterView = $('letterView');
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var io = null;

  function typeTitle(h) {
    var full = h.getAttribute('data-type') || h.textContent;
    if (h.getAttribute('data-typed') === '1') return;
    h.setAttribute('data-typed', '1');
    if (reduce) { h.textContent = full; return; }
    h.setAttribute('aria-label', full);
    h.textContent = '';
    var text = document.createElement('span');
    text.setAttribute('aria-hidden', 'true');
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    h.appendChild(text); h.appendChild(caret);
    var i = 0;
    (function step() {
      i++;
      text.textContent = full.slice(0, i);
      if (i < full.length) setTimeout(step, 34 + Math.random() * 30);
      else setTimeout(function () { h.textContent = full; h.removeAttribute('aria-label'); }, 700);
    })();
  }

  function onReveal(el) {
    el.classList.add('in');
    var h = el.querySelector && el.querySelector('.chapter-title');
    if (h) setTimeout(function () { typeTitle(h); }, 250);
  }

  function setupReveals() {
    if (!('IntersectionObserver' in window)) { reveals.forEach(onReveal); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { onReveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  function resetReveals() {
    reveals.forEach(function (el) { el.classList.remove('in'); });
    document.querySelectorAll('.chapter-title').forEach(function (h) {
      h.textContent = h.getAttribute('data-type');
      h.removeAttribute('data-typed');
      h.removeAttribute('aria-label');
    });
  }

  var petalsMade = false;
  function makePetals() {
    if (petalsMade || reduce) return;
    petalsMade = true;
    var wrap = $('petals');
    var n = window.innerWidth < 600 ? 9 : 15;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span');
      p.className = 'petal';
      p.style.left = (Math.random() * 100) + '%';
      p.style.setProperty('--d', (14 + Math.random() * 12) + 's');
      p.style.setProperty('--delay', (-Math.random() * 20) + 's');
      p.style.setProperty('--sway', ((Math.random() - .5) * 160) + 'px');
      var s = .7 + Math.random() * .7;
      p.style.width = (14 * s) + 'px'; p.style.height = (18 * s) + 'px';
      wrap.appendChild(p);
    }
  }

  function showLetter() {
    stage = 'letter';
    body.classList.add('letter-mode');
    letterView.classList.remove('leaving');
    letterView.classList.add('on');
    window.scrollTo(0, 0);
    makePetals();
    setupReveals();
    letterView.setAttribute('tabindex', '-1');
    letterView.focus({ preventScroll: true });
  }

  // ---------- finale ----------
  var finale = $('finale'), field = $('heartField'), bigHeart = $('bigHeart');
  var fLine = $('finaleLine'), fSub = $('finaleSub'), fActions = $('finaleActions');
  var finaleSky = null, minis = [];

  function heartPoint(t) {
    var s = Math.sin(t);
    return {
      x: 16 * s * s * s,
      y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    };
  }

  function buildMinis() {
    field.querySelectorAll('.mini-heart').forEach(function (m) { m.remove(); });
    minis = [];
    var n = reduce ? 18 : 36;
    for (var i = 0; i < n; i++) {
      var m = document.createElement('span');
      m.className = 'mini-heart';
      m.innerHTML = HEART_SVG;
      var ang = Math.random() * Math.PI * 2, dist = Math.max(window.innerWidth, window.innerHeight) * (.45 + Math.random() * .35);
      m.style.transform = 'translate(' + (Math.cos(ang) * dist).toFixed(1) + 'px,' + (Math.sin(ang) * dist).toFixed(1) + 'px) scale(.6)';
      m.style.setProperty('--t', (2.2 + Math.random() * 1.4).toFixed(2) + 's');
      m.style.color = ['#f6c9d8', '#ffdfe8', '#e3b39c', '#f08aa8'][i % 4];
      field.insertBefore(m, bigHeart);
      minis.push(m);
    }
  }

  function gatherMinis() {
    var w = field.clientWidth, scale = w / 2 / 18;
    minis.forEach(function (m, i) {
      var p = heartPoint((i / minis.length) * Math.PI * 2);
      setTimeout(function () {
        m.style.opacity = '.95';
        m.style.transform = 'translate(' + (p.x * scale).toFixed(1) + 'px,' + (p.y * scale + w * .03).toFixed(1) + 'px) scale(1)';
      }, reduce ? 0 : i * 40);
    });
  }

  function fLineOn(text, big) {
    fLine.textContent = text;
    fLine.classList.toggle('big', !!big);
    void fLine.offsetWidth;
    fLine.classList.add('on');
  }

  function runFinale() {
    clearTimers();
    stage = 'finale';
    letterView.classList.add('leaving');
    at(1500, function () {
      letterView.classList.remove('on', 'leaving');
      body.classList.remove('letter-mode');
      body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      buildMinis();
      finale.classList.add('on');
      finale.setAttribute('aria-hidden', 'false');
      if (!finaleSky && window.Sky) { finaleSky = new window.Sky($('finaleSky'), { hearts: false, density: 1.3, startAlpha: 0 }); }
      if (finaleSky) { finaleSky.resize(); finaleSky.fadeTo(1); }
    });
    at(2600, gatherMinis);
    at(5800, function () {
      bigHeart.classList.add('on');
      minis.forEach(function (m) { m.style.opacity = '.35'; });
    });
    at(6600, function () { fLineOn('From admiring you from afar...'); });
    at(9800, function () { fLine.classList.remove('on'); });
    at(10700, function () { fLineOn('To making memories with you...'); });
    at(13900, function () { fLine.classList.remove('on'); });
    at(14800, function () { fLineOn('I’m so grateful it’s you, Jess. ❤️', true); });
    at(17400, function () { fSub.classList.add('on'); });
    at(19200, function () { fActions.classList.add('on'); $('replay').focus({ preventScroll: true }); });
  }

  $('lastSurprise').addEventListener('click', function () {
    if (stage !== 'letter') return;
    runFinale();
  });

  // ---------- replay ----------
  $('replay').addEventListener('click', function () {
    clearTimers();
    finale.classList.remove('on');
    finale.setAttribute('aria-hidden', 'true');
    fLine.classList.remove('on'); fSub.classList.remove('on'); fActions.classList.remove('on');
    bigHeart.classList.remove('on');
    if (finaleSky) finaleSky.fadeTo(0);
    body.style.overflow = '';
    resetReveals();
    at(1200, function () {
      envelope.classList.remove('on', 'idle', 'open');
      goEnvelope();
    });
  });

  // ---------- start ----------
  runIntro();
})();
