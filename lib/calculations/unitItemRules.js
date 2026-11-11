// Unit item rules for Revenue / COGS (V6.1cj piece 3). One place decides what a PURCHASED ITEM is.
// A purchased item is a row with a buy price and nothing on the sell side (no revenue share, no
// sell price, no estimated units), for example a hired truck per load. buy_price_per_unit is null
// when no buy price has been set; a purchased item never has null (cleared price becomes 0).
function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hasBuyPrice(row) {
  const value = row ? row.buy_price_per_unit : null;

  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

export function isPurchasedItem(row) {
  if (!row) {
    return false;
  }

  return (
    hasBuyPrice(row) &&
    numberOrZero(row.revenue_share_percent) === 0 &&
    numberOrZero(row.average_sale_rate_per_unit) === 0 &&
    numberOrZero(row.estimated_units_annual) === 0
  );
}