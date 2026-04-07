"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qs_tools_cost_allocation_v2_1";

function generate_id(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function create_link(asset_id = "", staff_id = "") {
  const timestamp = new Date().toISOString();

  return {
    asset_labour_link_id: generate_id("link"),
    asset_id,
    staff_id,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function create_group() {
  const timestamp = new Date().toISOString();

  return {
    group_id: generate_id("group"),
    group_name: "",
    required_asset_ids: [],
    required_staff_ids: [],
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function create_initial_state() {
  return {
    active_allocation_profile_id: generate_id("allocation"),
    allocation_profile_name: "",
    effective_from: "",
    asset_labour_links: [],
    operational_groups: [],
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

    return {
      ...create_initial_state(),
      ...parsed,
      asset_labour_links: Array.isArray(parsed?.asset_labour_links)
        ? parsed.asset_labour_links
        : [],
      operational_groups: Array.isArray(parsed?.operational_groups)
        ? parsed.operational_groups
        : [],
    };
  } catch {
    return create_initial_state();
  }
}

function set_storage_state(state) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
        set_state((current) => ({
          ...current,
          [field_name]: value,
        }));
      },

      add_asset_labour_link(asset_id, staff_id) {
        if (!asset_id || !staff_id) {
          return;
        }

        set_state((current) => ({
          ...current,
          asset_labour_links: [
            ...current.asset_labour_links,
            create_link(asset_id, staff_id),
          ],
        }));
      },

      remove_asset_labour_link(asset_labour_link_id) {
        set_state((current) => ({
          ...current,
          asset_labour_links: current.asset_labour_links.map((link) =>
            link.asset_labour_link_id === asset_labour_link_id
              ? {
                  ...link,
                  is_active: false,
                  updated_at: new Date().toISOString(),
                }
              : link
          ),
        }));
      },

      add_operational_group() {
        set_state((current) => ({
          ...current,
          operational_groups: [...current.operational_groups, create_group()],
        }));
      },

      update_operational_group(group_id, patch) {
        set_state((current) => ({
          ...current,
          operational_groups: current.operational_groups.map((group) =>
            group.group_id === group_id
              ? {
                  ...group,
                  ...patch,
                  updated_at: new Date().toISOString(),
                }
              : group
          ),
        }));
      },

      remove_operational_group(group_id) {
        set_state((current) => ({
          ...current,
          operational_groups: current.operational_groups.map((group) =>
            group.group_id === group_id
              ? {
                  ...group,
                  is_active: false,
                  updated_at: new Date().toISOString(),
                }
              : group
          ),
        }));
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