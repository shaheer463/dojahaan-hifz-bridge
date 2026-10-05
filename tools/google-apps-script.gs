/**
 * Hifz Bridge: event collector for Google Sheets.
 *
 * Paste this whole file into Extensions → Apps Script in your Google Sheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web app URL into ANALYTICS_URL at the top of analytics.js.
 *
 * Each event becomes one row in the "events" tab. New kinds of fields get their
 * own column automatically, so app updates never need changes here.
 */
const SHEET_NAME = 'events';
const MAX_EVENTS_PER_REQUEST = 100;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const events = (body.events || []).slice(0, MAX_EVENTS_PER_REQUEST);
    if (!events.length) return ContentService.createTextOutput('no events');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    if (!headers.length) headers = ['received', 't', 'event', 'device', 'session', 'v', 'mode', 'platform'];

    // add a column for any new field
    events.forEach(ev => Object.keys(ev).forEach(k => { if (headers.indexOf(k) === -1) headers.push(k); }));
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    const now = new Date();
    const rows = events.map(ev => headers.map(h => {
      if (h === 'received') return now;
      const val = ev[h];
      if (val === undefined || val === null) return '';
      return typeof val === 'object' ? JSON.stringify(val) : String(val).slice(0, 200);
    }));
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    return ContentService.createTextOutput('ok ' + rows.length);
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

// Open the web app URL in a browser to check it's live.
function doGet() {
  return ContentService.createTextOutput('Hifz Bridge collector is running.');
}


/* =====================================================================
 * INSIGHTS: builds summary tabs from the "events" tab.
 *
 * After pasting this file and saving:
 *   1. Reload the Sheet. A "Hifz Bridge" menu appears.
 *   2. Hifz Bridge → Refresh insights (approve permissions the first time).
 *   3. Optional: Hifz Bridge → Refresh every morning.
 *
 * The web app doesn't need redeploying for this part.
 * ===================================================================== */
const SURAH_NAMES = {99:"Az-Zalzalah",100:"Al-'Adiyat",101:"Al-Qari'ah",102:"At-Takathur",103:"Al-'Asr",104:"Al-Humazah",105:"Al-Fil",106:"Quraysh",107:"Al-Ma'un",108:"Al-Kawthar",109:"Al-Kafirun",110:"An-Nasr",111:"Al-Masad",112:"Al-Ikhlas",113:"Al-Falaq",114:"An-Nas"};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Hifz Bridge')
    .addItem('Refresh insights', 'refreshInsights')
    .addItem('Refresh every morning', 'setupDailyRefresh')
    .addToUi();
}

function setupDailyRefresh() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'refreshInsights').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('refreshInsights').timeBased().everyDays(1).atHour(6).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Insights will refresh every morning around 6am.');
}

function refreshInsights() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) { ss.toast('No events yet.'); return; }
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1).map(r => { const o = {}; headers.forEach((h, i) => o[h] = r[i]); return o; });
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  const day = v => { const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? '' : Utilities.formatDate(d, tz, 'yyyy-MM-dd'); };
  const ins = computeInsights(rows, day, day(new Date()));

  writeTab(ss, 'Summary', [['Measure', 'Value', 'What it means']].concat(ins.summary));
  writeTab(ss, 'Hardest ayahs', [['Surah', 'Name', 'Ayah', 'Attempts', 'Needed help', 'Help rate', 'Devices']].concat(ins.ayahs));
  writeTab(ss, 'Hardest words', [['Word', 'Answers', 'Wrong', 'Accuracy', 'Most common mix-up']].concat(ins.words));
  writeTab(ss, 'Devices', [['Device', 'First seen', 'Last seen', 'Active days', 'Active days (last 7)', 'Ayah attempts', 'Surah stars', 'Version', 'Platform']].concat(ins.devices));
  writeTab(ss, 'Daily', [['Date', 'Active devices', 'Ayah attempts', 'Needed help', 'Quiz answers']].concat(ins.daily));
  ss.getSheetByName('Hardest ayahs').getRange('F2:F').setNumberFormat('0%');
  ss.getSheetByName('Hardest words').getRange('D2:D').setNumberFormat('0%');
  ss.toast('Insights refreshed from ' + rows.length + ' events.');
}

function writeTab(ss, name, table) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  const width = Math.max.apply(null, table.map(r => r.length));
  const grid = table.map(r => r.concat(Array(width - r.length).fill('')));
  sh.getRange(1, 1, grid.length, width).setValues(grid);
  sh.getRange(1, 1, 1, width).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, width);
}

