from pathlib import Path
from datetime import datetime
import csv
import re


# ============================================================
# MIRRA / QS Tools
# v4.0 Brief Alignment Audit
# ============================================================

PROJECT_ROOT = Path(r"D:\QSTools\qstools-web")

SOURCE_DIR = PROJECT_ROOT / "docs" / "v4.0 Source Files"

EVIDENCE_PACK = (
    PROJECT_ROOT
    / "docs"
    / "Evidence"
    / "2026-05-28_0732_MIRRA_v4_Core_Architecture_Lock"
)

OUTPUT_DIR = EVIDENCE_PACK / "audit_outputs"


REQUIRED_FILES = [
    "00_MIRRA_SYSTEM_PRINCIPLES_v4.0_LOCKED.txt",
    "01_MIRRA_ACTIVE_SYSTEM_BRIEF_v4.0_LOCKED.txt",
    "02_MIRRA_IMPLEMENTATION_ORDER_v4.0_LOCKED.txt",
    "03_MIRRA_VARIABLE_CONTRACT_BRIEF_v4.0_LOCKED.txt",
    "04_MIRRA_P_AND_L_PAGE_v4.0_LOCKED.txt",
    "05_MIRRA_GENERAL_OVERHEADS_v4.0_LOCKED.txt",
    "06_MIRRA_COST_SUMMARY_v4.0_LOCKED.txt",
    "07_MIRRA_LABOUR_MODULE_v4.0_LOCKED.txt",
    "08_MIRRA_SCENARIO_LAYER_DECISION_v4.0_LOCKED.txt",
    "09_MIRRA_ASSETS_MODULE_v4.0_LOCKED.txt",
    "10_MIRRA_MODULE_RECONCILIATION_v4.0_LOCKED.txt",
    "11_MIRRA_MODEL_READINESS_v4.0_LOCKED.txt",
    "12_MIRRA_BUSINESS_SETUP_v4.0_LOCKED.txt",
    "13_MIRRA_REVENUE_COGS_v4.0_LOCKED.txt",
    "14_MIRRA_BUSINESS_SUMMARY_v4.0_LOCKED.txt",
    "15_MIRRA_REVENUE_REALITY_v4.0_LOCKED.txt",
    "16_MIRRA_ASSET_REALITY_v4.0_LOCKED.txt",
    "17_MIRRA_COST_ALLOCATION_v4.0_LOCKED.txt",
    "18_MIRRA_RECOVERY_SUMMARY_v4.0_LOCKED.txt",
    "19_MIRRA_RATE_BUILDER_v4.0_LOCKED.txt",
    "20_MIRRA_BUSINESS_OUTCOME_v4.0_LOCKED.txt",
    "21_MIRRA_QUOTE_CHECKER_v4.0_LOCKED.txt",
    "22_MIRRA_SOQ_JOB_PO_LAYER_v4.0_LOCKED.txt",
    "23_MIRRA_JOB_COSTING_PROFITABILITY_v4.0_LOCKED.txt",
    "24_MIRRA_MODEL_FEEDBACK_LOOP_v4.0_LOCKED.txt",
    "25_MIRRA_MODEL_REVIEW_APPROVAL_v4.0_LOCKED.txt",
    "26_MIRRA_DATA_QUALITY_DASHBOARD_v4.0_LOCKED.txt",
    "27_MIRRA_REPORTING_ANALYTICS_v4.0_LOCKED.txt",
    "28_MIRRA_DATABASE_STORAGE_EXPORT_LAYER_v4.0_LOCKED.txt",
    "29_MIRRA_INTEGRATIONS_API_LAYER_v4.0_LOCKED.txt",
    "30_MIRRA_BUSINESS_MODELLING_v4.0_LOCKED.txt",
    "MIRRA_CORE_CLOSED_LOOP_RECOVERY_MODEL_v1.0_LOCKED.txt",
    "MIRRA_v4_CHAT_HANDOVER_PNL_REBUILD.txt",
]


HISTORICAL_CONTEXT_FILES = {
    "MIRRA_v4_CHAT_HANDOVER_PNL_REBUILD.txt",
}


CONFLICT_TERMS = [
    "Cost Allocation owns recovery",
    "Cost Allocation calculates recovery",
    "Cost Allocation defines recovery",
    "Cost Allocation defines the recovery model",
    "Recovery Summary asks user to choose recovery method",
    "Business Outcome feeds Quote Checker directly",
    "Employee Overheads as a separate active module",
    "Cost Summary consumes Cost Allocation",
    "Cost Summary consumes Recovery Summary",
    "Quote Checker uses unselected scenarios",
    "Cost Allocation before Cost Summary",
]


