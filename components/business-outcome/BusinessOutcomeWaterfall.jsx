'use client';

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

function WaterfallRow({ row }) {
  const isNegative = row.value < 0 && !row.isTotal;
  const isSurplus = row.isSurplus === true;
  const textColor = row.isTotal
    ? 'text-gray-900 font-bold'
    : isSurplus
    ? 'text-green-600'
    : isNegative
    ? 'text-red-600'
    : 'text-gray-700';
  const indentClass = row.indent > 0 ? 'pl-6' : '';
  const borderClass = row.isTotal ? 'border-t-2 border-gray-300 pt-2' : '';

  return (
    <div className={`flex items-center justify-between py-2 ${borderClass}`}>
      <span className={`text-sm ${indentClass} ${row.isTotal ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
        {row.label}
      </span>
      <span className={`text-sm ${textColor}`}>{formatCurrency(row.value)}</span>
    </div>
  );
}

export default function BusinessOutcomeWaterfall({ outcome }) {
  const { waterfallRows, waterfallAvailable, waterfallUnavailableReason, waterfallReconciles } = outcome;

  if (!waterfallAvailable) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Reconstructed P&amp;L
        </div>
        <div className="text-lg font-semibold text-gray-400 mb-2">Not available</div>
        <div className="text-sm text-gray-500">{waterfallUnavailableReason}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Reconstructed P&amp;L
        </div>
        <div className="text-2xl font-bold text-gray-900">
          Where does Net Profit actually come from?
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Same Revenue, Overheads, and Net Profit as your P&amp;L - now split by what each part of the business actually earns versus what material margin has to carry.
        </div>
      </div>

      <div>
        {waterfallRows.map((row) => (
          <WaterfallRow key={row.id} row={row} />
        ))}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100">
        {waterfallReconciles === true && (
          <div className="text-xs text-green-600">
            ✓ Reconciles to Recovery Summary's net position
          </div>
        )}
        {waterfallReconciles === false && (
          <div className="text-xs text-red-600 font-medium">
            ⚠ Does not reconcile to Recovery Summary's net position - see warnings above
          </div>
        )}
      </div>
    </div>
  );
}
