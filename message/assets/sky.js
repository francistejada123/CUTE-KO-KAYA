/* Lightweight starfield + floating glow particles + tiny hearts (canvas). */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Sky(canvas, opts) {
    opts = opts || {};
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.motes = [];
    this.hearts = [];
    this.alpha = opts.startAlpha == null ? 1 : opts.startAlpha;
    this.targetAlpha = this.alpha;
    this.density = opts.density || 1;
    this.withHearts = opts.hearts !== false;
    this.running = false;
    this._tick = this.tick.bind(this);
    this.resize();
    var self = this;
    window.addEventListener('resize', function () { self.resize(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { self.running = false; }
      else { self.start(); }
    });
  }

  Sky.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    this.w = w; this.h = h; this.dpr = dpr;
    this.c.width = Math.round(w * dpr);
    this.c.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.seed();
  };

  Sky.prototype.seed = function () {
    var area = this.w * this.h;
    var nStars = Math.min(220, Math.round(area / 5200 * this.density));
    var nMotes = Math.min(46, Math.round(area / 26000 * this.density));
    var nHearts = this.withHearts ? Math.min(10, Math.round(area / 120000) + 3) : 0;
    var i;
    this.stars = [];
    for (i = 0; i < nStars; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: Math.random() * 1.1 + .25,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * .9 + .35
      });
    }
    this.motes = [];
    for (i = 0; i < nMotes; i++) this.motes.push(this.mote(true));
    this.hearts = [];
    for (i = 0; i < nHearts; i++) this.hearts.push(this.heart(true));
  };

  Sky.prototype.mote = function (anywhere) {
    var hues = ['246,201,216', '227,179,156', '255,236,230', '220,120,160'];
    return {
      x: Math.random() * this.w,
      y: anywhere ? Math.random() * this.h : this.h + 20,
      r: Math.random() * 2.2 + .8,
      vy: -(Math.random() * .22 + .06),
      vx: (Math.random() - .5) * .08,
      p: Math.random() * Math.PI * 2,
      c: hues[(Math.random() * hues.length) | 0]
    };
  };

  Sky.prototype.heart = function (anywhere) {
    return {
      x: Math.random() * this.w,
      y: anywhere ? Math.random() * this.h : this.h + 30,
      s: Math.random() * 5 + 5,
      vy: -(Math.random() * .18 + .08),
      p: Math.random() * Math.PI * 2,
      a: Math.random() * .25 + .18
    };
  };

  function drawHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * .3);
    ctx.bezierCurveTo(x, y, x - s * .5, y - s * .1, x - s * .5, y + s * .25);
    ctx.bezierCurveTo(x - s * .5, y + s * .55, x - s * .1, y + s * .75, x, y + s);
    ctx.bezierCurveTo(x + s * .1, y + s * .75, x + s * .5, y + s * .55, x + s * .5, y + s * .25);
    ctx.bezierCurveTo(x + s * .5, y - s * .1, x, y, x, y + s * .3);
    ctx.fill();
  }

  Sky.prototype.fadeTo = function (a) { this.targetAlpha = a; this.start(); };

  Sky.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
  };

  Sky.prototype.tick = function (now) {
    if (!this.running) return;
    var dt = Math.min(50, now - this.last) / 16.67;
    this.last = now;
    var ctx = this.ctx, t = now / 1000, i, o;

    this.alpha += (this.targetAlpha - this.alpha) * Math.min(1, .02 * dt);
    ctx.clearRect(0, 0, this.w, this.h);
    if (this.alpha < .005) { requestAnimationFrame(this._tick); return; }
    ctx.globalAlpha = this.alpha;

    // stars
    for (i = 0; i < this.stars.length; i++) {
      o = this.stars[i];
      var tw = reduce ? .8 : (.55 + .45 * Math.sin(t * o.s * 1.6 + o.p));
      ctx.fillStyle = 'rgba(255,245,240,' + (tw * .9).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, 6.2832);
      ctx.fill();
    }

    // glowing motes
    for (i = 0; i < this.motes.length; i++) {
      o = this.motes[i];
      if (!reduce) {
        o.y += o.vy * dt;
        o.x += (o.vx + Math.sin(t * .6 + o.p) * .12) * dt;
      }
      if (o.y < -20) this.motes[i] = o = this.mote(false);
      var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 5);
      var fl = .35 + .25 * Math.sin(t * 1.2 + o.p);
      g.addColorStop(0, 'rgba(' + o.c + ',' + fl.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + o.c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 5, 0, 6.2832);
      ctx.fill();
    }

    // tiny hearts
    for (i = 0; i < this.hearts.length; i++) {
      o = this.hearts[i];
      if (!reduce) {
        o.y += o.vy * dt;
        o.x += Math.sin(t * .5 + o.p) * .15 * dt;
      }
      if (o.y < -30) this.hearts[i] = o = this.heart(false);
      ctx.fillStyle = 'rgba(246,190,210,' + o.a.toFixed(3) + ')';
      drawHeart(ctx, o.x, o.y, o.s);
    }

    ctx.globalAlpha = 1;
    if (reduce && Math.abs(this.targetAlpha - this.alpha) < .01) { this.running = false; return; }
    requestAnimationFrame(this._tick);
  };

  window.Sky = Sky;
})();
