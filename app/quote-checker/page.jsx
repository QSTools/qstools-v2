"use client";

import Link from "next/link";
import useQuoteChecker from "@/hooks/useQuoteChecker";

function NumberInput({ label, value, onChange }) {
  return (
    <label className="ui-stack-xs">
      <span className="ui-kicker">{label}</span>
      <input
        className="ui-input"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="ui-stack-xs">
      <span className="ui-kicker">{label}</span>
      <input
        className="ui-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MetricCard({ label, value, help }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className="ui-card-title-sm">{value}</div>
      {help ? <p className="ui-help">{help}</p> : null}
    </div>
  );
}

function MessageList({ title, items = [], emptyMessage }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{title}</div>

      {Array.isArray(items) && items.length > 0 ? (
        <div className="ui-stack-sm">
          {items.map((item, index) => (
            <p className="ui-help" key={item.id || `message-${index}`}>
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

export default function QuoteCheckerPage() {
  const {
    quote,
    updateQuoteField,
    result,
    trust_state,
    downstream_permissions,
    export_blockers,
    export_warnings,
  } = useQuoteChecker();

  const can_use_for_quote_checker =
    downstream_permissions?.can_use_for_quote_checker === true;

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Quote Checker</div>
            <div className="ui-display">Test a quote against the selected model</div>
            <p className="ui-help">
              Local-only quote test. This page does not save quotes and does not
              change source business values.
            </p>
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard label="Model trust state" value={trust_state} />
            <MetricCard
              label="Quote checker permission"
              value={can_use_for_quote_checker ? "Ready" : "Blocked"}
            />
            <MetricCard
              label="Quote alignment"
              value={result.quote_alignment_status}
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Quote inputs</div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextInput
                label="Quote name"
                value={quote.quote_name}
                onChange={(value) => updateQuoteField("quote_name", value)}
              />
              <NumberInput
                label="Labour hours"
                value={quote.labour_hours}
                onChange={(value) => updateQuoteField("labour_hours", value)}
              />
              <NumberInput
                label="Labour charge total"
                value={quote.labour_charge_total}
                onChange={(value) => updateQuoteField("labour_charge_total", value)}
              />
              <NumberInput
                label="Material cost"
                value={quote.material_cost}
                onChange={(value) => updateQuoteField("material_cost", value)}
              />
              <NumberInput
                label="Material charge total"
                value={quote.material_charge_total}
                onChange={(value) => updateQuoteField("material_charge_total", value)}
              />
              <NumberInput
                label="Other direct cost"
                value={quote.other_direct_cost}
                onChange={(value) => updateQuoteField("other_direct_cost", value)}
              />
              <NumberInput
                label="Other direct charge total"
                value={quote.other_direct_charge_total}
                onChange={(value) =>
                  updateQuoteField("other_direct_charge_total", value)
                }
              />
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <MetricCard label="Total quote charge" value={`$${result.total_quote_charge}`} />
            <MetricCard label="Total direct cost" value={`$${result.total_direct_cost}`} />
            <MetricCard label="Gross profit $" value={`$${result.gross_profit_dollars}`} />
            <MetricCard label="Gross profit %" value={`${result.gross_profit_percent}%`} />
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard
              label="Implied labour charge rate"
              value={`$${result.implied_labour_charge_rate}/hr`}
            />
            <MetricCard
              label="Required labour recovery"
              value={`$${result.required_labour_recovery}/hr`}
            />
            <MetricCard
              label="Labour recovery gap"
              value={`$${result.labour_recovery_gap}/hr`}
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetricCard
              label="Material markup"
              value={`$${result.material_markup_dollars}`}
              help={`${result.material_markup_percent}% on material cost`}
            />
            <MetricCard
              label="Other direct markup"
              value={`$${result.other_direct_markup_dollars}`}
              help={`${result.other_direct_markup_percent}% on other direct cost`}
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MessageList
              title="Quote blockers"
              items={result.blockers}
              emptyMessage="No quote blockers."
            />
            <MessageList
              title="Quote warnings"
              items={result.warnings}
              emptyMessage="No quote warnings."
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MessageList
              title="Model blockers"
              items={export_blockers}
              emptyMessage="No model blockers reported by the export state."
            />
            <MessageList
              title="Model warnings"
              items={export_warnings}
              emptyMessage="No model warnings reported by the export state."
            />
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Source review</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <SourceLinkCard
                href="/business-overview"
                title="Business Overview"
                description="Review the top-level business state."
              />
              <SourceLinkCard
                href="/business-modelling"
                title="Business Modelling"
                description="Review the selected model and scenarios."
              />
              <SourceLinkCard
                href="/ai-business-state"
                title="AI Business State"
                description="Review the export object."
              />
              <SourceLinkCard
                href="/model-readiness"
                title="Model Readiness"
                description="Review blockers and readiness groups."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
