"use client";

import { useMemo, useState } from "react";

function create_link(asset_id = "", staff_id = "") {
  const timestamp = new Date().toISOString();

  return {
    asset_labour_link_id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `link_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
    group_id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    group_name: "",
    required_asset_ids: [],
    required_staff_count: 1,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function create_initial_state() {
  return {
    active_allocation_profile_id: "live",
    allocation_profile_name: "Default Allocation Profile",
    effective_from: "",
    asset_labour_links: [],
    operational_groups: [],
  };
}

export function useCostAllocationStorage() {
  const [state, set_state] = useState(create_initial_state);

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
              : link,
          ),
        }));
      },

      add_operational_group() {
        set_state((current) => ({
          ...current,
          operational_groups: [
            ...current.operational_groups,
            create_group(),
          ],
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
              : group,
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
              : group,
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
    ...actions,
  };
}