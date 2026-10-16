// Mirra stress test - seed loader. Paste into the browser console on the ISOLATED instance (:3004) only.
// Shows a small panel with three buttons:
//   1. Backup now     downloads EVERY localStorage key on this origin as raw strings (no prefix filter).
//   2. Load seed...   pick seed_<id>.json. Takes a backup first, clears ALL keys, writes the seed, reloads.
//   3. Restore...     pick a backup file (this loader's format, or the earlier full-dump format). Clears, restores, reloads.
// Close every other :3004 tab first - an open page's save effect can overwrite the seed (register H8).
(() => {
  if (location.port !== "3004") { console.error("Seed loader refused: not on :3004 (" + location.origin + ")."); return; }
  const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");
  const download = (obj, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: "application/json" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
  const backup = () => {
    const keys = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); keys[k] = localStorage.getItem(k); }
    const out = { format: "mirra_raw_backup_v1", origin: location.origin, captured_at: new Date().toISOString(), key_count: Object.keys(keys).length, keys };
    download(out, `backup_${location.port}_${stamp()}.json`);
    console.log(`Backup downloaded: ${out.key_count} keys.`);
    return out;
  };
  const pick = (cb) => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json,application/json";
    input.onchange = () => { const f = input.files[0]; if (!f) return; f.text().then((t) => cb(JSON.parse(t), f.name)); };
    input.click();
  };
  const writeAll = (entries, label) => {
    localStorage.clear();
    let n = 0;
    for (const [k, v] of entries) { localStorage.setItem(k, v); n++; }
    console.log(`${label}: wrote ${n} keys. Reloading...`);
    setTimeout(() => location.reload(), 300);
  };
  const loadSeed = () => pick((seed, name) => {
    if (!seed || !seed.keys || !seed.meta) { alert("Not a seed file (needs meta and keys)."); return; }
    if (!confirm(`Load ${name}?\n${seed.meta.label}\n${seed.meta.people} people, ${seed.meta.assets} assets, ${seed.meta.groups} groups, as of ${seed.meta.as_of}.\n\nA backup downloads first. ALL keys on :3004 are replaced.`)) return;
    backup();
    writeAll(Object.entries(seed.keys).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]), `Seed ${seed.meta.recipe_id}`);
  });
  const restore = () => pick((b, name) => {
    let entries;
    if (b.format === "mirra_raw_backup_v1") entries = Object.entries(b.keys);
    else if (b.keys) entries = Object.entries(b.keys).map(([k, x]) => [k, typeof x.value === "string" ? x.value : JSON.stringify(x.value)]);
    else { alert("Not a backup file."); return; }
    if (!confirm(`Restore ${name}? ${entries.length} keys. ALL current keys on :3004 are replaced.`)) return;
    writeAll(entries, `Restore ${name}`);
  });
  document.getElementById("mirra-seed-panel")?.remove();
  const panel = document.createElement("div");
  panel.id = "mirra-seed-panel";
  panel.style.cssText = "position:fixed;top:12px;right:12px;z-index:2147483647;background:#1f3864;color:#fff;padding:10px 12px;border-radius:8px;font:13px Arial;box-shadow:0 4px 16px rgba(0,0,0,.3)";
  panel.innerHTML = "<div style='font-weight:bold;margin-bottom:6px'>Mirra stress test (:3004)</div>";
  [["Backup now", backup], ["Load seed...", loadSeed], ["Restore...", restore], ["Close", () => panel.remove()]].forEach(([t, fn]) => {
    const b = document.createElement("button"); b.textContent = t; b.onclick = fn;
    b.style.cssText = "margin:2px;padding:4px 8px;border:0;border-radius:4px;cursor:pointer;font:13px Arial";
    panel.appendChild(b);
  });
  document.body.appendChild(panel);
  console.log("Mirra seed loader ready (top right).");
})();
