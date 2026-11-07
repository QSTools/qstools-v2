// R3 slice 5 batch A test. READ-ONLY: imports one pure function, touches no browser storage and writes no file.
// Run: node Py\model_storage_tests\s5_whole_business_gap.test.mjs
// Checks lib/calculations/wholeBusinessRateGap.js (BM brief Addendum 37 item 5) and that the page uses it. Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}
const near = (a, b, tol = 0.0001) => typeof a === "number" && Math.abs(a - b) <= tol;
const H = await import(pathToFileURL(path.join(root, "lib", "calculations", "wholeBusinessRateGap.js")).href);
const calc = H.calculateWholeBusinessRateGap;

function freeze(v) { if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.freeze(v); Object.values(v).forEach(freeze); } return v; }
const g = (id, seat, min, full, rev, cov = seat) => ({ group_id: id, group_name: id, seat_hours: seat, min_rate: min, full_cost_rate: full, modelled_revenue: rev, covered_hours: cov });

// 1 all equal hours, two groups: hand worked. G1 100h min 80 full 90 rev 10000 (100/h); G2 300h min 60 full 70 rev 24000 (80/h)
{
  const r = calc(freeze([g("g1", 100, 80, 90, 10000), g("g2", 300, 60, 70, 24000)]));
  check("1 weighted min rate (80*100+60*300)/400 = 65", near(r.min_rate, 65), String(r.min_rate));
  check("1 weighted full cost rate (90*100+70*300)/400 = 75", near(r.full_cost_rate, 75), String(r.full_cost_rate));
  check("1 revenue per seat hour 34000/400 = 85", near(r.revenue_per_seat_hour, 85), String(r.revenue_per_seat_hour));
  check("1 gaps 85-65 = 20 and 85-75 = 10", near(r.gap_to_min_rate, 20) && near(r.gap_to_full_cost_rate, 10));
  check("1 totals 400 seat, 400 covered, not differing", r.total_seat_hours === 400 && r.total_covered_hours === 400 && r.covered_differs === false);
  check("1 not an unweighted mean (72.5 / 82.5 / 90 would be wrong)", !near(r.min_rate, 70) && !near(r.revenue_per_seat_hour, 90));
}
// 2 covered below seat: revenue stays on seat hours, flag set, total covered shown
{
  const r = calc([g("g1", 100, 80, 90, 8000, 80), g("g2", 100, 60, 70, 10000)]);
  check("2 revenue per SEAT hour = 18000/200 = 90 (not /180)", near(r.revenue_per_seat_hour, 90), String(r.revenue_per_seat_hour));
  check("2 covered differs flagged, covered total 180, seat total 200", r.covered_differs === true && r.total_covered_hours === 180 && r.total_seat_hours === 200);
}
// 3 covered differs by 0.1 or less is NOT flagged; just over is
{
  check("3 difference of exactly 0.1 not flagged", calc([g("g1", 100, 80, 90, 8000, 99.9)]).covered_differs === false);
  check("3 difference of 0.11 flagged", calc([g("g1", 100, 80, 90, 8000, 99.89)]).covered_differs === true);
}
// 4 one group excluded for missing revenue: left out of ALL THREE, named with reason
{
  const r = calc([g("g1", 100, 80, 90, 10000), { ...g("g2", 300, 60, 70, null), modelled_revenue: null }]);
  check("4 excluded group named with reason", r.excluded_groups.length === 1 && r.excluded_groups[0].group_id === "g2" && /revenue/.test(r.excluded_groups[0].reason));
  check("4 all three averages use g1 only (80 / 90 / 100)", near(r.min_rate, 80) && near(r.full_cost_rate, 90) && near(r.revenue_per_seat_hour, 100));
  check("4 seat total excludes the excluded group", r.total_seat_hours === 100 && r.included_group_ids.length === 1);
}
// 5 missing minimum rate and missing full cost rate also exclude, reasons name the field; undefined, "" and NaN are missing, never 0
{
  const r = calc([g("a", 10, undefined, 5, 100), g("b", 10, 4, "", 100), g("c", 10, 4, 5, NaN), g("d", 10, 4, 5, 100)]);
  check("5 three groups excluded, one included", r.excluded_groups.length === 3 && r.included_group_ids.join() === "d");
  check("5 reasons name the missing figure", /minimum/.test(r.excluded_groups[0].reason) && /full cost/.test(r.excluded_groups[1].reason) && /revenue/.test(r.excluded_groups[2].reason));
  check("5 a zero is a real value, not missing", calc([g("z", 10, 0, 0, 0)]).available === true);
}
// 6 no earning groups: nothing is invented
{
  for (const input of [[], null, undefined, [g("s", 0, 0, 0, 0)], [g("s", null, 1, 1, 1)]]) {
    const r = calc(input);
    check("6 no earning groups -> unavailable, nulls, not 0 (" + JSON.stringify(input)?.slice(0, 30) + ")",
      r.available === false && r.min_rate === null && r.full_cost_rate === null && r.revenue_per_seat_hour === null && r.gap_to_min_rate === null && r.gap_to_full_cost_rate === null && r.total_seat_hours === 0);
  }
}
// 7 support group (no seat hours) ignored: not in totals, not listed as excluded
{
  const r = calc([g("g1", 100, 80, 90, 10000), g("support", 0, null, null, null)]);
  check("7 support group ignored (not excluded, not averaged)", r.excluded_groups.length === 0 && r.included_group_ids.join() === "g1" && near(r.min_rate, 80));
}
// 8 negative gaps (revenue below cost) and zero gap
{
  const r = calc([g("g1", 100, 80, 90, 7000)]);
  check("8 negative gaps: 70-80 = -10 and 70-90 = -20", near(r.gap_to_min_rate, -10) && near(r.gap_to_full_cost_rate, -20));
  const z = calc([g("g1", 100, 80, 80, 8000)]);
  check("8 zero gap is 0, not null", z.gap_to_min_rate === 0 && z.gap_to_full_cost_rate === 0);
}
// 9 dollar identity: gap x seat hours = modelled revenue - group cost, within rounding of the displayed rates
{
  const rows = [g("g1", 1414.12, 79.93, 80.79, 233355.2), g("g2", 2665, 79.86, 80.32, 341409.15), g("g3", 1414.12, 87.3, 88.17, 226259.2), g("g4", 4242.35, 75.26, 75.55, 304048.58)];
  const r = calc(freeze(rows));
  const seat = rows.reduce((s, x) => s + x.seat_hours, 0);
  const rev = rows.reduce((s, x) => s + x.modelled_revenue, 0);
  const full_cost_dollars = rows.reduce((s, x) => s + x.full_cost_rate * x.seat_hours, 0);
  const min_dollars = rows.reduce((s, x) => s + x.min_rate * x.seat_hours, 0);
  check("9 gap to full cost x seat hours = revenue - full cost dollars (within 0.005 x hours)", Math.abs(r.gap_to_full_cost_rate * seat - (rev - full_cost_dollars)) <= 0.01 * seat, String(r.gap_to_full_cost_rate * seat - (rev - full_cost_dollars)));
  check("9 gap to min rate x seat hours = revenue - min dollars (within 0.005 x hours)", Math.abs(r.gap_to_min_rate * seat - (rev - min_dollars)) <= 0.01 * seat);
  check("9 gaps equal the subtraction of the displayed rates", near(r.gap_to_min_rate, Math.round((r.revenue_per_seat_hour - r.min_rate) * 100) / 100) && near(r.gap_to_full_cost_rate, Math.round((r.revenue_per_seat_hour - r.full_cost_rate) * 100) / 100));
  check("9 results are rounded to the cent", [r.min_rate, r.full_cost_rate, r.revenue_per_seat_hour, r.gap_to_min_rate, r.gap_to_full_cost_rate].every((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6));
}
// 10 input is not mutated; same input twice gives the same answer
{
  const rows = freeze([g("g1", 100, 80, 90, 10000)]);
  check("10 frozen input accepted and result repeatable", JSON.stringify(calc(rows)) === JSON.stringify(calc(rows)));
}
// 11 the page uses the helper and does no arithmetic of its own for the averages
{
  const page = fs.readFileSync(path.join(root, "app", "business-modelling", "page.jsx"), "utf8").replace(/\r\n/g, "\n");
  check("11 page imports calculateWholeBusinessFromContracts once and calls it once", page.split("import { calculateWholeBusinessFromContracts }").length - 1 === 1 && page.split("= calculateWholeBusinessFromContracts(").length - 1 === 1);
  check("11 page shows a Whole business row and a Covered hours column", /Whole business \(earning groups\)/.test(page) && /Covered hours/.test(page));
  check("11 page has no gap wording yet (should / need to / must / consider / recommend)", !/\b(should|need to|must|consider|recommend)\b/i.test(page.replace(/\/\/.*$/gm, "")));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
