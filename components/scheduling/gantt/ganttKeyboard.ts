import type { KeyboardEvent } from "react";

function focusScheduleCell(rowIndex: number, colIndex: number): void {
  const selector = `[data-schedule-row="${rowIndex}"][data-schedule-col="${colIndex}"]`;
  const target = document.querySelector<HTMLElement>(selector);

  if (!target) return;

  target.focus();

  if (target instanceof HTMLInputElement) {
    target.select();
  }
}

export function handleScheduleCellKeyDown(
  event: KeyboardEvent<HTMLElement>,
  rowIndex: number,
  colIndex: number
): void {
  if (
    event.key !== "Enter" &&
    event.key !== "ArrowUp" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight"
  ) {
    return;
  }

  event.preventDefault();

  let nextRow = rowIndex;
  let nextCol = colIndex;

  if (event.key === "Enter" || event.key === "ArrowDown") nextRow += 1;
  if (event.key === "ArrowUp") nextRow -= 1;
  if (event.key === "ArrowRight") nextCol += 1;
  if (event.key === "ArrowLeft") nextCol -= 1;

  window.requestAnimationFrame(() => {
    focusScheduleCell(nextRow, nextCol);
  });
}
