"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function build_grouped_rows(overhead_rows) {
  const rows = Array.isArray(overhead_rows) ? overhead_rows : [];

  const grouped_sections = [
    {
      group_key: "office_admin",
      title: "Office / Admin",
      row_keys: [
        "software_subscriptions",
        "internet_cost",
        "phone_system_cost",
        "office_supplies_cost",
        "general_admin_cost",
      ],
    },
    {
      group_key: "financial_admin",
      title: "Financial Admin",
      row_keys: ["accounting_fees", "bank_fees"],
    },
    {
      group_key: "insurance_compliance",
      title: "Insurance & Compliance",
      row_keys: [
        "public_liability_insurance",
        "professional_indemnity_insurance",
        "legal_fees",
      ],
    },
    {
      group_key: "vehicles_running",
      title: "Vehicles (Running)",
      row_keys: [
        "fuel_cost_annual",
        "vehicle_maintenance_cost_annual",
        "vehicle_repairs_cost_annual",
        "vehicle_registration_cost_annual",
        "vehicle_tyres_cost_annual",
        "vehicle_consumables_cost_annual",
      ],
    },
    {
      group_key: "facilities_premises",
      title: "Facilities / Premises",
      row_keys: ["office_rent", "power_cost"],
    },
    {
      group_key: "sales_growth",
      title: "Sales / Growth",
      row_keys: ["marketing_cost"],
    },
    {
      group_key: "other_unallocated",
      title: "Other / Unallocated",
      row_keys: ["other_general_overhead_cost"],
    },
  ];

  return grouped_sections.map((section) => {
    let section_rows = rows.filter((row) => section.row_keys.includes(row.key));

    if (section.group_key === "other_unallocated") {
      const custom_rows = rows.filter((row) => row.is_custom);
      section_rows = [...section_rows, ...custom_rows];
    }

    const subtotal_value = section_rows.reduce(
      (sum, row) => sum + to_number(row.amount),
      0
    );

    return {
      ...section,
      rows: section_rows,
      subtotal_value,
      subtotal_display: format_currency(subtotal_value),
    };
  });
}

function SummaryRow({ label, amount_display }) {
  return (
    <div className="labour-summary-table-row">
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{amount_display}</div>
    </div>
  );
}

export default function GeneralOverheadSummaryCard({
  total_general_overheads,
  total_general_overheads_display,
  overhead_rows,
  output_contract,
}) {
  const grouped_sections = build_grouped_rows(overhead_rows);

  return (
    <div className="ui-card ui-stack">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Summary</div>
        <div className="ui-card-title">General Overheads Summary</div>
        <p className="ui-help">
          Locked downstream total for Cost Summary consumption.
        </p>
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-label">Total General Overheads</div>
        <div className="ui-display">{total_general_overheads_display}</div>
      </div>

      <div className="ui-stack-sm">
        {grouped_sections.map((section) => (
          <CollapsibleSection
            key={section.group_key}
            title={section.title}
            summary={section.subtotal_display}
            defaultOpen={false}
          >
            <div className="ui-panel ui-stack-sm">
              {section.rows.length === 0 ? (
                <div className="ui-help">No items in this category yet.</div>
              ) : (
                <div className="labour-summary-table">
                  {section.rows.map((row) => (
                    <SummaryRow
                      key={row.key}
                      label={row.label}
                      amount_display={format_currency(row.amount)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
        ))}
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-label">Output Contract</div>
        <div className="ui-readonly">
          total_general_overheads = {format_currency(total_general_overheads)}
        </div>
        {output_contract?.overhead_rows ? (
          <div className="ui-help">
            {output_contract.overhead_rows.length} overhead rows included in the
            current output.
          </div>
        ) : null}
      </div>
    </div>
  );
}