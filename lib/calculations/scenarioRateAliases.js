// V6.1bx (Business Modelling brief, Addendum 65). PURE, no storage, no React. ASCII only.
// A productive scenario STAFF add may point at a real staff type (rate_staff_type_id). The added person then earns income at that type's saved
// charge-out rate. The add keeps its own scratch staff type (cost and hours unchanged); this file only says which rate that scratch type is priced at.
// with_scenario_rate_aliases(rate_map, adds): a copy of the saved-rate map with scratch_type_<id> set to the chosen type's rate. A missing, unknown or
// zero-rate type gives no alias (the group stays incomplete, as today). No add with the field = the SAME rate_map object back. Inputs never mutated.
// Applied only where the map is READ (never inside the storage reader, whose save helpers write the map back).

import { is_valid_stored_add, scratch_staff_type_id, SCRATCH_STAFF_TYPE_PREFIX } from "./scenarioAdds.js";

const NO_OPTIONS = Object.freeze([]);

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function with_scenario_rate_aliases(rate_map, adds) {
  if (!Array.isArray(adds) || adds.length === 0) return rate_map;
  const base = rate_map && typeof rate_map === "object" ? rate_map : {};
  let next = null;
  for (const add of adds) {
    if (!is_valid_stored_add(add) || add.kind !== "staff" || !add.is_productive) continue;
    const real_id = typeof add.rate_staff_type_id === "string" ? add.rate_staff_type_id : "";
    if (real_id === "" || real_id.startsWith(SCRATCH_STAFF_TYPE_PREFIX)) continue;
    const rate = positive(base[real_id]);
    if (rate <= 0) continue;
    if (next === null) next = { ...base };
    next[scratch_staff_type_id(add.id)] = rate;
  }
  return next === null ? rate_map : next;
}

// Real, active staff types that have a saved charge-out rate above 0, for the drop-down: [{ staff_type_id, staff_type_name, charge_out_rate }].
export function build_rate_type_options(staff_types, rate_map) {
  if (!Array.isArray(staff_types)) return NO_OPTIONS;
  const seen = new Set();
  const options = [];
  for (const type of staff_types) {
    if (!type || typeof type !== "object" || type.is_active === false) continue;
    const id = typeof type.staff_type_id === "string" ? type.staff_type_id.trim() : "";
    if (id === "" || id.startsWith(SCRATCH_STAFF_TYPE_PREFIX) || seen.has(id)) continue;
    const rate = positive(rate_map && rate_map[id]);
    if (rate <= 0) continue;
    seen.add(id);
    const name = typeof type.staff_type_name === "string" && type.staff_type_name.trim() !== "" ? type.staff_type_name.trim() : id;
    options.push(Object.freeze({ staff_type_id: id, staff_type_name: name, charge_out_rate: rate }));
  }
  return options.length === 0 ? NO_OPTIONS : Object.freeze(options);
}