"use client";

import { useMemo, useState } from "react";

import LabourProfileCard from "@/components/labour/LabourProfileCard";
import SavedProfilesCard from "@/components/labour/SavedProfilesCard";
import PayCard from "@/components/labour/PayCard";
import CommercialCard from "@/components/labour/CommercialCard";
import EntitlementsCard from "@/components/labour/EntitlementsCard";
import EmployerContributionsCard from "@/components/labour/EmployerContributionsCard";

import LabourSummaryCard from "@/components/labour/LabourSummaryCard";
import ProductiveStaffTypeRatesPanel from "@/components/labour/ProductiveStaffTypeRatesPanel";
import ScenarioModelCard from "@/components/labour/ScenarioModelCard";
import LabourHelpPanel from "@/components/labour/LabourHelpPanel";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function format_currency(value, decimals = 0) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(to_number(value));
}

function format_number(value, decimals = 0) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(to_number(value));
}

function SummaryRow({ label = "", value = "", helper = "", is_total = false }) {
  return (
    <div className={`labour-summary-table-row ${is_total ? "total" : ""}`}>
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {helper ? <div className="ui-help">{helper}</div> : null}
      </div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function SummaryTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <p className="ui-help">No values available yet.</p>;
  }

  return (
    <div className="labour-summary-table">
      {rows.map((row, index) => (
        <SummaryRow
          key={`${row.label}-${index}`}
          label={row.label}
          value={row.value}
          helper={row.helper}
          is_total={row.is_total}
        />
      ))}
    </div>
  );
}

function WorkspaceTile({
  tile_id = "",
  label = "",
  value = "",
  helper = "",
  active_tile = "",
  on_select,
}) {
  const is_active = active_tile === tile_id;

  return (
    <button
      type="button"
      className={`labour-compact-tile ${is_active ? "is-active" : ""}`}
      onClick={() => on_select?.(tile_id)}
    >
      <div className="labour-compact-tile__label">{label}</div>
      <div className="labour-compact-tile__value">{value}</div>
      {helper ? (
        <div className="labour-compact-tile__helper">{helper}</div>
      ) : null}
    </button>
  );
}

function get_readiness_value(labour = {}) {
  if (!labour.has_profile) return "No profile";
  if (labour.status?.labour_ready || labour.status?.is_ready) return "Ready";
  if (labour.status?.labour_status === "amber") return "Review";
  if (labour.status?.labour_status === "red") return "Blocked";
  return "Review";
}

function get_review_value(labour = {}) {
  const warning_count = to_number(labour.status?.warning_count);
  return `${warning_count} issue${warning_count === 1 ? "" : "s"}`;
}

function get_result_value(labour = {}) {
  return `${format_currency(labour.outputs?.productive_labour_cost_rate, 2)}/hr`;
}

function get_result_helper(labour = {}) {
  return `${format_number(labour.outputs?.productive_hours)} productive hrs`;
}

function InputDetail({ labour = {} }) {
  return (
    <div className="ui-stack-sm">
      <CollapsibleSection
        title="Labour Profile"
        summary="Create and manage staff identity"
        defaultOpen={false}
      >
        <LabourProfileCard
          state={labour.state}
          staff_types={labour.staff_types}
          has_profile={labour.has_profile}
          update_field={labour.update_field}
          create_profile={labour.create_profile}
          create_staff_type={labour.create_staff_type}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Pay"
        summary="Hrs per week and wage cost"
        defaultOpen={false}
      >
        <PayCard
          state={labour.state}
          outputs={labour.outputs}
          has_profile={labour.has_profile}
          update_field={labour.update_field}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Productivity"
        summary="Productive capacity settings"
        defaultOpen={false}
      >
        <CommercialCard
          state={labour.state}
          outputs={labour.outputs}
          has_profile={labour.has_profile}
          update_field={labour.update_field}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Entitlements"
        summary="Leave, holidays, sick leave, bereavement"
        defaultOpen={false}
      >
        <EntitlementsCard
          state={labour.state}
          outputs={labour.outputs}
          has_profile={labour.has_profile}
          update_field={labour.update_field}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Employer Contributions"
        summary="KiwiSaver, ESCT, ACC"
        defaultOpen={false}
      >
        <EmployerContributionsCard
          state={labour.state}
          outputs={labour.outputs}
          has_profile={labour.has_profile}
          update_field={labour.update_field}
        />
      </CollapsibleSection>
    </div>
  );
}

function ResultDetail({ labour = {} }) {
  return (
    <LabourSummaryCard
      {...labour.summary}
      has_profile={labour.has_profile}
      save_profile={labour.save_profile}
      start_new_profile={labour.start_new_profile}
    />
  );
}

