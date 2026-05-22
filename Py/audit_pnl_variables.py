from pathlib import Path
import re
import json

ROOT = Path(r"D:\QSTools\qstools-web")

TARGET_PATHS = [
    ROOT / "app" / "profit-and-loss",
    ROOT / "hooks",
    ROOT / "lib" / "storage",
    ROOT / "lib" / "calculations",
    ROOT / "lib" / "selectors",
    ROOT / "components" / "profit-and-loss",
]

OUTPUT_JSON = ROOT / "tools" / "pnl_variables_audit.json"


def read_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def is_pnl_file(path: Path) -> bool:
    name = path.name.lower()
    path_text = str(path).replace("\\", "/").lower()

    return (
        "profitandloss" in name
        or "profit-and-loss" in path_text
        or "pnl" in name
    )


def find_storage_keys(content: str):
    patterns = [
        r"localStorage\.getItem\(['\"]([^'\"]+)['\"]\)",
        r"localStorage\.setItem\(['\"]([^'\"]+)['\"]",
        r"localStorage\.removeItem\(['\"]([^'\"]+)['\"]",
    ]

    keys = set()

    for pattern in patterns:
        keys.update(re.findall(pattern, content))

    return sorted(keys)


def find_state_fields(content: str):
    fields = set()

    # useState({ field_name: value })
    fields.update(re.findall(r"\b([a-z][a-z0-9_]+)\s*:", content))

    # value={state.field_name}
    fields.update(re.findall(r"\.([a-z][a-z0-9_]+)\b", content))

    # name="field_name"
    fields.update(re.findall(r"name=['\"]([a-z][a-z0-9_]+)['\"]", content))

    # id="field_name"
    fields.update(re.findall(r"id=['\"]([a-z][a-z0-9_]+)['\"]", content))

    # onChange handlers often update field keys
    fields.update(re.findall(r"\[['\"]([a-z][a-z0-9_]+)['\"]\]", content))

    ignored = {
        "map",
        "filter",
        "reduce",
        "length",
        "target",
        "value",
        "label",
        "className",
        "children",
        "toString",
        "preventDefault",
        "currentTarget",
    }

    return sorted(f for f in fields if f not in ignored)


def find_money_like_fields(fields):
    keywords = [
        "revenue",
        "sales",
        "income",
        "cost",
        "cogs",
        "expense",
        "expenses",
        "overhead",
        "gross",
        "profit",
        "margin",
        "wages",
        "salary",
        "salaries",
        "labour",
        "labor",
        "asset",
        "insurance",
        "rent",
        "software",
        "admin",
        "fees",
        "vehicle",
        "fuel",
        "materials",
        "subcontract",
    ]

    result = []

    for field in fields:
        if any(keyword in field.lower() for keyword in keywords):
            result.append(field)

    return sorted(set(result))


def classify_file(path: Path):
    text = str(path).replace("\\", "/").lower()

    if "/app/" in text:
        return "page"
    if "/hooks/" in text:
        return "hook"
    if "/lib/storage/" in text:
        return "storage"
    if "/lib/calculations/" in text:
        return "calculation"
    if "/lib/selectors/" in text:
        return "selector"
    if "/components/" in text:
        return "component"

    return "other"


def scan():
    results = {
        "searched_paths": [str(p) for p in TARGET_PATHS],
        "files": [],
        "storage_keys": [],
        "all_fields": [],
        "money_like_fields": [],
        "recommended_search_files": [],
    }

    all_storage_keys = set()
    all_fields = set()

    for folder in TARGET_PATHS:
        if not folder.exists():
            continue

        if folder.is_file():
            paths = [folder]
        else:
            paths = list(folder.rglob("*"))

        for path in paths:
            if path.suffix not in [".js", ".jsx", ".ts", ".tsx"]:
                continue

            if not is_pnl_file(path):
                continue

            content = read_file(path)

            storage_keys = find_storage_keys(content)
            fields = find_state_fields(content)

            all_storage_keys.update(storage_keys)
            all_fields.update(fields)

            rel_path = path.relative_to(ROOT)

            results["files"].append(
                {
                    "path": str(rel_path),
                    "type": classify_file(path),
                    "storage_keys": storage_keys,
                    "fields": fields,
                    "money_like_fields": find_money_like_fields(fields),
                }
            )

    results["storage_keys"] = sorted(all_storage_keys)
    results["all_fields"] = sorted(all_fields)
    results["money_like_fields"] = find_money_like_fields(all_fields)

    priority_types = ["storage", "hook", "component", "calculation", "selector", "page"]

    for file_type in priority_types:
        for item in results["files"]:
            if item["type"] == file_type:
                results["recommended_search_files"].append(item["path"])

    return results


def print_summary(results):
    print("\nP&L VARIABLES AUDIT")
    print("=" * 50)

    print("\nFiles found:")
    for item in results["files"]:
        print(f"- {item['path']} [{item['type']}]")

    print("\nStorage keys:")
    if results["storage_keys"]:
        for key in results["storage_keys"]:
            print(f"- {key}")
    else:
        print("- No hardcoded localStorage keys found")

    print("\nMoney-like / P&L-like fields:")
    for field in results["money_like_fields"]:
        print(f"- {field}")

    print("\nRecommended files to inspect first:")
    for path in results["recommended_search_files"]:
        print(f"- {path}")

    print("\nOutput written to:")
    print(OUTPUT_JSON)


def main():
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    results = scan()

    OUTPUT_JSON.write_text(
        json.dumps(results, indent=2),
        encoding="utf-8",
    )

    print_summary(results)


if __name__ == "__main__":
    main()