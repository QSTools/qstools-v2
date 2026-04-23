"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import GeneralOverheadSummaryCard from "@/components/general-overheads/GeneralOverheadSummaryCard";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum_fields(state, fields) {
  return fields.reduce((sum, field) => sum + to_number(state[field]), 0);
}

function CurrencyField({ label, value, onChange }) {
  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className="ui-input"
        value={value ?? 0}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CustomItemRow({
  item,
  update_custom_item,
  remove_custom_item,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <label className="ui-field">
        <span className="ui-label">Custom Item Name</span>
        <input
          type="text"
          className="ui-input"
          value={item.custom_overhead_name ?? ""}
          onChange={(event) =>
            update_custom_item(
              item.custom_overhead_id,
              "custom_overhead_name",
              event.target.value
            )
          }
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Amount</span>
        <input
          type="number"
          inputMode="decimal"
          className="ui-input"
          value={item.custom_overhead_amount ?? 0}
          onChange={(event) =>
            update_custom_item(
              item.custom_overhead_id,
              "custom_overhead_amount",
              event.target.value
            )
          }
        />
      </label>

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => remove_custom_item(item.custom_overhead_id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ProfilePanel({
  overhead_profile_name,
  effective_from,
  is_active,
  update_field,
  save_profile,
  reset_state,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Profile</div>
      <div className="ui-card-title-sm">General Overheads Profile</div>

      <label className="ui-field">
        <span className="ui-label">Profile Name</span>
        <input
          type="text"
          className="ui-input"
          value={overhead_profile_name ?? ""}
          onChange={(event) =>
            update_field("overhead_profile_name", event.target.value)
          }
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Effective From</span>
        <input
          type="date"
          className="ui-input"
          value={effective_from ?? ""}
          onChange={(event) =>
            update_field("effective_from", event.target.value)
          }
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Active Profile</span>
        <select
          className="ui-input"
          value={is_active ? "true" : "false"}
          onChange={(event) =>
            update_field("is_active", event.target.value === "true")
          }
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>

      <div className="ui-actions">
        <button type="button" className="ui-button-primary" onClick={save_profile}>
          Save Profile
        </button>
        <button type="button" className="ui-button-secondary" onClick={reset_state}>
          Reset
        </button>
      </div>
    </div>
  );
}

function SavedProfilesPanel({
  saved_overheads,
  load_profile,
  delete_profile,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Saved Profiles</div>
      <div className="ui-card-title-sm">Saved General Overheads</div>

      {saved_overheads?.length ? (
        <div className="ui-stack-sm">
          {saved_overheads.map((profile) => (
            <div
              key={profile.overhead_profile_id}
              className="ui-row-between ui-panel"
            >
              <div className="ui-stack-sm">
                <div className="ui-label">
                  {profile.overhead_profile_name || "Untitled Profile"}
                </div>
                <div className="ui-help">
                  {profile.effective_from || "No effective date"}
                </div>
              </div>

              <div className="ui-actions">
                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={() => load_profile(profile.overhead_profile_id)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={() => delete_profile(profile.overhead_profile_id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ui-help">No saved overhead profiles yet.</div>
      )}
    </div>
  );
}

export default function GeneralOverheadMainCard({
  profile,
  profiles,
  form,
  summary,
}) {
  const overhead_state = form.overhead_state;

  const office_admin_total = sum_fields(overhead_state, [
    "software_subscriptions",
    "internet_cost",
    "phone_system_cost",
    "office_supplies_cost",
    "general_admin_cost",
  ]);

  const financial_admin_total = sum_fields(overhead_state, [
    "accounting_fees",
    "bank_fees",
  ]);

  const insurance_compliance_total = sum_fields(overhead_state, [
    "public_liability_insurance",
    "professional_indemnity_insurance",
    "legal_fees",
  ]);

  const vehicles_running_total = sum_fields(overhead_state, [
    "fuel_cost_annual",
    "vehicle_maintenance_cost_annual",
    "vehicle_repairs_cost_annual",
    "vehicle_registration_cost_annual",
    "vehicle_tyres_cost_annual",
    "vehicle_consumables_cost_annual",
  ]);

  const facilities_premises_total = sum_fields(overhead_state, [
    "office_rent",
    "power_cost",
  ]);

  const sales_growth_total = sum_fields(overhead_state, [
    "marketing_cost",
  ]);

  const other_unallocated_total =
    to_number(overhead_state.other_general_overhead_cost) +
    (overhead_state.custom_overhead_items ?? []).reduce(
      (sum, item) => sum + to_number(item.custom_overhead_amount),
      0
    );

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Business Overheads</div>
          <div className="ui-card-title">General Overheads</div>
          <p className="ui-help">
            Review, group, and confirm the annual overhead costs required to run
            the business outside Labour and Assets.
          </p>
        </div>

        <ProfilePanel {...profile} />
        <SavedProfilesPanel {...profiles} />
        <GeneralOverheadSummaryCard {...summary} />

        <CollapsibleSection
          title="Office / Admin"
          summary={format_currency(office_admin_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Software Subscriptions"
              value={overhead_state.software_subscriptions}
              onChange={(value) => form.update_field("software_subscriptions", value)}
            />
            <CurrencyField
              label="Internet"
              value={overhead_state.internet_cost}
              onChange={(value) => form.update_field("internet_cost", value)}
            />
            <CurrencyField
              label="Phone System"
              value={overhead_state.phone_system_cost}
              onChange={(value) => form.update_field("phone_system_cost", value)}
            />
            <CurrencyField
              label="Office Supplies"
              value={overhead_state.office_supplies_cost}
              onChange={(value) => form.update_field("office_supplies_cost", value)}
            />
            <CurrencyField
              label="General Admin"
              value={overhead_state.general_admin_cost}
              onChange={(value) => form.update_field("general_admin_cost", value)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Financial Admin"
          summary={format_currency(financial_admin_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Accounting Fees"
              value={overhead_state.accounting_fees}
              onChange={(value) => form.update_field("accounting_fees", value)}
            />
            <CurrencyField
              label="Bank Fees"
              value={overhead_state.bank_fees}
              onChange={(value) => form.update_field("bank_fees", value)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Insurance & Compliance"
          summary={format_currency(insurance_compliance_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Public Liability Insurance"
              value={overhead_state.public_liability_insurance}
              onChange={(value) =>
                form.update_field("public_liability_insurance", value)
              }
            />
            <CurrencyField
              label="Professional Indemnity Insurance"
              value={overhead_state.professional_indemnity_insurance}
              onChange={(value) =>
                form.update_field("professional_indemnity_insurance", value)
              }
            />
            <CurrencyField
              label="Legal Fees"
              value={overhead_state.legal_fees}
              onChange={(value) => form.update_field("legal_fees", value)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Vehicles (Running)"
          summary={format_currency(vehicles_running_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Fuel"
              value={overhead_state.fuel_cost_annual}
              onChange={(value) => form.update_field("fuel_cost_annual", value)}
            />
            <CurrencyField
              label="Vehicle Maintenance"
              value={overhead_state.vehicle_maintenance_cost_annual}
              onChange={(value) =>
                form.update_field("vehicle_maintenance_cost_annual", value)
              }
            />
            <CurrencyField
              label="Vehicle Repairs"
              value={overhead_state.vehicle_repairs_cost_annual}
              onChange={(value) =>
                form.update_field("vehicle_repairs_cost_annual", value)
              }
            />
            <CurrencyField
              label="Registration / Licensing"
              value={overhead_state.vehicle_registration_cost_annual}
              onChange={(value) =>
                form.update_field("vehicle_registration_cost_annual", value)
              }
            />
            <CurrencyField
              label="Tyres"
              value={overhead_state.vehicle_tyres_cost_annual}
              onChange={(value) =>
                form.update_field("vehicle_tyres_cost_annual", value)
              }
            />
            <CurrencyField
              label="Vehicle Consumables"
              value={overhead_state.vehicle_consumables_cost_annual}
              onChange={(value) =>
                form.update_field("vehicle_consumables_cost_annual", value)
              }
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Facilities / Premises"
          summary={format_currency(facilities_premises_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Office Rent"
              value={overhead_state.office_rent}
              onChange={(value) => form.update_field("office_rent", value)}
            />
            <CurrencyField
              label="Power"
              value={overhead_state.power_cost}
              onChange={(value) => form.update_field("power_cost", value)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Sales / Growth"
          summary={format_currency(sales_growth_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Marketing"
              value={overhead_state.marketing_cost}
              onChange={(value) => form.update_field("marketing_cost", value)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Other / Unallocated"
          summary={format_currency(other_unallocated_total)}
          defaultOpen={false}
        >
          <div className="ui-panel ui-stack-sm">
            <CurrencyField
              label="Other General Overheads"
              value={overhead_state.other_general_overhead_cost}
              onChange={(value) =>
                form.update_field("other_general_overhead_cost", value)
              }
            />

            <div className="ui-stack-sm">
              <div className="ui-label">Custom Overhead Items</div>

              {(overhead_state.custom_overhead_items ?? []).length ? (
                (overhead_state.custom_overhead_items ?? []).map((item) => (
                  <CustomItemRow
                    key={item.custom_overhead_id}
                    item={item}
                    update_custom_item={form.update_custom_item}
                    remove_custom_item={form.remove_custom_item}
                  />
                ))
              ) : (
                <div className="ui-help">No custom overhead items yet.</div>
              )}

              <div className="ui-actions">
                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={form.add_custom_item}
                >
                  Add Custom Item
                </button>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </section>
  );
}