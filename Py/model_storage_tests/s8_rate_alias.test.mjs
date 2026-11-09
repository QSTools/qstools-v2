// V6.1bx test (BM Addendum 65). READ-ONLY, pure (no storage, no React). Run: node Py\model_storage_tests\s8_rate_alias.test.mjs
// Checks the optional rate_staff_type_id on scenarioAdds.js and lib/calculations/scenarioRateAliases.js against the REAL scenarioAdds.js. Exit 0 only if all pass.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const calc = path.resolve(here, "..", "..", "lib", "calculations");
const load = (f) => import(pathToFileURL(path.join(calc, f)).href);
const A = await load("scenarioAdds.js");
const L = await load("scenarioRateAliases.js");
const N = await load("scenarioRateNote.js");
let pass = 0, fail = 0;
function check(n, ok, d) { if (ok) { pass++; console.log("PASS: " + n); } else { fail++; console.log("FAIL: " + n + (d ? " :: " + d : "")); } }
function deep_freeze(o) { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deep_freeze); } return o; }

const base = { kind: "staff", name: "Hire", is_productive: true, annual_cost: 90000, productive_hours: 1700, group_id: "g4" };
const keys = (v) => Object.keys(v).sort().join(",");
const OLD_KEYS = "annual_cost,group_id,is_productive,kind,name,productive_hours";

// shape
const blank = A.validate_add_input(base);
check("blank add: exactly the old shape", blank.ok && keys(blank.value) === OLD_KEYS);
const chosen = A.validate_add_input({ ...base, rate_staff_type_id: "  operator  " });
check("productive staff add keeps the trimmed id", chosen.ok && chosen.value.rate_staff_type_id === "operator" && chosen.value.annual_cost === 90000);
check("empty text stores nothing", keys(A.validate_add_input({ ...base, rate_staff_type_id: "   " }).value) === OLD_KEYS);
check("non-text stores nothing", keys(A.validate_add_input({ ...base, rate_staff_type_id: 7 }).value) === OLD_KEYS);
check("non-productive staff never carries it", keys(A.validate_add_input({ kind: "staff", name: "Office", is_productive: false, annual_cost: 5000, rate_staff_type_id: "operator" }).value) === "annual_cost,is_productive,kind,name");
check("asset never carries it", keys(A.validate_add_input({ ...base, kind: "asset", rate_staff_type_id: "operator" }).value) === OLD_KEYS);
check("over-long id stores nothing", keys(A.validate_add_input({ ...base, rate_staff_type_id: "x".repeat(121) }).value) === OLD_KEYS);

// old and unknown entries stay valid
const old_entry = { id: "scratch_old1", ...blank.value };
check("old stored add (no field) still valid", A.is_valid_stored_add(old_entry));
check("add with an id that no longer exists is still valid", A.is_valid_stored_add({ id: "scratch_new1", ...chosen.value, rate_staff_type_id: "gone" }));

// aliases
const rates = deep_freeze({ operator: 80, labourer: 55, zero: 0 });
const adds = deep_freeze([
  { id: "scratch_a1", ...chosen.value },
  { id: "scratch_b1", ...blank.value },
  { id: "scratch_c1", ...chosen.value, rate_staff_type_id: "gone" },
  { id: "scratch_d1", ...chosen.value, rate_staff_type_id: "zero" },
  { id: "scratch_e1", ...chosen.value, rate_staff_type_id: "labourer", copy_of: "scratch_a1" },
]);
const out = L.with_scenario_rate_aliases(rates, adds);
check("chosen add gets the real type's rate", out.scratch_type_a1 === 80);
check("a copy gets its own alias", out.scratch_type_e1 === 55);
check("blank add gets no alias", !("scratch_type_b1" in out));
check("unknown id gets no alias", !("scratch_type_c1" in out));
check("zero-rate type gets no alias", !("scratch_type_d1" in out));
check("real rates unchanged and input not mutated", out.operator === 80 && out.labourer === 55 && Object.keys(rates).length === 3);
check("no adds -> same object", L.with_scenario_rate_aliases(rates, []) === rates && L.with_scenario_rate_aliases(rates, undefined) === rates);
check("no add has the field -> same object", L.with_scenario_rate_aliases(rates, [{ id: "scratch_b1", ...blank.value }]) === rates);
check("non-productive staff add is ignored", L.with_scenario_rate_aliases(rates, [{ id: "scratch_f1", kind: "staff", name: "Office", is_productive: false, annual_cost: 5000, rate_staff_type_id: "operator" }]) === rates);
const moved = L.with_scenario_rate_aliases({ operator: 85 }, [adds[0]]);
check("rate lever +5 on the real type moves the alias +5", moved.scratch_type_a1 === 85);

// drop-down list
const types = deep_freeze([
  { staff_type_id: "operator", staff_type_name: "Operator", is_active: true },
  { staff_type_id: "labourer", staff_type_name: "Labourer", is_active: false },
  { staff_type_id: "zero", staff_type_name: "Zero", is_active: true },
  { staff_type_id: "unpriced", staff_type_name: "Unpriced", is_active: true },
  { staff_type_id: "scratch_type_a1", staff_type_name: "Hire", is_active: true },
]);
const opts = L.build_rate_type_options(types, rates);
check("list: only active real types with a saved rate", opts.length === 1 && opts[0].staff_type_id === "operator" && opts[0].charge_out_rate === 80);
check("list: no types -> frozen empty list", L.build_rate_type_options(null, rates).length === 0 && Object.isFrozen(L.build_rate_type_options(undefined, {})));

// scenario-hire note
const hire_row = (extra) => ({ staff_type_id: A.scratch_staff_type_id("scratch_h1"), ...extra });
check("note: unpriced scenario hire still gets the note", N.has_scenario_hire([hire_row({ is_priced: false })]) === true);
check("note: row with no is_priced field still gets the note (as before)", N.has_scenario_hire([hire_row({})]) === true);
check("note: hire priced from a staff type gets no note, other unpriced hire still does", N.has_scenario_hire([hire_row({ is_priced: true })]) === false && N.has_scenario_hire([hire_row({ is_priced: true }), { staff_type_id: A.scratch_staff_type_id("scratch_h2"), is_priced: false }]) === true);

for (const f of ["scenarioRateAliases.js", "scenarioAdds.js"]) {
  check(f + " under 600 lines", fs.readFileSync(path.join(calc, f), "utf8").split("\n").length < 600);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);