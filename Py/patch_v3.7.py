from pathlib import Path
import shutil

# ============================================================
# QS Tools v3.7 Source Pack Filename Checker / Cleaner
# ============================================================

SOURCE_DIR = Path(r"D:\QSTools\qstools-web\docs\V3.7 Source Files")

# Set to False first to preview changes.
# Set to True when the preview looks correct.
APPLY_CHANGES = False

ARCHIVE_OLD_VERSIONS = True
ARCHIVE_DIR = Path(r"D:\QSTools\qstools-web\docs\V3.6 Source Files\Previous Versions")

EXPECTED_FILES = [
    "00_FIRST_PRINCIPLES_SYSTEM_BRIEF_v3.7_LOCKED.txt",
    "00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_v3.7_LOCKED.txt",
    "01_ACTIVE_SYSTEM_BRIEF_v3.7_LOCKED.txt",
    "02_IMPLEMENTATION_ORDER_v3.7_LOCKED.txt",
    "03_VARIABLE_CONTRACT_BRIEF_v3.7_LOCKED.txt",
    "04_PNL_PAGE_v3.7_LOCKED.txt",
    "05_GENERAL_OVERHEADS_v3.7_LOCKED.txt",
    "06_GENERAL_OVERHEADS_CATEGORY_MAPPING_v3.7_LOCKED.txt",
    "07_LABOUR_MODULE_v3.7_LOCKED.txt",
    "08_LABOUR_ACC_INTEGRATION_v3.7_LOCKED.txt",
    "09_ASSETS_MODULE_v3.7_LOCKED.txt",
    "10_MODULE_RECONCILIATION_v3.7_LOCKED.txt",
    "11_MODEL_READINESS_v3.7_LOCKED.txt",
    "12_MODULE_RECONCILIATION_AND_MODEL_READINESS_BUILD_BRIEF_v3.7_LOCKED.txt",
    "13_COST_SUMMARY_v3.7_LOCKED.txt",
    "14_COST_SUMMARY_BUILD_BRIEF_v3.7_LOCKED.txt",
    "15_CODE_MIGRATION_CLEANUP_BRIEF_v3.7_LOCKED.txt",
    "17_LABOUR_RECOVERY_AND_MARGIN_POOL_STANDARD_v3.7_LOCKED.txt",
    "18_COST_SETUP_READINESS_MILESTONE_v3.7_LOCKED.txt",
    "19_REVENUE_COGS_v3.7_LOCKED.txt",
    "20_BUSINESS_SUMMARY_v3.7_LOCKED.txt",
    "21_BUSINESS_MODELLING_v3.7_LOCKED.txt",
    "22_QUOTE_ENGINE_v3.7_LOCKED.txt",
    "23_BUSINESS_FEEDBACK_LOOP_v3.7_LOCKED.txt",
]

# Known incorrect / old names -> correct active v3.7 names
RENAME_MAP = {
    "00_FIRST_PRINCIPLES_SYSTEM_BRIEF_v3.7_UPDATED.txt": "00_FIRST_PRINCIPLES_SYSTEM_BRIEF_v3.7_LOCKED.txt",
    "00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_v3.7_UPDATED.txt": "00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_v3.7_LOCKED.txt",

    "04_PNL_PAGE_v3.67_LOCKED.txt": "04_PNL_PAGE_v3.7_LOCKED.txt",

    "17_LABOUR_RECOVERY_AND_MARGIN_POOL_STANDARD_v3.7_UPDATED.txt": "17_LABOUR_RECOVERY_AND_MARGIN_POOL_STANDARD_v3.7_LOCKED.txt",

    "18_COST_SETUP_READINESS_MILESTONE_v3.7_LOCKED.txt.txt": "18_COST_SETUP_READINESS_MILESTONE_v3.7_LOCKED.txt",
    "18_COST_SETUP_READINESS_MILESTONE_v3.7_UPDATED.txt": "18_COST_SETUP_READINESS_MILESTONE_v3.7_LOCKED.txt",
    "18_COST_SETUP_READINESS_MILESTONE_COPY_v3.7_UPDATED.txt": "18_COST_SETUP_READINESS_MILESTONE_v3.7_LOCKED.txt",

    "19_REVENUE_COGS_v3.7_UPDATED.txt": "19_REVENUE_COGS_v3.7_LOCKED.txt",
    "20_BUSINESS_SUMMARY_v3.7_UPDATED.txt": "20_BUSINESS_SUMMARY_v3.7_LOCKED.txt",
    "21_BUSINESS_MODELLING_v3.7_UPDATED.txt": "21_BUSINESS_MODELLING_v3.7_LOCKED.txt",
    "22_QUOTE_ENGINE_v3.7_LEAK_DETECTION_UPDATED.txt": "22_QUOTE_ENGINE_v3.7_LOCKED.txt",

    "23_Business_Feedback_Loop_v3.7.txt": "23_BUSINESS_FEEDBACK_LOOP_v3.7_LOCKED.txt",
    "23_BUSINESS_FEEDBACK_LOOP_v3.7.txt": "23_BUSINESS_FEEDBACK_LOOP_v3.7_LOCKED.txt",
}

