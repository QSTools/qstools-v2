"use client";

import useAiBusinessState from "@/hooks/useAiBusinessState";

function StatusMetric({ label, value }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className="ui-card-title-sm">{String(value)}</div>
    </div>
  );
}

function PermissionTable({ permissions = {} }) {
  return (
    <div className="labour-summary-table">
      {Object.entries(permissions).map(([key, value]) => (
        <div key={key} className="labour-summary-table-row">
          <div className="labour-summary-table-label">{key}</div>
          <div className="labour-summary-table-value">
            {value ? "Yes" : "No"}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageList({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{title}</div>
      {items.map((item, index) => (
        <p className="ui-help" key={item.id || item.warning_id || `item-${index}`}>
          {item.message || String(item)}
        </p>
      ))}
    </div>
  );
}

export default function AiBusinessStatePage() {
  const {
    export_object,
    trust_state,
    downstream_permissions,
    blockers,
    warnings,
  } = useAiBusinessState();

  const selected_model = export_object.selected_model ?? {};

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">AI-readable Business State</div>
            <div className="ui-card-title-sm">Read-only export preview</div>
            <p className="ui-help">
              Packages the current business state for downstream AI, dashboard,
              reporting and quote-checking layers without changing source truth.
            </p>
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <StatusMetric label="Trust state" value={trust_state} />
            <StatusMetric
              label="Can use for AI"
              value={downstream_permissions.can_use_for_ai ? "Yes" : "No"}
            />
            <StatusMetric
              label="Can use for dashboard"
              value={downstream_permissions.can_use_for_dashboard ? "Yes" : "No"}
            />
            <StatusMetric
              label="Can use for quote checker"
              value={downstream_permissions.can_use_for_quote_checker ? "Yes" : "No"}
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Downstream permissions</div>
            <PermissionTable permissions={downstream_permissions} />
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Selected model summary</div>
            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">Model name</div>
                <div className="labour-summary-table-value">
                  {selected_model.scenario_name ||
                    selected_model.baseline_name ||
                    "Selected model"}
                </div>
              </div>
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">Trust state</div>
                <div className="labour-summary-table-value">
                  {selected_model.scenario_trust_state ||
                    selected_model.model_trust_state ||
                    trust_state}
                </div>
              </div>
            </div>
          </div>
        </section>

        <MessageList title="Blockers" items={blockers} />
        <MessageList title="Warnings" items={warnings} />

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">JSON export preview</div>
            <pre className="ui-panel overflow-auto text-xs">
              {JSON.stringify(export_object, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
