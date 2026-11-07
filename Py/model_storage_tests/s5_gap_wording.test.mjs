// R3 slice 5 batch C test. READ-ONLY: imports two pure functions, reads two source files, touches no browser storage and writes no file.
// Run: node Py\model_storage_tests\s5_gap_wording.test.mjs
// Checks lib/calculations/wholeBusinessGapWording.js (BM brief Addendum 42 item 6): one two-rate template, a separate left-out sentence,
// the no-earning-group sentence, no advice words, and that the page uses the module. Exit code 0 only if every check passes.
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
const W = await import(pathToFileURL(path.join(root, "lib", "calculations", "wholeBusinessGapWording.js")).href);
const G = await import(pathToFileURL(path.join(root, "lib", "calculations", "wholeBusinessRateGap.js")).href);
const words = W.buildWholeBusinessGapWording;
const calc = G.calculateWholeBusinessRateGap;
const BANNED = /\b(should|need to|must|consider|recommend\w*)\b/i;
function freeze(v) { if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.freeze(v); Object.values(v).forEach(freeze); } return v; }
const whole = (gm, gf, extra = {}) => ({ available: true, gap_to_min_rate: gm, gap_to_full_cost_rate: gf, excluded_groups: [], covered_differs: false, ...extra });

// 1 above both (scenario_b live figures)
{
  const r = words(freeze(whole(75.58, 72.03)));
  check("1 above both", r.two_rate_sentence === "Revenue per hour is $75.58 above the group minimum rate and $72.03 above the full cost rate.", r.two_rate_sentence);
  check("1 nothing else shown", r.left_out_sentence === null && r.no_earning_sentence === null);
}
// 2 above the minimum, below the full cost rate (the Addendum 42 example shape)
{
  const r = words(whole(20, -14));
  check("2 above then below", r.two_rate_sentence === "Revenue per hour is $20.00 above the group minimum rate and $14.00 below the full cost rate.", r.two_rate_sentence);
}
// 3 below both: amounts carry no minus sign
{
  const r = words(whole(-3.5, -9.25));
  check("3 below both", r.two_rate_sentence === "Revenue per hour is $3.50 below the group minimum rate and $9.25 below the full cost rate.", r.two_rate_sentence);
  check("3 no minus sign or plus sign in the sentence", !/[-+]/.test(r.two_rate_sentence.replace("Revenue per hour is", "")));
}
// 4 exactly equal
{
  const a = words(whole(0, 10));
  const b = words(whole(0, 0));
  check("4 equal to the minimum", a.two_rate_sentence === "Revenue per hour is equal to the group minimum rate and $10.00 above the full cost rate.", a.two_rate_sentence);
  check("4 equal to both", b.two_rate_sentence === "Revenue per hour is equal to the group minimum rate and equal to the full cost rate.", b.two_rate_sentence);
  check("4 negative zero reads as equal", words(whole(-0, 5)).two_rate_sentence.includes("equal to the group minimum rate"));
}
// 5 thousands separator and two decimals
{
  const r = words(whole(1234.5, -1000));
  check("5 amounts formatted", r.two_rate_sentence === "Revenue per hour is $1,234.50 above the group minimum rate and $1,000.00 below the full cost rate.", r.two_rate_sentence);
}
// 6 no earning groups: no two-rate sentence, one plain sentence; bad input never throws
{
  for (const input of [null, undefined, {}, { available: false }, calc([]), calc([{ group_id: "s", seat_hours: 0, min_rate: 1, full_cost_rate: 1, modelled_revenue: 1 }])]) {
    const r = words(input);
    check("6 not available: no two-rate sentence, one no-earning sentence", r.two_rate_sentence === null && /^No earning group has a complete set of figures/.test(r.no_earning_sentence));
  }
  check("6 available but a gap missing is treated as not available", words({ available: true, gap_to_min_rate: null, gap_to_full_cost_rate: 3 }).two_rate_sentence === null);
}
// 7 left out: separate sentence, name or id, reason, several joined
{
  const one = words(whole(1, 1, { excluded_groups: [{ group_id: "g3", group_name: "G03 Dry hire", reason: "missing revenue" }] }));
  check("7 one left out", one.left_out_sentence === "Left out of the whole business row: G03 Dry hire (missing revenue).", one.left_out_sentence);
  check("7 two-rate sentence unchanged by a left-out group", one.two_rate_sentence === words(whole(1, 1)).two_rate_sentence);
  const many = words(whole(1, 1, { excluded_groups: [{ group_id: "a", reason: "missing revenue" }, { group_id: "b", group_name: "B", reason: "missing group minimum rate, full cost rate" }] }));
  check("7 several left out, id used when no name", many.left_out_sentence === "Left out of the whole business row: a (missing revenue); B (missing group minimum rate, full cost rate).", many.left_out_sentence);
  const none = words(calc([]));
  check("7 nothing left out gives null", words(whole(1, 1)).left_out_sentence === null && none.left_out_sentence === null);
  const both = words({ available: false, excluded_groups: [{ group_id: "g", reason: "missing revenue" }] });
  check("7 no earning group and a left-out group: both sentences", both.no_earning_sentence !== null && both.left_out_sentence !== null);
}
// 8 covered hours differing from seat hours: the two-rate sentence is the same (the page keeps its separate per-recovery-hour note)
{
  const a = words(whole(5, 2, { covered_differs: true }));
  const b = words(whole(5, 2, { covered_differs: false }));
  check("8 covered_differs does not change the sentence", a.two_rate_sentence === b.two_rate_sentence);
}
// 9 sentence amounts equal the helper's gaps on real helper output (hand figures: 100h min 80 full 90 rev 10000; 300h min 60 full 70 rev 24000 -> +20 and +10)
{
  const groups = [
    { group_id: "g1", group_name: "g1", seat_hours: 100, min_rate: 80, full_cost_rate: 90, modelled_revenue: 10000, covered_hours: 100 },
    { group_id: "g2", group_name: "g2", seat_hours: 300, min_rate: 60, full_cost_rate: 70, modelled_revenue: 24000, covered_hours: 300 },
  ];
  const r = words(calc(groups));
  check("9 helper output: $20.00 above and $10.00 above", r.two_rate_sentence === "Revenue per hour is $20.00 above the group minimum rate and $10.00 above the full cost rate.", r.two_rate_sentence);
  const hi = words(calc([{ ...groups[0], modelled_revenue: 7000 }]));
  check("9 revenue 70/h against 80 and 90: below both", hi.two_rate_sentence === "Revenue per hour is $10.00 below the group minimum rate and $20.00 below the full cost rate.", hi.two_rate_sentence);
}
// 10 input is not changed
{
  const w = freeze(whole(2, 3, { excluded_groups: [{ group_id: "x", reason: "missing revenue" }] }));
  let threw = false;
  try { words(w); } catch { threw = true; }
  check("10 frozen input does not throw", threw === false);
}
// 11 advice words: none in any sentence, none in the module or page source outside comments
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");
}
{
  const all = [words(whole(5, -5)), words(whole(0, 0, { excluded_groups: [{ group_id: "g", reason: "missing revenue" }] })), words(null)];
  const text = all.map((r) => [r.two_rate_sentence, r.left_out_sentence, r.no_earning_sentence].join(" ")).join(" ");
  check("11 no advice words in any sentence", !BANNED.test(text), text.match(BANNED)?.[0]);
  const lib_src = stripComments(fs.readFileSync(path.join(root, "lib", "calculations", "wholeBusinessGapWording.js"), "utf8"));
  check("11 no advice words in the module source", !BANNED.test(lib_src), lib_src.match(BANNED)?.[0]);
  const page_src = stripComments(fs.readFileSync(path.join(root, "app", "business-modelling", "page.jsx"), "utf8"));
  check("11 no advice words in the page source", !BANNED.test(page_src), page_src.match(BANNED)?.[0]);
  // 12 the page uses the module and the old labelled gap line is gone
  check("12 page imports and calls the module", /wholeBusinessGapWording/.test(page_src) && /buildWholeBusinessGapWording\(whole\)/.test(page_src));
  check("12 page shows the three sentences", /wording\.two_rate_sentence/.test(page_src) && /wording\.left_out_sentence/.test(page_src) && /wording\.no_earning_sentence/.test(page_src));
  check("12 old labelled gap line removed", !/Revenue per hour minus group minimum rate/.test(page_src) && !/signed_money/.test(page_src));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
