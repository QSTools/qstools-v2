// components/business-modelling/BusinessModellingLeverPanel.jsx
// v6.0 Business Modelling redesign - the chain in order: overheads > labour
// > assets and materials margin. Receives the whole
// useBusinessModellingLevers() result as `model`. Display only.
import BusinessModellingNetProfitBar from "@/components/business-modelling/BusinessModellingNetProfitBar";
import BusinessModellingSourceRow from "@/components/business-modelling/BusinessModellingSourceRow";

export default function BusinessModellingLeverPanel({ model }) {
  if (!model?.available) {
    return (
      <section className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Model a change</div>
        <p className="ui-help">Waiting for Business Outcome figures...</p>
      </section>
    );
  }

  const { rows, levers, effects, today_net_profit, modelled_net_profit, total_effect, setLever, resetLevers } = model;
  const overheads = rows.filter((r) => r.kind === "overhead");
  const labour = rows.filter((r) => r.kind === "staff");
  const assets_and_materials = rows.filter((r) => r.kind === "unit" || r.kind === "assets" || r.kind === "materials");
  const has_changes = Object.keys(levers).length > 0;

  const render_row = (row) => (
    <BusinessModellingSourceRow
      key={row.row_id}
      row={row}
      value={levers[row.row_id]}
      effect={effects[row.row_id]}
      onChange={setLever}
    />
  );

  return (
    <section className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Model a change</div>
      <BusinessModellingNetProfitBar today={today_net_profit} modelled={modelled_net_profit} change={total_effect} />
      <p className="ui-help">
        Every source starts at what it actually achieves today. Change one and only that source moves - everything else
        stays exactly where it is. Breakeven is the rate that covers that source&apos;s own full cost. The entered rate is
        what your rates say, not a cap.
      </p>

      <div className="ui-card-title-sm">1. Overheads</div>
      {overheads.length > 0 ? (
        overheads.map(render_row)
      ) : (
        <p className="ui-help">No overhead categories found.</p>
      )}

      <div className="ui-card-title-sm">2. Labour</div>
      {labour.map(render_row)}

      <div className="ui-card-title-sm">3. Assets and materials margin</div>
      {assets_and_materials.map(render_row)}

      {has_changes ? (
        <button type="button" className="ui-button-primary" onClick={resetLevers}>
          Clear all changes
        </button>
      ) : null}
    </section>
  );
}