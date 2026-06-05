"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qs_tools_cost_allocation_v2_1";

export const DEFAULT_DIVISION_ID = "main_operations";

function generate_id(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function get_timestamp() {
  return new Date().toISOString();
}

function safe_array(value) {
  return Array.isArray(value) ? value : [];
}

function create_default_division() {
  const timestamp = get_timestamp();

  return {
    division_id: DEFAULT_DIVISION_ID,
    division_name: "Main Operations",
    division_description: "Default operating division",
    is_active: true,
    sort_order: 1,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function create_division(payload = {}) {
  const timestamp = get_timestamp();

  return {
    division_id: payload.division_id || generate_id("division"),
    division_name: String(payload.division_name || "").trim(),
    division_description: String(payload.division_description || "").trim(),
    is_active: payload.is_active !== false,
    sort_order: Number(payload.sort_order || 1),
    created_at: payload.created_at || timestamp,
    updated_at: timestamp,
  };
}

function normalise_divisions(divisions) {
  const rows = safe_array(divisions).map((division) => ({
    ...create_division(division),
    ...division,
    division_id: division?.division_id || generate_id("division"),
    division_name: String(division?.division_name || "").trim(),
    division_description: String(division?.division_description || "").trim(),
    is_active: division?.is_active !== false,
  }));

  const has_default_division = rows.some(
    (division) => division?.division_id === DEFAULT_DIVISION_ID
  );

  if (has_default_division) {
    return rows;
  }

  return [create_default_division(), ...rows];
}

function create_link(asset_id = "", staff_id = "") {
  const timestamp = get_timestamp();

  return {
    asset_labour_link_id: generate_id("link"),
    asset_id,
    staff_id,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function create_group(payload = {}) {
  const timestamp = get_timestamp();

  const group =
    typeof payload === "string"
      ? {
          division_id: payload,
        }
      : payload || {};

  return {
    group_id: group.group_id || generate_id("group"),
    division_id: group.division_id || DEFAULT_DIVISION_ID,
    group_name: String(group.group_name || "").trim(),
    group_description: String(group.group_description || "").trim(),
    required_asset_ids: safe_array(group.required_asset_ids),
    required_staff_ids: safe_array(group.required_staff_ids),
    required_staff_count: Number(group.required_staff_count || 0),
    is_active: group.is_active !== false,
    sort_order: Number(group.sort_order || 1),
    created_at: group.created_at || timestamp,
    updated_at: timestamp,
  };
}

function normalise_operational_groups(operational_groups) {
  return safe_array(operational_groups).map((group) => ({
    ...create_group(group),
    ...group,
    group_id: group?.group_id || generate_id("group"),
    division_id: group?.division_id || DEFAULT_DIVISION_ID,
    group_name: String(group?.group_name || "").trim(),
    group_description: String(group?.group_description || "").trim(),
    required_asset_ids: safe_array(group?.required_asset_ids),
    required_staff_ids: safe_array(group?.required_staff_ids),
    required_staff_count: Number(group?.required_staff_count || 0),
    is_active: group?.is_active !== false,
  }));
}

function create_initial_state() {
  return {
    active_allocation_profile_id: generate_id("allocation"),
    allocation_profile_name: "",
    effective_from: "",
    divisions: [create_default_division()],
    asset_labour_links: [],
    operational_groups: [],
    labour_group_assignments: [],
    asset_group_assignments: [],
    overhead_group_assignments: [],
    external_delivery_enabled: false,
    external_delivery_note: "",
  };
}

function normalise_state(state = {}) {
  return {
    ...create_initial_state(),
    ...state,

    divisions: normalise_divisions(state?.divisions),

    asset_labour_links: safe_array(state?.asset_labour_links),

    operational_groups: normalise_operational_groups(
      state?.operational_groups
    ),

    labour_group_assignments: safe_array(state?.labour_group_assignments),

    asset_group_assignments: safe_array(state?.asset_group_assignments),

    overhead_group_assignments: safe_array(state?.overhead_group_assignments),
  };
}

function get_storage_state() {
  if (typeof window === "undefined") {
    return create_initial_state();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return create_initial_state();
    }

    const parsed = JSON.parse(raw);

    return normalise_state(parsed);
  } catch {
    return create_initial_state();
  }
}

function set_storage_state(state) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalise_state(state)));
}

export function useCostAllocationStorage() {
  const [state, set_state] = useState(create_initial_state);
  const [hydrated, set_hydrated] = useState(false);

  useEffect(() => {
    const stored_state = get_storage_state();
    set_state(stored_state);
    set_hydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    set_storage_state(state);
  }, [state, hydrated]);

  const actions = useMemo(() => {
    return {
      set_field(field_name, value) {
        set_state((current) =>
          normalise_state({
            ...current,
            [field_name]: value,
          })
        );
      },

      add_division(division_payload = {}) {
        const next_division = create_division(division_payload);

        if (!next_division.division_name) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            divisions: [...safe_array(current.divisions), next_division],
          })
        );
      },

      update_division(division_id, patch = {}) {
        if (!division_id) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            divisions: safe_array(current.divisions).map((division) =>
              division.division_id === division_id
                ? {
                    ...division,
                    ...patch,
                    division_name:
                      patch.division_name !== undefined
                        ? String(patch.division_name || "").trim()
                        : division.division_name,
                    division_description:
                      patch.division_description !== undefined
                        ? String(patch.division_description || "").trim()
                        : division.division_description,
                    updated_at: get_timestamp(),
                  }
                : division
            ),
          })
        );
      },

      remove_division(division_id) {
        if (!division_id || division_id === DEFAULT_DIVISION_ID) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            divisions: safe_array(current.divisions).map((division) =>
              division.division_id === division_id
                ? {
                    ...division,
                    is_active: false,
                    updated_at: get_timestamp(),
                  }
                : division
            ),
            operational_groups: safe_array(current.operational_groups).map(
              (group) =>
                group.division_id === division_id
                  ? {
                      ...group,
                      division_id: DEFAULT_DIVISION_ID,
                      updated_at: get_timestamp(),
                    }
                  : group
            ),
          })
        );
      },

      add_asset_labour_link(asset_id, staff_id) {
        if (!asset_id || !staff_id) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            asset_labour_links: [
              ...safe_array(current.asset_labour_links),
              create_link(asset_id, staff_id),
            ],
          })
        );
      },

      remove_asset_labour_link(asset_labour_link_id) {
        if (!asset_labour_link_id) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            asset_labour_links: safe_array(current.asset_labour_links).map(
              (link) =>
                link.asset_labour_link_id === asset_labour_link_id
                  ? {
                      ...link,
                      is_active: false,
                      updated_at: get_timestamp(),
                    }
                  : link
            ),
          })
        );
      },

      add_operational_group(group_payload = {}) {
        const next_group = create_group(group_payload);

        if (!next_group.group_name) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            operational_groups: [
              ...safe_array(current.operational_groups),
              next_group,
            ],
          })
        );
      },

      update_operational_group(group_id, patch = {}) {
        if (!group_id) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            operational_groups: safe_array(current.operational_groups).map(
              (group) =>
                group.group_id === group_id
                  ? {
                      ...group,
                      ...patch,
                      division_id:
                        patch?.division_id ||
                        group.division_id ||
                        DEFAULT_DIVISION_ID,
                      group_name:
                        patch.group_name !== undefined
                          ? String(patch.group_name || "").trim()
                          : group.group_name,
                      group_description:
                        patch.group_description !== undefined
                          ? String(patch.group_description || "").trim()
                          : group.group_description,
                      required_asset_ids:
                        patch.required_asset_ids !== undefined
                          ? safe_array(patch.required_asset_ids)
                          : safe_array(group.required_asset_ids),
                      required_staff_ids:
                        patch.required_staff_ids !== undefined
                          ? safe_array(patch.required_staff_ids)
                          : safe_array(group.required_staff_ids),
                      required_staff_count:
                        patch.required_staff_count !== undefined
                          ? Number(patch.required_staff_count || 0)
                          : Number(group.required_staff_count || 0),
                      updated_at: get_timestamp(),
                    }
                  : group
            ),
          })
        );
      },

      remove_operational_group(group_id) {
        if (!group_id) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            operational_groups: safe_array(current.operational_groups).map(
              (group) =>
                group.group_id === group_id
                  ? {
                      ...group,
                      is_active: false,
                      updated_at: get_timestamp(),
                    }
                  : group
            ),
          })
        );
      },

      reset_state() {
        set_state(create_initial_state());
      },
    };
  }, []);

  return {
    state,
    hydrated,
    ...actions,
  };
}