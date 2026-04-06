#!/usr/bin/env python3
"""
QS Tools UI Audit Script

Scans a Next.js / React / Tailwind codebase for:
- hardcoded color classes
- inline styles
- risky grid layouts
- tables
- overflow risks
- fixed width / height classes
- tiny text classes
- sticky/fixed positioning
- long input rows / dense flex rows
- mobile-collapse candidates

Outputs:
- ui_audit_report.txt
- ui_audit_report.json

Usage:
    python mobile_ui_audit.py --root D:\QSTools\qstools-web
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable


TEXT_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".md", ".json"
}

DEFAULT_SCAN_DIRS = ["app", "components", "hooks", "lib"]
DEFAULT_EXCLUDE_DIRS = {
    ".next", "node_modules", ".git", "dist", "build", "coverage", "out"
}

COLOR_PATTERN = re.compile(
    r"(?:^|\s)(?:bg|text|border|ring|stroke|fill|from|via|to|decoration|placeholder)-"
    r"(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)"
    r"(?:-[0-9]{2,3})?"
)

RISK_PATTERNS = {
    "inline_style": re.compile(r"\bstyle\s*=\s*\{{"),
    "table_tag": re.compile(r"<\s*table\b"),
    "overflow_x_auto": re.compile(r"overflow-x-auto"),
    "overflow_hidden": re.compile(r"overflow-hidden"),
    "fixed_width": re.compile(r"(?:^|\s)(?:w|min-w|max-w)-[^\s\"]+"),
    "fixed_height": re.compile(r"(?:^|\s)(?:h|min-h|max-h)-[^\s\"]+"),
    "tiny_text": re.compile(r"(?:^|\s)(?:text-xs|text-\[\d+px\])"),
    "grid_cols_2plus": re.compile(r"(?:^|\s)(?:grid-cols-[2-9]|sm:grid-cols-[2-9]|md:grid-cols-[2-9]|lg:grid-cols-[2-9]|xl:grid-cols-[2-9]|2xl:grid-cols-[2-9])"),
    "flex_row": re.compile(r"(?:^|\s)flex-row(?:\s|$)"),
    "nowrap": re.compile(r"(?:^|\s)(?:whitespace-nowrap|flex-nowrap)(?:\s|$)"),
    "sticky": re.compile(r"(?:^|\s)sticky(?:\s|$)"),
    "fixed": re.compile(r"(?:^|\s)fixed(?:\s|$)"),
    "absolute": re.compile(r"(?:^|\s)absolute(?:\s|$)"),
    "horizontal_scroll_shell": re.compile(r"(?:^|\s)(?:overflow-x-scroll|overflow-auto)(?:\s|$)"),
    "manual_px_values": re.compile(r"(?:^|\s)(?:w|h|min-w|min-h|max-w|max-h|p|px|py|m|mx|my|gap)-\[[^\]]+\]"),
    "small_touch_target": re.compile(r"(?:^|\s)(?:h-[1-9]|h-10|px-1|px-2|py-1|py-2)(?:\s|$)"),
}

CLASSNAME_RE = re.compile(
    r"(?:className|class)\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|\{`([^`]*)`\})",
    re.DOTALL,
)

INPUT_RE = re.compile(r"<\s*(input|select|textarea|button)\b", re.IGNORECASE)
SECTION_NAMES = [
    "StatusStrip", "Summary", "Card", "Table", "Drilldown", "HelpPanel",
    "Scenario", "People Cost", "Business Cost", "Recovery", "Entitlements",
    "Employer Contributions", "Charge-Out", "Profiles"
]


@dataclass
class MatchRecord:
    line: int
    kind: str
    snippet: str


@dataclass
class FileAudit:
    path: str
    class_blocks: int
    inputs: int
    findings: list[MatchRecord]
    score: int
    collapse_candidate: bool


class Auditor:
    def __init__(self, root: Path, scan_dirs: list[str]) -> None:
        self.root = root
        self.scan_dirs = scan_dirs
        self.file_audits: list[FileAudit] = []
        self.global_counts: Counter[str] = Counter()
        self.class_counter: Counter[str] = Counter()
        self.findings_by_kind: defaultdict[str, list[tuple[str, int, str]]] = defaultdict(list)

    def iter_files(self) -> Iterable[Path]:
        for rel in self.scan_dirs:
            base = self.root / rel
            if not base.exists():
                continue
            for path in base.rglob("*"):
                if not path.is_file():
                    continue
                if any(part in DEFAULT_EXCLUDE_DIRS for part in path.parts):
                    continue
                if path.suffix.lower() not in TEXT_EXTENSIONS:
                    continue
                yield path

    def audit(self) -> None:
        for path in sorted(self.iter_files()):
            self.file_audits.append(self.audit_file(path))

    def audit_file(self, path: Path) -> FileAudit:
        text = path.read_text(encoding="utf-8", errors="ignore")
        findings: list[MatchRecord] = []
        class_blocks = 0
        inputs = len(INPUT_RE.findall(text))

        lines = text.splitlines()
        for i, line in enumerate(lines, start=1):
            if COLOR_PATTERN.search(line):
                findings.append(MatchRecord(i, "hardcoded_color", line.strip()))
                self.global_counts["hardcoded_color"] += 1
                self.findings_by_kind["hardcoded_color"].append((self.rel(path), i, line.strip()))

            for kind, pattern in RISK_PATTERNS.items():
                if pattern.search(line):
                    findings.append(MatchRecord(i, kind, line.strip()))
                    self.global_counts[kind] += 1
                    self.findings_by_kind[kind].append((self.rel(path), i, line.strip()))

        for match in CLASSNAME_RE.finditer(text):
            class_blocks += 1
            raw = next(group for group in match.groups() if group is not None)
            for cls in raw.split():
                self.class_counter[cls] += 1

        dense_input_rows = self.detect_dense_input_rows(lines)
        for line_no, snippet in dense_input_rows:
            findings.append(MatchRecord(line_no, "dense_input_row", snippet))
            self.global_counts["dense_input_row"] += 1
            self.findings_by_kind["dense_input_row"].append((self.rel(path), line_no, snippet))

        collapse_candidate = self.detect_collapse_candidate(path, text, inputs, findings)
        if collapse_candidate:
            self.global_counts["collapse_candidate"] += 1

        score = self.score_findings(findings, inputs, collapse_candidate)

        return FileAudit(
            path=self.rel(path),
            class_blocks=class_blocks,
            inputs=inputs,
            findings=findings,
            score=score,
            collapse_candidate=collapse_candidate,
        )

    def detect_dense_input_rows(self, lines: list[str]) -> list[tuple[int, str]]:
        out: list[tuple[int, str]] = []
        for i, line in enumerate(lines, start=1):
            if "grid-cols-" in line or "flex-row" in line or "md:grid-cols-" in line:
                window = " ".join(lines[i - 1:i + 6])
                input_count = len(INPUT_RE.findall(window))
                if input_count >= 3:
                    out.append((i, line.strip()))
        return out

    def detect_collapse_candidate(
        self,
        path: Path,
        text: str,
        inputs: int,
        findings: list[MatchRecord],
    ) -> bool:
        name = path.stem.lower()
        keyword_hit = any(keyword.lower().replace(" ", "") in name.replace("-", "") for keyword in SECTION_NAMES)
        high_density = inputs >= 5 or len(findings) >= 8
        long_component = len(text.splitlines()) >= 120
        return keyword_hit and (high_density or long_component)

    def score_findings(
        self,
        findings: list[MatchRecord],
        inputs: int,
        collapse_candidate: bool,
    ) -> int:
        weights = {
            "hardcoded_color": 2,
            "inline_style": 4,
            "table_tag": 5,
            "grid_cols_2plus": 3,
            "dense_input_row": 4,
            "fixed_width": 2,
            "fixed_height": 1,
            "tiny_text": 3,
            "nowrap": 3,
            "overflow_hidden": 2,
            "sticky": 2,
            "fixed": 2,
            "absolute": 1,
            "small_touch_target": 2,
            "manual_px_values": 2,
        }
        score = sum(weights.get(f.kind, 1) for f in findings)
        if inputs >= 6:
            score += 3
        elif inputs >= 3:
            score += 1
        if collapse_candidate:
            score += 3
        return score

    def rel(self, path: Path) -> str:
        return str(path.relative_to(self.root)).replace("\\", "/")

    def build_report_text(self) -> str:
        files_sorted = sorted(self.file_audits, key=lambda f: f.score, reverse=True)
        lines: list[str] = []
        lines.append("QS Tools UI Audit Report")
        lines.append("=" * 80)
        lines.append(f"Root: {self.root}")
        lines.append(f"Files scanned: {len(self.file_audits)}")
        lines.append("")

        lines.append("Global Finding Counts")
        lines.append("-" * 80)
        if self.global_counts:
            for kind, count in self.global_counts.most_common():
                lines.append(f"{kind}: {count}")
        else:
            lines.append("No findings.")
        lines.append("")

        lines.append("Top Risk Files")
        lines.append("-" * 80)
        if files_sorted:
            for fa in files_sorted[:25]:
                cc = "yes" if fa.collapse_candidate else "no"
                lines.append(
                    f"score={fa.score:>3} | inputs={fa.inputs:>2} | collapse_candidate={cc:<3} | {fa.path}"
                )
        else:
            lines.append("No files scanned.")
        lines.append("")

        lines.append("Most Common Class Tokens")
        lines.append("-" * 80)
        for cls, count in self.class_counter.most_common(60):
            lines.append(f"{count:>4}  {cls}")
        lines.append("")

        lines.append("Findings By Category")
        lines.append("-" * 80)
        for kind in sorted(self.findings_by_kind):
            lines.append(f"\n[{kind}]")
            for path, line_no, snippet in self.findings_by_kind[kind][:120]:
                lines.append(f"- {path}:{line_no} :: {snippet}")
        lines.append("")

        lines.append("Per File Detail")
        lines.append("-" * 80)
        for fa in files_sorted:
            lines.append(
                f"\n{fa.path}\n  score={fa.score} | class_blocks={fa.class_blocks} | inputs={fa.inputs} | collapse_candidate={fa.collapse_candidate}"
            )
            if not fa.findings:
                lines.append("  no findings")
                continue
            grouped = Counter(f.kind for f in fa.findings)
            lines.append("  summary: " + ", ".join(f"{k}={v}" for k, v in grouped.most_common()))
            for f in fa.findings[:30]:
                lines.append(f"  - L{f.line} [{f.kind}] {f.snippet}")
            if len(fa.findings) > 30:
                lines.append(f"  ... {len(fa.findings) - 30} more findings")

        return "\n".join(lines)

    def build_report_json(self) -> dict:
        return {
            "root": str(self.root),
            "files_scanned": len(self.file_audits),
            "global_counts": dict(self.global_counts),
            "top_risk_files": [
                {
                    "path": fa.path,
                    "score": fa.score,
                    "inputs": fa.inputs,
                    "collapse_candidate": fa.collapse_candidate,
                }
                for fa in sorted(self.file_audits, key=lambda f: f.score, reverse=True)[:50]
            ],
            "class_frequency": dict(self.class_counter.most_common(300)),
            "files": [
                {
                    **asdict(fa),
                    "findings": [asdict(f) for f in fa.findings],
                }
                for fa in sorted(self.file_audits, key=lambda f: f.score, reverse=True)
            ],
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit a React/Tailwind UI codebase for mobile and theme risks.")
    parser.add_argument("--root", required=True, help="Project root folder")
    parser.add_argument(
        "--scan-dirs",
        nargs="*",
        default=DEFAULT_SCAN_DIRS,
        help="Top-level folders to scan relative to root",
    )
    parser.add_argument(
        "--out-dir",
        default=None,
        help="Output directory for reports. Defaults to <root>/audit_reports",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Root folder not found: {root}")

    out_dir = Path(args.out_dir).resolve() if args.out_dir else root / "audit_reports"
    out_dir.mkdir(parents=True, exist_ok=True)

    auditor = Auditor(root=root, scan_dirs=args.scan_dirs)
    auditor.audit()

    txt_path = out_dir / "ui_audit_report.txt"
    json_path = out_dir / "ui_audit_report.json"

    txt_path.write_text(auditor.build_report_text(), encoding="utf-8")
    json_path.write_text(json.dumps(auditor.build_report_json(), indent=2), encoding="utf-8")

    print(f"Audit complete.")
    print(f"Scanned files: {len(auditor.file_audits)}")
    print(f"Text report: {txt_path}")
    print(f"JSON report: {json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
