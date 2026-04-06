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

EXACT_REPLACEMENTS = [
    # ------------------------------------------------------------------
    # Hardcoded color swaps
    # ------------------------------------------------------------------
    (
        'className="text-sm font-medium text-white"',
        'className="text-sm font-medium text-[var(--text-primary)]"',
        "hardcoded_text_white_block",
    ),
    (
        'className="text-xl font-semibold text-white"',
        'className="text-xl font-semibold text-[var(--text-primary)]"',
        "hardcoded_text_white_heading",
    ),
    (
        'className="text-sm font-medium text-white"',
        'className="text-sm font-medium text-[var(--text-primary)]"',
        "hardcoded_text_white_medium",
    ),
    (
        'className="text-sm font-medium text-white">{value}</span>',
        'className="text-sm font-medium text-[var(--text-primary)]">{value}</span>',
        "hardcoded_text_white_value",
    ),
    (
        'className="font-medium text-white">{value}</span>',
        'className="font-medium text-[var(--text-primary)]">{value}</span>',
        "hardcoded_text_white_inline",
    ),
    (
        'className="rounded-xl bg-white px-4 py-3 text-sm min-h-[44px] font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"',
        'className="ui-button-primary"',
        "saved_profiles_white_button",
    ),
    (
        'className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm min-h-[44px] font-medium"',
        'className="ui-button-secondary"',
        "neutral_dark_button",
    ),
    (
        'className="min-h-screen bg-neutral-950 text-white px-4 py-6 md:px-6"',
        'className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] px-4 py-6 md:px-6"',
        "app_page_shell",
    ),
    (
        'className="text-sm text-neutral-400"',
        'className="text-sm text-[var(--text-muted)]"',
        "neutral_text_muted",
    ),
    (
        'className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300"',
        'className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-secondary)]"',
        "neutral_info_panel",
    ),
    (
        'className="border-t border-neutral-800"',
        'className="border-t border-[var(--border-primary)]"',
        "neutral_border_top",
    ),

    # ------------------------------------------------------------------
    # Readonly / panel leftovers
    # ------------------------------------------------------------------
    (
        'className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"',
        'className="ui-readonly"',
        "readonly_primary",
    ),
    (
        'className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"',
        'className="ui-readonly"',
        "readonly_strong",
    ),
    (
        'className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm min-h-[44px] text-[var(--danger)]"',
        'className="ui-readonly border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]"',
        "readonly_danger",
    ),
    (
        'className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px]"',
        'className="ui-input"',
        "input_leftover_plain",
    ),
    (
        'className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 text-sm min-h-[44px]"',
        'className="ui-readonly"',
        "readonly_leftover_card",
    ),
    (
        'className="rounded-xl border border-[var(--danger)]/50 bg-[var(--danger-soft)]/30 px-4 py-3 text-sm min-h-[44px] text-[var(--danger)]"',
        'className="ui-readonly border-[var(--danger)]/50 bg-[var(--danger-soft)]/30 text-[var(--danger)]"',
        "readonly_leftover_danger_soft",
    ),

    # ------------------------------------------------------------------
    # Pills / badges / status
    # ------------------------------------------------------------------
    (
        'className="rounded-full border border-[var(--success)] bg-[var(--success-soft)] px-3 py-2 text-sm min-h-[40px] text-[var(--success)]"',
        'className="ui-pill border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"',
        "pill_success",
    ),
    (
        'className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm min-h-[40px] font-medium text-[var(--text-secondary)]"',
        'className="ui-pill text-[var(--text-secondary)]"',
        "pill_muted",
    ),

    # ------------------------------------------------------------------
    # Labour / flow leftovers
    # ------------------------------------------------------------------
    (
        'className="flex justify-between border-t border-[var(--border-primary)] pt-2 text-sm font-semibold text-white"',
        'className="flex justify-between border-t border-[var(--border-primary)] pt-2 text-sm font-semibold text-[var(--text-primary)]"',
        "flow_footer_text",
    ),
    (
        'className="text-xl font-semibold text-white"',
        'className="text-xl font-semibold text-[var(--text-primary)]"',
        "flow_heading_text",
    ),
]

STRING_REPLACEMENTS = [
    (
        '"block rounded-md px-3 py-2 no-underline transition-colors"',
        '"block rounded-md px-4 py-3 no-underline transition-colors"',
        "sidebar_link_touch",
    ),
]

SKIP_FILES = {
    # leave layout-heavy files manual if needed later
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
        if path.is_file() and is_included_source(path, root):
            yield path


def write_backup(root: Path, rel_path: str, original: str):
    backup_root = root / "audit_reports" / "codemod_v2_backups"
    backup_path = backup_root / rel_path
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    backup_path.write_text(original, encoding="utf-8")


def apply_replacements(content: str):
    updated = content
    counts = {}

    for old, new, tag in EXACT_REPLACEMENTS:
        n = updated.count(old)
        if n:
            updated = updated.replace(old, new)
            counts[tag] = counts.get(tag, 0) + n

    for old, new, tag in STRING_REPLACEMENTS:
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

    txt_report = reports_dir / "ui_codemod_v2_report.txt"
    json_report = reports_dir / "ui_codemod_v2_report.json"

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
        updated, counts = apply_replacements(original)

        changed = updated != original
        replacement_count = sum(counts.values())

        if changed:
            totals["files_changed"] += 1
            totals["total_replacements"] += replacement_count

            if not dry_run:
                write_backup(root, rel_path, original)
                path.write_text(updated, encoding="utf-8")

            file_changes.append(
                {
                    "path": rel_path,
                    "changed": True,
                    "replacement_count": replacement_count,
                    "replacements": counts,
                }
            )

    lines = []
    lines.append("QS Tools UI Codemod v2 Report")
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
        print(f"Backups: {root / 'audit_reports' / 'codemod_v2_backups'}")


if __name__ == "__main__":
    main()