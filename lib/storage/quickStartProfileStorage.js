"use client";

import { useEffect, useState } from "react";

const PROFILE_STORAGE_KEY = "qs_tools_quick_start_profiles_v1";

export function useQuickStartProfileStorage() {
  const [saved_profiles, set_saved_profiles] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      set_saved_profiles(raw ? JSON.parse(raw) : []);
    } catch {
      set_saved_profiles([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(saved_profiles),
    );
  }, [saved_profiles]);

  function save_profile(profile) {
    set_saved_profiles((current) => [profile, ...current]);
  }

  function delete_profile(profile_id) {
    set_saved_profiles((current) =>
      current.filter((profile) => profile.profile_id !== profile_id),
    );
  }

  return {
    saved_profiles,
    save_profile,
    delete_profile,
  };
}