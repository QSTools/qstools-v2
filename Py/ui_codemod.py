from pathlib import Path
import argparse
import json

TEXT_EXTS = {".js", ".jsx", ".ts", ".tsx"}

EXCLUDED_DIRS = {
    ".git",
    ".next",
    ".venv",
    "node_modules",
    "audit_reports",
    "__pycache__",
    "dist",
    "build",
    "out",
}

INCLUDED_TOP_LEVEL_DIRS = {"app", "components"}

# -------------------------------------------------------------------
# Exact class replacements only.
# Keep these narrow and intentional.
# -------------------------------------------------------------------

EXACT_REPLACEMENTS = [
    # Inputs
    (
        'className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px]"',
        'className="ui-input number-input"',
        "input_base_number",
    ),
    (
        'className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"',
        'className="ui-input number-input"',
        "input_base_number_full",
    ),
    (
        'className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px]"',
        'className="ui-input"',
        "input_base_plain",
    ),
    (
        'className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-[var(--text-primary)] text-sm min-h-[44px] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"',
        'className="ui-input"',
        "input_base_full",
    ),
    (
        'className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] text-sm min-h-[44px] outline-none focus:border-[var(--accent)]"',
        'className="ui-input"',
        "input_card_full",
    ),

    # Readonly
    (
        'className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"',
        'className="ui-readonly"',
        "readonly_base",
    ),
    (
        'className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"',
        'className="ui-readonly"',
        "readonly_full",
    ),
    (
        'className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"',
        'className="ui-readonly"',
        "readonly_panel",
    ),

    # Buttons
    (
        'className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm min-h-[44px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"',
        'className="ui-button-primary"',
        "button_primary",
    ),
    (
        'className="rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm min-h-[44px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] disabled:cursor-not-allowed disabled:opacity-60"',
        'className="ui-button-secondary"',
        "button_secondary",
    ),

    # Sections / panels
    (
        'className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5"',
        'className="ui-section"',
        "section_base",
    ),
    (
        'className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4"',
        'className="ui-panel"',
        "panel_base",
    ),
    (
        'className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4"',
        'className="ui-section-muted"',
        "section_muted",
    ),

    # Labels / help
    (
        'className="mb-2 text-sm text-[var(--text-secondary)]"',
        'className="ui-label"',
        "label_base",
    ),
    (
        'className="mt-1 text-sm text-[var(--text-muted)]"',
        'className="ui-help"',
        "help_text",
    ),
]

# -------------------------------------------------------------------
# Exact string replacements for class constants inside JS files
# -------------------------------------------------------------------

EXACT_STRING_REPLACEMENTS = [
    (
        '"w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-[var(--text-primary)] text-sm min-h-[44px] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"',
        '"ui-input"',
        "const_input_full",
    ),
    (
        '"w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] text-sm min-h-[44px] outline-none focus:border-[var(--accent)]"',
        '"ui-input"',
        "const_input_card",
    ),
    (
        '"rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm min-h-[44px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] disabled:cursor-not-allowed disabled:opacity-60"',
        '"ui-button-secondary"',
        "const_button_secondary",
    ),
    (
        '"rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm min-h-[44px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"',
        '"ui-button-primary"',
        "const_button_primary",
    ),
]

# Files where broad exact replacements are okay.
# Skip more fragile files if needed later.
SKIP_FILES = {
    # none for now
}


def is_included_source(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False

    if not rel.parts:
        return False

    if rel.parts[0] not in INCLUDED_TOP_LEVEL_DIRS:
        return False

    if any(part.lower() in EXCLUDED_DIRS for part in rel.parts):
        return False

    return path.suffix.lower() in TEXT_EXTS


def iter_source_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if is_included_source(path, root):
            yield path


def write_backup(root: Path, rel_path: str, original: str):
    backup_root = root / "audit_reports" / "codemod_backups"
    backup_path = backup_root / rel_path
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    backup_path.write_text(original, encoding="utf-8")


def apply_exact_replacements(content: str):
    updated = content
    counts = {}

    for old, new, tag in EXACT_REPLACEMENTS:
        n = updated.count(old)
        if n:
            updated = updated.replace(old, new)
            counts[tag] = counts.get(tag, 0) + n

    for old, new, tag in EXACT_STRING_REPLACEMENTS:
        n = updated.count(old)
        if n:
            updated = updated.replace(old, new)
            counts[tag] = counts.get(tag, 0) + n

    return updated, counts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, help="Repo root")
    parser.add_argument("--apply", action="store_true", help="Write changes")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Root does not exist: {root}")

    dry_run = not args.apply

    reports_dir = root / "audit_reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    txt_report = reports_dir / "ui_codemod_report.txt"
    json_report = reports_dir / "ui_codemod_report.json"

    totals = {
        "files_scanned": 0,
        "files_changed": 0,
        "total_replacements": 0,
    }

    file_changes = []

    for path in iter_source_files(root):
        rel_path = path.relative_to(root).as_posix()
        totals["files_scanned"] += 1

        if rel_path in SKIP_FILES:
            continue

        original = path.read_text(encoding="utf-8", errors="ignore")
        updated, counts = apply_exact_replacements(original)

        changed = updated != original
        replacement_count = sum(counts.values())

        if changed:
            totals["files_changed"] += 1
            totals["total_replacements"] += replacement_count

            if not dry_run:
                write_backup(root, rel_path, original)
                path.write_text(updated, encoding="utf-8")

        if changed:
            file_changes.append(
                {
                    "path": rel_path,
                    "changed": True,
                    "replacement_count": replacement_count,
                    "replacements": counts,
                }
            )

    lines = []
    lines.append("QS Tools UI Codemod Report")
    lines.append("=" * 80)
    lines.append(f"Root: {root}")
    lines.append(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")
    lines.append("")
    lines.append("Totals")
    lines.append("-" * 80)
    for key, value in totals.items():
        lines.append(f"{key}: {value}")
    lines.append("")
    lines.append("Per File")
    lines.append("-" * 80)

    for item in sorted(file_changes, key=lambda x: x["path"]):
        lines.append(item["path"])
        lines.append(f"  changed: {item['changed']}")
        lines.append(f"  replacement_count: {item['replacement_count']}")
        lines.append(f"  replacements: {item['replacements']}")
        lines.append("")

    txt_report.write_text("\n".join(lines), encoding="utf-8")
    json_report.write_text(
        json.dumps(
            {
                "root": str(root),
                "mode": "dry_run" if dry_run else "apply",
                "totals": totals,
                "files": file_changes,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Wrote: {txt_report}")
    print(f"Wrote: {json_report}")
    if not dry_run:
        print(f"Backups: {root / 'audit_reports' / 'codemod_backups'}")


if __name__ == "__main__":
    main()