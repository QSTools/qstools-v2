"use client";

import CostAllocationGroupsCard from "@/components/cost-allocation/CostAllocationGroupsCard";
import CostAllocationLinkTable from "@/components/cost-allocation/CostAllocationLinkTable";
import ChecklistSection from "@/components/cost-allocation/evidence/ChecklistSection";
import GroupCostStacksSection from "@/components/cost-allocation/evidence/GroupCostStacksSection";
import PlaceholderSection from "@/components/cost-allocation/evidence/PlaceholderSection";
import PoolReconciliationSection from "@/components/cost-allocation/evidence/PoolReconciliationSection";
import WhatNeedsAttentionSection from "@/components/cost-allocation/evidence/WhatNeedsAttentionSection";

export default function CostAllocationEvidenceBreakdown({
  active_section,
  recovery_plan,
  delivery_summary,
  evidence,
  links,
  divisions,
  groups,
  problems,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  add_division,
  update_division,
  remove_division,
  add_asset_labour_link,
  remove_asset_labour_link,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
  add_overhead_assignment,
  remove_overhead_assignment,
}) {
  const current_section = active_section || "groups";

  if (current_section === "groups") {
    return (
      <CostAllocationGroupsCard
        divisions={divisions}
        groups={groups}
        labour_assignment={labour_assignment}
        asset_assignment={asset_assignment}
        overhead_assignment={overhead_assignment}
        add_division={add_division}
        update_division={update_division}
        remove_division={remove_division}
        add_operational_group={add_operational_group}
        update_operational_group={update_operational_group}
        remove_operational_group={remove_operational_group}
        add_labour_assignment={add_labour_assignment}
        remove_labour_assignment={remove_labour_assignment}
        add_asset_assignment={add_asset_assignment}
        remove_asset_assignment={remove_asset_assignment}
        add_overhead_assignment={add_overhead_assignment}
        remove_overhead_assignment={remove_overhead_assignment}
      />
    );
  }

  if (current_section === "links") {
    return (
      <CostAllocationLinkTable
        links={links}
        add_asset_labour_link={add_asset_labour_link}
        remove_asset_labour_link={remove_asset_labour_link}
      />
    );
  }

  if (current_section === "group_cost_stacks") {
    return <GroupCostStacksSection recovery_plan={recovery_plan} />;
  }

  if (current_section === "pool_reconciliation") {
    return (
      <PoolReconciliationSection
        recovery_plan={recovery_plan}
        labour_assignment={labour_assignment}
        asset_assignment={asset_assignment}
        overhead_assignment={overhead_assignment}
      />
    );
  }

  if (current_section === "setup_checklist") {
    return (
      <ChecklistSection
        kicker="Setup checklist"
        title="Setup items needing review"
        help_text="Complete these items to make the operating structure reliable."
        warnings={evidence?.setup_warnings}
        empty_message="No setup checklist items are currently active."
      />
    );
  }

  if (current_section === "structural_warnings") {
    return (
      <ChecklistSection
        kicker="Structure warnings"
        title="Operating group and source-pool warnings"
        help_text="These are operating group, productive source-pool, or recovery dependency issues that may prevent the structure from being relied on downstream."
        warnings={evidence?.structural_warnings}
        empty_message="No structural warnings are currently active."
      />
    );
  }

  if (current_section === "evidence") {
    return (
      <WhatNeedsAttentionSection
        delivery_summary={delivery_summary}
        problems={problems}
      />
    );
  }

  return (
    <PlaceholderSection
      kicker="Section not connected"
      title="This section is not wired yet"
      help_text={`No component is currently connected for active_section: ${current_section}`}
    />
  );
}
