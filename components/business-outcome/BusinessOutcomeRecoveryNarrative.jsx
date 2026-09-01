"use client";

// Rules-based narrative for the Recovery & Rate Justification page.
// Deliberately distinct from Business Outcome's "Your business, right
// now" - that page answers "is the business profitable"; this page
// answers "are our rates actually recovering real cost." Same
// business, different question, so this must not repeat that
// messaging. Not an AI call - reads the same live calculation output
// already powering the rest of this page.

function streamLabel(stream) {
  return { Labour: "Labour", Assets: "Assets", Overheads: "Overheads" }[stream] || stream;
}

export default function BusinessOutcomeRecoveryNarrative({ outcome }) {
  const { pressureRows, primaryPressureSource, asset } = outcome || {};
  if (!Array.isArray(pressureRows) || pressureRows.length === 0) return null;

  const lines = [];

  // 1. Overall recovery status
  if (primaryPressureSource === "none_identified") {
    lines.push("Every stream is currently recovering at or above its cost - no rate pressure right now.");
  } else if (primaryPressureSource && primaryPressureSource !== "unknown_pending_rate_builder_data") {
    const label =
      { labour: "Labour", overhead: "Overheads", asset: "Assets", combined_labour_overhead: "Labour and Overheads" }[
        primaryPressureSource
      ] || primaryPressureSource;
    lines.push(`${label} is currently under recovery pressure - cost is running ahead of what the model expects to recover.`);
  }

  // 2. Tightest stream (least headroom), even when nothing is in outright pressure
  const withGap = pressureRows.filter((r) => r.gap !== null && r.gap !== undefined && r.modelCapacity);
  if (withGap.length > 0) {
    const tightest = [...withGap].sort((a, b) => b.gap - a.gap)[0];
    if (tightest.gap < 0) {
      const headroomPercent = tightest.modelCapacity > 0 ? Math.abs(tightest.gap / tightest.modelCapacity) * 100 : null;
      if (headroomPercent !== null && headroomPercent < 25) {
        lines.push(
          `${streamLabel(tightest.stream)} has the least headroom of the three streams - worth watching if costs rise.`
        );
      }
    }
  }

  // 3. Group-level rate flag - a rate issue, not necessarily a business-health one
  const groupsAtLoss = asset?.assetGroupsAtLoss;
  if (Array.isArray(groupsAtLoss) && groupsAtLoss.length > 0) {
    const names = groupsAtLoss.map((g) => g.groupName).join(", ");
    lines.push(
      `${names} ${groupsAtLoss.length === 1 ? "is" : "are"} currently priced below ${
        groupsAtLoss.length === 1 ? "its" : "their"
      } own cost - a rate issue worth reviewing, even though the business overall may comfortably absorb it. See the Assets breakdown below.`
    );
  }

  if (lines.length === 0) {
    lines.push("Rates look adequate across every stream right now.");
  }

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Rate Recovery, Right Now</div>
      {lines.map((line, i) => (
        <p key={i} style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: "0.25rem 0" }}>
          {line}
        </p>
      ))}
    </div>
  );
}