function ReviewDetail({ labour = {} }) {
  const warnings = Array.isArray(labour.status?.warnings)
    ? labour.status.warnings
    : [];

  const review_rows = [
    {
      label: "Readiness",
      value: get_readiness_value(labour),
      helper: "Whether this Labour profile is usable downstream.",
      is_total: true,
    },
    {
      label: "Profile",
      value: labour.status?.profile_state_label || "No active profile",
    },
    {
      label: "Staff",
      value: labour.status?.staff_name_label || "Unnamed staff",
    },
    {
      label: "Labour class",
      value: labour.status?.labour_class_label || "No class",
    },
    {
      label: "Productive hours",
      value: labour.status?.productive_hours_label || "0 hrs",
    },
    {
      label: "P&L benchmark",
      value: labour.status?.pnl_benchmark_total_label || "$0",
    },
    {
      label: "Module total",
      value: labour.status?.module_total_label || "$0",
    },
    {
      label: "Variance amount",
      value: labour.status?.labour_variance_amount_label || "$0",
    },
    {
      label: "Variance percent",
      value: labour.status?.labour_variance_percent_label || "0%",
    },
  ];

  return (
    <div className="ui-stack-sm">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Review path detail</div>
          <p className="ui-help">
            Shows readiness, reconciliation, and warnings that need review
            before Labour cost truth flows downstream.
          </p>
          <SummaryTable rows={review_rows} />
        </div>
      </div>

      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Warnings</div>

          {warnings.length > 0 ? (
            <div className="ui-stack-sm">
              {warnings.map((warning, index) => (
                <div key={`${warning}-${index}`} className="ui-help">
                  • {warning}
                </div>
              ))}
            </div>
          ) : (
            <p className="ui-help">No current warnings.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdvancedDetail({ labour = {} }) {
  return (
    <div className="ui-stack-sm">
      <CollapsibleSection
        title="Productive Staff Type Rates"
        summary="Weighted productive rates by staff type"
        defaultOpen={false}
      >
        <ProductiveStaffTypeRatesPanel
          productive_staff_type_rates={
            labour.output_contract.productive_staff_type_rates
          }
          weighted_all_productive_labour_rate={
            labour.output_contract.weighted_all_productive_labour_rate
          }
          weighted_all_productive_productivity_percent={
            labour.output_contract.weighted_all_productive_productivity_percent
          }
          total_productive_labour_hours={
            labour.output_contract.total_productive_labour_hours
          }
          total_productive_labour_cost={
            labour.output_contract.total_productive_labour_cost
          }
          total_productive_paid_hours={
            labour.output_contract.total_productive_paid_hours
          }
          productive_staff_type_rate_warnings={
            labour.output_contract.productive_staff_type_rate_warnings
          }
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Saved Profiles"
        summary="Load, save, delete"
        defaultOpen={false}
      >
        <SavedProfilesCard
          profile_rows={labour.profile_rows}
          active_profile_id={labour.active_profile_id}
          load_profile={labour.load_profile}
          save_profile={labour.save_profile}
          start_new_profile={labour.start_new_profile}
          delete_profile={labour.delete_profile}
          has_profile={labour.has_profile}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Legacy Labour Commercial Scenario"
        summary="Temporary what-if testing before full Rate Builder migration"
        defaultOpen={false}
      >
        <ScenarioModelCard
          labourState={labour.state}
          has_profile={labour.has_profile}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Help"
        summary="How Labour works"
        defaultOpen={false}
      >
        <LabourHelpPanel />
      </CollapsibleSection>
    </div>
  );
}

function DetailPanel({ active_tile = "", labour = {} }) {
  const detail_config = useMemo(() => {
    if (active_tile === "inputs") {
      return {
        kicker: "Labour inputs",
        title: "Input setup",
        body:
          "Edit staff identity, hours, wage cost, productivity, entitlements, and employer contributions.",
      };
    }

    if (active_tile === "review") {
      return {
        kicker: "Review path",
        title: "Review path",
        body:
          "Review missing inputs, reconciliation status, and warnings before relying on this Labour output.",
      };
    }

    if (active_tile === "advanced") {
      return {
        kicker: "Advanced outputs",
        title: "Advanced outputs",
        body:
          "Use this area for staff type rates, saved profiles, legacy scenario testing, and help.",
      };
    }

    return {
      kicker: "Labour cost result",
      title: "Labour cost result",
      body:
        "Shows productive hours and the real labour cost per productive hour.",
    };
  }, [active_tile]);

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">{detail_config.kicker}</div>
          <h3 className="ui-card-title-sm">{detail_config.title}</h3>
          <p className="ui-help">{detail_config.body}</p>
        </div>

        {active_tile === "inputs" ? <InputDetail labour={labour} /> : null}
        {active_tile === "result" ? <ResultDetail labour={labour} /> : null}
        {active_tile === "review" ? <ReviewDetail labour={labour} /> : null}
        {active_tile === "advanced" ? <AdvancedDetail labour={labour} /> : null}
      </div>
    </div>
  );
}

export default function LabourCompactWorkspaceCard({ labour = {} }) {
  const [active_tile, set_active_tile] = useState("result");

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Labour Summary</div>
            <h2 className="ui-card-title">Labour cost position</h2>
            <p className="ui-help">
              Open each card to see inputs, cost result, review path, and
              advanced outputs.
            </p>
          </div>

          <div className="labour-compact-grid">
            <WorkspaceTile
              tile_id="inputs"
              label="Labour inputs"
              value="Input setup"
              helper="Profile, hrs, wage"
              active_tile={active_tile}
              on_select={set_active_tile}
            />

            <WorkspaceTile
              tile_id="result"
              label="Labour cost result"
              value={get_result_value(labour)}
              helper={get_result_helper(labour)}
              active_tile={active_tile}
              on_select={set_active_tile}
            />

            <WorkspaceTile
              tile_id="review"
              label="Review path"
              value={get_review_value(labour)}
              helper={labour.status?.reconciliation_label || "Current checks"}
              active_tile={active_tile}
              on_select={set_active_tile}
            />

            <WorkspaceTile
              tile_id="advanced"
              label="Advanced outputs"
              value="Staff rates"
              helper="Profiles and rates"
              active_tile={active_tile}
              on_select={set_active_tile}
            />
          </div>

          <DetailPanel active_tile={active_tile} labour={labour} />
        </div>
      </div>
    </section>
  );
}