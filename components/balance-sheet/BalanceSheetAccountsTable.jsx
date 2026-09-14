"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  const sign = Number(value) < 0 ? "-" : "";
  const abs = Math.abs(Number(value));
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

const SECTION_LABELS = {
  assets: "Assets",
  liabilities: "Liabilities",
  equity: "Equity",
};

const SECTION_TOTAL_KEYS = {
  assets: "total_assets",
  liabilities: "total_liabilities",
  equity: "total_equity",
};

const SUBSECTION_TOTAL_KEY_MAP = {
  "current assets": "total_current_assets",
  "fixed assets": "total_fixed_assets",
  "current liabilities": "total_current_liabilities",
  "non-current liabilities": "total_non_current_liabilities",
};

function group_accounts(accounts) {
  const sections = { assets: [], liabilities: [], equity: [] };

  (accounts || []).forEach((account) => {
    if (sections[account.section]) {
      sections[account.section].push(account);
    }
  });

  const grouped = {};
  for (const [section_key, rows] of Object.entries(sections)) {
    const subsections = new Map();
    rows.forEach((row) => {
      const key = row.subsection || "";
      if (!subsections.has(key)) subsections.set(key, []);
      subsections.get(key).push(row);
    });
    grouped[section_key] = subsections;
  }

  return grouped;
}

/**
 * BalanceSheetAccountsTable
 *
 * Full account-by-account breakdown, grouped by section (Assets/
 * Liabilities/Equity) then subsection (Current Assets, Fixed Assets,
 * etc.), with subtotal and total rows read directly from the importer's
 * totals object (not re-derived by summing - same "trust Xero's own
 * totals, reconcile separately" principle as the importer's docstring).
 * Reuses business-outcome-ledger-table/-row classes.
 */
export default function BalanceSheetAccountsTable({ accounts, totals }) {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  const grouped = group_accounts(accounts);

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Full Balance Sheet</div>
      {["assets", "liabilities", "equity"].map((section_key) => {
        const subsections = grouped[section_key];
        if (!subsections || subsections.size === 0) return null;

        return (
          <div key={section_key} className="business-outcome-ledger-table" style={{ marginBottom: "1rem" }}>
            <div className="business-outcome-ledger-row business-outcome-ledger-header">
              <span>{SECTION_LABELS[section_key]}</span>
              <span />
            </div>
            {Array.from(subsections.entries()).map(([subsection_name, rows]) => {
              const subsection_total_key = SUBSECTION_TOTAL_KEY_MAP[subsection_name.toLowerCase()];
              const subsection_total = subsection_total_key ? totals?.[subsection_total_key] : null;

              if (!subsection_name) {
                const section_total = totals?.[SECTION_TOTAL_KEYS[section_key]];
                return (
                  <CollapsibleSection
                    key={`${section_key}-ungrouped`}
                    title={SECTION_LABELS[section_key]}
                    summary={
                      section_total !== null && section_total !== undefined
                        ? format_currency(section_total)
                        : null
                    }
                    defaultOpen={false}
                  >
                    {rows.map((account, index) => (
                      <div className="business-outcome-ledger-row" key={`${account.account_name}-${index}`}>
                        <span>{account.account_name}</span>
                        <span>{format_currency(account.amount)}</span>
                      </div>
                    ))}
                  </CollapsibleSection>
                );
              }

              return (
                <CollapsibleSection
                  key={subsection_name}
                  title={subsection_name}
                  summary={
                    subsection_total !== null && subsection_total !== undefined
                      ? format_currency(subsection_total)
                      : null
                  }
                  defaultOpen={false}
                >
                  {rows.map((account, index) => (
                    <div className="business-outcome-ledger-row" key={`${account.account_name}-${index}`}>
                      <span>{account.account_name}</span>
                      <span>{format_currency(account.amount)}</span>
                    </div>
                  ))}
                </CollapsibleSection>
              );
            })}
            {totals?.[SECTION_TOTAL_KEYS[section_key]] !== undefined && (
              <div className="business-outcome-ledger-row business-outcome-ledger-true-total">
                <span>Total {SECTION_LABELS[section_key]}</span>
                <span>{format_currency(totals[SECTION_TOTAL_KEYS[section_key]])}</span>
              </div>
            )}
          </div>
        );
      })}
      {totals?.net_assets !== undefined && (
        <div className="business-outcome-ledger-row business-outcome-ledger-true-total">
          <span>Net Assets</span>
          <span>{format_currency(totals.net_assets)}</span>
        </div>
      )}
    </div>
  );
}