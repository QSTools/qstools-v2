import os

# Base project root (one level up from /Py)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FOLDERS = [
    "Py",

    "app/labour",

    "components/labour",

    "hooks",

    "lib/calculations",
    "lib/selectors",
    "lib/storage",
    "lib/identity",

    "docs/sources",

    "public"
]

PLACEHOLDER_FILES = [
    "app/labour/page.jsx",
    "hooks/useLabour.js",
    "lib/calculations/labourCalculations.js",
    "components/labour/.gitkeep",
    "lib/selectors/.gitkeep",
    "lib/storage/.gitkeep",
    "lib/identity/.gitkeep",
    "docs/sources/.gitkeep",
    "public/.gitkeep",
]

def create_folders(base_path, folders):
    for folder in folders:
        full_path = os.path.join(base_path, folder)
        os.makedirs(full_path, exist_ok=True)
        print(f"Created folder: {full_path}")

def create_placeholder_files(base_path, files):
    for rel_path in files:
        full_path = os.path.join(base_path, rel_path)

        if not os.path.exists(full_path):
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write("")
            print(f"Created file: {full_path}")
        else:
            print(f"Skipped existing file: {full_path}")

if __name__ == "__main__":
    print(f"Base directory: {BASE_DIR}\n")

    create_folders(BASE_DIR, FOLDERS)
    print()
    create_placeholder_files(BASE_DIR, PLACEHOLDER_FILES)

    print("\n✅ QS Tools clean structure created.")