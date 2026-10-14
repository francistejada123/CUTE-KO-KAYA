TO MY JESS - quick guide
========================

FILES (all inside C:\xampp\htdocs\message\)
  index.html          Page 1 - QR landing ("scan mo nakakagulat yan")
  letter.html         Page 2 + 3 + finale - intro, envelope, the letter, last surprise
  assets\style.css    all styling and animations
  assets\sky.js       stars / glowing particles / tiny hearts background
  assets\landing.js   builds the QR from the current public address
  assets\letter.js    intro timeline, envelope, scroll reveals, finale, replay
  assets\music.js     optional soft music (generated in the browser, no file needed)
  assets\qrcode.js    QR generator library (MIT, offline - no internet needed)
  assets\index.html   blank page so the assets folder can't be browsed

LOCAL
  http://localhost/message/            (landing + QR)
  http://localhost/message/letter.html (the letter directly)
  Note: on localhost the QR points to localhost, so another phone can't open it.
  A small "Preview mode" note shows on the page when that happens.

PUBLIC (Cloudflare Tunnel)
  https://<your-tunnel-hostname>/message/
  Open THIS link once in your own browser and check that the QR is generated from it.
  The QR is built from whatever address the page was opened with, so through the
  tunnel it automatically encodes https://<your-tunnel-hostname>/message/letter.html.

  If you use a quick tunnel (https://something.trycloudflare.com):
  - that address changes every time you restart cloudflared
  - the link AND the QR only work while that tunnel is running
  - if you restart it, send Jess the new link (the QR updates itself)

SAFETY NOTE
  If your tunnel points at http://localhost:80, it exposes ALL of htdocs, including
  /phpmyadmin and /dashboard. Apache sees tunnel visitors as coming from localhost,
  so XAMPP's "local only" protection does not block them.

  Safest option for a quick tunnel - serve only this folder (uses XAMPP's own PHP):
    C:\xampp\php\php.exe -S 127.0.0.1:8099 -t C:\xampp\htdocs\message
    cloudflared tunnel --url http://localhost:8099
  Then the public link is https://<new-hostname>/ (no /message/ needed).

  For a named tunnel with config.yml, you can limit it to this folder:
    ingress:
      - hostname: your.domain.com
        path: ^/message(/.*)?$
        service: http://localhost:80
      - service: http_status:404

OPTIONAL: YOUR OWN SONG
  Put a file in assets\ (e.g. music.mp3) and in assets\music.js set
    var MUSIC_FILE = 'assets/music.mp3';
  Music never autoplays - it only starts when Jess taps the "music" button.
