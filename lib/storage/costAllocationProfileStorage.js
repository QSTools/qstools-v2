"use client";

import { useState } from "react";

export function useCostAllocationProfileStorage() {
  const [profiles, set_profiles] = useState([]);

  function save_profile(profile) {
    set_profiles((current) => [...current, profile]);
  }

  function delete_profile(active_allocation_profile_id) {
    set_profiles((current) =>
      current.filter(
        (profile) =>
          profile?.active_allocation_profile_id !== active_allocation_profile_id,
      ),
    );
  }

  return {
    profiles,
    save_profile,
    delete_profile,
  };
}