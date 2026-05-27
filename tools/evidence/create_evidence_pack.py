from pathlib import Path
from datetime import datetime
import argparse
import json
import shutil
import subprocess
import sys


# ============================================================
# Mirra / QS Tools
# Evidence Pack Automation Script
# ============================================================
#
# Purpose:
# Creates a dated milestone evidence pack containing:
# - README
# - git log
# - git status
# - copied screenshots from EvidenceDrop
# - copied logs / notes from EvidenceDrop
# - index.json metadata
#
# Usage:
# python tools\evidence\create_evidence_pack.py --label "PNL_Source_Integrity"
#
# Optional:
# python tools\evidence\create_evidence_pack.py --label "PNL_Source_Integrity" --note "Before P&L rebuild"
# ============================================================


PROJECT_ROOT = Path(r"D:\QSTools\qstools-web")

DOCS_ROOT = PROJECT_ROOT / "docs"
EVIDENCE_ROOT = DOCS_ROOT / "Evidence"

DROP_ROOT = PROJECT_ROOT / "EvidenceDrop"

SCREENSHOT_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

LOG_EXTENSIONS = {
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".log",
}

SOURCE_EXTENSIONS = {
    ".txt",
    ".md",
}


def safe_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d_%H%M")


def slugify_label(label: str) -> str:
    cleaned = "".join(
        char if char.isalnum() else "_"
        for char in label.strip()
    )

    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")

    cleaned = cleaned.strip("_")

    if not cleaned:
        return "Milestone"

    return cleaned


def run_command(command: list[str]) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        output = ""

        if result.stdout:
            output += result.stdout

        if result.stderr:
            if output:
                output += "\n"
            output += result.stderr

        return result.returncode == 0, output.strip()

    except Exception as exc:
        return False, str(exc)


