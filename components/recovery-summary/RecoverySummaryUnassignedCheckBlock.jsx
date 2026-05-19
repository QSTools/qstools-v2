import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function RecoverySummaryUnassignedCheckBlock({
  overhead_absorption_level,
  overhead_absorption_title,
  overhead_absorption_message,
  overhead_absorption_diagnostics = [],
}) {
  const is_fully_assigned = overhead_absorption_level === "none";

  const summary = is_fully_assigned
    ? "Fully assigned"
    : overhead_absorption_level === "high"
      ? "Strong review"
      : overhead_absorption_level === "medium"
        ? "Review"
        : "Low review";

  const resolved_title = is_fully_assigned
    ? "Starting recovery model is fully assigned"
    : overhead_absorption_title;

  const resolved_message = is_fully_assigned
    ? "The starting recovery model is fully assigned based on current inputs. Asset recovery is not yet included unless productive asset utilisation can support it."
    : overhead_absorption_message;

  return (
    <CollapsibleSection
      title="Unassigned recovery check"
      summary={summary}
      defaultOpen={false}
    >
      <div className="ui-stack">
        <p className="ui-help">
          This checks whether any part of the starting recovery model still
          needs to be allocated to labour, productive assets, or materials /
          products. This is a recovery strategy issue, not the same as Other /
          Unallocated in General Overheads.
        </p>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">
              {overhead_absorption_level === "high"
                ? "Strong review"
                : overhead_absorption_level === "medium"
                  ? "Review"
                  : "Status"}
            </p>

            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {resolved_title}
            </h4>

            <p className="text-sm font-medium text-[var(--text-primary)]">
              {resolved_message}
            </p>
          </div>
        </div>

        {is_fully_assigned ? (
          <div className="ui-readonly">
            <p className="text-sm text-[var(--text-primary)]">
              Assets remain in the cost burden. They are not forced into the
              recovery split until asset utilisation or productive asset usage
              gives the system enough evidence to assign an asset recovery
              share.
            </p>
          </div>
        ) : null}

        {overhead_absorption_diagnostics.length > 0 ? (
          <div className="ui-stack-sm">
            {overhead_absorption_diagnostics.map((diagnostic) => (
              <div key={diagnostic.diagnostic_key} className="ui-readonly">
                <div className="ui-stack-sm">
                  <p className="ui-label">{diagnostic.title}</p>

                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {diagnostic.message}
                  </p>

                  <p className="ui-help">{diagnostic.check_area}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}