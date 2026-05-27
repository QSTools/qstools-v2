from pathlib import Path
import shutil


# ============================================================
# QS Tools / Mirra
# Retrospective Evidence Pack Source Brief Copier
# ============================================================

PROJECT_ROOT = Path(r"D:\QSTools\qstools-web")

DOCS_ROOT = PROJECT_ROOT / "docs"
EVIDENCE_ROOT = DOCS_ROOT / "Evidence"

PACK_LABEL = "MIRRA_v4_Core_Architecture_Lock"


SOURCE_BRIEF_FILES = [
    "MIRRA_CORE_CLOSED_LOOP_RECOVERY_MODEL_v1.0_LOCKED.txt",
    "01_MIRRA_ACTIVE_SYSTEM_BRIEF_v4.0_LOCKED.txt",
    "02_MIRRA_IMPLEMENTATION_ORDER_v4.0_LOCKED.txt",
    "30_MIRRA_BUSINESS_MODELLING_v4.0_LOCKED.txt",
    "MIRRA_v4_CHAT_HANDOVER_PNL_REBUILD.txt",
]


def find_latest_pack_folder() -> Path:
    matching_folders = [
        folder
        for folder in EVIDENCE_ROOT.iterdir()
        if folder.is_dir() and folder.name.endswith(PACK_LABEL)
    ]

    if not matching_folders:
        raise FileNotFoundError(
            f"No existing evidence pack folder found in: {EVIDENCE_ROOT}"
        )

    return max(matching_folders, key=lambda folder: folder.stat().st_mtime)


def find_source_file(file_name: str) -> Path | None:
    matches = list(DOCS_ROOT.rglob(file_name))

    # Avoid accidentally finding files already copied inside Evidence packs
    matches = [
        match
        for match in matches
        if "Evidence" not in match.parts
    ]

    if not matches:
        return None

    # If there are duplicates, use the most recently modified one
    return max(matches, key=lambda file: file.stat().st_mtime)


def copy_source_briefs_to_pack():
    pack_path = find_latest_pack_folder()
    source_briefs_path = pack_path / "source_briefs"
    source_briefs_path.mkdir(parents=True, exist_ok=True)

    copied_files = []
    missing_files = []

    print("Using latest evidence pack:")
    print(pack_path)
    print()

    print("Searching for source briefs under:")
    print(DOCS_ROOT)
    print()

    for file_name in SOURCE_BRIEF_FILES:
        source_path = find_source_file(file_name)

        if source_path is None:
            missing_files.append(file_name)
            print(f"Missing: {file_name}")
            continue

        target_path = source_briefs_path / file_name
        shutil.copy2(source_path, target_path)
        copied_files.append(file_name)

        print(f"Copied: {file_name}")
        print(f"  From: {source_path}")
        print(f"  To:   {target_path}")

    summary_path = pack_path / "SOURCE_BRIEF_COPY_SUMMARY.txt"

    summary_lines = [
        "# Source Brief Copy Summary",
        "",
        f"Evidence pack:",
        str(pack_path),
        "",
        "Copied files:",
    ]

    if copied_files:
        for file_name in copied_files:
            summary_lines.append(f"- {file_name}")
    else:
        summary_lines.append("- None")

    summary_lines.extend([
        "",
        "Missing files:",
    ])

    if missing_files:
        for file_name in missing_files:
            summary_lines.append(f"- {file_name}")
    else:
        summary_lines.append("- None")

    summary_path.write_text("\n".join(summary_lines), encoding="utf-8")

    print()
    print("Copy summary written:")
    print(summary_path)

    print()
    if missing_files:
        print("Some source briefs are still missing.")
        print("That means they either have different filenames or are not saved under docs yet.")
    else:
        print("All listed source briefs copied successfully.")


if __name__ == "__main__":
    copy_source_briefs_to_pack()