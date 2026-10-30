// R3 slice 4, batch C1 (Business Modelling brief, Addendum 26: scratch adds; owner decisions 2026-10-30).
// PURE functions for scenario ADDS (scratch staff and scratch assets). No storage, no React, no imports, so they run in plain node for the tests.
//
// What an add is (saved shape approved by the owner, Addendum 26 item 5), one entry of mirra_scenarios_v1 item.added[]:
//   { id: "scratch_<base36>", kind: "staff" | "asset", name, is_productive, annual_cost,
//     productive_hours (productive only), group_id (productive only), copy_of (copies only) }
// No other field is stored. A non-productive add never carries productive_hours or group_id, even if the caller passes them.
//
// How the pieces are carried (Addendum 26 items 3 and 4):
//   NON-PRODUCTIVE adds (office hire, idle vehicle): non_productive_total() is the sum the C2 wiring will add to the overhead pool, which Cost Allocation
//     already spreads by each group's recovery hours. No new maths here, only the cent-exact sum.
//   PRODUCTIVE adds: productive_placements() says which group each one goes into and with how many hours; build_added_staff_rows() / build_added_asset_rows()
//     give the rows the real chain expects, each staff add with its OWN scratch staff type so it cannot clash with a real type.
// Rows and results are NEW objects. Inputs are never mutated. With no adds every function returns a shared frozen empty result (same identity each call),
// so a hook memo does no extra work.
// C1 emits only the row fields named in the handover. The exact fields every consumer expects are read and added in C2 (Addendum 26 item 9).

export const ADD_KINDS = ["staff", "asset"];
export const SCRATCH_PREFIX = "scratch_";
export const SCRATCH_STAFF_TYPE_PREFIX = "scratch_type_";
export const MAX_NAME_LENGTH = 80;
export const MAX_ID_LENGTH = 120;
export const MAX_COPIES = 50;

const EMPTY_LIST = Object.freeze([]);

function to_cents(value) {
  return Math.round(Number(value) * 100);
}

function round_cents(value) {
  return Math.round(value * 100) / 100;
}

// ---------- ids ----------
export function is_scratch_id(id) {
  return typeof id === "string" && id.length > SCRATCH_PREFIX.length && id.length <= MAX_ID_LENGTH && id.startsWith(SCRATCH_PREFIX);
}

let id_sequence = 0;
const issued_ids = new Set(); // every id handed out in this session, so a removed id is never reused

// existing_ids: scratch ids already stored (array or Set). now / random are injectable for the tests.
export function new_scratch_id(existing_ids, now = Date.now(), random = Math.random) {
  const taken = existing_ids instanceof Set ? existing_ids : new Set(Array.isArray(existing_ids) ? existing_ids : []);
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    id_sequence += 1;
    const noise = Math.floor(random() * 36 ** 4).toString(36).padStart(4, "0");
    const id = SCRATCH_PREFIX + Math.floor(now).toString(36) + id_sequence.toString(36) + noise;
    if (!taken.has(id) && !issued_ids.has(id)) {
      issued_ids.add(id);
      return id;
    }
  }
  throw new Error("could not make a unique scratch id");
}

// ---------- validation ----------
function bad(reason) {
  return { ok: false, reason };
}

// input: { kind, name, is_productive, annual_cost, productive_hours?, group_id? }. Any id or copy_of the caller passes is ignored.
// Returns { ok: true, value } with only the allowed fields (name trimmed, annual_cost to the cent), or { ok: false, reason }.
export function validate_add_input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return bad("add_bad_kind");
  if (!ADD_KINDS.includes(input.kind)) return bad("add_bad_kind");
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name === "" || name.length > MAX_NAME_LENGTH) return bad("add_bad_name");
  if (typeof input.is_productive !== "boolean") return bad("add_bad_is_productive");
  if (typeof input.annual_cost !== "number" || !Number.isFinite(input.annual_cost) || input.annual_cost < 0) return bad("add_bad_cost");
  const value = { kind: input.kind, name, is_productive: input.is_productive, annual_cost: round_cents(input.annual_cost) };
  if (input.is_productive) {
    if (typeof input.productive_hours !== "number" || !Number.isFinite(input.productive_hours) || input.productive_hours <= 0) return bad("add_bad_hours");
    const group_id = typeof input.group_id === "string" ? input.group_id.trim() : "";
    if (group_id === "" || group_id.length > MAX_ID_LENGTH) return bad("add_bad_group");
    value.productive_hours = input.productive_hours;
    value.group_id = group_id;
  }
  return { ok: true, value };
}

