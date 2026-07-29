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

function formatPercent(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

function LabourAssignments({ assignments }) {
  if (!assignments || assignments.length === 0) return null;

  return (
    <div className="pl-8 pb-2 -mt-1">
      {assignments.map((assignment, index) => {
        const hasCharge = assignment.charged !== null;
        const profitColor = !hasCharge
          ? 'text-gray-400'
          : assignment.profitOrLoss >= 0
          ? 'text-green-600'
          : 'text-red-600';

        return (
          <div key={`${assignment.name}-${index}`} className="grid grid-cols-4 gap-2 text-xs text-gray-500 py-0.5">
            <span>{assignment.name}</span>
            <span>{formatCurrency(assignment.cost)}</span>
            <span>{hasCharge ? formatCurrency(assignment.charged) : 'No saved rate'}</span>
            <span className={profitColor}>{hasCharge ? formatCurrency(assignment.profitOrLoss) : '-'}</span>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, cost, charged, profitOrLoss, assignments }) {
  const hasCharge = charged !== null;
  const profitColor =
    !hasCharge ? 'text-gray-400' : profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <>
      <div className="grid grid-cols-4 gap-3 py-2 text-xs">
        <div className="text-gray-600 pl-4">{label}</div>
        <div className="text-gray-600">{formatCurrency(cost)}</div>
        <div className="text-gray-600">
          {hasCharge ? formatCurrency(charged) : <span className="text-gray-400">Not separately priced</span>}
        </div>
        <div className={`font-medium ${profitColor}`}>
          {hasCharge ? formatCurrency(profitOrLoss) : '-'}
        </div>
      </div>
      {assignments && <LabourAssignments assignments={assignments} />}
    </>
  );
}

function GroupDetail({ detail }) {
  if (!detail) return null;

  if (!detail.available) {
    return (
      <div className="pl-4 py-3 text-xs text-amber-600">
        {detail.unavailableReason}
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <div className="grid grid-cols-4 gap-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
        <div className="pl-4">Stream</div>
        <div>Cost</div>
        <div>Charged</div>
        <div>Profit/(Loss)</div>
      </div>
      <DetailRow
        label="Labour"
        cost={detail.labour.cost}
        charged={detail.labour.charged}
        profitOrLoss={detail.labour.profitOrLoss}
        assignments={detail.labour.assignments}
      />
      <DetailRow label="Asset" cost={detail.asset.cost} charged={detail.asset.charged} profitOrLoss={detail.asset.profitOrLoss} />
      <DetailRow label="Overhead" cost={detail.overhead.cost} charged={detail.overhead.charged} profitOrLoss={detail.overhead.profitOrLoss} />
    </div>
  );
}

function GroupRow({ row, isExpanded, onToggle }) {
  const hasCharge = row.charged !== null;
  const profitColor = !hasCharge ? 'text-gray-400' : row.isProfitable ? 'text-green-600' : 'text-red-600';
  const isDrillable = row.detail !== null;

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
          <div>
            <div className="font-medium text-gray-900 text-sm">{row.groupName}</div>
            {row.calculatorName && <div className="text-xs text-gray-400">{row.calculatorName}</div>}
          </div>
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
      {isDrillable && isExpanded && <GroupDetail detail={row.detail} />}
    </div>
  );
}

export default function BusinessOutcomeAssetSplit({ outcome }) {
  const { assetSplitRows, assetSplitTotals, assetSplitAllPriced } = outcome;
  const [expandedGroup, setExpandedGroup] = useState(null);

  if (!assetSplitRows || assetSplitRows.length === 0) {
    return (
      <div>
        <div className="text-sm font-semibold text-gray-900">
          Which asset-backed groups are actually profitable?
        </div>
        <div className="text-xs text-gray-500 mt-1">
          No asset-backed Cost Allocation operating groups found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-900">
          Which asset-backed groups are actually profitable?
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Whole-group cost (labour + asset + overhead) vs what that group's Rate Builder calculator charges. Click a group to see the Labour / Asset / Overhead split within it.
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 pb-2 border-b-2 border-gray-300 text-xs font-semibold text-gray-500 uppercase">
        <div>Operating Group</div>
        <div>Total Group Cost</div>
        <div>Total Charged</div>
        <div>Profit/(Loss)</div>
        <div>% of Revenue</div>
      </div>

      {assetSplitRows.map((row) => (
        <GroupRow
          key={row.groupId}
          row={row}
          isExpanded={expandedGroup === row.groupId}
          onToggle={() => setExpandedGroup(expandedGroup === row.groupId ? null : row.groupId)}
        />
      ))}

      <div className="grid grid-cols-5 gap-3 pt-3 mt-1 border-t-2 border-gray-300 font-bold text-sm text-gray-900">
        <div>Total{!assetSplitAllPriced ? ' (priced groups only)' : ''}</div>
        <div>{formatCurrency(assetSplitTotals.cost)}</div>
        <div>{formatCurrency(assetSplitTotals.charged)}</div>
        <div className={assetSplitTotals.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(assetSplitTotals.profitOrLoss)}
        </div>
        <div></div>
      </div>

      {!assetSplitAllPriced && (
        <div className="mt-3 text-xs text-amber-600">
          Totals exclude groups without a linked Rate Builder calculator.
        </div>
      )}
    </div>
  );
}
