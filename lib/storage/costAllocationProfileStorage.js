"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qs_tools_cost_allocation_profiles_v2_2";

function generate_id(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function get_storage_profiles() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function set_storage_profiles(profiles) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function useCostAllocationProfileStorage() {
  const [profiles, set_profiles] = useState([]);
  const [hydrated, set_hydrated] = useState(false);

  useEffect(() => {
    const stored_profiles = get_storage_profiles();
    set_profiles(stored_profiles);
    set_hydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    set_storage_profiles(profiles);
  }, [profiles, hydrated]);

  const active_profile = useMemo(() => {
    return profiles.find((profile) => profile?.is_active) ?? null;
  }, [profiles]);

  function save_profile(profile_payload) {
    if (!profile_payload) {
      return null;
    }

    const now = new Date().toISOString();
    const active_allocation_profile_id =
      profile_payload.active_allocation_profile_id || generate_id("allocation");

    const existing_profile = profiles.find(
      (profile) =>
        profile?.active_allocation_profile_id === active_allocation_profile_id
    );

    const next_profile = {
      active_allocation_profile_id,
      allocation_profile_name:
        profile_payload.allocation_profile_name || "Default Allocation Profile",
      effective_from: profile_payload.effective_from || "",
      active_recovery_model: profile_payload.active_recovery_model || "labour_only",
      asset_labour_links: Array.isArray(profile_payload.asset_labour_links)
        ? profile_payload.asset_labour_links
        : [],
      operational_groups: Array.isArray(profile_payload.operational_groups)
        ? profile_payload.operational_groups
        : [],
      is_active: true,
      created_at: existing_profile?.created_at || now,
      updated_at: now,
    };

    set_profiles((current) => {
      const without_existing = current.filter(
        (profile) =>
          profile?.active_allocation_profile_id !== active_allocation_profile_id
      );

      const deactivated = without_existing.map((profile) => ({
        ...profile,
        is_active: false,
      }));

      return [next_profile, ...deactivated];
    });

    return active_allocation_profile_id;
  }

  function load_profile(active_allocation_profile_id) {
    const target_profile = profiles.find(
      (profile) =>
        profile?.active_allocation_profile_id === active_allocation_profile_id
    );

    if (!target_profile) {
      return null;
    }

    set_profiles((current) =>
      current.map((profile) => ({
        ...profile,
        is_active:
          profile?.active_allocation_profile_id === active_allocation_profile_id,
      }))
    );

    return target_profile;
  }

  function delete_profile(active_allocation_profile_id) {
    set_profiles((current) =>
      current.filter(
        (profile) =>
          profile?.active_allocation_profile_id !== active_allocation_profile_id
      )
    );
  }

  return {
    profiles,
    active_profile,
    save_profile,
    load_profile,
    delete_profile,
  };
}