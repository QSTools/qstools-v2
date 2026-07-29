'use client';

import { useState } from 'react';
import BusinessOutcomeLabourSplit from '@/components/business-outcome/BusinessOutcomeLabourSplit';
import BusinessOutcomeAssetSplit from '@/components/business-outcome/BusinessOutcomeAssetSplit';

function formatCurrency(value) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(value);
}

function PressureRow({ row, isDrillable, isExpanded, onToggle }) {
  const statusColor =
    row.status === 'pressure' || row.status === 'unrecovered' || row.status === 'asset_recovery_pressure'
      ? 'text-amber-600'
      : 'text-green-600';

  return (
    <div
      className={`grid grid-cols-5 gap-4 py-3 border-b border-gray-100 items-center ${
        isDrillable ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={isDrillable ? onToggle : undefined}
    >
      <div className="font-medium text-gray-900 flex items-center gap-1.5">
        {isDrillable && (
          <span className="text-gray-400 text-xs w-3 inline-block">
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
        {row.stream}
      </div>
      <div className="text-sm text-gray-600">{formatCurrency(row.cost)}</div>
      <div className="text-sm text-gray-600">
        {row.modelCapacity !== null ? formatCurrency(row.modelCapacity) : 'Not available'}
        {row.modelCapacityNote && (
          <div className="text-xs text-gray-400">{row.modelCapacityNote}</div>
        )}
      </div>
      <div className="text-sm text-gray-600">
        {row.gap !== null ? formatCurrency(row.gap) : '-'}
      </div>
      <div className={`text-sm font-medium ${statusColor}`}>{row.flag}</div>
    </div>
  );
}

export default function BusinessOutcomeMainCard({ outcome }) {
  const { pressureRows, primaryPressureSource, structureConfidence } = outcome;
  const [expandedStream, setExpandedStream] = useState(null);

  const pressureSourceLabel = {
    labour: 'Labour',
    overhead: 'Overheads',
    asset: 'Assets',
    combined_labour_overhead: 'Labour & Overheads (combined)',
  }[primaryPressureSource] || 'None identified';

  const drillableStreams = ['Labour', 'Assets'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
      {/* Headline */}
      <div>
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Where is the pressure?
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {pressureSourceLabel}
        </div>
      </div>

      {/* Table header */}
      <div>
        <div className="grid grid-cols-5 gap-4 pb-2 border-b-2 border-gray-200 text-xs font-semibold text-gray-500 uppercase">
          <div>Stream</div>
          <div>Cost</div>
          <div>Model Capacity / Target</div>
          <div>Gap</div>
          <div>Status</div>
        </div>
        {pressureRows.map((row) => {
          const isDrillable = drillableStreams.includes(row.stream);
          const isExpanded = expandedStream === row.stream;

          return (
            <div key={row.stream}>
              <PressureRow
                row={row}
                isDrillable={isDrillable}
                isExpanded={isExpanded}
                onToggle={() =>
                  setExpandedStream(isExpanded ? null : row.stream)
                }
              />
              {isDrillable && isExpanded && (
                <div className="pl-6 pr-1 py-4 bg-gray-50 border-b border-gray-100">
                  {row.stream === 'Labour' && (
                    <BusinessOutcomeLabourSplit outcome={outcome} />
                  )}
                  {row.stream === 'Assets' && (
                    <BusinessOutcomeAssetSplit outcome={outcome} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Structure confidence */}
      <div className="pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Structure Confidence
        </div>
        <div className="text-sm text-gray-700">{structureConfidence.note}</div>
        <div className="text-xs text-gray-400 mt-1">
          Labour coverage: {structureConfidence.staffCoveragePercent}% · Asset coverage: {structureConfidence.assetCoveragePercent}%
        </div>
      </div>

      {/* Anchor statement */}
      <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 italic">
        {outcome.business_outcome_note}
      </div>
    </div>
  );
}
