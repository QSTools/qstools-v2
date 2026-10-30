// hooks/general-overheads/generalOverheadNudgeClassify.js
//
// R3 slice 3, batch 3 (Business Modelling brief, Addendum 8 item 6; Addendum 18 slice 3 items 1 and 6). The rule that decides, for ONE overhead row,
// which category a per-category nudge sees it in and whether the nudge may touch it. It reuses the General Overheads selectors so the nudge and the
// allocation screens can never disagree:
//   category = the row's EFFECTIVE category (a reclassified row follows its override), from get_effective_category_key.
//   eligible = NOT flagged as containing asset finance interest, and its effective allocation type is NOT an asset pool or asset finance interest
//              (those lines are already distributed to assets, Addendum 8 item 6, BM-2 rule R5).
// Pure: no hooks, no storage. Handed to apply_overhead_nudges (lib/calculations/generalOverheadNudge.js) by useGeneralOverheads.

import { ASSET_POOL_BY_ALLOCATION_TYPE } from "@/lib/selectors/general-overheads/generalOverheadDefinitions";
import { get_effective_category_key } from "@/lib/selectors/general-overheads/generalOverheadCategorySelectors";
import { get_effective_system_allocation_type } from "@/lib/selectors/general-overheads/generalOverheadAllocationSelectors";

export function classify_nudge_row(row, overhead_state) {
  const category_key = get_effective_category_key(row, overhead_state);
  const allocation_type = get_effective_system_allocation_type(row, overhead_state, category_key);
  const is_asset_row =
    row.is_asset_finance_interest === true ||
    allocation_type === "asset_finance_interest" ||
    Boolean(ASSET_POOL_BY_ALLOCATION_TYPE[allocation_type]);

  return { category_key, eligible: !is_asset_row };
}