OLD_ACTIVE_PATTERNS = [
    "_v3.6_",
    "v3.6",
    "_UPDATED",
    "_LEAK_DETECTION_UPDATED",
    ".txt.txt",
]


def print_header(title: str) -> None:
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def safe_rename(src: Path, dst: Path) -> None:
    if not src.exists():
        return

    if dst.exists():
        print(f"SKIP rename: target already exists")
        print(f"  From: {src.name}")
        print(f"  To:   {dst.name}")
        return

    print(f"RENAME")
    print(f"  From: {src.name}")
    print(f"  To:   {dst.name}")

    if APPLY_CHANGES:
        src.rename(dst)


def move_old_file(src: Path) -> None:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    dst = ARCHIVE_DIR / src.name

    if dst.exists():
        print(f"SKIP archive: already exists in archive")
        print(f"  {src.name}")
        return

    print(f"ARCHIVE OLD FILE")
    print(f"  From: {src}")
    print(f"  To:   {dst}")

    if APPLY_CHANGES:
        shutil.move(str(src), str(dst))


def main() -> None:
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Source folder not found: {SOURCE_DIR}")

    print_header("QS Tools v3.7 Source Pack Check")
    print(f"Source folder: {SOURCE_DIR}")
    print(f"Apply changes: {APPLY_CHANGES}")

    # 1. Rename known bad filenames
    print_header("Known Filename Fixes")

    for old_name, new_name in RENAME_MAP.items():
        old_path = SOURCE_DIR / old_name
        new_path = SOURCE_DIR / new_name
        safe_rename(old_path, new_path)

    # 2. Archive old v3.6 files if they are sitting in active v3.7 folder
    print_header("Old / Deprecated Files In Active Folder")

    all_txt_files = sorted(SOURCE_DIR.glob("*.txt"))
    for file_path in all_txt_files:
        name = file_path.name

        is_expected = name in EXPECTED_FILES
        looks_old = any(pattern in name for pattern in OLD_ACTIVE_PATTERNS)

        if looks_old and not is_expected:
            if ARCHIVE_OLD_VERSIONS:
                move_old_file(file_path)
            else:
                print(f"OLD FILE FOUND: {name}")

    # Refresh file list after possible renames
    current_files = {p.name for p in SOURCE_DIR.glob("*.txt")}

    # 3. Check expected files
    print_header("Expected File Check")

    missing = []
    present = []

    for expected in EXPECTED_FILES:
        if expected in current_files:
            present.append(expected)
            print(f"OK      {expected}")
        else:
            missing.append(expected)
            print(f"MISSING {expected}")

    # 4. Extra files
    print_header("Extra TXT Files In Active Folder")

    extras = sorted(current_files - set(EXPECTED_FILES))

    if extras:
        for extra in extras:
            print(f"EXTRA   {extra}")
    else:
        print("No extra .txt files found.")

    # 5. Summary
    print_header("Summary")

    print(f"Expected files: {len(EXPECTED_FILES)}")
    print(f"Present files:  {len(present)}")
    print(f"Missing files:  {len(missing)}")
    print(f"Extra files:    {len(extras)}")

    if missing:
        print("\nMissing files:")
        for item in missing:
            print(f"  - {item}")

    if extras:
        print("\nExtra files:")
        for item in extras:
            print(f"  - {item}")

    if not APPLY_CHANGES:
        print("\nDRY RUN ONLY.")
        print("If the actions above look correct, set APPLY_CHANGES = True and run again.")
    else:
        print("\nChanges applied.")


if __name__ == "__main__":
    main()