"use client";

import Link from "next/link";
import useAiBusinessState from "@/hooks/useAiBusinessState";
import NextStepFooter from "@/components/navigation/NextStepFooter";

function StatusCard({ label, value, help }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className="ui-card-title-sm">{String(value)}</div>
      {help ? <p className="ui-help">{help}</p> : null}
    </div>
  );
}

function PermissionCard({ label, value }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className="ui-card-title-sm">{value ? "Ready" : "Blocked"}</div>
    </div>
  );
}

function MessageList({ title, items = [], emptyMessage }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{title}</div>

      {Array.isArray(items) && items.length > 0 ? (
        <div className="ui-stack-sm">
          {items.slice(0, 5).map((item, index) => (
            <p className="ui-help" key={item.id || item.warning_id || `item-${index}`}>
              {item.message || String(item)}
            </p>
          ))}
        </div>
      ) : (
        <p className="ui-help">{emptyMessage}</p>
      )}
    </div>
  );
}

function SourceLinkCard({ href, title, description }) {
  return (
    <Link href={href} className="ui-panel ui-stack-sm no-underline">
      <div className="ui-kicker">{title}</div>
      <p className="ui-help">{description}</p>
    </Link>
  );
}

export default function BusinessOverviewPage() {
  const {
    export_object,
    trust_state,
    downstream_permissions,
    blockers,
    warnings,
  } = useAiBusinessState();

  const selected_model = export_object.selected_model ?? {};
  const business_summary = export_object.business_summary ?? {};

  const selected_model_name =
    selected_model.scenario_name ||
    selected_model.baseline_name ||
    "Selected model";

  const selected_model_trust_state =
    selected_model.scenario_trust_state ||
    selected_model.model_trust_state ||
    trust_state;

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Business Overview</div>
            <div className="ui-display">Current business state</div>
            <p className="ui-help">
              A read-only overview of trust, readiness, selected model, blockers,
              warnings and next review areas.
            </p>
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <StatusCard label="Trust state" value={trust_state} />
            <PermissionCard
              label="AI export"
              value={downstream_permissions.can_use_for_ai}
            />
            <PermissionCard
              label="Dashboard"
              value={downstream_permissions.can_use_for_dashboard}
            />
            <PermissionCard
              label="Quote checker"
              value={downstream_permissions.can_use_for_quote_checker}
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatusCard
              label="Selected model"
              value={selected_model_name}
              help={`Trust state: ${selected_model_trust_state}`}
            />
            <StatusCard
              label="Business revenue"
              value={business_summary.total_revenue ?? 0}
              help="Read from Business Summary output contract."
            />
            <StatusCard
              label="Net position"
              value={business_summary.net_position ?? 0}
              help="Read-only source value."
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MessageList
              title="Blockers"
              items={blockers}
              emptyMessage="No blockers reported by the current export state."
            />
            <MessageList
              title="Warnings"
              items={warnings}
              emptyMessage="No warnings reported by the current export state."
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Next actions</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SourceLinkCard
                href="/model-readiness"
                title="Review readiness"
                description="Check blockers, warnings and readiness groups."
              />
              <SourceLinkCard
                href="/business-modelling"
                title="Review modelling"
                description="Check selected model, scenarios and modelling gaps."
              />
              <SourceLinkCard
                href="/ai-business-state"
                title="Review export"
                description="Inspect the AI-readable business state JSON."
              />
            </div>
          </div>
        </section>

        <NextStepFooter
          nextHref="/model-readiness"
          nextLabel="Next: Model Readiness"
        />
      </div>
    </main>
  );
}
