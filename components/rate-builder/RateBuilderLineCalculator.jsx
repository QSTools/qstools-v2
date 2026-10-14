"use client";

import RateBuilderAddLinePanel from "./line-calculator/RateBuilderAddLinePanel";
import RateBuilderChargeList from "./line-calculator/RateBuilderChargeList";
import RateBuilderGroupSelector from "./line-calculator/RateBuilderGroupSelector";
import RateBuilderResultPanel from "./line-calculator/RateBuilderResultPanel";
import useRateBuilderLineCalculator from "./line-calculator/useRateBuilderLineCalculator";
import { get_asset_pricing_block } from "@/lib/calculations/rateBuilderPricingBlock";

export default function RateBuilderLineCalculator({ labour_rate_context = {} }) {
  const calculator = useRateBuilderLineCalculator({ labour_rate_context });
  const pricing_block = get_asset_pricing_block(calculator.labour_breakdown);

  return (
    <section className="rate-builder-calculator">
      <div className="rate-builder-calculator__left ui-stack">
        <RateBuilderGroupSelector
          active_calculator={calculator.active_calculator}
          asset_backed_group_options={calculator.asset_backed_group_options}
          group_asset_options={calculator.group_asset_options}
          updateLinkedAsset={calculator.updateLinkedAsset}
          updateLinkedCostAllocationGroup={
            calculator.updateLinkedCostAllocationGroup
          }
        />

        <RateBuilderAddLinePanel
          addRateLine={calculator.addRateLine}
          pricing_block={pricing_block}
          draft_line={calculator.draft_line}
          updateDraftField={calculator.updateDraftField}
        />

        <RateBuilderResultPanel
          display_calculator_name={calculator.display_calculator_name}
          has_labour_rate_context={calculator.has_labour_rate_context}
          labour_breakdown={calculator.labour_breakdown}
          labour_charge_out_rate={calculator.labour_charge_out_rate}
          labour_job_charge={calculator.labour_job_charge}
          labour_minimum_recoverable_rate={
            calculator.labour_minimum_recoverable_rate
          }
          labour_per_hr_profit={calculator.labour_per_hr_profit}
          preview={calculator.preview}
          recovery_driver_quantity={calculator.recovery_driver_quantity}
          recovery_preview={calculator.recovery_preview}
          selected_cost_allocation_group={
            calculator.selected_cost_allocation_group
          }
          selected_group_asset_rate={calculator.selected_group_asset_rate}
          selected_asset_cost_summary={calculator.selected_asset_cost_summary}
          selected_group_labour_rate={calculator.selected_group_labour_rate}
          selected_group_overhead_rate={calculator.selected_group_overhead_rate}
          selected_group_recovery_rate={calculator.selected_group_recovery_rate}
        />
      </div>

      <RateBuilderChargeList
        is_locked={pricing_block.is_blocked}
        deleteRateLine={calculator.deleteRateLine}
        display_calculator_name={calculator.display_calculator_name}
        rate_lines={calculator.rate_lines}
        setOutputDriver={calculator.setOutputDriver}
        updateRateLine={calculator.updateRateLine}
      />
    </section>
  );
}
