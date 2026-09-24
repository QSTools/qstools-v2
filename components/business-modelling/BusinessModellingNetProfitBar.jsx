// components/business-modelling/BusinessModellingNetProfitBar.jsx
// Today (real, never mutated) vs Modelled vs Change. With no levers set,
// Modelled equals Today and Change is $0.
import { formatMoney, formatSignedMoney } from "@/components/business-modelling/businessModellingFormat";

function Line({ label, value, tone }) {
  return (
    <div className="ui-row-between">
      <span className="theme-text-secondary">{label}</span>
      <span className={"ui-collapsible-value " + tone}>{value}</span>
    </div>
  );
}

export default function BusinessModellingNetProfitBar({ today, modelled, change }) {
  const tone = (v) => (Number(v) >= 0 ? "value-good" : "value-bad");
  return (
    <div className="ui-section-muted ui-stack-sm">
      <Line label="Today - real net profit" value={formatMoney(today)} tone={tone(today)} />
      <Line label="Modelled net profit" value={formatMoney(modelled)} tone={tone(modelled)} />
      <Line label="Change from your changes" value={formatSignedMoney(change)} tone={tone(change)} />
    </div>
  );
}