def create_folder(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def copy_file(source: Path, target_folder: Path) -> Path:
    target_path = target_folder / source.name

    if target_path.exists():
        stem = target_path.stem
        suffix = target_path.suffix
        counter = 2

        while target_path.exists():
            target_path = target_folder / f"{stem}_{counter}{suffix}"
            counter += 1

    shutil.copy2(source, target_path)

    return target_path


def collect_drop_files(pack_paths: dict[str, Path]) -> dict:
    copied = {
        "screenshots": [],
        "logs": [],
        "source_briefs": [],
        "other": [],
    }

    if not DROP_ROOT.exists():
        return copied

    for source in sorted(DROP_ROOT.rglob("*")):
        if not source.is_file():
            continue

        suffix = source.suffix.lower()

        if suffix in SCREENSHOT_EXTENSIONS:
            target = copy_file(source, pack_paths["screenshots"])
            copied["screenshots"].append(str(target.relative_to(PROJECT_ROOT)))

        elif suffix in LOG_EXTENSIONS:
            target = copy_file(source, pack_paths["logs"])
            copied["logs"].append(str(target.relative_to(PROJECT_ROOT)))

        elif suffix in SOURCE_EXTENSIONS:
            target = copy_file(source, pack_paths["source_briefs"])
            copied["source_briefs"].append(str(target.relative_to(PROJECT_ROOT)))

        else:
            target = copy_file(source, pack_paths["other"])
            copied["other"].append(str(target.relative_to(PROJECT_ROOT)))

    return copied


def create_git_logs(pack_paths: dict[str, Path]) -> dict:
    outputs = {}

    commands = {
        "git_log_recent": ["git", "log", "--oneline", "--decorate", "-n", "30"],
        "git_status": ["git", "status"],
        "git_status_short": ["git", "status", "--short"],
        "git_branch": ["git", "branch", "--show-current"],
        "git_last_commit": ["git", "log", "-1", "--stat"],
    }

    for name, command in commands.items():
        ok, output = run_command(command)

        file_path = pack_paths["logs"] / f"{name}.txt"

        if not ok:
            output = f"Command failed: {' '.join(command)}\n\n{output}"

        write_text(file_path, output + "\n")

        outputs[name] = str(file_path.relative_to(PROJECT_ROOT))

    return outputs


def build_readme(
    pack_label: str,
    pack_name: str,
    timestamp: str,
    note: str,
    copied: dict,
    git_outputs: dict,
) -> str:
    screenshot_count = len(copied["screenshots"])
    log_count = len(copied["logs"])
    source_count = len(copied["source_briefs"])
    other_count = len(copied["other"])

    return f"""# Mirra Evidence Pack

Pack created:
{timestamp}

Milestone:
{pack_label}

Pack folder:
{pack_name}

Purpose:
This evidence pack records a product development milestone for Mirra.

Note:
{note or "No additional note provided."}

---

## Contents

source_briefs/
- Source briefs, build contracts, or relevant milestone notes copied from EvidenceDrop.

logs/
- Git log, git status, command outputs, changelogs, and text notes.

screenshots/
- Current-state UI screenshots copied from EvidenceDrop.

other/
- Other files copied from EvidenceDrop that did not match screenshot/log/source extensions.

audit_outputs/
- Reserved for audit outputs generated after pack creation.

---

## Copied File Counts

Screenshots:
{screenshot_count}

Logs / notes:
{log_count}

Source briefs:
{source_count}

Other files:
{other_count}

---

## Generated Git Evidence

{chr(10).join(f"- {key}: {value}" for key, value in git_outputs.items())}

---

## Workflow Reminder

1. Run any changelog or audit commands.
2. Place screenshots and notes in EvidenceDrop.
3. Run this evidence script.
4. Review the generated pack.
5. Commit the pack only if the milestone is important.

---

## Evidence Principle

Daily coding uses Git.

Milestones use:
- Git logs
- screenshots
- source briefs
- short README
- optional audit outputs

This keeps evidence useful without slowing development.
"""


def write_index(
    pack_path: Path,
    pack_label: str,
    pack_name: str,
    timestamp: str,
    note: str,
    copied: dict,
    git_outputs: dict,
) -> Path:
    index = {
        "product": "Mirra",
        "former_name": "QS Tools",
        "pack_label": pack_label,
        "pack_name": pack_name,
        "created_at": timestamp,
        "project_root": str(PROJECT_ROOT),
        "pack_path": str(pack_path),
        "note": note,
        "copied_files": copied,
        "generated_git_outputs": git_outputs,
    }

    index_path = pack_path / "index.json"
    index_path.write_text(json.dumps(index, indent=2), encoding="utf-8")

    return index_path


def optionally_clear_drop_folder(clear_drop: bool) -> None:
    if not clear_drop:
        return

    if not DROP_ROOT.exists():
        return

    for item in DROP_ROOT.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()


def create_evidence_pack(label: str, note: str = "", clear_drop: bool = False) -> Path:
    timestamp = safe_timestamp()
    safe_label = slugify_label(label)

    pack_name = f"{timestamp}_{safe_label}"
    pack_path = EVIDENCE_ROOT / pack_name

    pack_paths = {
        "pack": pack_path,
        "source_briefs": pack_path / "source_briefs",
        "logs": pack_path / "logs",
        "screenshots": pack_path / "screenshots",
        "audit_outputs": pack_path / "audit_outputs",
        "other": pack_path / "other",
    }

    for path in pack_paths.values():
        create_folder(path)

    copied = collect_drop_files(pack_paths)
    git_outputs = create_git_logs(pack_paths)

    readme_content = build_readme(
        pack_label=label,
        pack_name=pack_name,
        timestamp=timestamp,
        note=note,
        copied=copied,
        git_outputs=git_outputs,
    )

    readme_path = pack_path / f"README_EVIDENCE_{pack_name}.txt"
    write_text(readme_path, readme_content)

    index_path = write_index(
        pack_path=pack_path,
        pack_label=label,
        pack_name=pack_name,
        timestamp=timestamp,
        note=note,
        copied=copied,
        git_outputs=git_outputs,
    )

    optionally_clear_drop_folder(clear_drop)

    print("Evidence pack created successfully.")
    print()
    print(f"Pack path: {pack_path}")
    print(f"README: {readme_path}")
    print(f"Index: {index_path}")
    print()
    print("Copied files:")
    print(f"- Screenshots: {len(copied['screenshots'])}")
    print(f"- Logs / notes: {len(copied['logs'])}")
    print(f"- Source briefs: {len(copied['source_briefs'])}")
    print(f"- Other: {len(copied['other'])}")
    print()
    print("Generated git evidence:")
    for key, value in git_outputs.items():
        print(f"- {key}: {value}")
    print()
    print("Next:")
    print(f'git add "{pack_path.relative_to(PROJECT_ROOT)}"')
    print(f'git commit -m "Add evidence pack for {label}"')

    return pack_path


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create a Mirra milestone evidence pack."
    )

    parser.add_argument(
        "--label",
        required=True,
        help='Milestone label, e.g. "PNL_Source_Integrity"',
    )

    parser.add_argument(
        "--note",
        default="",
        help="Optional note to include in the README and index.",
    )

    parser.add_argument(
        "--clear-drop",
        action="store_true",
        help="Clear EvidenceDrop after copying files.",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    if not PROJECT_ROOT.exists():
        print(f"Project root does not exist: {PROJECT_ROOT}", file=sys.stderr)
        sys.exit(1)

    create_folder(EVIDENCE_ROOT)
    create_folder(DROP_ROOT)

    create_evidence_pack(
        label=args.label,
        note=args.note,
        clear_drop=args.clear_drop,
    )


if __name__ == "__main__":
    main()