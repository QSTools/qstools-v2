"use client";

import { useState } from "react";

function create_profile_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `asset-profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function create_timestamp() {
  return new Date().toISOString();
}

export function useAssetProfileStorage() {
  const [profiles, set_profiles] = useState([]);
  const [active_profile_id, set_active_profile_id] = useState("");

  function get_profile_by_id(asset_profile_id) {
    return profiles.find((profile) => profile.asset_profile_id === asset_profile_id) || null;
  }

  function get_latest_version_for_asset(asset_id) {
    return profiles
      .filter((profile) => profile.asset_id === asset_id)
      .reduce((max_version, profile) => {
        return Math.max(max_version, Number(profile.profile_version || 1));
      }, 0);
  }

  function save_profile(asset_state, calculations) {
    const timestamp = create_timestamp();
    const current_active_profile = active_profile_id
      ? get_profile_by_id(active_profile_id)
      : null;

    const is_same_asset_as_active =
      current_active_profile &&
      current_active_profile.asset_id &&
      current_active_profile.asset_id === asset_state.asset_id;

    const next_version = is_same_asset_as_active
      ? Number(current_active_profile.profile_version || 1) + 1
      : Math.max(1, get_latest_version_for_asset(asset_state.asset_id) + 1);

    const next_profile = {
      ...asset_state,
      ...calculations,
      asset_profile_id: create_profile_id(),
      asset_profile_name: asset_state.asset_name || "Untitled asset",
      profile_version: next_version,
      created_at: asset_state.created_at || timestamp,
      updated_at: timestamp,
      is_active: true,
    };

    set_profiles((current) =>
      current.map((profile) => ({
        ...profile,
        is_active: false,
      })).concat(next_profile)
    );

    set_active_profile_id(next_profile.asset_profile_id);

    return next_profile;
  }

  function delete_profile(asset_profile_id) {
    let fallback_profile_id = "";

    set_profiles((current) => {
      const remaining_profiles = current.filter(
        (profile) => profile.asset_profile_id !== asset_profile_id
      );

      const deleted_profile = current.find(
        (profile) => profile.asset_profile_id === asset_profile_id
      );

      if (deleted_profile) {
        const same_asset_profiles = remaining_profiles
          .filter((profile) => profile.asset_id === deleted_profile.asset_id)
          .sort((left, right) => {
            return Number(right.profile_version || 1) - Number(left.profile_version || 1);
          });

        fallback_profile_id = same_asset_profiles[0]?.asset_profile_id || "";
      }

      return remaining_profiles.map((profile) => ({
        ...profile,
        is_active: profile.asset_profile_id === fallback_profile_id,
      }));
    });

    set_active_profile_id((current) => {
      if (current !== asset_profile_id) {
        return current;
      }

      return fallback_profile_id;
    });
  }

  function set_active_profile(asset_profile_id) {
    set_active_profile_id(asset_profile_id);

    set_profiles((current) =>
      current.map((profile) => ({
        ...profile,
        is_active: profile.asset_profile_id === asset_profile_id,
      }))
    );
  }

  return {
    profiles,
    active_profile_id,
    save_profile,
    get_profile_by_id,
    delete_profile,
    set_active_profile,
  };
}