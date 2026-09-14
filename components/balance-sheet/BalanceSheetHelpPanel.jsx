"use client";

/**
 * BalanceSheetHelpPanel
 *
 * Static explanatory content for the Balance Sheet page's four ratios -
 * matches the "About Business Outcome" help panel pattern
 * (BusinessOutcomeTruthHelpPanel.jsx). Built 2026-09-12 after the user
 * flagged these figures aren't self-explanatory to most readers.
 */
export default function BalanceSheetHelpPanel() {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-card-title-sm">About these figures</div>
      <p className="ui-help">
        These four numbers come from your Balance Sheet - a snapshot of what the business owns and
        owes on a single date, not what it earned or spent over a period (that&apos;s the P&amp;L).
        They&apos;re standard measures lenders, accountants, and CFOs use to check whether a business
        can cover its near-term obligations, and how much of it is financed by debt versus the
        owner&apos;s own money.
      </p>
      <p className="ui-help">
        <strong>Working Capital</strong> is the simplest one - current assets minus current
        liabilities, in dollars. Positive means there&apos;s a cushion; negative means that if every
        short-term bill came due at once, there isn&apos;t enough in short-term assets to cover it.
      </p>
      <p className="ui-help">
        <strong>Current Ratio</strong> is the same comparison as a ratio instead of a dollar figure -
        current assets divided by current liabilities. Below 1.0 means liabilities exceed assets in
        the short term. A commonly cited comfortable range is roughly 1.5-2.0, though this varies a
        lot by industry.
      </p>
      <p className="ui-help">
        <strong>Quick Ratio</strong> is a stricter version of Current Ratio - it excludes prepayments,
        since money already spent on things like insurance can&apos;t be converted back to cash to pay
        a bill. A lower Quick Ratio than Current Ratio is expected, not a separate problem.
      </p>
      <p className="ui-help">
        <strong>Cash Ratio</strong> is the strictest liquidity measure - only cash and bank balances counted as
        Current Assets, divided by current liabilities. Not every business&apos;s Balance Sheet has a clean cash
        line under Current Assets (bank accounts sometimes sit under liabilities instead, such as an overdraft) -
        when that&apos;s the case here, this figure will show as not available rather than a misleading number.
      </p>
      <p className="ui-help">
        <strong>Debt to Equity</strong> compares total liabilities to total equity - how much of the
        business is financed by debt versus the owner&apos;s own capital. Higher means more reliance
        on debt. What counts as &quot;high&quot; varies significantly by industry - asset-heavy
        businesses (construction, manufacturing) often run higher than service or office-based ones.
      </p>
      <p className="ui-help">
        <strong>These figures describe what the numbers mean, not what to do about them.</strong> A
        low ratio or high leverage doesn&apos;t automatically mean a crisis - it depends on things a
        single snapshot doesn&apos;t show, like how quickly customers actually pay, or whether there&apos;s
        a credit facility backing a short-term gap. Worth discussing with whoever manages the books or
        your accountant before drawing conclusions.
      </p>
    </div>
  );
}