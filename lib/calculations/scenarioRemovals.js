// R3 slice 4, batch B, part 1 (Business Modelling brief, Addendum 18 items 7 to 9; owner decisions 2026-10-30, Addendum 24).
// PURE functions that apply scenario REMOVALS to a COPY of the staff or asset lists. No storage, no React, no imports, so they run in plain node for the tests.
//
// Staff: a removed staff member is filtered out of active_staff. Cost Allocation looks staff up by id, so a link to a removed id drops out and the
//   overhead absorbed by recovery hours spreads over the remaining hours through the real maths (proved live in batch B part 3).
// Assets: a removed asset is filtered out AND the overhead pool amounts assigned to it are REDISTRIBUTED to the remaining live assets in the same pool
//   (owner: a removal must never leave unassigned cost). Rule (owner agreed pro rata): each remaining asset receives a share in proportion to the amount
//   it already holds in that pool; if every remaining asset holds zero in that pool the amount is split equally. The last receiver takes the rounding
//   remainder so the pool total is conserved to the cent. If NO live asset remains, the amount has nowhere to go: it is reported in unplaced (the one
//   exception) and the pool simply shows unassigned.
// Identity: with nothing removed (or no removed id matches) the SAME array is returned, so a hook memo does no extra work and baseline numbers are untouched.
// Inputs are never mutated; receiving assets are copied with a spread so no field is dropped (project instruction 6b).

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_cents(value) {
  return Math.round(value * 100) / 100;
}

function id_set(ids) {
  return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && id !== "") : []);
}

// Staff: active_staff rows carry staff_id. Returns the same array when nothing matches.
export function apply_staff_removals(active_staff, removed_staff_ids) {
  const removed = id_set(removed_staff_ids);
  if (removed.size === 0 || !Array.isArray(active_staff)) return active_staff;
  if (!active_staff.some((staff) => removed.has(staff?.staff_id))) return active_staff;
  return active_staff.filter((staff) => !removed.has(staff?.staff_id));
}

// Assets: saved_assets rows carry asset_id, is_retired and asset_overhead_pool_assignments { <pool_key>: amount }.
// Returns { assets, redistributed, unplaced, removed_count }:
//   assets        the effective list (removed assets filtered out, receivers copied with new assignments); the SAME array when nothing matches
//   redistributed { <pool_key>: amount moved to remaining assets }
//   unplaced      { <pool_key>: amount that had no remaining live asset to receive it }
export function apply_asset_removals(saved_assets, removed_asset_ids) {
  const removed = id_set(removed_asset_ids);
  const none = { assets: saved_assets, redistributed: {}, unplaced: {}, removed_count: 0 };
  if (removed.size === 0 || !Array.isArray(saved_assets)) return none;
  const hit = saved_assets.filter((asset) => removed.has(asset?.asset_id));
  if (hit.length === 0) return none;

  // Only live (non-retired) removed assets hold overhead that was counted; retired ones were never counted.
  const live_removed = hit.filter((asset) => !asset.is_retired);
  const pool_totals = {};
  for (const asset of live_removed) {
    const assignments = asset.asset_overhead_pool_assignments;
    if (!assignments || typeof assignments !== "object") continue;
    for (const [pool_key, amount] of Object.entries(assignments)) {
      const value = to_number(amount);
      if (value > 0) pool_totals[pool_key] = (pool_totals[pool_key] || 0) + value;
    }
  }

  const receivers = saved_assets.filter((asset) => !asset.is_retired && !removed.has(asset?.asset_id));
  const new_assignments = new Map(); // asset_id -> assignments object
  const redistributed = {};
  const unplaced = {};

  for (const [pool_key, total_raw] of Object.entries(pool_totals)) {
    const total = round_cents(total_raw);
    if (receivers.length === 0) {
      unplaced[pool_key] = total;
      continue;
    }
    const weights = receivers.map((asset) => Math.max(to_number(asset.asset_overhead_pool_assignments?.[pool_key]), 0));
    const weight_sum = weights.reduce((sum, w) => sum + w, 0);
    let given = 0;
    receivers.forEach((asset, index) => {
      const last = index === receivers.length - 1;
      const share = last
        ? round_cents(total - given)
        : round_cents(total * (weight_sum > 0 ? weights[index] / weight_sum : 1 / receivers.length));
      given = round_cents(given + share);
      const key = asset.asset_id;
      const current = new_assignments.get(key) || { ...(asset.asset_overhead_pool_assignments || {}) };
      current[pool_key] = round_cents(to_number(current[pool_key]) + share);
      new_assignments.set(key, current);
    });
    redistributed[pool_key] = total;
  }

  const assets = saved_assets
    .filter((asset) => !removed.has(asset?.asset_id))
    .map((asset) => (new_assignments.has(asset.asset_id) ? { ...asset, asset_overhead_pool_assignments: new_assignments.get(asset.asset_id) } : asset));

  return { assets, redistributed, unplaced, removed_count: hit.length };
}
