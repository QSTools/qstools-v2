// bm7_f_storage_tap.js
// BM-7 audit, part F (runtime check). Paste into the browser console of the running app.
// OBSERVES ONLY: it wraps Storage getItem / setItem / removeItem / clear to log each call, then
// passes the call straight through. It changes no data of its own. The app still does its normal
// reads and writes (it rewrites updated_at in qs_tools_general_overhead_state on load, for one).
//
// How to use
//   1. Open the app on any page, paste this whole file into the console, press Enter.
//   2. Move between pages using the app's own links (client-side navigation keeps the tap; a full
//      page reload removes it, so paste again after a reload).
//   3. Optionally edit a number on General Overheads or Rate Builder and wait a second.
//   4. Run  __bm7.report()  -  it prints the result and copies it to the clipboard (a line of
//      "undefined" afterwards is normal). Paste it straight away.
//   5. __bm7.remove() restores the original Storage methods.
// Readable caller names need a dev server; on a production build the keys per page still show.

(() => {
  if (window.__bm7) { console.log('BM-7 tap already installed. Run __bm7.report()'); return; }
  const S = Storage.prototype;
  const orig = { g: S.getItem, s: S.setItem, r: S.removeItem, c: S.clear };
  const log = [];
  const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };
  const snap = () => {
    const o = {};
    Object.keys(localStorage).sort().forEach(k => { const v = orig.g.call(localStorage, k); o[k] = (v || '').length + ':' + hash(v || ''); });
    return o;
  };
  const where = () => {
    const lines = (new Error().stack || '').split('\n').slice(3, 6);
    return lines.map(l => l.trim().replace(/^at\s+/, '').replace(/\(?https?:\/\/[^/]+/, '(').slice(0, 90)).join(' < ');
  };
  const store = (self) => (self === window.sessionStorage ? 'session' : 'local');
  S.getItem = function (k) { log.push({ op: 'R', st: store(this), k: String(k), page: location.pathname, w: where() }); return orig.g.apply(this, arguments); };
  S.setItem = function (k, v) {
    const prev = orig.g.call(this, k);
    log.push({ op: 'W', st: store(this), k: String(k), same: prev === String(v), page: location.pathname, w: where() });
    return orig.s.apply(this, arguments);
  };
  S.removeItem = function (k) { log.push({ op: 'X', st: store(this), k: String(k), page: location.pathname, w: where() }); return orig.r.apply(this, arguments); };
  S.clear = function () { log.push({ op: 'C', st: store(this), k: '*', page: location.pathname, w: where() }); return orig.c.apply(this, arguments); };

  const start = snap();
  window.__bm7 = {
    log,
    start,
    remove() { S.getItem = orig.g; S.setItem = orig.s; S.removeItem = orig.r; S.clear = orig.c; delete window.__bm7; console.log('BM-7 tap removed'); },
    report() {
      const agg = {};
      log.forEach(e => {
        const id = e.page + ' | ' + e.st + ' | ' + e.op + ' | ' + e.k + (e.op === 'W' ? (e.same ? ' (same value)' : ' (CHANGED value)') : '');
        const a = agg[id] || (agg[id] = { n: 0, w: {} });
        a.n++; a.w[e.w.split(' < ')[0]] = 1;
      });
      const lines = ['BM-7 F. STORAGE TAP REPORT   ' + new Date().toISOString(), 'calls logged: ' + log.length, '',
        'page | store | op | key  x count   [first caller frames]'];
      Object.keys(agg).sort().forEach(id => lines.push(id + '  x' + agg[id].n + '   [' + Object.keys(agg[id].w).slice(0, 2).join(' ; ') + ']'));
      const end = snap();
      const keys = Array.from(new Set([...Object.keys(start), ...Object.keys(end)])).sort();
      lines.push('', 'Keys changed since the tap was installed (length:hash):');
      let any = false;
      keys.forEach(k => { if (start[k] !== end[k]) { any = true; lines.push('  ' + k + '   ' + (start[k] || 'absent') + '  ->  ' + (end[k] || 'absent')); } });
      if (!any) lines.push('  none');
      const text = lines.join('\n');
      console.log(text);
      try { copy(text); } catch (e) { /* copy() only exists in devtools consoles */ }
    }
  };
  console.log('BM-7 tap installed. Navigate with the app links, then run __bm7.report()');
})();
