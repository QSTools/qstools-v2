"use client";

import { useCallback, useState } from "react";

export function useSquareMetreRateProfileStorage() {
  const [saved_profiles, set_saved_profiles] = useState([]);

  const save_profile = useCallback((profile) => {
    set_saved_profiles((current) => [...current, profile]);
  }, []);

  const delete_profile = useCallback((profile_id) => {
    set_saved_profiles((current) =>
      current.filter((profile) => profile.profile_id !== profile_id)
    );
  }, []);

  return {
    saved_profiles,
    save_profile,
    delete_profile,
  };
}