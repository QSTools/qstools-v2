"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function ProfitAndLossAwarenessPanel() {
  return (
    <CollapsibleSection
      title="P&L Awareness"
      summary="This page helps classify your accounting picture into QS benchmark categories."
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack-sm">
        <p className="ui-help">
          This page does not need to be perfect. It is designed to help you
          classify a real-world P&amp;L into consistent QS benchmark groups so
          you can understand where the business cost is sitting.
        </p>

        <p className="ui-help">
          Each line should be assigned to one category only. If a line feels
          messy or mixed, choose the best-fit bucket for now rather than trying
          to make the accounting structure perfect.
        </p>

        <p className="ui-help">
          The goal is benchmark visibility and downstream setup readiness — not
          accounting-grade chart-of-accounts design.
        </p>
      </div>
    </CollapsibleSection>
  );
}