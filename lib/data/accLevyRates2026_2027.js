// QS Tools — ACC Levy Rates Dataset (2026/2027)
// Source: ACC Levy Guidebook 2026/2027
// Purpose: searchable ACC Classification Unit / Work Levy rate source for Labour Module.
//
// IMPORTANT:
// This file is the stable data-source shell for ACC integration.
// The full ACC CU table should be pasted/imported into ACC_LEVY_RATES_2026_2027
// using the same object shape below.
//
// ACC calculation rule:
// acc_work_levy_annual = gross_wages_annual * (total_acc_rate / 100)
//
// ACC rates are expressed as dollars per $100 liable earnings.

export const ACC_LEVY_YEAR_2026_2027 = {
  source_name: "ACC Levy Guidebook 2026/2027",
  effective_from: "2026-04-01",
  effective_to: "2027-03-31",
  rate_basis: "per_100_liable_earnings",
  rate_basis_label: "$ per $100 liable earnings",
};

export const ACC_LEVY_RATE_FIELDS = {
  acc_cu_code: "ACC Classification Unit code",
  acc_cu_description: "ACC Classification Unit description",
  bic_code: "Business Industry Classification code",
  bic_description: "Business Industry Classification description",
  levy_risk_group: "ACC levy risk group",
  employer_work_levy_rate: "Employer Work levy rate",
  working_safer_levy_rate: "Working Safer levy rate",
  total_acc_rate: "Total ACC rate used by QS Tools",
};

// Full dataset placeholder.
// Keep this array data-only. Do not add calculations here.
export const ACC_LEVY_RATES_2026_2027 = [
  /*
  {
    acc_cu_code: "00000",
    acc_cu_description: "Example industry classification",
    bic_code: "A000000",
    bic_description: "Example BIC description",
    levy_risk_group: "000",
    employer_work_levy_rate: 0.00,
    working_safer_levy_rate: 0.00,
    total_acc_rate: 0.00,
  },
  */
];

export function get_acc_rate_by_cu(acc_cu_code) {
  if (!acc_cu_code) return null;

  return (
    ACC_LEVY_RATES_2026_2027.find(
      (rate) => String(rate.acc_cu_code) === String(acc_cu_code)
    ) || null
  );
}

export function build_acc_search_label(rate) {
  if (!rate) return "";

  return [
    rate.acc_cu_code,
    rate.acc_cu_description,
    rate.bic_code,
    rate.bic_description,
    `${rate.total_acc_rate} per $100`,
  ]
    .filter(Boolean)
    .join(" — ");
}

export function search_acc_rates(search_text) {
  const query = String(search_text || "").trim().toLowerCase();

  if (!query) return ACC_LEVY_RATES_2026_2027;

  return ACC_LEVY_RATES_2026_2027.filter((rate) => {
    const haystack = [
      rate.acc_cu_code,
      rate.acc_cu_description,
      rate.bic_code,
      rate.bic_description,
      rate.levy_risk_group,
      rate.total_acc_rate,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
