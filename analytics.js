/*
  Hifz Bridge: anonymous usage events.

  What it does
  - Records small, anonymous events (taps and scores only: no names, no voice, no free text).
  - Records nothing unless a parent has said yes on the "Help improve Hifz Bridge" card.
  - Keeps events on the phone while offline and sends them in batches when online.
  - Sends to a Google Apps Script web app that writes each event as a row in your Google Sheet.

  Setup: paste your Apps Script web app URL below. See docs/FEEDBACK-SETUP.md.
  While ANALYTICS_URL is empty, events are kept on the phone (up to the cap) but never sent.
  Events are removed from the phone only after the collector replies "ok", so a broken link loses nothing.
*/
const ANALYTICS_URL = 'https://script.google.com/macros/s/AKfycbx6XDw7WL5UpSb_qsl9IDl82sRGYeE9qKdZe5LuVxSu4JudsR_MZZ-HH7hxS2XAwwliJg/exec';

(function () {
  const KEY = 'hsq2.analytics';
  const MAX_QUEUE = 500;      // oldest events are dropped beyond this
  const BATCH = 50;           // events per request
  const read = (k, d) => { try { const v = localStorage.getItem(KEY + '.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(KEY + '.' + k, JSON.stringify(v)); } catch (e) {} };

  const rid = () => (crypto && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  let device = read('device', null);
  if (!device) { device = rid(); write('device', device); }
  const session = rid().slice(0, 8);
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const platform = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'desktop';

  let sending = false;
  async function flush() {
    if (sending || !ANALYTICS_URL || read('consent', null) !== true || !navigator.onLine) return;
    const q = read('queue', []);
    if (!q.length) return;
    sending = true;
    const batch = q.slice(0, BATCH);
    try {
      // A plain-text POST is a "simple" request, so Apps Script accepts it from any site
      // and we can read its reply. Events leave the phone only after the Sheet says "ok".
      const res = await fetch(ANALYTICS_URL, { method: 'POST', body: JSON.stringify({ events: batch }) });
      const text = res.ok ? await res.text() : '';
      if (!/^ok\b/.test(text)) throw new Error('collector replied: ' + (text || res.status).toString().slice(0, 60));
      const rest = read('queue', []).slice(batch.length);
      write('queue', rest);
      write('last', { ok: new Date().toISOString() });
      sending = false;
      if (rest.length) setTimeout(flush, 500);
    } catch (e) {
      sending = false; // offline, blocked or a bad link: keep the queue and try later
      write('last', { error: String(e && e.message || e).slice(0, 80), at: new Date().toISOString() });
    }
  }

  function track(event, props) {
    if (read('consent', null) !== true) return;
    const q = read('queue', []);
    q.push(Object.assign({
      t: new Date().toISOString(),
      event, device, session,
      v: (typeof APP_VERSION !== 'undefined' ? APP_VERSION : ''),
      mode: standalone ? 'app' : 'browser',
      platform,
    }, props || {}));
    write('queue', q.slice(-MAX_QUEUE));
    clearTimeout(track._t);
    track._t = setTimeout(flush, 1500);
  }

  function setConsent(yes) {
    write('consent', !!yes);
    if (!yes) write('queue', []);
    else track('consent_yes');
  }

  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('appinstalled', () => track('app_installed'));
  setTimeout(flush, 3000);

  window.HB = {
    track, setConsent, flush,
    get consent() { return read('consent', null); },
    get queued() { return read('queue', []).length; },
    get configured() { return !!ANALYTICS_URL; },
    get last() { return read('last', null); },
  };
})();
