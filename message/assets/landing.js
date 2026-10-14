/* Page 1 — QR landing */
(function () {
  'use strict';

  // ---- background ----
  var canvas = document.getElementById('sky');
  if (window.Sky && canvas) { new window.Sky(canvas).start(); }

  // ---- build the letter URL from the current address ----
  // On Vercel this becomes https://<your-project>.vercel.app/letter.html automatically.
  var letterUrl;
  try {
    var u = new URL('letter.html', window.location.href);
    u.search = ''; u.hash = '';
    letterUrl = u.href;
  } catch (e) {
    letterUrl = 'letter.html';
  }
  document.getElementById('openSurprise').setAttribute('href', 'letter.html');

  // ---- QR rendering ----
  var qr = null;
  var small = document.getElementById('qr');
  var big = document.getElementById('qrBig');
  var note = document.getElementById('hostNote');

  function makeQr() {
    if (typeof window.qrcode !== 'function') return null;
    try {
      var q = window.qrcode(0, 'Q'); // auto version, 25% error correction
      q.addData(letterUrl);
      q.make();
      return q;
    } catch (e) { return null; }
  }

  function svgFor(q) {
    var n = q.getModuleCount(), quiet = 4, size = n + quiet * 2, path = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (q.isDark(r, c)) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size +
      '" shape-rendering="crispEdges" aria-hidden="true"><rect width="100%" height="100%" fill="#ffffff"/>' +
      '<path d="' + path + '" fill="#1a0b17"/></svg>';
  }

  function fallback(el) {
    el.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'qr-fallback';
    p.textContent = 'QR not available — open this link instead: ' + letterUrl;
    el.appendChild(p);
  }

  function renderQr() {
    qr = makeQr();
    if (qr) {
      var svg = svgFor(qr);
      small.innerHTML = svg;
      big.innerHTML = svg;
      small.setAttribute('data-url', letterUrl);
    } else {
      fallback(small); fallback(big);
    }
  }

  renderQr();

  // ---- when testing on your own PC, warn that the QR points to this computer ----
  var host = window.location.hostname;
  var isPrivate = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/.test(host) || host === '';
  if (isPrivate) {
    note.textContent = 'Preview mode: this QR points to ' + (host || 'a local file') +
      '. Open your Vercel link so the QR works on another phone.';
    note.hidden = false;
  }

  // ---- full screen ----
  var modal = document.getElementById('qrModal');
  var lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.getElementById('qrClose').focus();
  }
  function closeModal() {
    modal.hidden = true;
    if (lastFocus) lastFocus.focus();
  }
  document.getElementById('qrFull').addEventListener('click', openModal);
  document.getElementById('qrFrame').addEventListener('click', openModal);
  document.getElementById('qrClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // ---- save as PNG ----
  function qrCanvas() {
    var n = qr.getModuleCount(), quiet = 4, scale = 16;
    var px = (n + quiet * 2) * scale;
    var cv = document.createElement('canvas');
    cv.width = px; cv.height = px;
    var x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, px, px);
    x.fillStyle = '#1a0b17';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (qr.isDark(r, c)) x.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
    return cv;
  }

  function dataUrlToBlob(url) {
    var bin = atob(url.split(',')[1]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: 'image/png' });
  }

  var isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  var saveImg = document.getElementById('qrImg');
  var saveActions = document.getElementById('qrSaveActions');
  var dlLink = document.getElementById('qrDownload');
  var shareBtn = document.getElementById('qrShare');
  var hint = document.getElementById('qrHint');
  var saveFile = null, blobUrl = null;

  // Phones handle saving very differently (Safari, Chrome, Messenger/Facebook in-app browser...),
  // so show the QR as a real picture with every way to save it.
  function openSaveView() {
    var dataUrl = qrCanvas().toDataURL('image/png');
    var blob = dataUrlToBlob(dataUrl);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(blob);
    try { saveFile = new File([blob], 'for-jess-qr.png', { type: 'image/png' }); } catch (e) { saveFile = null; }

    saveImg.src = dataUrl;
    saveImg.hidden = false;
    big.hidden = true;
    dlLink.href = blobUrl;
    shareBtn.hidden = !(saveFile && navigator.canShare && navigator.canShare({ files: [saveFile] }));
    saveActions.hidden = false;
    hint.textContent = 'Pindutin nang matagal ang QR → "Save image" / "Add to Photos", o gamitin ang button sa ibaba';
    openModal();
  }

  shareBtn.addEventListener('click', function () {
    if (!saveFile) return;
    navigator.share({ files: [saveFile], title: 'QR' }).catch(function () {});
  });

  document.getElementById('qrSave').addEventListener('click', function () {
    if (!qr) { window.open(letterUrl, '_blank'); return; }
    if (isPhone) { openSaveView(); return; }
    var a = document.createElement('a');
    a.href = qrCanvas().toDataURL('image/png'); a.download = 'for-jess-qr.png';
    document.body.appendChild(a); a.click(); a.remove();
  });

  // reset the full-screen view back to the live QR when it's closed
  document.getElementById('qrClose').addEventListener('click', function () {
    saveImg.hidden = true;
    saveActions.hidden = true;
    big.hidden = false;
    hint.textContent = 'point your camera here ✨';
  });
})();