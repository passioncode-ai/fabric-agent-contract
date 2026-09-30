#!/usr/bin/env python3
"""Small ux-contract v4 integrity gate for this documentation-only project."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
UX = ROOT / "docs" / "ux"
files = {name: (UX / name).read_text() for name in ("foundation.md", "flows.md", "screens.md", "scenarios.md")}
findings: list[str] = []


def ids(name: str, prefix: str) -> set[str]:
    return set(re.findall(rf"^### ({prefix}-\d+):", files[name], re.MULTILINE))


def duplicates(name: str, prefix: str) -> None:
    found = re.findall(rf"^### ({prefix}-\d+):", files[name], re.MULTILINE)
    for value in sorted(set(found)):
        if found.count(value) > 1:
            findings.append(f"U001 {name}: duplicate {value}")


for filename, prefix in (("foundation.md", "P"), ("foundation.md", "JTBD"), ("foundation.md", "JRN"), ("foundation.md", "ST"), ("flows.md", "FLW"), ("screens.md", "SCR"), ("scenarios.md", "SCN")):
    duplicates(filename, prefix)

stories = ids("foundation.md", "ST")
flows = ids("flows.md", "FLW")
screens = ids("screens.md", "SCR")
scenarios = ids("scenarios.md", "SCN")

for ref in sorted(set(re.findall(r"\bST-\d{3}\b", files["scenarios.md"])) - stories):
    findings.append(f"U012 scenarios.md: missing story {ref}")
for ref in sorted(set(re.findall(r"\bFLW-\d{2}\b", files["scenarios.md"])) - flows):
    findings.append(f"U013 scenarios.md: missing flow {ref}")
for ref in sorted(set(re.findall(r"\bSCR-\d{2}\b", files["flows.md"])) - screens):
    findings.append(f"U010 flows.md: missing screen {ref}")
for story in sorted(stories):
    if story not in files["scenarios.md"]:
        findings.append(f"U014 foundation.md: story without scenario {story}")
for flow in sorted(flows):
    if flow not in files["scenarios.md"]:
        findings.append(f"U013 flows.md: flow without scenario {flow}")
for screen in sorted(screens):
    if screen not in files["flows.md"]:
        findings.append(f"U011 screens.md: orphan screen {screen}")
for scenario in sorted(scenarios):
    if scenario not in files["screens.md"]:
        findings.append(f"U011 scenarios.md: scenario is not mapped to a screen {scenario}")

if "- **Figma:** disabled" not in files["foundation.md"]:
    findings.append("U020 foundation.md: Figma choice is not explicit")
if "- **Web surfaces:** no" not in files["screens.md"]:
    findings.append("U050 screens.md: Web surfaces declaration missing")

valid_status = {"draft", "validated", "implemented", "retired"}
for block in re.split(r"(?=^### SCN-\d{3}:)", files["scenarios.md"], flags=re.MULTILINE)[1:]:
    header = block.splitlines()[0]
    match = re.search(r"^- \*\*Status:\*\* (\S+)$", block, re.MULTILINE)
    if not match or match.group(1) not in valid_status:
        findings.append(f"U070 scenarios.md: invalid or missing status in {header}")
    if "- **Expected result:**" not in block:
        findings.append(f"U060 scenarios.md: expected result missing in {header}")
    if "- **Errors & recovery:**" not in block:
        findings.append(f"U060 scenarios.md: recovery missing in {header}")

if findings:
    print("\n".join(findings))
    sys.exit(1)

print(f"UX lint passed: {len(stories)} stories, {len(flows)} flows, {len(screens)} screens, {len(scenarios)} scenarios")
