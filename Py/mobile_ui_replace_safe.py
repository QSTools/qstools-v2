from pathlib import Path
import argparse
import json
import re

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

EXACT_REPLACEMENTS = [
    ("px-3 py-2 text-sm", "px-4 py-3 text-sm min-h-[44px]", "touch_target_upgrade"),
    ("px-4 py-2 text-sm", "px-4 py-3 text-sm min-h-[44px]", "touch_target_upgrade"),
    ("px-3 py-1 text-xs", "px-3 py-2 text-xs min-h-[40px]", "badge_touch_target_upgrade"),
]

TINY_TEXT_TARGETS = (
    "components/labour/",
    "components/cost-summary/",
    "components/employee-overheads/",
    "components/layout/",
    "components/common/",
)

TINY_TEXT_EXCLUDES = (
    "tracking-wide",
    "uppercase",
)

MANUAL_SKIP_FILES = {
    "components/labour/ScenarioModelCard.jsx",
}

INLINE_STYLE_PATTERN = re.compile(r"\bstyle=\{\{")
CLASSNAME_PATTERN = re.compile(r'className=(["\'])(.*?)\1', re.DOTALL)


def iter_source_files(root):
    for path in root.rglob("*"):
        if not path.is_file():
            continue

        if any(part.lower() in EXCLUDED_DIRS for part in path.parts):
            continue

        if path.suffix.lower() not in TEXT_EXTS:
            continue

        yield path


def path_matches_any(rel_path, prefixes):
    rel_path = rel_path.replace("\\", "/")
    return any(rel_path.startswith(prefix) for prefix in prefixes)


def safe_upgrade_text_xs(content, rel_path):
    if not path_matches_any(rel_path, TINY_TEXT_TARGETS):
        return content, 0

    count = 0

    def replace_class_block(match):
        nonlocal count
        quote = match.group(1)
        classes = match.group(2)

        if "text-xs" not in classes:
            return match.group(0)

        if any(ex in classes for ex in TINY_TEXT_EXCLUDES):
            return match.group(0)

        new_classes = classes.replace("text-xs", "text-sm")
        if new_classes != classes:
            count += 1
            return f'className={quote}{new_classes}{quote}'

        return match.group(0)

    updated = CLASSNAME_PATTERN.sub(replace_class_block, content)
    return updated, count


def apply_exact_replacements(content):
    counts = {}
    updated = content

    for old, new, tag in EXACT_REPLACEMENTS:
        n = updated.count(old)
        if n:
            updated = updated.replace(old, new)
            counts[tag] = counts.get(tag, 0) + n

    return updated, counts


def write_backup(root, rel_path, original):
    backup_root = root / "audit_reports" / "replacement_backups"
    backup_path = backup_root / rel_path
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    backup_path.write_text(original, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Root does not exist: {root}")

    dry_run = not args.apply

    reports_dir = root / "audit_reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    txt_report = reports_dir / "mobile_ui_replacement_report.txt"
    json_report = reports_dir / "mobile_ui_replacement_report.json"

    totals = {
        "files_scanned": 0,
        "files_changed": 0,
        "touch_target_upgrade": 0,
        "badge_touch_target_upgrade": 0,
        "tiny_text_upgrades": 0,
        "inline_style_files": 0,
        "manual_skip_files_found": 0,
    }

    file_changes = []

    for path in iter_source_files(root):
        rel_path = path.relative_to(root).as_posix()
        totals["files_scanned"] += 1

        original = path.read_text(encoding="utf-8", errors="ignore")
        updated = original

        inline_style_found = bool(INLINE_STYLE_PATTERN.search(updated))
        if inline_style_found:
            totals["inline_style_files"] += 1

        if rel_path in MANUAL_SKIP_FILES:
            totals["manual_skip_files_found"] += 1
            file_changes.append({
                "path": rel_path,
                "changed": False,
                "replacements": {},
                "tiny_text_upgrades": 0,
                "inline_style_found": inline_style_found,
                "manual_skip": True,
            })
            continue

        updated, replace_counts = apply_exact_replacements(updated)
        for key, value in replace_counts.items():
            totals[key] += value

        updated, tiny_count = safe_upgrade_text_xs(updated, rel_path)
        totals["tiny_text_upgrades"] += tiny_count

        changed = updated != original
        if changed:
            totals["files_changed"] += 1
            if not dry_run:
                write_backup(root, rel_path, original)
                path.write_text(updated, encoding="utf-8")

        if changed or inline_style_found:
            file_changes.append({
                "path": rel_path,
                "changed": changed,
                "replacements": replace_counts,
                "tiny_text_upgrades": tiny_count,
                "inline_style_found": inline_style_found,
                "manual_skip": False,
            })

    lines = []
    lines.append("QS Tools Safe Mobile UI Replacement Report")
    lines.append("=" * 80)
    lines.append(f"Root: {root}")
    lines.append(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")
    lines.append("")
    lines.append("Totals")
    lines.append("-" * 80)
    for key, value in totals.items():
        lines.append(f"{key}: {value}")
    lines.append("")
    lines.append("Manual Files Left Untouched")
    lines.append("-" * 80)
    for rel in sorted(MANUAL_SKIP_FILES):
        if (root / rel).exists():
            lines.append(f"- {rel}")
    lines.append("")
    lines.append("Per File")
    lines.append("-" * 80)

    for item in sorted(file_changes, key=lambda x: x["path"]):
        lines.append(item["path"])
        lines.append(f"  changed: {item['changed']}")
        lines.append(f"  replacements: {item['replacements']}")
        lines.append(f"  tiny_text_upgrades: {item['tiny_text_upgrades']}")
        lines.append(f"  inline_style_found: {item['inline_style_found']}")
        lines.append(f"  manual_skip: {item['manual_skip']}")
        lines.append("")

    txt_report.write_text("\n".join(lines), encoding="utf-8")
    json_report.write_text(
        json.dumps(
            {
                "root": str(root),
                "mode": "dry_run" if dry_run else "apply",
                "totals": totals,
                "manual_skip_files": sorted(MANUAL_SKIP_FILES),
                "files": file_changes,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Wrote: {txt_report}")
    print(f"Wrote: {json_report}")


if __name__ == "__main__":
    main()