REQUIRED_CONCEPTS = [
    "closed-loop",
    "Monthly P&L",
    "Business Modelling",
    "Quote Checker",
    "Cost Summary",
    "Recovery Summary",
    "Cost Allocation",
    "Rate Builder",
    "Business Outcome",
]


SECTION_HINTS = [
    "PURPOSE",
    "SYSTEM ROLE",
    "INPUTS",
    "OUTPUTS",
    "MUST NOT",
    "NOT ALLOWED",
    "CORE RULE",
    "DEFINITION",
]


RECOVERY_BOUNDARY_PHRASES = [
    "must not calculate recovery",
    "does not calculate recovery",
    "does not test recovery",
    "must not decide whether the recovery strategy works",
    "recovery summary owns recovery testing",
    "cost allocation does not test recovery",
    "do not test recovery",
    "must not own",
    "does not create recovery strategy",
    "must not create recovery strategy",
]


SAFE_CONTEXT_MARKERS = [
    "replaces",
    "older",
    "deprecated",
    "do not",
    "does not",
    "must not",
    "not allowed",
    "no separate",
    "should move",
    "move to",
    "removed",
    "must never",
    "not recreated",
    "not a separate active module",
    "conflicts to watch",
    "flag older",
    "watch for",
    "must be replaced",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def count_matches(text: str, phrase: str) -> int:
    return len(re.findall(re.escape(phrase.lower()), text.lower()))


def has_section(text: str, section_hint: str) -> bool:
    pattern = re.compile(rf"(^|\n)\s*#*\s*{re.escape(section_hint)}", re.IGNORECASE)
    return bool(pattern.search(text))


def is_negated_or_historical_context(text: str, term: str) -> bool:
    lower_text = text.lower()
    lower_term = term.lower()

    start = 0

    while True:
        index = lower_text.find(lower_term, start)
        if index == -1:
            return False

        window_start = max(0, index - 300)
        window_end = min(len(lower_text), index + len(lower_term) + 300)
        context = lower_text[window_start:window_end]

        if any(marker in context for marker in SAFE_CONTEXT_MARKERS):
            return True

        start = index + len(lower_term)


def audit_file(path: Path) -> list[dict]:
    findings = []
    text = read_text(path)
    lower_text = text.lower()

    # ------------------------------------------------------------
    # Version / lock checks
    # ------------------------------------------------------------

    if "v4.0" not in text and "v1.0" not in text:
        findings.append({
            "severity": "warning",
            "file": path.name,
            "check": "version_marker",
            "finding": "No obvious v4.0 or v1.0 version marker found.",
        })

    # File name already counts as a lock marker for v4.0 source files.
    if "LOCKED" not in text and "LOCKED" not in path.name:
        findings.append({
            "severity": "warning",
            "file": path.name,
            "check": "locked_marker",
            "finding": "No LOCKED marker found in file body or filename.",
        })

    # ------------------------------------------------------------
    # Required section hints
    # ------------------------------------------------------------

    section_hits = [hint for hint in SECTION_HINTS if has_section(text, hint)]

    if len(section_hits) < 3:
        findings.append({
            "severity": "info",
            "file": path.name,
            "check": "section_coverage",
            "finding": f"Only {len(section_hits)} standard section hints found: {', '.join(section_hits)}",
        })

    # ------------------------------------------------------------
    # Conflict terms
    # ------------------------------------------------------------

    for term in CONFLICT_TERMS:
        if term.lower() in lower_text:
            if path.name in HISTORICAL_CONTEXT_FILES:
                findings.append({
                    "severity": "info",
                    "file": path.name,
                    "check": "conflict_term_historical_context",
                    "finding": f"Conflict phrase appears in historical handover context: {term}",
                })
            elif is_negated_or_historical_context(text, term):
                findings.append({
                    "severity": "info",
                    "file": path.name,
                    "check": "conflict_term_safe_context",
                    "finding": f"Conflict phrase appears in safe/deprecated/negative context: {term}",
                })
            else:
                findings.append({
                    "severity": "error",
                    "file": path.name,
                    "check": "conflict_term",
                    "finding": f"Potential conflicting architecture phrase found: {term}",
                })

    # ------------------------------------------------------------
    # Module-specific checks
    # ------------------------------------------------------------

    if "COST_ALLOCATION" in path.name or "COST_ALLOCATION" in path.stem:
        if "structural" not in lower_text and "working-group builder" not in lower_text:
            findings.append({
                "severity": "warning",
                "file": path.name,
                "check": "cost_allocation_role",
                "finding": "Cost Allocation file does not clearly include structural or working-group role language.",
            })

        if not any(phrase in lower_text for phrase in RECOVERY_BOUNDARY_PHRASES):
            findings.append({
                "severity": "warning",
                "file": path.name,
                "check": "cost_allocation_recovery_boundary",
                "finding": "Cost Allocation file may not clearly state it must not calculate/test/own recovery.",
            })

    if "RECOVERY_SUMMARY" in path.name or "RECOVERY_SUMMARY" in path.stem:
        if "how" not in lower_text or "recover" not in lower_text:
            findings.append({
                "severity": "warning",
                "file": path.name,
                "check": "recovery_summary_role",
                "finding": "Recovery Summary file may not clearly define HOW cost is recovered.",
            })

    if "COST_SUMMARY" in path.name or "COST_SUMMARY" in path.stem:
        if "what" not in lower_text or "cost" not in lower_text:
            findings.append({
                "severity": "warning",
                "file": path.name,
                "check": "cost_summary_role",
                "finding": "Cost Summary file may not clearly define WHAT the business costs.",
            })

    return findings


def audit_required_files() -> list[dict]:
    findings = []

    for file_name in REQUIRED_FILES:
        path = SOURCE_DIR / file_name
        if not path.exists():
            findings.append({
                "severity": "error",
                "file": file_name,
                "check": "required_file_exists",
                "finding": "Required v4.0 source file is missing.",
            })

    return findings


def audit_pack_concepts() -> list[dict]:
    findings = []

    combined_text = ""

    for path in SOURCE_DIR.glob("*.txt"):
        combined_text += "\n\n" + read_text(path)

    for concept in REQUIRED_CONCEPTS:
        matches = count_matches(combined_text, concept)

        if matches == 0:
            findings.append({
                "severity": "warning",
                "file": "SOURCE_PACK",
                "check": "required_concept",
                "finding": f"Required concept not found in source pack: {concept}",
            })

    return findings


def write_outputs(findings: list[dict]):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M")

    txt_path = OUTPUT_DIR / f"MIRRA_BRIEF_ALIGNMENT_AUDIT_{timestamp}.txt"
    csv_path = OUTPUT_DIR / f"MIRRA_BRIEF_ALIGNMENT_AUDIT_{timestamp}.csv"

    errors = [f for f in findings if f["severity"] == "error"]
    warnings = [f for f in findings if f["severity"] == "warning"]
    infos = [f for f in findings if f["severity"] == "info"]

    lines = [
        "# MIRRA v4.0 Brief Alignment Audit",
        "",
        f"Created: {timestamp}",
        f"Source directory: {SOURCE_DIR}",
        f"Evidence output: {OUTPUT_DIR}",
        "",
        "Summary:",
        f"- Errors: {len(errors)}",
        f"- Warnings: {len(warnings)}",
        f"- Info: {len(infos)}",
        f"- Total findings: {len(findings)}",
        "",
        "Finding interpretation:",
        "- error = likely active contradiction or missing required file",
        "- warning = possible wording gap",
        "- info = low-risk formatting note, historical handover note, or safe/deprecated conflict wording",
        "",
        "Findings:",
    ]

    if not findings:
        lines.append("- No findings.")
    else:
        for item in findings:
            lines.extend([
                "",
                f"[{item['severity'].upper()}] {item['file']}",
                f"Check: {item['check']}",
                f"Finding: {item['finding']}",
            ])

    txt_path.write_text("\n".join(lines), encoding="utf-8")

    with csv_path.open("w", newline="", encoding="utf-8") as csv_file:
        fieldnames = ["severity", "file", "check", "finding"]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(findings)

    print("MIRRA v4.0 brief alignment audit complete.")
    print()
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    print(f"Info: {len(infos)}")
    print(f"Total findings: {len(findings)}")
    print()
    print(f"TXT output: {txt_path}")
    print(f"CSV output: {csv_path}")


def main():
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Source directory not found: {SOURCE_DIR}")

    findings = []

    findings.extend(audit_required_files())

    for path in sorted(SOURCE_DIR.glob("*.txt")):
        findings.extend(audit_file(path))

    findings.extend(audit_pack_concepts())

    write_outputs(findings)


if __name__ == "__main__":
    main()