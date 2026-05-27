from pathlib import Path
from datetime import datetime


# ============================================================
# QS Tools / Mirra
# Retrospective Evidence Pack Folder Creator
# ============================================================

PROJECT_ROOT = Path(r"D:\QSTools\qstools-web")

EVIDENCE_ROOT = PROJECT_ROOT / "docs" / "Evidence"

PACK_LABEL = "MIRRA_v4_Core_Architecture_Lock"


def safe_timestamp():
    """
    Creates a folder-safe timestamp.
    Example: 2026-05-28_1430
    """
    return datetime.now().strftime("%Y-%m-%d_%H%M")


def create_evidence_pack_folders():
    timestamp = safe_timestamp()

    pack_folder_name = f"{timestamp}_{PACK_LABEL}"
    pack_path = EVIDENCE_ROOT / pack_folder_name

    folders = {
        "pack": pack_path,
        "logs": pack_path / "logs",
        "screenshots": pack_path / "screenshots",
        "source_briefs": pack_path / "source_briefs",
        "audit_outputs": pack_path / "audit_outputs",
    }

    for folder in folders.values():
        folder.mkdir(parents=True, exist_ok=True)

    readme_path = pack_path / f"README_EVIDENCE_{pack_folder_name}.txt"

    readme_content = f"""# MIRRA v4.0 Retrospective Evidence Pack

Pack created:
{timestamp}

Purpose:
This evidence pack records the retrospective architecture lock for MIRRA v4.0.

Milestone:
{PACK_LABEL}

Folder structure:
- source_briefs/
  Locked architecture and source-of-truth briefs

- logs/
  Git logs, changelogs, implementation logs, or terminal records

- screenshots/
  Current-state screenshots proving visible application state

- audit_outputs/
  Brief alignment audits, source integrity checks, or validation outputs

Notes:
This pack is retrospective.
Missing old screenshots are acceptable.
Current-state screenshots are sufficient for the milestone record.

Core principle:
Mirra is a closed-loop business recovery model.
Monthly P&L is model recalibration evidence.
"""

    readme_path.write_text(readme_content, encoding="utf-8")

    print("Evidence pack folders created successfully.")
    print(f"Pack path: {pack_path}")
    print()
    print("Created folders:")
    for name, folder in folders.items():
        print(f"- {name}: {folder}")
    print()
    print(f"README created: {readme_path}")


if __name__ == "__main__":
    create_evidence_pack_folders()