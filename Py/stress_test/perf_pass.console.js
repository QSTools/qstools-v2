// Mirra stress test - UI performance pass (Q-7), frame method. Saved 2026-10-22 (stress brief Addendum 15).
// READ-ONLY on the repo. Run in the browser console (or the built-in browser pane) on the PRODUCTION server
// (npm run build, then npm start -- -p 3005), pane VISIBLE (check requestAnimationFrame gives about 60 fps).
// Needs seed files served at /__stress_tmp/seed_n<N>.json (public\__stress_tmp\ must exist BEFORE the build;
// delete it afterwards). Generate: python Py\stress_test\generate_business.py <recipe> --as-of <today> --staff-total N --out <dir>.
// Run it from the plain seed JSON page (http://localhost:3005/__stress_tmp/seed_n10.json) so no app is running in the parent.
// It overwrites localStorage on that origin (clears it at the end). Output: one line per route and run.
// Known limits: ready = load or last long task (over 50 ms) plus 1.5 s quiet; typing is measured separately (see brief).
window.__runPass = async (n, routes, runs) => {
  const seed = await (await fetch('/__stress_tmp/seed_n' + n + '.json')).json();
  const entries = Object.entries(seed.keys).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
  const out = [];
  for (const route of routes) {
    for (let run = 1; run <= runs; run++) {
      localStorage.clear(); for (const [k, v] of entries) localStorage.setItem(k, v);
      const tasks = []; const po = new PerformanceObserver(l => { for (const e of l.getEntries()) tasks.push([e.startTime, e.duration]); });
      po.observe({ entryTypes: ['longtask'] });
      const fr = document.createElement('iframe');
      fr.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff';
      let loadT = null; const t0 = performance.now(); fr.onload = () => { loadT = performance.now() - t0; };
      fr.src = route; document.body.appendChild(fr);
      let ready = null;
      while (true) {
        await new Promise(r => setTimeout(r, 100));
        const now = performance.now() - t0;
        const lastEnd = tasks.length ? Math.max(...tasks.map(t => t[0] + t[1])) - t0 : 0;
        if (loadT !== null && now - Math.max(lastEnd, loadT) > 1500) { ready = Math.max(lastEnd, loadT); break; }
        if (now > 40000) { ready = -1; break; }
      }
      po.disconnect();
      const maxF = tasks.length ? Math.max(...tasks.map(t => t[1])) : 0;
      out.push({ n, route, run, ready: Math.round(ready), maxFreeze: Math.round(maxF), longTasks: tasks.length });
      fr.remove(); await new Promise(r => setTimeout(r, 300));
    }
  }
  localStorage.clear();
  return out;
};
window.__R = ['/labour', '/assets', '/cost-allocation', '/rate-builder', '/cost-summary', '/business-outcome', '/business-modelling', '/calculation-trace'];
// Usage: (await window.__runPass(1000, window.__R.slice(0, 5), 2)).map(x => `${x.route} r${x.run}: ready ${x.ready} / freeze ${x.maxFreeze}`).join('\n')
// Split 1,000 staff into two calls (slice(0,5), slice(5)) so one call stays short.
