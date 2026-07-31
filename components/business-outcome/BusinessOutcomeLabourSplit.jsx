'use client';

import { useState } from 'react';

function formatCurrency(value) {
  if (value === null || value === undefined) return 'N/A';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

function formatRate(value) {
  if (value === null || value === undefined) return 'N/A';
  return `$${value.toFixed(2)}/hr`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

function AssignmentDetail({ assignments }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="pl-4 py-3 text-xs text-gray-400">
        No staff type assignment detail available for this group.
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <div className="grid grid-cols-5 gap-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
        <div className="pl-4">Staff Type</div>
        <div>Cost</div>
        <div>Rate</div>
        <div>Charged</div>
        <div>Profit/(Loss)</div>
      </div>
      {assignments.map((assignment, index) => {
        const hasCharge = assignment.charged !== null;
        const profitColor = !hasCharge
          ? 'text-gray-400'
          : assignment.profitOrLoss >= 0
          ? 'text-green-600'
          : 'text-red-600';

        return (
          <div key={`${assignment.name}-${index}`} className="grid grid-cols-5 gap-3 py-2 text-xs">
            <div className="text-gray-700 pl-4">{assignment.name}</div>
            <div className="text-gray-600">{formatCurrency(assignment.cost)}</div>
            <div className="text-gray-600">
              {assignment.rate !== null ? formatRate(assignment.rate) : <span className="text-gray-400">No saved rate</span>}
            </div>
            <div className="text-gray-600">
              {hasCharge ? formatCurrency(assignment.charged) : '-'}
            </div>
            <div className={`font-medium ${profitColor}`}>
              {hasCharge ? formatCurrency(assignment.profitOrLoss) : '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupRow({ row, isExpanded, onToggle }) {
  const hasCharge = row.charged !== null;
  const profitColor = !hasCharge ? 'text-gray-400' : row.isProfitable ? 'text-green-600' : 'text-red-600';
  const isDrillable = row.assignments && row.assignments.length > 0;

  return (
    <div className="border-b border-gray-200">
      <div
        className={`grid grid-cols-5 gap-3 py-3 items-center ${isDrillable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
        onClick={isDrillable ? onToggle : undefined}
      >
        <div className="flex items-center gap-1.5">
          {isDrillable && (
            <span className="text-gray-400 text-xs w-3 inline-block">{isExpanded ? '▾' : '▸'}</span>
          )}
          <div className="font-medium text-gray-900 text-sm">{row.groupName}</div>
        </div>
        <div className="text-sm text-gray-600">{formatCurrency(row.cost)}</div>
        <div className="text-sm text-gray-600">
          {hasCharge ? formatCurrency(row.charged) : (
            <span className="text-amber-600 text-xs">{row.reason || 'Not available'}</span>
          )}
        </div>
        <div className={`text-sm font-medium ${profitColor}`}>
          {hasCharge ? formatCurrency(row.profitOrLoss) : '-'}
        </div>
        <div className="text-sm text-gray-600">
          {hasCharge ? formatPercent(row.percentOfRevenue) : '-'}
        </div>
      </div>
      {isDrillable && isExpanded && <AssignmentDetail assignments={row.assignments} />}
    </div>
  );
}

function ReconciliationRow({ row }) {
  return (
    <div className={`grid grid-cols-3 gap-3 py-1.5 text-sm ${row.isTotal ? 'font-bold border-t border-gray-300 mt-1 pt-2' : ''}`}>
      <span className={row.isTotal ? 'text-gray-900' : 'text-gray-600'}>
        {row.label}
        {row.note && <span className="text-xs text-gray-400 ml-1">({row.note})</span>}
      </span>
      <span className={row.isTotal ? 'text-gray-900' : 'text-gray-700'}>{formatCurrency(row.cost)}</span>
      <span className={row.isTotal ? 'text-gray-900' : 'text-gray-700'}>
        {row.charged !== null ? formatCurrency(row.charged) : <span className="text-amber-600 text-xs font-normal">Pending</span>}
      </span>
    </div>
  );
}

export default function BusinessOutcomeLabourSplit({ outcome }) {
  const {
    labourSplitRows,
    labourSplitTotals,
    labourSplitAllPriced,
    labourChargeOutRateApplied,
    labourReconciliationRows,
    labourReconciles,
    labourChargedReconciles,
  } = outcome;

  const [expandedGroup, setExpandedGroup] = useState(null);

  if (!labourSplitRows || labourSplitRows.length === 0) {
    return (
      <div>
        <div className="text-sm font-semibold text-gray-900">
          Which labour-carrying groups are actually profitable?
        </div>
        <div className="text-xs text-gray-500 mt-1">
          No Cost Allocation operating groups with labour assigned were found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-900">
          Which labour-carrying groups are actually profitable?
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Labour-only groups shown here (no assets). Groups with both labour and assets appear under Assets, with their labour visible in that group's own breakdown. Click a group to see each staff type's own rate, charge, and profit within it.
        </div>
        {labourChargeOutRateApplied !== null && (
          <div className="text-xs text-gray-400 mt-1">
            Applying blended labour charge-out rate: {formatRate(labourChargeOutRateApplied)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3 pb-2 border-b-2 border-gray-300 text-xs font-semibold text-gray-500 uppercase">
        <div>Operating Group</div>
        <div>Labour Cost</div>
        <div>Labour Charged</div>
        <div>Profit/(Loss)</div>
        <div>% of Revenue</div>
      </div>

      {labourSplitRows.map((row) => (
        <GroupRow
          key={row.groupId}
          row={row}
          isExpanded={expandedGroup === row.groupId}
          onToggle={() => setExpandedGroup(expandedGroup === row.groupId ? null : row.groupId)}
        />
      ))}

      <div className="grid grid-cols-5 gap-3 pt-3 mt-1 border-t-2 border-gray-300 font-bold text-sm text-gray-900">
        <div>Total{!labourSplitAllPriced ? ' (priced groups only)' : ''}</div>
        <div>{formatCurrency(labourSplitTotals.cost)}</div>
        <div>{formatCurrency(labourSplitTotals.charged)}</div>
        <div className={labourSplitTotals.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(labourSplitTotals.profitOrLoss)}
        </div>
        <div></div>
      </div>

      {!labourSplitAllPriced && (
        <div className="mt-3 text-xs text-amber-600">
          Totals exclude groups that could not be priced (missing rate data).
        </div>
      )}

      {labourReconciliationRows.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Full Labour Reconciliation
          </div>
          <div className="grid grid-cols-3 gap-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
            <div></div>
            <div>Cost</div>
            <div>Charged</div>
          </div>
          {labourReconciliationRows.map((row) => (
            <ReconciliationRow key={row.id} row={row} />
          ))}
          <div className="text-xs mt-2 space-y-1">
            <div>
              {labourReconciles ? (
                <span className="text-green-600">✓ Cost matches the pressure map's total labour cost above.</span>
              ) : (
                <span className="text-red-600 font-medium">⚠ Cost does not match the pressure map's total labour cost - see warnings.</span>
              )}
            </div>
            <div>
              {labourChargedReconciles === true && (
                <span className="text-green-600">✓ Total Labour Charged matches Rate Builder's own Model Capacity figure above.</span>
              )}
              {labourChargedReconciles === false && (
                <span className="text-red-600 font-medium">⚠ Total Labour Charged does not match Rate Builder's Model Capacity figure - see warnings.</span>
              )}
              {labourChargedReconciles === null && (
                <span className="text-gray-400">Total Labour Charged cross-check pending - not all groups are priced yet.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
