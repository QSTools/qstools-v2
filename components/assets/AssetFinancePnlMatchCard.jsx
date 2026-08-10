import {
  TableBlock,
  TableRow,
  formatMoney,
} from "@/components/cost-allocation/evidence/evidenceHelpers";

export default function AssetFinancePnlMatchCard({ asset_finance_pnl_match }) {
  const flagged_pnl_total = asset_finance_pnl_match?.flagged_pnl_total ?? 0;
  const matched_to_assets = asset_finance_pnl_match?.matched_to_assets ?? 0;
  const remaining = asset_finance_pnl_match?.remaining ?? 0;
  const match_status = asset_finance_pnl_match?.match_status ?? "not_applicable";

  if (match_status === "not_applicable") {
    return null;
  }

  const is_gap_present = match_status === "gap_present";
  const is_unflagged_mismatch =
    match_status === "unflagged_but_assets_has_interest";

  const heading = is_unflagged_mismatch
    ? "Likely misclassified P&L line"
    : is_gap_present
    ? "Some flagged P&L interest is still unmatched"
    : "Fully matched";

  const help_text = is_unflagged_mismatch
    ? "No P&L line is currently flagged as containing asset finance interest, but the assets entered above total real, confirmed interest cost. Check the P&L classification for this line - should it include asset finance / interest? Until this is corrected, this cost may be counted in full inside General Overheads as well as here, a genuine double-count."
    : is_gap_present
    ? "Check whether all financed assets are entered above, or whether the flagged P&L line includes other interest costs (e.g. an overdraft) alongside asset finance."
    : "Every dollar of the P&L's flagged asset finance interest line is accounted for by the assets entered above.";

  const panel_style = is_unflagged_mismatch
    ? { borderColor: "var(--danger)", background: "var(--danger-soft)" }
    : is_gap_present
    ? { borderColor: "var(--warning)", background: "var(--warning-soft)" }
    : undefined;

  return (
    <section className="ui-panel" style={panel_style}>
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Asset finance interest &mdash; P&amp;L match</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {heading}
          </h3>
          <p className="ui-help">{help_text}</p>
        </div>

        <TableBlock
          title="P&L match"
          help_text="Compares the P&L line(s) flagged as containing asset finance interest against the total interest cost of the assets entered here."
        >
          <TableRow
            label="P&L flagged total"
            value={formatMoney(flagged_pnl_total)}
          />
          <TableRow
            label="Matched to assets"
            value={formatMoney(matched_to_assets)}
          />
          <TableRow
            label="Remaining (unmatched)"
            value={formatMoney(remaining)}
            total
          />
        </TableBlock>
      </div>
    </section>
  );
}
