"use client";

export default function RevenueRealityMainCard({
  formatted = {},
  hero_message = "",
  is_hours_based = true,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Margin stress test</div>
            <h1 className="ui-card-title">
              What your GP actually leaves behind
            </h1>
            <p className="ui-help">
              Your P&amp;L GP is tested after labour is paid.
            </p>
          </div>

          <div className="ui-readonly">
            <div className="ui-stack-sm">
              <div className="ui-kicker">
                Stress-tested Margin after Labour
              </div>
              <div className="text-3xl font-semibold text-[var(--text-primary)]">
                {formatted.stress_tested_margin_after_labour}
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {hero_message}
              </p>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">What this reveals</div>
              <h2 className="ui-card-title-sm">
                Cross-subsidy reality check
              </h2>
              <p className="ui-help">
                {is_hours_based
                  ? "This test shows whether material margin is being used to support labour. In an hours-based business, labour should stand on its own. If labour consumes most or all of GP, the business may be relying on material margin to hide labour under-recovery."
                  : "In a product/unit-based business, margin after COGS must carry the whole business. This test shows how much product margin remains after labour before assets, overheads, and profit."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
