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

function normalise_divisions(divisions) {
  const rows = Array.isArray(divisions) ? divisions : [];
  const has_default_division = rows.some(
    (division) => division?.division_id === DEFAULT_DIVISION_ID
  );

  if (has_default_division) {
    return rows;
  }

  return [create_default_division(), ...rows];
}

function normalise_operational_groups(operational_groups) {
  const rows = Array.isArray(operational_groups) ? operational_groups : [];

  return rows.map((group) => ({
    ...group,
    division_id: group?.division_id || DEFAULT_DIVISION_ID,
  }));
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

function create_division() {
  const timestamp = get_timestamp();

  return {
    division_id: generate_id("division"),
    division_name: "",
    division_description: "",
    is_active: true,
    sort_order: 1,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function create_group(division_id = DEFAULT_DIVISION_ID) {
  const timestamp = get_timestamp();

  return {
    group_id: generate_id("group"),
    division_id: division_id || DEFAULT_DIVISION_ID,
    group_name: "",
    group_description: "",
    required_asset_ids: [],
    required_staff_ids: [],
    is_active: true,
    sort_order: 1,
    created_at: timestamp,
    updated_at: timestamp,
  };
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

    asset_labour_links: Array.isArray(state?.asset_labour_links)
      ? state.asset_labour_links
      : [],

    operational_groups: normalise_operational_groups(
      state?.operational_groups
    ),

    labour_group_assignments: Array.isArray(state?.labour_group_assignments)
      ? state.labour_group_assignments
      : [],

    asset_group_assignments: Array.isArray(state?.asset_group_assignments)
      ? state.asset_group_assignments
      : [],

    overhead_group_assignments: Array.isArray(
      state?.overhead_group_assignments
    )
      ? state.overhead_group_assignments
      : [],
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

      add_division() {
        set_state((current) =>
          normalise_state({
            ...current,
            divisions: [...current.divisions, create_division()],
          })
        );
      },

      update_division(division_id, patch) {
        set_state((current) =>
          normalise_state({
            ...current,
            divisions: current.divisions.map((division) =>
              division.division_id === division_id
                ? {
                    ...division,
                    ...patch,
                    updated_at: get_timestamp(),
                  }
                : division
            ),
          })
        );
      },

      remove_division(division_id) {
        if (division_id === DEFAULT_DIVISION_ID) {
          return;
        }

        set_state((current) =>
          normalise_state({
            ...current,
            divisions: current.divisions.map((division) =>
              division.division_id === division_id
                ? {
                    ...division,
                    is_active: false,
                    updated_at: get_timestamp(),
                  }
                : division
            ),
            operational_groups: current.operational_groups.map((group) =>
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
              ...current.asset_labour_links,
              create_link(asset_id, staff_id),
            ],
          })
        );
      },

      remove_asset_labour_link(asset_labour_link_id) {
        set_state((current) =>
          normalise_state({
            ...current,
            asset_labour_links: current.asset_labour_links.map((link) =>
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

      add_operational_group(division_id = DEFAULT_DIVISION_ID) {
        set_state((current) =>
          normalise_state({
            ...current,
            operational_groups: [
              ...current.operational_groups,
              create_group(division_id),
            ],
          })
        );
      },

      update_operational_group(group_id, patch) {
        set_state((current) =>
          normalise_state({
            ...current,
            operational_groups: current.operational_groups.map((group) =>
              group.group_id === group_id
                ? {
                    ...group,
                    ...patch,
                    division_id:
                      patch?.division_id || group.division_id || DEFAULT_DIVISION_ID,
                    updated_at: get_timestamp(),
                  }
                : group
            ),
          })
        );
      },

      remove_operational_group(group_id) {
        set_state((current) =>
          normalise_state({
            ...current,
            operational_groups: current.operational_groups.map((group) =>
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