// R3 slice 4 batch C2b test. READ-ONLY, pure (no storage, no React). Run: node Py\model_storage_tests\s4_add_rows.test.mjs
// Checks lib/calculations/scenarioAddRows.js and scenarioPlacements.js against the REAL scenarioAdds.js: only productive adds become rows, the fields the
// labour and asset consumers read, identity when nothing to add, inputs never mutated, placement shapes, files under 600 lines. Exit 0 only if all pass.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const calc = path.resolve(here, "..", "..", "lib", "calculations");
const load = (f) => import(pathToFileURL(path.join(calc, f)).href);
const A = await load("scenarioAdds.js");
const R = await load("scenarioAddRows.js");
const P = await load("scenarioPlacements.js");
let pass = 0, fail = 0;
function check(n, ok, d) { if (ok) { pass++; console.log("PASS: " + n); } else { fail++; console.log("FAIL: " + n + (d ? " :: " + d : "")); } }
function deep_freeze(o) { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deep_freeze); } return o; }

const adds = deep_freeze([
  { id: "scratch_office1", kind: "staff", name: "Office hire", is_productive: false, annual_cost: 62345.67 },
  { id: "scratch_hire1", kind: "staff", name: "Hire A", is_productive: true, annual_cost: 71234.56, productive_hours: 1650.5, group_id: "g1" },
  { id: "scratch_hire2", kind: "staff", name: "Hire B", is_productive: true, annual_cost: 50000, productive_hours: 1500, group_id: "g2" },
  { id: "scratch_van1", kind: "asset", name: "Idle van", is_productive: false, annual_cost: 8123.45 },
  { id: "scratch_dig1", kind: "asset", name: "Digger", is_productive: true, annual_cost: 30000.1, productive_hours: 900, group_id: "g1" },
]);
const staff = R.to_labour_rows(A.build_added_staff_rows(adds));
const assets = R.to_asset_rows(A.build_added_asset_rows(adds));
check("only productive staff become rows", staff.length === 2 && staff.every((r) => r.is_productive === true));
check("non-productive staff never a row", !staff.some((r) => r.staff_id === "scratch_office1"));
check("only productive assets become rows", assets.length === 1 && assets[0].asset_id === "scratch_dig1");
const s = staff[0];
check("staff cost fields the contract sums", s.total_labour_cost_annual === 71234.56 && s.annual_labour_cost === 71234.56);
check("staff hours fields", s.recovery_hours === 1650.5 && s.productive_hours_annual === 1650.5 && s.productive_hours === 1650.5 && s.paid_hours_per_year === 1650.5);
check("staff contributes to recovery hours and is active", s.contributes_to_recovery_hours === true && s.is_active === true && s.labour_class === "productive");
check("staff own scratch type id and name", s.staff_type_id === "scratch_type_hire1" && s.staff_type_name === "Hire A");
check("staff is_scratch kept", s.is_scratch === true);
check("sum of staff cost to the cent", Math.round(staff.reduce((t, r) => t + r.total_labour_cost_annual, 0) * 100) === 12123456);
const a = assets[0];
check("asset cost fields", a.total_asset_cost_annual === 30000.1 && a.asset_recovery_cost_annual === 30000.1);
check("asset hours: weekly x 1 week = typed hours", a.utilisation_hours_per_week === 900 && a.asset_annual_weeks_override === 1 && a.utilisation_hours_per_week * a.asset_annual_weeks_override === 900);
check("asset not retired, empty pool assignments, type productive", a.is_retired === false && a.asset_type === "productive" && Object.keys(a.asset_overhead_pool_assignments).length === 0);
check("no adds -> frozen empty lists", R.to_labour_rows([]) === R.to_labour_rows(undefined) && Object.isFrozen(R.to_labour_rows([])) && R.to_asset_rows(null).length === 0);
check("only non-productive adds -> empty", R.to_labour_rows(A.build_added_staff_rows([adds[0]])).length === 0 && R.to_asset_rows(A.build_added_asset_rows([adds[3]])).length === 0);
const base = Object.freeze([{ staff_id: "real" }]);
check("append_rows: nothing to add returns the same array", R.append_rows(base, R.to_labour_rows([])) === base && R.append_rows(base, undefined) === base);
const joined = R.append_rows(base, staff);
check("append_rows: real rows first, input unchanged", joined.length === 3 && joined[0] === base[0] && base.length === 1);

const placements = A.productive_placements(adds);
const nm = { scratch_hire1: "Hire A", scratch_hire2: "Hire B" };
const real_l = deep_freeze([{ assignment_id: "r1", group_id: "g1" }]);
const real_a = deep_freeze([{ assignment_id: "ra1", group_id: "g1", asset_id: "x" }]);
const out = P.inject_placements({ labour_assignments: real_l, asset_assignments: real_a, placements, names_by_id: nm, stamp: "2026-10-30T00:00:00.000Z" });
check("placements applied", out.applied === true);
check("labour: real kept first, 2 added", out.labour_assignments.length === 3 && out.labour_assignments[0] === real_l[0]);
const l = out.labour_assignments[1];
check("labour assignment shape", l.group_id === "g1" && l.staff_type_id === "scratch_type_hire1" && l.assignment_percent === 100 && l.is_productive === true && l.is_active === true && l.assigned_staff_count === 1 && l.labour_type_label === "Hire A");
check("labour: second goes to its own group", out.labour_assignments[2].group_id === "g2");
check("asset: real kept first, 1 added", out.asset_assignments.length === 2 && out.asset_assignments[0] === real_a[0]);
check("asset assignment shape", out.asset_assignments[1].asset_id === "scratch_dig1" && out.asset_assignments[1].group_id === "g1" && out.asset_assignments[1].assignment_percent === 100);
check("assignment ids unique and do not clash with real", new Set([...out.labour_assignments, ...out.asset_assignments].map((x) => x.assignment_id)).size === 5);
check("inputs never mutated", real_l.length === 1 && real_a.length === 1);
const none = P.inject_placements({ labour_assignments: real_l, asset_assignments: real_a, placements: [], stamp: "x" });
check("no placements -> same arrays", none.applied === false && none.labour_assignments === real_l && none.asset_assignments === real_a);
const undef = P.inject_placements({ placements: A.productive_placements([]) });
check("no placements, undefined arrays -> unchanged", undef.applied === false && undef.labour_assignments === undefined);
const only_staff = P.inject_placements({ labour_assignments: real_l, asset_assignments: real_a, placements: placements.filter((p) => p.kind === "staff") });
check("staff only -> asset array is the same array", only_staff.asset_assignments === real_a && only_staff.labour_assignments !== real_l);
const ghost = P.inject_placements({ labour_assignments: [], asset_assignments: [], placements: [{ kind: "staff", id: "scratch_z", group_id: "gone", hours: 1, staff_type_id: "scratch_type_z" }] });
check("placement into a missing group is still appended (shows as unassigned, not lost)", ghost.labour_assignments.length === 1 && ghost.labour_assignments[0].group_id === "gone");
const bad = P.inject_placements({ labour_assignments: real_l, asset_assignments: real_a, placements: [{ kind: "staff", id: "q", group_id: "", staff_type_id: "t" }, null] });
check("empty group id and null entries are skipped", bad.applied === false && bad.labour_assignments === real_l);
for (const f of ["scenarioAddRows.js", "scenarioPlacements.js"]) check(f + " under 600 lines", fs.readFileSync(path.join(calc, f), "utf8").split("\n").length < 600);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
