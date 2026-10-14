/* Background music: "Last Night on Earth" by Green Day, played from the official YouTube video.
   Starts when Jess taps "Open My Letter" (browsers only allow sound after a tap).
   If YouTube can't play it (offline, embedding blocked), a soft tune generated in the browser plays instead.
   To use a different YouTube video, put its ID first in YT_IDS. */
(function () {
  'use strict';

  var YT_IDS = ['5_A7VlJEspI', '1RTMbmVr3j8', '7_vDnvX49IU']; // your chosen video, then official music video, then official visualizer
  var YT_VOLUME = 70;

  var btn, label, card, playing = false, mode = 'yt', resumeOnReturn = false;
  var yt = null, ytReady = false, ytIndex = 0, wantPlay = false, startTimer = null;

  // ---------------- YouTube ----------------
  function loadYouTube() {
    window.onYouTubeIframeAPIReady = function () {
      yt = new window.YT.Player('ytPlayer', {
        width: '100%', height: '100%',
        videoId: YT_IDS[0],
        host: 'https://www.youtube.com',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, fs: 0 },
        events: {
          onReady: function () { ytReady = true; try { yt.setVolume(YT_VOLUME); } catch (e) {} if (wantPlay) ytPlay(); },
          onStateChange: onYtState,
          onError: onYtError
        }
      });
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = function () { mode = 'synth'; if (wantPlay) startSynthUi(); };
    document.head.appendChild(s);
    // If the API never loads (blocked network), give up on YouTube after 8s
    setTimeout(function () { if (!ytReady && mode === 'yt') { mode = 'synth'; if (card) card.classList.remove('show'); if (wantPlay) startSynthUi(); } }, 8000);
  }

  function onYtState(e) {
    var S = window.YT.PlayerState;
    if (e.data === S.PLAYING) { clearTimeout(startTimer); card.classList.remove('needs-tap'); setUi(true); }
    else if (e.data === S.PAUSED) { setUi(false); }
    else if (e.data === S.ENDED) { try { yt.seekTo(0); yt.playVideo(); } catch (x) {} }
  }

  function onYtError() {
    ytIndex++;
    if (ytIndex < YT_IDS.length) {
      try { wantPlay ? yt.loadVideoById(YT_IDS[ytIndex]) : yt.cueVideoById(YT_IDS[ytIndex]); } catch (e) {}
    } else {
      mode = 'synth';
      card.classList.remove('show');
      if (wantPlay) startSynthUi();
    }
  }

  function ytPlay() {
    card.classList.add('show');
    try { yt.unMute(); yt.setVolume(YT_VOLUME); yt.playVideo(); } catch (e) {}
    // Some phones (mostly iPhone) block YouTube sound until the player itself is tapped
    clearTimeout(startTimer);
    startTimer = setTimeout(function () {
      if (!playing && mode === 'yt') card.classList.add('needs-tap');
    }, 2500);
  }

  // ---------------- fallback synth ----------------
  var ctx = null, master = null, timer = null, step = 0;
  var CHORDS = [
    [174.61, 220.00, 261.63, 329.63],
    [164.81, 196.00, 246.94, 293.66],
    [146.83, 174.61, 220.00, 261.63],
    [130.81, 196.00, 246.94, 293.66]
  ];
  var MELODY = [523.25, 659.25, 587.33, 523.25, 493.88, 587.33, 523.25, 440.00];
  var BAR = 4.2;

  function ensureCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      var delay = ctx.createDelay(); delay.delayTime.value = 0.38;
      var fb = ctx.createGain(); fb.gain.value = 0.28;
      master.connect(lp); lp.connect(ctx.destination);
      lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function note(freq, t, dur, gain, type) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(1.2, dur * .3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function scheduleBar() {
    if (!ctx) return;
    var t = ctx.currentTime + 0.08, chord = CHORDS[step % CHORDS.length];
    for (var i = 0; i < chord.length; i++) note(chord[i], t + i * 0.06, BAR + 1.2, 0.035, 'triangle');
    note(MELODY[(step * 2) % MELODY.length], t + 0.6, 2.6, 0.05);
    note(MELODY[(step * 2 + 1) % MELODY.length], t + 2.5, 2.6, 0.05);
    step++;
  }
  function startSynth() {
    if (!ensureCtx()) return false;
    if (timer) return true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2);
    scheduleBar(); timer = setInterval(scheduleBar, BAR * 1000);
    return true;
  }
  function stopSynth() {
    if (timer) { clearInterval(timer); timer = null; }
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, .4);
  }
  function startSynthUi() { setUi(startSynth()); }

  // ---------------- controls ----------------
  function setUi(on) {
    playing = on;
    if (!btn) return;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    label.textContent = on ? 'music on' : 'music';
  }

  function play() {
    wantPlay = true;
    ensureCtx(); // unlock audio inside the tap (needed on phones) in case we fall back to the soft tune
    if (mode === 'yt') {
      if (ytReady) ytPlay();
      else { card.classList.add('show'); label.textContent = '…'; } // plays as soon as the player is ready
    } else {
      startSynthUi();
    }
  }

  function pause() {
    wantPlay = false;
    clearTimeout(startTimer);
    if (mode === 'yt' && ytReady) { try { yt.pauseVideo(); } catch (e) {} }
    else stopSynth();
    setUi(false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    btn = document.getElementById('musicBtn');
    label = document.getElementById('musicLabel');
    card = document.getElementById('ytCard');
    if (!btn || !card) return;
    btn.addEventListener('click', function () { resumeOnReturn = false; playing ? pause() : play(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) { resumeOnReturn = true; pause(); }
      else if (!document.hidden && resumeOnReturn) { resumeOnReturn = false; play(); }
    });
    loadYouTube();
  });

  window.LoveMusic = {
    show: function () { if (btn) btn.classList.add('show'); },
    start: function () { if (btn && !playing) play(); }
  };
})();
