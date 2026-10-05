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
