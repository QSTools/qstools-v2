import { calculateRateBuilderQuotePreview } from '@/lib/calculations/rateBuilderCalculations';

function getRecoveryDriverQuantity(lineTotals, outputDriverQuantity) {
  const timeLineQuantity = lineTotals
    .filter((line) => line.type === 'time')
    .reduce((total, line) => total + Number(line.quantity || 0), 0);

  return timeLineQuantity > 0 ? timeLineQuantity : outputDriverQuantity;
}

function getLabourAssignmentName(assignment = {}) {
  return (
    assignment.staff_type_name ||
    assignment.labour_type_label ||
    assignment.labour_type_name ||
    'Productive labour group'
  );
}

// Same normalisation Cost Allocation's own
// costAllocationLabourAdapter.js uses (normalise_key) - lowercase,
// strip non-alphanumeric, trim underscores. Used here to join staff
// types by NAME rather than by ID, since the two systems generate
// their IDs differently and cannot be reliably matched by ID alone.
function normaliseNameKey(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildLabourAssignments(group = {}, chargeRowByName) {
  const assignments = Array.isArray(group?.labour_group_assignments)
    ? group.labour_group_assignments
    : [];

  return assignments
    .map((assignment) => {
      const name = getLabourAssignmentName(assignment);
      const cost = Number(assignment?.assigned_cost || 0);
      const hours = Number(assignment?.assigned_hours || 0);
      const nameKey = normaliseNameKey(name);
      const chargeRow = nameKey ? chargeRowByName.get(nameKey) : null;
      const hasRate = chargeRow?.has_rate === true;
      const rate = hasRate ? Number(chargeRow.current_charge_out_rate || 0) : null;
      const charged = hasRate ? rate * hours : null;

      return {
        name,
        cost,
        hours,
        rate,
        charged,
        profitOrLoss: hasRate ? charged - cost : null,
      };
    })
    .filter((row) => row.cost > 0 || row.hours > 0)
    .sort((left, right) => right.cost - left.cost);
}

/**
 * calculateOperatingGroupSplit
 *
 * One calculation, covering ALL Cost Allocation operating groups.
 */
export function calculateOperatingGroupSplit({
  calculators = [],
  operationalGroupCostRows = [],
  totalRevenue = 0,
  labourChargeOutRate = null,
  weightedSummaryRows = [],
}) {
  const hasLabourRate = labourChargeOutRate !== null && labourChargeOutRate > 0;

  // Keyed by normalised NAME, not labour_source_type_id - see note
  // above on why ID matching across Cost Allocation and Rate Builder
  // is unreliable.
  const chargeRowByName = new Map(
    weightedSummaryRows.map((row) => [
      normaliseNameKey(row.labour_source_type_name),
      row,
    ])
  );

  const rows = operationalGroupCostRows.map((group) => {
    const groupId = group?.group_id || '';
    const groupName = group?.group_name || 'Operating group';
    const totalGroupCost = Number(group?.total_group_cost || 0);
    const groupRecoveryHours = Number(group?.group_recovery_hours || 0);
    const assignedLabourCost = Number(group?.assigned_labour_cost || 0);
    const assignedAssetCost = Number(group?.assigned_asset_burden || 0);
    const assignedOverheadCost = Number(group?.assigned_overhead_amount || 0);
    const hasLabour = assignedLabourCost > 0;
    const hasAsset = assignedAssetCost > 0;
    const labourAssignments = buildLabourAssignments(group, chargeRowByName);

    // S18 6.4 - per-group non-productive cost, cost only, no charge
    // concept (never charged out). Sourced from Cost Allocation's
    // operational_group_cost_rows, which already carries these fields
    // as of S18 6.1/6.2 - this is purely reading data that was already
    // flowing through here and being ignored, not a new calculation.
    // Placed in `base` (not `detail`) so it is present on every row
    // shape returned below, including the early-return "unavailable"
    // branches - a Management-style group with only non-productive
    // labour and no productive capacity would otherwise fall into one
    // of those early branches and lose this data entirely.
    const nonProductiveLabourCost = Number(
      group?.assigned_non_productive_labour_cost || 0
    );
    const nonProductiveAssetCost = Number(
      group?.assigned_non_productive_asset_cost || 0
    );

    const calculator = calculators.find(
      (calc) => calc?.linked_cost_allocation_group_id === groupId
    );

    const base = {
      groupId,
      groupName,
      totalGroupCost,
      hasLabour,
      hasAsset,
      nonProductiveLabourCost,
      nonProductiveAssetCost,
      calculatorName: calculator?.name || null,
      hasCalculator: Boolean(calculator?.lines?.length),
    };

    if (!calculator || !Array.isArray(calculator.lines) || calculator.lines.length === 0) {
      if (hasAsset) {
        return {
          ...base,
          totalCharged: null,
          profitOrLoss: null,
          percentOfRevenue: null,
          reason: 'No Rate Builder calculator linked to this group',
          detail: null,
        };
      }

      if (!hasLabourRate || groupRecoveryHours <= 0) {
        return {
          ...base,
          totalCharged: null,
          profitOrLoss: null,
          percentOfRevenue: null,
          reason: !hasLabourRate
            ? 'Labour charge-out rate not available'
            : 'Group recovery hours not set',
          detail: null,
        };
      }

      const labourChargedAnnual = labourChargeOutRate * groupRecoveryHours;
      const totalCharged = labourChargedAnnual;
      const profitOrLoss = totalCharged - totalGroupCost;
      const percentOfRevenue = totalRevenue > 0 ? (totalCharged / totalRevenue) * 100 : null;

      return {
        ...base,
        totalCharged,
        profitOrLoss,
        percentOfRevenue,
        reason: null,
        detail: {
          labour: {
            cost: assignedLabourCost,
            charged: labourChargedAnnual,
            profitOrLoss: labourChargedAnnual - assignedLabourCost,
            rate: labourChargeOutRate,
            assignments: labourAssignments,
          },
          asset: { cost: assignedAssetCost, charged: 0, profitOrLoss: -assignedAssetCost },
          overhead: { cost: assignedOverheadCost, charged: null, profitOrLoss: null },
          available: true,
        },
      };
    }

    const preview = calculateRateBuilderQuotePreview(calculator.lines);
    const recoveryDriverQuantity = getRecoveryDriverQuantity(
      preview.line_totals,
      preview.output_driver_quantity
    );

    if (recoveryDriverQuantity <= 0 || groupRecoveryHours <= 0) {
      return {
        ...base,
        totalCharged: null,
        profitOrLoss: null,
        percentOfRevenue: null,
        reason: 'Calculator or group recovery hours not set',
        detail: null,
      };
    }

    const blendedRate = preview.total_charge / recoveryDriverQuantity;
    const totalCharged = blendedRate * groupRecoveryHours;
    const profitOrLoss = totalCharged - totalGroupCost;
    const percentOfRevenue = totalRevenue > 0 ? (totalCharged / totalRevenue) * 100 : null;

    let detail = null;

    if (hasLabourRate) {
      const labourChargedAnnual = labourChargeOutRate * groupRecoveryHours;
      const assetChargedAnnual = totalCharged - labourChargedAnnual;

      detail = {
        labour: {
          cost: assignedLabourCost,
          charged: labourChargedAnnual,
          profitOrLoss: labourChargedAnnual - assignedLabourCost,
          rate: labourChargeOutRate,
          assignments: labourAssignments,
        },
        asset: {
          cost: assignedAssetCost,
          charged: assetChargedAnnual,
          profitOrLoss: assetChargedAnnual - assignedAssetCost,
        },
        overhead: {
          cost: assignedOverheadCost,
          charged: null,
          profitOrLoss: null,
        },
        available: true,
      };
    } else {
      detail = {
        labour: { cost: assignedLabourCost, charged: null, profitOrLoss: null, rate: null, assignments: labourAssignments },
        asset: { cost: assignedAssetCost, charged: null, profitOrLoss: null },
        overhead: { cost: assignedOverheadCost, charged: null, profitOrLoss: null },
        available: false,
        unavailableReason: 'Labour charge-out rate not available - cannot split Labour from Asset within this group',
      };
    }

    return {
      ...base,
      totalCharged,
      profitOrLoss,
      percentOfRevenue,
      reason: null,
      detail,
    };
  });

  return {
    rows: rows.sort((left, right) => left.groupName.localeCompare(right.groupName)),
    totalRevenue,
  };
}