"use client";

import { useState } from "react";

const LABOUR_CLASS_OPTIONS = [
  { value: "", label: "Select labour class" },
  { value: "productive", label: "Productive" },
  { value: "non_productive", label: "Non-productive" },
];

export default function LabourProfileCard({
  state = {},
  staff_types = [],
  has_profile = false,
  update_field,
  create_profile,
  create_staff_type,
}) {
  const [is_creating_staff_type, set_is_creating_staff_type] = useState(false);
  const [new_staff_type_name, set_new_staff_type_name] = useState("");

  function handle_create_profile() {
    if (typeof create_profile === "function") {
      create_profile();
    }
  }

  function handle_labour_class_change(value) {
    update_field?.("labour_class", value);
    update_field?.(
      "contributes_to_recovery_hours",
      value === "non_productive" ? false : true
    );
  }

  function handle_staff_type_selection(selected_type_id) {
    if (selected_type_id === "__create_new") {
      set_is_creating_staff_type(true);
      return;
    }

    const selected_type = staff_types.find(
      (t) => t.staff_type_id === selected_type_id
    );
    if (selected_type) {
      update_field?.("staff_type_id", selected_type.staff_type_id);
      update_field?.("staff_type_name", selected_type.staff_type_name);
      update_field?.("staff_role", selected_type.staff_type_name);
    }
  }

  function handle_create_new_staff_type() {
    const clean_name = String(new_staff_type_name || "").trim();

    if (!clean_name) {
      return;
    }

    const new_type = create_staff_type?.(clean_name);
    if (new_type) {
      set_new_staff_type_name("");
      set_is_creating_staff_type(false);
      handle_staff_type_selection(new_type.staff_type_id);
    }
  }

  function handle_cancel_create_staff_type() {
    set_new_staff_type_name("");
    set_is_creating_staff_type(false);
  }

  const active_staff_types = staff_types.filter(
    (t) => t?.is_active !== false
  );
  const profile_is_locked = Boolean(has_profile);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Profile</div>
          <h2 className="ui-card-title">Labour profile</h2>
          <p className="ui-help">
            Start by creating the staff profile. Labour inputs stay locked until
            a profile exists because Labour owns staff identity.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Staff name</span>
            <input
              className="ui-input"
              type="text"
              value={state.staff_name ?? ""}
              onChange={(event) =>
                update_field?.("staff_name", event.target.value)
              }
              placeholder="Enter staff name"
              disabled={profile_is_locked}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Staff type</span>
            {!is_creating_staff_type ? (
              <select
                className="ui-select"
                value={state.staff_type_id ?? ""}
                onChange={(event) =>
                  handle_staff_type_selection(event.target.value)
                }
                disabled={profile_is_locked}
              >
                <option value="">Select staff type</option>
                {active_staff_types.map((type) => (
                  <option key={type.staff_type_id} value={type.staff_type_id}>
                    {type.staff_type_name}
                  </option>
                ))}
                <option value="__create_new">+ Create new staff type</option>
              </select>
            ) : (
              <div className="ui-stack-sm">
                <input
                  className="ui-input"
                  type="text"
                  value={new_staff_type_name}
                  onChange={(event) =>
                    set_new_staff_type_name(event.target.value)
                  }
                  placeholder="Enter new staff type name"
                  autoFocus
                />
                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={handle_create_new_staff_type}
                    disabled={!new_staff_type_name.trim()}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={handle_cancel_create_staff_type}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Labour class</span>
            <select
              className="ui-select"
              value={state.labour_class ?? ""}
              onChange={(event) =>
                handle_labour_class_change(event.target.value)
              }
            >
              {LABOUR_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="ui-help">
              Productive staff add recovery hours. Non-productive staff add
              cost, but their hours do not reduce the Cost Summary recovery
              rate.
            </span>
          </label>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            className="ui-button-primary"
            onClick={handle_create_profile}
            disabled={profile_is_locked}
          >
            Create profile
          </button>
        </div>

        {profile_is_locked ? (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Profile active</div>
              <p className="ui-help">
                Staff identity fields are now locked for this live profile.
                Labour class remains editable so recovery-hour treatment can be
                updated and saved.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
