"use client";

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
          ? 'text-[var(--text-muted)]'
          : assignment.profitOrLoss >= 0
          ? 'text-[var(--success)]'
          : 'text-[var(--danger)]';

        return (
          <div key={`${assignment.name}-${index}`} className="grid grid-cols-4 gap-2 text-xs text-[var(--text-muted)] py-0.5">
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
    !hasCharge ? 'text-[var(--text-muted)]' : profitOrLoss >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]';

  return (
    <>
      <div className="grid grid-cols-4 gap-3 py-2 text-xs">
        <div className="text-[var(--text-secondary)] pl-4">{label}</div>
        <div className="text-[var(--text-secondary)]">{formatCurrency(cost)}</div>
        <div className="text-[var(--text-secondary)]">
          {hasCharge ? formatCurrency(charged) : <span className="text-[var(--text-muted)]">Not separately priced</span>}
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
      <div className="pl-4 py-3 text-xs text-[var(--warning)]">
        {detail.unavailableReason}
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-[var(--border-primary)]">
      <div className="grid grid-cols-4 gap-3 pb-1 text-xs font-semibold text-[var(--text-muted)] uppercase">
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
  const profitColor = !hasCharge ? 'text-[var(--text-muted)]' : row.isProfitable ? 'text-[var(--success)]' : 'text-[var(--danger)]';
  const isDrillable = row.detail !== null;

  return (
    <div className="border-b border-[var(--border-primary)]">
      <div
        className={`grid grid-cols-5 gap-3 py-3 items-center ${isDrillable ? 'cursor-pointer hover:bg-[var(--bg-hover)]' : ''}`}
        onClick={isDrillable ? onToggle : undefined}
      >
        <div className="flex items-center gap-1.5">
          {isDrillable && (
            <span className="text-[var(--text-muted)] text-xs w-3 inline-block">{isExpanded ? '▾' : '▸'}</span>
          )}
          <div>
            <div className="font-medium text-[var(--text-primary)] text-sm">{row.groupName}</div>
            {row.calculatorName && <div className="text-xs text-[var(--text-muted)]">{row.calculatorName}</div>}
          </div>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">{formatCurrency(row.cost)}</div>
        <div className="text-sm text-[var(--text-secondary)]">
          {hasCharge ? formatCurrency(row.charged) : (
            <span className="text-[var(--warning)] text-xs">{row.reason || 'Not available'}</span>
          )}
        </div>
        <div className={`text-sm font-medium ${profitColor}`}>
          {hasCharge ? formatCurrency(row.profitOrLoss) : '-'}
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {hasCharge ? formatPercent(row.percentOfRevenue) : '-'}
        </div>
      </div>
      {isDrillable && isExpanded && <GroupDetail detail={row.detail} />}
    </div>
  );
}

function ReconciliationRow({ row }) {
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${row.isTotal ? 'font-bold border-t border-[var(--border-strong)] mt-1 pt-2' : ''}`}>
      <span className={row.isTotal ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
        {row.label}
        {row.note && <span className="text-xs text-[var(--text-muted)] ml-1">({row.note})</span>}
      </span>
      <span className={row.isTotal ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>{formatCurrency(row.value)}</span>
    </div>
  );
}

export default function BusinessOutcomeAssetSplit({ outcome }) {
  const {
    assetSplitRows,
    assetSplitTotals,
    assetSplitAllPriced,
    assetReconciliationRows,
    assetReconciles,
  } = outcome;

  const [expandedGroup, setExpandedGroup] = useState(null);

  if (!assetSplitRows || assetSplitRows.length === 0) {
    return (
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          Which asset-backed groups are actually profitable?
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          No asset-backed Cost Allocation operating groups found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          Which asset-backed groups are actually profitable?
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">
          Whole-group cost (labour + asset + overhead) vs what that group's Rate Builder calculator charges. Click a group to see the Labour / Asset / Overhead split within it.
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 pb-2 border-b-2 border-[var(--border-strong)] text-xs font-semibold text-[var(--text-muted)] uppercase">
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

      <div className="grid grid-cols-5 gap-3 pt-3 mt-1 border-t-2 border-[var(--border-strong)] font-bold text-sm text-[var(--text-primary)]">
        <div>Total{!assetSplitAllPriced ? ' (priced groups only)' : ''}</div>
        <div>{formatCurrency(assetSplitTotals.cost)}</div>
        <div>{formatCurrency(assetSplitTotals.charged)}</div>
        <div className={assetSplitTotals.profitOrLoss >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
          {formatCurrency(assetSplitTotals.profitOrLoss)}
        </div>
        <div></div>
      </div>

      {!assetSplitAllPriced && (
        <div className="mt-3 text-xs text-[var(--warning)]">
          Totals exclude groups without a linked Rate Builder calculator.
        </div>
      )}

      {assetReconciliationRows.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--border-primary)]">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">
            Full Asset Cost Reconciliation
          </div>
          {assetReconciliationRows.map((row) => (
            <ReconciliationRow key={row.id} row={row} />
          ))}
          <div className="text-xs mt-2">
            {assetReconciles ? (
              <span className="text-[var(--success)]">✓ Matches the pressure map's total asset cost above.</span>
            ) : (
              <span className="text-[var(--danger)] font-medium">⚠ Does not match the pressure map's total asset cost - see warnings.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

