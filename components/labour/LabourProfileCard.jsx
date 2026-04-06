"use client";

import { useEffect, useMemo, useState } from "react";

const CUSTOM_ROLES_STORAGE_KEY = "qs_tools_labour_custom_roles_v1";

const ROLE_CATEGORIES = [
  { value: "leadership_management", label: "Leadership / Management" },
  { value: "commercial_office", label: "Commercial / Office" },
  { value: "delivery_production", label: "Delivery / Production" },
  { value: "technical_support", label: "Technical / Support" },
  { value: "custom_roles", label: "Custom Roles" },
];

const LABOUR_CLASS_OPTIONS = [
  { value: "direct_production", label: "Direct Production" },
  { value: "direct_support", label: "Direct Support" },
  { value: "indirect_overhead", label: "Indirect / Overhead" },
];

const SYSTEM_ROLE_MAP = {
  leadership_management: [
    { role_name: "CEO / Managing Director", labour_class: "indirect_overhead" },
    { role_name: "General Manager", labour_class: "indirect_overhead" },
    { role_name: "Operations Manager", labour_class: "direct_support" },
    { role_name: "Construction Manager", labour_class: "direct_support" },
    { role_name: "Project Manager", labour_class: "direct_support" },
    { role_name: "Site Manager", labour_class: "direct_support" },
    { role_name: "Foreman / Supervisor", labour_class: "direct_production" },
  ],
  commercial_office: [
    { role_name: "Estimator", labour_class: "indirect_overhead" },
    { role_name: "Quantity Surveyor", labour_class: "indirect_overhead" },
    { role_name: "Sales Manager", labour_class: "indirect_overhead" },
    {
      role_name: "Sales / Business Development",
      labour_class: "indirect_overhead",
    },
    { role_name: "Accounts Manager", labour_class: "indirect_overhead" },
    { role_name: "Accounts / Bookkeeper", labour_class: "indirect_overhead" },
    { role_name: "Office Manager", labour_class: "indirect_overhead" },
    { role_name: "Administrator", labour_class: "indirect_overhead" },
    {
      role_name: "Reception / Admin Support",
      labour_class: "indirect_overhead",
    },
  ],
  delivery_production: [
    { role_name: "Leading Hand", labour_class: "direct_production" },
    { role_name: "Site Labourer", labour_class: "direct_production" },
    {
      role_name: "Skilled Labourer / Tradesperson",
      labour_class: "direct_production",
    },
    { role_name: "Driver", labour_class: "direct_production" },
    { role_name: "Plant Operator", labour_class: "direct_production" },
    { role_name: "Machine Operator", labour_class: "direct_production" },
    { role_name: "Yardman / Storeman", labour_class: "direct_support" },
    { role_name: "Workshop Technician", labour_class: "direct_support" },
  ],
  technical_support: [
    {
      role_name: "Health & Safety Coordinator",
      labour_class: "direct_support",
    },
    { role_name: "Procurement / Purchasing", labour_class: "direct_support" },
    { role_name: "Scheduler / Planner", labour_class: "direct_support" },
  ],
};

function readCustomRoles() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_ROLES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomRoles(roles) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_ROLES_STORAGE_KEY, JSON.stringify(roles));
}

