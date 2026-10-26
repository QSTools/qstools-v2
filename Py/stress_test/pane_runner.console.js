// pane_runner.console.js - live check of a stress seed in the built-in browser pane (production build on :3005). 2026-10-27
// WHAT IT DOES: seeds localStorage from public\__stress_tmp (seed_<id>.json), then reads the calculation trace JSON and compares it with
//   expected_<id>_layer2.json: trace nodes, Cost Allocation raw checks, derived checks, plus trace integrity (duplicates / missing endpoints).
//   Same pass rule as compare_full.py: own tolerance, else max(1, 1e-4 x |expected|).
// CHANGES: browser storage of the pane's :3005 origin only (backed up to sessionStorage __bak first, restored at the end). No repo file.
// HOW (Claude drives it with javascript_tool; each numbered step is a SEPARATE call, never navigate and run a script in the same batch):
//   1. open any http://localhost:3005 page.
//   2. run SEED(id) below (id e.g. scenario_b_dry_hire).
//   3. navigate to http://localhost:3005/calculation-trace
//   4. run: (0,eval)(sessionStorage.getItem('__runner')); await window.__grab(); window.__cmp()
//   5. repeat 2 to 4 per seed, then RESTORE() and check the key count matches the backup (18 keys on the owner's pane).
// OUTPUT: __cmp() returns {total, pass, sec:{nodes,raw,derived}:[count,passed], fails[], traceNodes, edges, dup, missingEnds, integrity}.
// LIMITS: the seed loader refuses nothing, so only run it on the pane at :3005 (never the owner's Chrome). Asset interest is dated to the day the
//   page runs, so seeds must be generated with --as-of = today (NZ date); if only interest nodes fail, regenerate.

const SEED = async (id) => {
  if (!sessionStorage.getItem('__bak')) {
    const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); }
    sessionStorage.setItem('__bak', JSON.stringify(o));
  }
  const seed = await fetch('/__stress_tmp/seed_' + id + '.json').then(r => r.json());
  const exp = await fetch('/__stress_tmp/expected_' + id + '_layer2.json').then(r => r.json());
  localStorage.clear();
  for (const [k, v] of Object.entries(seed.keys)) localStorage.setItem(k, JSON.stringify(v));
  sessionStorage.setItem('__exp', JSON.stringify(exp));
  sessionStorage.setItem('__runner', RUNNER);
  return { id, seedKeys: Object.keys(seed.keys).length, expNodes: Object.keys(exp.nodes).length };
};

const RESTORE = () => {
  const bak = JSON.parse(sessionStorage.getItem('__bak'));
  localStorage.clear(); for (const [k, v] of Object.entries(bak)) localStorage.setItem(k, v);
  const bad = Object.entries(bak).filter(([k, v]) => localStorage.getItem(k) !== v).map(([k]) => k);
  ['__bak', '__exp', '__runner'].forEach(k => sessionStorage.removeItem(k));
  return { restored: localStorage.length, bad };
};

const RUNNER = `
window.__grab = async () => {
  let blobP = null; const orig = URL.createObjectURL;
  URL.createObjectURL = (b) => { blobP = b; return orig.call(URL, b); };
  const btn = [...document.querySelectorAll('button')].find(b => /download trace json/i.test(b.textContent));
  if (!btn) return { err: 'no download button' };
  btn.click(); await new Promise(r => setTimeout(r, 1500));
  URL.createObjectURL = orig;
  if (!blobP) return { err: 'no blob' };
  window.__snap = JSON.parse(await blobP.text());
  return { ok: true, nodes: window.__snap.nodes.length };
};
window.__cmp = () => {
  const exp = JSON.parse(sessionStorage.getItem('__exp')), snap = window.__snap;
  const actual = {}; snap.nodes.forEach(n => actual[n.node_id] = n.resolved_value);
  const raw = snap.cost_allocation_raw || {};
  const resolve = (obj, path) => { for (const s of path) { if (s && typeof s === 'object') obj = (obj || []).find(x => Object.entries(s).every(([k, v]) => x[k] === v)); else obj = (obj && typeof obj === 'object') ? obj[s] : undefined; if (obj === undefined || obj === null) return null; } return obj; };
  const dtol = e => Math.max(1, 1e-4 * Math.abs(e));
  const names = exp.group_names || {}; const lab = n => n.split('.').map(p => names[p] || p).join('.');
  const fails = []; let total = 0, pass = 0;
  const row = (name, e, a, tol, sect) => { total++; if (typeof a !== 'number') { fails.push(sect + ' MISSING ' + name + ' exp ' + e + ' got ' + a); return; } if (Math.abs(a - e) <= tol) pass++; else fails.push(sect + ' FAIL ' + name + ' exp ' + e + ' got ' + a + ' diff ' + (a - e)); };
  const sec = {}; let b = [total, pass];
  for (const [n, e] of Object.entries(exp.nodes)) row(lab(n), e, actual[n], (exp.tolerances || {})[n] ?? dtol(e), 'node');
  sec.nodes = [total - b[0], pass - b[1]]; b = [total, pass];
  for (const c of (exp.raw_checks || [])) row(c.label, c.expected, resolve(raw, c.path), c.tol != null ? c.tol : dtol(c.expected), 'raw');
  sec.raw = [total - b[0], pass - b[1]]; b = [total, pass];
  for (const c of (exp.derived_checks || [])) { const pct = resolve(raw, c.percent_path); if (pct === null) { total++; fails.push('derived MISSING pct ' + c.label); continue; } const e = c.const + c.coef * pct / 100; const a = c.kind === 'node' ? actual[c.key] : resolve(raw, c.path); row(c.label, e, a, c.tol != null ? c.tol : dtol(e), 'derived'); }
  sec.derived = [total - b[0], pass - b[1]];
  const ids = snap.nodes.map(n => n.node_id);
  return { total, pass, sec, fails: fails.slice(0, 40), traceNodes: ids.length, edges: (snap.edges || []).length, dup: ids.length - new Set(ids).size, integrity: snap.integrity_report };
};`;
