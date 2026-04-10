"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pnl_profiles_v3";

export function useProfitAndLossProfileStorage() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setProfiles(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  function save_profile({
    label,
    financial_year,
    month = null,
    type = "annual",
    state,
  }) {
    const new_profile = {
      id: crypto.randomUUID(),

      label,
      financial_year,
      month,
      type,

      state,
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, new_profile]);
  }

  function load_profile(id) {
    return profiles.find((p) => p.id === id);
  }

  function delete_profile(id) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  return {
    profiles,
    save_profile,
    load_profile,
    delete_profile,
  };
}