function createCustomRoleId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `custom_role_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const inputClassName = "ui-input";
const inputCardClassName = "ui-input";
const secondaryButtonClassName = "ui-button-secondary";
const primaryButtonClassName = "ui-button-primary";

function Field({ label, help, children }) {
  return (
    <div>
      <label className="ui-label">{label}</label>
      {children}
      {help ? <p className="ui-help">{help}</p> : null}
    </div>
  );
}

export default function LabourProfileCard({
  state,
  has_profile,
  update_field,
  create_profile,
}) {
  const [customRoles, setCustomRoles] = useState([]);
  const [identityOpen, setIdentityOpen] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [showCustomRoleForm, setShowCustomRoleForm] = useState(false);

  const [customRoleDraft, setCustomRoleDraft] = useState({
    custom_role_name: "",
    role_category: "delivery_production",
    labour_class: "",
  });

  useEffect(() => {
    setCustomRoles(readCustomRoles());
  }, []);

  const selectedRoleCategory = state?.role_category || "";

  const filteredRoles = useMemo(() => {
    if (!selectedRoleCategory) return [];

    if (selectedRoleCategory === "custom_roles") {
      return customRoles.map((role) => ({
        role_name: role.custom_role_name,
        labour_class: role.labour_class,
      }));
    }

    return SYSTEM_ROLE_MAP[selectedRoleCategory] || [];
  }, [selectedRoleCategory, customRoles]);

  function handleCategoryChange(value) {
    update_field("role_category", value);
    update_field("staff_role", "");
    update_field("labour_class", "");
  }

  function handleStaffRoleChange(value) {
    update_field("staff_role", value);

    const matched = filteredRoles.find((role) => role.role_name === value);
    if (matched) {
      update_field("labour_class", matched.labour_class);
    } else {
      update_field("labour_class", "");
    }
  }

  function handleLabourClassChange(value) {
    update_field("labour_class", value);
  }

  function handleCreateProfile() {
    const ok = create_profile?.();

    if (!ok) {
      alert(
        "Please complete staff name, role category, staff role, and labour class."
      );
    }
  }

  function handleCustomDraftChange(field, value) {
    setCustomRoleDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSaveCustomRole() {
    const custom_role_name = String(
      customRoleDraft.custom_role_name || ""
    ).trim();
    const role_category = String(customRoleDraft.role_category || "").trim();
    const labour_class = String(customRoleDraft.labour_class || "").trim();

    if (!custom_role_name || !role_category || !labour_class) {
      alert("Enter a custom role name, role category, and labour class.");
      return;
    }

    const exists = customRoles.some(
      (role) =>
        String(role.custom_role_name || "")
          .trim()
          .toLowerCase() === custom_role_name.toLowerCase() &&
        role.role_category === role_category
    );

    if (exists) {
      alert("That custom role already exists in this category.");
      return;
    }

    const now = new Date().toISOString();

    const newRole = {
      custom_role_id: createCustomRoleId(),
      custom_role_name,
      role_category,
      labour_class,
      created_at: now,
      updated_at: now,
    };

    const updatedRoles = [...customRoles, newRole].sort((a, b) =>
      a.custom_role_name.localeCompare(b.custom_role_name)
    );

    setCustomRoles(updatedRoles);
    writeCustomRoles(updatedRoles);

    update_field("role_category", "custom_roles");
    update_field("staff_role", newRole.custom_role_name);
    update_field("labour_class", newRole.labour_class);

    setCustomRoleDraft({
      custom_role_name: "",
      role_category: "delivery_production",
      labour_class: "",
    });

    setShowCustomRoleForm(false);
    setCustomOpen(false);
  }

  const labourClassLabel =
    LABOUR_CLASS_OPTIONS.find((option) => option.value === state?.labour_class)
      ?.label || "—";

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Labour Profile
          </h2>
          <p className="ui-help">
            Create the staff profile first. Core labour inputs stay locked until
            the profile is created.
          </p>
        </div>

        <div className="ui-panel">
          <div className="ui-split">
            <div>
              <div className="text-base font-semibold text-[var(--text-primary)]">
                Profile Identity
              </div>
              <div className="ui-help">
                Staff name, role category, role selection, and labour class
              </div>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setIdentityOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {identityOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {identityOpen ? (
            <div className="mt-4 ui-stack">
              <Field label="Staff Name">
                <input
                  type="text"
                  value={state?.staff_name ?? ""}
                  onChange={(e) => update_field("staff_name", e.target.value)}
                  disabled={has_profile}
                  placeholder="Enter staff name"
                  className={inputClassName}
                />
              </Field>

              <Field label="Role Category">
                <select
                  value={state?.role_category ?? ""}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={has_profile}
                  className={inputClassName}
                >
                  <option value="">Select role category</option>
                  {ROLE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Staff Role">
                <select
                  value={state?.staff_role ?? ""}
                  onChange={(e) => handleStaffRoleChange(e.target.value)}
                  disabled={has_profile || !selectedRoleCategory}
                  className={inputClassName}
                >
                  <option value="">
                    {selectedRoleCategory
                      ? "Select staff role"
                      : "Select role category first"}
                  </option>
                  {filteredRoles.map((role) => (
                    <option key={role.role_name} value={role.role_name}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Labour Class"
                help="Standard roles auto-fill this. Custom roles must define it before save."
              >
                <select
                  value={state?.labour_class ?? ""}
                  onChange={(e) => handleLabourClassChange(e.target.value)}
                  disabled={has_profile}
                  className={inputClassName}
                >
                  <option value="">Select labour class</option>
                  {LABOUR_CLASS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="ui-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomRoleForm((previous) => !previous);
                    setCustomOpen(true);
                  }}
                  disabled={has_profile}
                  className={secondaryButtonClassName}
                >
                  {showCustomRoleForm ? "Hide Custom Role" : "Add Custom Role"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {showCustomRoleForm && !has_profile ? (
          <div className="ui-panel border-dashed border-[var(--border-strong)]">
            <div className="ui-split">
              <div>
                <div className="text-base font-semibold text-[var(--text-primary)]">
                  Create Custom Role
                </div>
                <div className="ui-help">
                  Add a browser-local custom role and auto-select it into the
                  profile
                </div>
              </div>

              <div className="ui-actions">
                <button
                  type="button"
                  onClick={() => setCustomOpen((prev) => !prev)}
                  className="ui-button-secondary"
                >
                  {customOpen ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {customOpen ? (
              <div className="mt-4 ui-stack">
                <Field label="Custom Role Name">
                  <input
                    type="text"
                    value={customRoleDraft.custom_role_name}
                    onChange={(e) =>
                      handleCustomDraftChange(
                        "custom_role_name",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Concrete Coordinator"
                    className={inputCardClassName}
                  />
                </Field>

                <Field label="Role Category">
                  <select
                    value={customRoleDraft.role_category}
                    onChange={(e) =>
                      handleCustomDraftChange("role_category", e.target.value)
                    }
                    className={inputCardClassName}
                  >
                    {ROLE_CATEGORIES.filter(
                      (category) => category.value !== "custom_roles"
                    ).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Labour Class">
                  <select
                    value={customRoleDraft.labour_class}
                    onChange={(e) =>
                      handleCustomDraftChange("labour_class", e.target.value)
                    }
                    className={inputCardClassName}
                  >
                    <option value="">Select labour class</option>
                    {LABOUR_CLASS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="ui-actions">
                  <button
                    type="button"
                    onClick={handleSaveCustomRole}
                    className={primaryButtonClassName}
                  >
                    Save Custom Role
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomRoleDraft({
                        custom_role_name: "",
                        role_category: "delivery_production",
                        labour_class: "",
                      });
                      setShowCustomRoleForm(false);
                      setCustomOpen(false);
                    }}
                    className={secondaryButtonClassName}
                  >
                    Cancel
                  </button>
                </div>

                <p className="ui-help">
                  For now, custom roles are stored locally in this browser only.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="ui-panel">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-[var(--text-secondary)]">
                Selected Role:
              </span>{" "}
              <span className="text-[var(--text-primary)]">
                {state?.staff_role || "—"}
              </span>
            </div>

            <div>
              <span className="font-medium text-[var(--text-secondary)]">
                Labour Class:
              </span>{" "}
              <span className="text-[var(--text-primary)]">
                {labourClassLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            onClick={handleCreateProfile}
            disabled={has_profile}
            className={primaryButtonClassName}
          >
            Create Profile
          </button>

          {has_profile ? (
            <div className="ui-help">
              Profile created. Identity fields are now locked.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}