// An entry read back from storage is usable only if it still passes the same rules. Unusable entries are skipped on read and kept untouched on write.
export function is_valid_stored_add(entry) {
  if (!entry || typeof entry !== "object" || !is_scratch_id(entry.id)) return false;
  return validate_add_input(entry).ok;
}

// ---------- rows for the real chain ----------
function usable(adds, kind) {
  if (!Array.isArray(adds)) return EMPTY_LIST;
  const list = adds.filter((add) => is_valid_stored_add(add) && add.kind === kind);
  return list.length === 0 ? EMPTY_LIST : list;
}

export function scratch_staff_type_id(add_id) {
  return SCRATCH_STAFF_TYPE_PREFIX + String(add_id).slice(SCRATCH_PREFIX.length);
}

// One row per staff add, shaped like a useLabour staff row. Own scratch staff type per add (cannot clash with a real type).
export function build_added_staff_rows(adds) {
  const list = usable(adds, "staff");
  if (list === EMPTY_LIST) return EMPTY_LIST;
  return list.map((add) => ({
    staff_id: add.id,
    staff_type_id: scratch_staff_type_id(add.id),
    staff_name: add.name,
    name: add.name,
    labour_class: add.is_productive ? "productive" : "support",
    is_productive: add.is_productive,
    contributes_to_recovery_hours: add.is_productive,
    annual_labour_cost: round_cents(add.annual_cost),
    productive_hours_annual: add.is_productive ? add.productive_hours : 0,
    is_scratch: true,
  }));
}

// One row per asset add, shaped like a useAssets row. Overhead pool assignments start empty (a scratch asset holds no assigned overhead).
export function build_added_asset_rows(adds) {
  const list = usable(adds, "asset");
  if (list === EMPTY_LIST) return EMPTY_LIST;
  return list.map((add) => ({
    asset_id: add.id,
    asset_name: add.name,
    name: add.name,
    asset_type: add.is_productive ? "productive" : "support",
    is_productive: add.is_productive,
    asset_recovery_cost_annual: round_cents(add.annual_cost),
    utilisation_hours_annual: add.is_productive ? add.productive_hours : 0,
    asset_overhead_pool_assignments: {},
    is_retired: false,
    is_scratch: true,
  }));
}

// ---------- the two totals the wiring needs ----------
// Sum of the annual cost of every NON-productive add (staff and assets), exact to the cent (summed as whole cents).
export function non_productive_total(adds) {
  if (!Array.isArray(adds)) return 0;
  let cents = 0;
  for (const add of adds) {
    if (is_valid_stored_add(add) && !add.is_productive) cents += to_cents(add.annual_cost);
  }
  return cents / 100;
}

// Where each PRODUCTIVE add goes: { kind, id, group_id, hours, staff_type_id (staff only, else null) }. Non-productive adds never appear here.
export function productive_placements(adds) {
  if (!Array.isArray(adds)) return EMPTY_LIST;
  const list = adds
    .filter((add) => is_valid_stored_add(add) && add.is_productive)
    .map((add) => ({
      kind: add.kind,
      id: add.id,
      group_id: add.group_id,
      hours: add.productive_hours,
      staff_type_id: add.kind === "staff" ? scratch_staff_type_id(add.id) : null,
    }));
  return list.length === 0 ? EMPTY_LIST : list;
}
