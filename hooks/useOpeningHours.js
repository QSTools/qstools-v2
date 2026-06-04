"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_OPENING_HOURS_STATE,
  get_opening_hours_state,
  set_opening_hours_state,
  reset_opening_hours_state,
} from "@/lib/storage/openingHoursStorage";
import { calculate_opening_hours } from "@/lib/calculations/openingHoursCalculations";
import {
  build_opening_hours_status,
  build_opening_hours_card,
} from "@/lib/selectors/openingHoursSelectors";

export default function useOpeningHours() {
  const [state, setState] = useState(DEFAULT_OPENING_HOURS_STATE);
  const [has_loaded_storage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    setState(get_opening_hours_state());
    setHasLoadedStorage(true);

    function handleStorageUpdate() {
      setState(get_opening_hours_state());
    }

    window.addEventListener(
      "opening-hours-storage-updated",
      handleStorageUpdate
    );

    return () => {
      window.removeEventListener(
        "opening-hours-storage-updated",
        handleStorageUpdate
      );
    };
  }, []);

  const calculated = useMemo(() => {
    return calculate_opening_hours(state);
  }, [state]);

  const status = useMemo(() => {
    return build_opening_hours_status(calculated);
  }, [calculated]);

  const card = useMemo(() => {
    return build_opening_hours_card(calculated);
  }, [calculated]);

  function save_next_state(next_state) {
    setState(next_state);
    set_opening_hours_state(next_state);
  }

  function update_field(field_name, value) {
    save_next_state({
      ...state,
      [field_name]: value,
      updated_at: new Date().toISOString(),
    });
  }

  function update_day(day_id, patch) {
    const standard_week_days = (state.standard_week_days || []).map((day) => {
      if (day.day_id !== day_id) {
        return day;
      }

      return {
        ...day,
        ...patch,
      };
    });

    save_next_state({
      ...state,
      standard_week_days,
      updated_at: new Date().toISOString(),
    });
  }

  function add_closed_day() {
    const closed_day = {
      closed_day_id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `closed_day_${Date.now()}`,
      date: "",
      label: "",
      reason: "",
      closed_hours: 0,
    };

    save_next_state({
      ...state,
      additional_closed_days: [
        ...(state.additional_closed_days || []),
        closed_day,
      ],
      updated_at: new Date().toISOString(),
    });
  }

  function update_closed_day(closed_day_id, patch) {
    const additional_closed_days = (state.additional_closed_days || []).map(
      (closed_day) => {
        if (closed_day.closed_day_id !== closed_day_id) {
          return closed_day;
        }

        return {
          ...closed_day,
          ...patch,
        };
      }
    );

    save_next_state({
      ...state,
      additional_closed_days,
      updated_at: new Date().toISOString(),
    });
  }

  function remove_closed_day(closed_day_id) {
    const additional_closed_days = (state.additional_closed_days || []).filter(
      (closed_day) => closed_day.closed_day_id !== closed_day_id
    );

    save_next_state({
      ...state,
      additional_closed_days,
      updated_at: new Date().toISOString(),
    });
  }

  function reset_module() {
    reset_opening_hours_state();
    setState(get_opening_hours_state());
  }

  return {
    state,
    calculated,
    status,
    card,
    has_loaded_storage,
    actions: {
      update_field,
      update_day,
      add_closed_day,
      update_closed_day,
      remove_closed_day,
      reset_module,
    },
  };
}