/* Pure calculation, kept separate so it can be tested outside Google. */
function computeInsights(rows, dayOf, today) {
  const num = v => (v === '' || v === null || v === undefined) ? null : Number(v);
  const daysAgo = (d, n) => { const t = new Date(today + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - n); return d >= t.toISOString().slice(0, 10); };
  const dev = {}, ayah = {}, word = {}, daily = {};
  let attempts = 0, misses = 0, helpAdded = 0, cleared = 0, stars = 0, qa = 0, qok = 0, quizzes = 0, quizPct = 0, opens = 0;
  const optedIn = new Set();
  rows.forEach(r => {
    const d = dayOf(r.t || r.received); if (!d) return;
    const id = r.device || '?';
    const D = dev[id] || (dev[id] = { first: d, last: d, days: new Set(), att: 0, stars: 0, v: '', p: '' });
    if (d < D.first) D.first = d; if (d > D.last) D.last = d;
    D.days.add(d); D.v = r.v || D.v; D.p = r.platform || D.p;
    const Y = daily[d] || (daily[d] = { devs: new Set(), att: 0, help: 0, qa: 0 });
    Y.devs.add(id);
    switch (r.event) {
      case 'consent_yes': optedIn.add(id); break;
      case 'app_open': opens++; break;
      case 'ayah_result': {
        attempts++; D.att++; Y.att++;
        const k = num(r.surah) + ':' + num(r.ayah);
        const A = ayah[k] || (ayah[k] = { s: num(r.surah), a: num(r.ayah), n: 0, miss: 0, devs: new Set() });
        A.n++; A.devs.add(id);
        if (num(r.correct) === 0) { A.miss++; misses++; Y.help++; }
        break;
      }
      case 'needed_help': helpAdded++; break;
      case 'practice_cleared': cleared++; break;
      case 'recite_star': stars++; D.stars++; break;
      case 'quiz_answer': {
        qa++; Y.qa++;
        const W = word[r.word] || (word[r.word] = { n: 0, wrong: 0, picks: {} });
        W.n++;
        if (num(r.correct) === 1) qok++; else { W.wrong++; if (r.picked) W.picks[r.picked] = (W.picks[r.picked] || 0) + 1; }
        break;
      }
      case 'quiz_done': quizzes++; quizPct += (num(r.score) || 0) / (num(r.total) || 1); break;
    }
  });
  const devIds = Object.keys(dev);
  const active7 = devIds.filter(id => [...dev[id].days].some(d => daysAgo(d, 6))).length;
  const avgDays = devIds.length ? devIds.reduce((a, id) => a + dev[id].days.size, 0) / devIds.length : 0;
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '-';
  const summary = [
    ['Devices that opted in', optedIn.size, 'Families who tapped "Yes, share"'],
    ['Devices active in the last 7 days', active7, 'Weekly active families'],
    ['Average practice days per device', Math.round(avgDays * 10) / 10, 'How many different days each device was used'],
    ['App opens', opens, ''],
    ['Ayahs recited (Your turn)', attempts, 'Every "I got it" or "Needed help" tap'],
    ['Recited from memory', pct(attempts - misses, attempts), 'Share of taps that were "I got it"'],
    ['Ayahs added to practice lists', helpAdded, ''],
    ['Practice ayahs cleared', cleared, pct(cleared, helpAdded) + ' of added ayahs are now cleared'],
    ['Surah "Your turn" stars earned', stars, 'Whole surah recited with an empty practice list'],
    ['Word quiz answers', qa, 'Accuracy ' + pct(qok, qa)],
    ['Word quizzes finished', quizzes, 'Average score ' + (quizzes ? Math.round(quizPct / quizzes * 100) + '%' : '-')],
    ['Last refreshed', today, ''],
  ];
  const ayahs = Object.values(ayah)
    .sort((x, y) => y.miss - x.miss || (y.miss / y.n) - (x.miss / x.n) || x.s - y.s || x.a - y.a)
    .map(A => [A.s, SURAH_NAMES[A.s] || '', A.a, A.n, A.miss, A.n ? A.miss / A.n : 0, A.devs.size]);
  const words = Object.keys(word).map(k => {
    const W = word[k], top = Object.keys(W.picks).sort((a, b) => W.picks[b] - W.picks[a])[0];
    return [k, W.n, W.wrong, W.n ? (W.n - W.wrong) / W.n : 0, top ? top + ' (' + W.picks[top] + 'x)' : ''];
  }).sort((x, y) => x[3] - y[3] || y[2] - x[2]);
  const devices = devIds.map(id => { const D = dev[id]; return [id.slice(0, 8), D.first, D.last, D.days.size, [...D.days].filter(d => daysAgo(d, 6)).length, D.att, D.stars, D.v, D.p]; })
    .sort((x, y) => (y[2] > x[2] ? 1 : y[2] < x[2] ? -1 : 0));
  const dailyRows = Object.keys(daily).sort().reverse().map(d => [d, daily[d].devs.size, daily[d].att, daily[d].help, daily[d].qa]);
  return { summary, ayahs, words, devices, daily: dailyRows };
}
