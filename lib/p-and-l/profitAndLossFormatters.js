export function format_money(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function get_line_amount_total(lines = []) {
  return (lines ?? []).reduce((total, line) => {
    return total + Number(line.amount || 0);
  }, 0);
}
