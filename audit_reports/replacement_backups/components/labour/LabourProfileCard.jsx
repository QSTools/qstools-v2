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
    { role_name: "Sales / Business Development", labour_class: "indirect_overhead" },
    { role_name: "Accounts Manager", labour_class: "indirect_overhead" },
    { role_name: "Accounts / Bookkeeper", labour_class: "indirect_overhead" },
    { role_name: "Office Manager", labour_class: "indirect_overhead" },
    { role_name: "Administrator", labour_class: "indirect_overhead" },
    { role_name: "Reception / Admin Support", labour_class: "indirect_overhead" },
  ],
  delivery_production: [
    { role_name: "Leading Hand", labour_class: "direct_production" },
    { role_name: "Site Labourer", labour_class: "direct_production" },
    { role_name: "Skilled Labourer / Tradesperson", labour_class: "direct_production" },
    { role_name: "Driver", labour_class: "direct_production" },
    { role_name: "Plant Operator", labour_class: "direct_production" },
    { role_name: "Machine Operator", labour_class: "direct_production" },
    { role_name: "Yardman / Storeman", labour_class: "direct_support" },
    { role_name: "Workshop Technician", labour_class: "direct_support" },
  ],
  technical_support: [
    { role_name: "Health & Safety Coordinator", labour_class: "direct_support" },
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

export default function LabourProfileCard({
  state,
  has_profile,
  update_field,
  create_profile,
}) {
  const [customRoles, setCustomRoles] = useState([]);
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
      alert("Please complete staff name, role category, staff role, and labour class.");
    }
  }

  function handleCustomDraftChange(field, value) {
    setCustomRoleDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSaveCustomRole() {
    const custom_role_name = String(customRoleDraft.custom_role_name || "").trim();
    const role_category = String(customRoleDraft.role_category || "").trim();
    const labour_class = String(customRoleDraft.labour_class || "").trim();

    if (!custom_role_name || !role_category || !labour_class) {
      alert("Enter a custom role name, role category, and labour class.");
      return;
    }

    const exists = customRoles.some(
      (role) =>
        String(role.custom_role_name || "").trim().toLowerCase() === custom_role_name.toLowerCase() &&
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
  }

  const labourClassLabel =
    LABOUR_CLASS_OPTIONS.find((option) => option.value === state?.labour_class)?.label || "—";

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Labour Profile</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Create the staff profile first. Core labour inputs stay locked until the
          profile is created.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            Staff Name
          </label>
          <input
            type="text"
            value={state?.staff_name ?? ""}
            onChange={(e) => update_field("staff_name", e.target.value)}
            disabled={has_profile}
            placeholder="Enter staff name"
            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-white outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            Role Category
          </label>
          <select
            value={state?.role_category ?? ""}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={has_profile}
            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-white outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select role category</option>
            {ROLE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            Staff Role
          </label>
          <select
            value={state?.staff_role ?? ""}
            onChange={(e) => handleStaffRoleChange(e.target.value)}
            disabled={has_profile || !selectedRoleCategory}
            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-white outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {selectedRoleCategory ? "Select staff role" : "Select role category first"}
            </option>
            {filteredRoles.map((role) => (
              <option key={role.role_name} value={role.role_name}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
            Labour Class
          </label>
          <select
            value={state?.labour_class ?? ""}
            onChange={(e) => handleLabourClassChange(e.target.value)}
            disabled={has_profile}
            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-white outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select labour class</option>
            {LABOUR_CLASS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Standard roles auto-fill this. Custom roles must define it before save.
          </p>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setShowCustomRoleForm((previous) => !previous)}
            disabled={has_profile}
            className="rounded-xl border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bg-card-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showCustomRoleForm ? "Hide Custom Role" : "Add Custom Role"}
          </button>
        </div>
      </div>

      {showCustomRoleForm && !has_profile ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-input)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Create Custom Role</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Custom Role Name
              </label>
              <input
                type="text"
                value={customRoleDraft.custom_role_name}
                onChange={(e) =>
                  handleCustomDraftChange("custom_role_name", e.target.value)
                }
                placeholder="e.g. Concrete Coordinator"
                className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Role Category
              </label>
              <select
                value={customRoleDraft.role_category}
                onChange={(e) =>
                  handleCustomDraftChange("role_category", e.target.value)
                }
                className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
              >
                {ROLE_CATEGORIES.filter((category) => category.value !== "custom_roles").map(
                  (category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Labour Class
              </label>
              <select
                value={customRoleDraft.labour_class}
                onChange={(e) =>
                  handleCustomDraftChange("labour_class", e.target.value)
                }
                className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
              >
                <option value="">Select labour class</option>
                {LABOUR_CLASS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveCustomRole}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
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
              }}
              className="rounded-xl border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bg-card-muted)]"
            >
              Cancel
            </button>
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            For now, custom roles are stored locally in this browser only.
          </p>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl bg-[var(--bg-input)] p-4">
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium text-[var(--text-secondary)]">Selected Role:</span>{" "}
            <span className="text-white">{state?.staff_role || "—"}</span>
          </div>
          <div>
            <span className="font-medium text-[var(--text-secondary)]">Labour Class:</span>{" "}
            <span className="text-white">{labourClassLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCreateProfile}
          disabled={has_profile}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create Profile
        </button>

        {has_profile ? (
          <div className="text-sm text-[var(--text-muted)]">
            Profile created. Identity fields are now locked.
          </div>
        ) : null}
      </div>
    </section>
  );
}