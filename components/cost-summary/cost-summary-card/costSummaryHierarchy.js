import { toNumber } from "@/components/cost-summary/cost-summary-card/costSummaryFormatters";

function makeNode({ key, label, amount = 0, title, note, children = [] }) {
  return {
    key,
    label,
    title: title || label,
    amount: toNumber(amount),
    total: toNumber(amount),
    note,
    children,
    items: children,
  };
}

export function getNodeByPath(root, activePath = []) {
  return activePath.slice(1).reduce((node, key) => {
    return node?.children?.find((child) => child.key === key) ?? node;
  }, root);
}

export function getBreadcrumbNodes(root, activePath = []) {
  const nodes = [root];
  let node = root;

  for (const key of activePath.slice(1)) {
    const next = node?.children?.find((child) => child.key === key);
    if (!next) break;
    nodes.push(next);
    node = next;
  }

  return nodes;
}

export function buildCostSummaryHierarchy({
  total_cost_burden_annual,
  total_people_cost_annual,
  total_asset_cost_annual,
  total_asset_interest,
  total_business_overheads,
  labour_detail,
  asset_detail,
  overhead_detail,
}) {
  function buildContributionNodes(prefix, detail = {}) {
    return [
      makeNode({
        key: `${prefix}-kiwisaver`,
        label: "KiwiSaver",
        amount: detail.employer_kiwisaver_annual,
      }),
      makeNode({
        key: `${prefix}-esct`,
        label: "ESCT",
        amount: detail.esct_annual,
      }),
      makeNode({
        key: `${prefix}-acc`,
        label: "ACC",
        amount: detail.acc_levy_annual,
      }),
    ];
  }

  function buildEntitlementNodes(prefix, detail = {}) {
    return [
      makeNode({
        key: `${prefix}-annual-leave`,
        label: "Annual Leave",
        amount: detail.annual_leave_cost_annual,
      }),
      makeNode({
        key: `${prefix}-public-holidays`,
        label: "Public Holidays",
        amount: detail.public_holiday_cost_annual,
      }),
      makeNode({
        key: `${prefix}-sick-leave`,
        label: "Sick Leave",
        amount: detail.sick_leave_cost_annual,
      }),
      makeNode({
        key: `${prefix}-bereavement-leave`,
        label: "Bereavement Leave",
        amount: detail.bereavement_leave_cost_annual,
      }),
      makeNode({
        key: `${prefix}-family-violence-leave`,
        label: "Family Violence Leave",
        amount: detail.family_violence_leave_cost_annual,
      }),
    ];
  }

  function buildLabourClassNode(key, label, detail = {}) {
    return makeNode({
      key,
      label,
      amount: detail.total_labour_cost_annual,
      children: [
        makeNode({
          key: `${key}-base-wages`,
          label: "Base Wages",
          amount: detail.base_wages_annual,
        }),
        makeNode({
          key: `${key}-employer-contributions`,
          label: "Employer Contributions",
          amount: detail.employer_contribution_annual,
          children: buildContributionNodes(key, detail),
        }),
        makeNode({
          key: `${key}-entitlements`,
          label: "Entitlements",
          amount: detail.entitlements_annual,
          note: "Entitlement cost is separated from base wages here for review.",
          children: buildEntitlementNodes(key, detail),
        }),
      ],
    });
  }

  const running_cost_annual = toNumber(asset_detail.running_cost_annual);
  const asset_children = [
    makeNode({
      key: "asset-total-cost",
      label: "Total Asset Cost",
      amount: total_asset_cost_annual,
    }),
    makeNode({
      key: "asset-finance-interest",
      label: "Asset Finance Interest",
      amount: total_asset_interest,
      note: "Supporting detail only. This is already included inside Asset Cost where applicable.",
    }),
  ];

  if (running_cost_annual > 0) {
    asset_children.push(
      makeNode({
        key: "asset-running-cost",
        label: "Running Cost",
        amount: running_cost_annual,
        note: "Legacy display only where upstream Assets exposes running cost.",
      })
    );
  }

  const category_totals = Array.isArray(overhead_detail.category_totals)
    ? overhead_detail.category_totals
    : [];
  const overhead_children = category_totals
    .filter((category) => toNumber(category?.total) > 0)
    .map((category) =>
      makeNode({
        key: `overheads-${category.category_id}`,
        label: category.category_name || category.category_id,
        amount: category.total,
      })
    );

  if (overhead_children.length === 0) {
    overhead_children.push(
      makeNode({
        key: "general-overheads-total",
        label: "Total General Overheads",
        amount: total_business_overheads,
        note: "Future-ready: category-level overhead outputs are not available in this Cost Summary view.",
      })
    );
  }

  return makeNode({
    key: "total",
    label: "Total Cost",
    title: "Where your business cost comes from",
    amount: total_cost_burden_annual,
    children: [
      makeNode({
        key: "people",
        label: "People Cost",
        title: "People cost breakdown",
        amount: total_people_cost_annual,
        children: [
          buildLabourClassNode(
            "productive-labour",
            "Productive Labour",
            labour_detail.productive
          ),
          buildLabourClassNode(
            "non-productive-labour",
            "Non-productive Labour",
            labour_detail.non_productive
          ),
        ],
      }),
      makeNode({
        key: "assets",
        label: "Assets",
        title: "Asset cost breakdown",
        amount: total_asset_cost_annual,
        children: asset_children,
      }),
      makeNode({
        key: "overheads",
        label: "General Overheads",
        title: "General overhead breakdown",
        amount: total_business_overheads,
        children: overhead_children,
      }),
    ],
  });
}
