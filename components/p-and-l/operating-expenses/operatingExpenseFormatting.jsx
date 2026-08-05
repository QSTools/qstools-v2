import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

export function format_money(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MoneyInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className="ui-input"
      value={format_number_with_commas(value)}
      onChange={(event) => onChange(parse_number_string(event.target.value))}
      disabled={disabled}
    />
  );
}

export function get_line_amount_total(lines = []) {
  return (lines ?? []).reduce((total, line) => {
    return total + Number(line.amount || 0);
  }, 0);
}

