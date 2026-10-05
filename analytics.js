/*
  Hifz Bridge: anonymous usage events.

  What it does
  - Records small, anonymous events (taps and scores only: no names, no voice, no free text).
  - Records nothing unless a parent has said yes on the "Help improve Hifz Bridge" card.
  - Keeps events on the phone while offline and sends them in batches when online.
  - Sends to a Google Apps Script web app that writes each event as a row in your Google Sheet.

  Setup: paste your Apps Script web app URL below. See docs/FEEDBACK-SETUP.md.
  While ANALYTICS_URL is empty, events are kept on the phone (up to the cap) but never sent.
*/
const ANALYTICS_URL = '';

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
      // text/plain + no-cors keeps this a simple request that Apps Script accepts from any site.
      await fetch(ANALYTICS_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ events: batch }) });
      const rest = read('queue', []).slice(batch.length);
      write('queue', rest);
      sending = false;
      if (rest.length) setTimeout(flush, 500);
    } catch (e) {
      sending = false; // offline or blocked: keep the queue and try later
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
  };
})();
