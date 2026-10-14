export default function RateBuilderPricingBlockNotice({ pricing_block }) {
  if (!pricing_block?.is_blocked) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-300"
    >
      <p className="font-semibold">Asset pricing is locked</p>
      <p className="mt-1">{pricing_block.message}</p>
    </div>
  );
}