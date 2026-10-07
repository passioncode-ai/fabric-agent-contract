// #region rule-codes — docs: docs/specification/conformance.md#semantic-rule-codes
/**
 * G-13 (DEC-0029): every semantic rule code is allocated once, in the register in
 * conformance.md, and defined once — in that register for FAC-SEM-000…008, otherwise in the
 * semantic-rules table of the one specification the register names. Every code the checker
 * emits has a register row, and every register row is a code the checker emits.
 *
 * Two runs that numbered rules by hand gave FAC-SEM-028 and FAC-SEM-029 two meanings; the
 * register is what an id reservation reads, and this check is what refuses the collision when
 * either branch reaches main.
 */
export interface TextFile { path: string; text: string }

const CODE = /FAC-SEM-(\d{3})/;
const ROW = /^\|\s*`(FAC-SEM-\d{3})`\s*\|([^|]*)\|([^|]*)\|/gm;
const NEXT_FREE = /\*\*Next free rule code:\*\* `FAC-SEM-(\d{3})`/;
const EMITTED = /code:\s*"(FAC-SEM-\d{3})"/g;

const number = (code: string) => Number(CODE.exec(code)?.[1] ?? Number.NaN);

/** The register's rows, in file order, with the specification file each names (undefined: defined in the register). */
export function registerRows(register: string): Array<{ code: string; home: string | undefined }> {
  const section = register.split(/^## Semantic rule codes$/m)[1]?.split(/^## /m)[0] ?? "";
  return [...section.matchAll(ROW)].map((match) => ({
    code: match[1] ?? "",
    home: /\]\(([a-z-]+\.md)#semantic-rules\)/.exec(match[3] ?? "")?.[1]
  }));
}

/** Codes a specification's semantic-rules table defines (rows that start with a code). */
export function definedCodes(spec: string): string[] {
  const section = spec.split(/^## Semantic rules$/m)[1]?.split(/^## /m)[0] ?? "";
  return [...section.matchAll(ROW)].map((match) => match[1] ?? "");
}

export function ruleCodeFindings(register: TextFile, specs: TextFile[], sources: TextFile[]): string[] {
  const findings: string[] = [];
  const rows = registerRows(register.text);
  const seen = new Set<string>();
  let previous = -1;
  for (const { code } of rows) {
    if (seen.has(code)) findings.push(`${register.path}: ${code} is allocated twice (G-13)`);
    seen.add(code);
    if (number(code) <= previous) findings.push(`${register.path}: ${code} is out of order (G-13)`);
    previous = Math.max(previous, number(code));
  }

  const nextFree = Number(NEXT_FREE.exec(register.text)?.[1] ?? Number.NaN);
  if (!Number.isInteger(nextFree)) findings.push(`${register.path}: the **Next free rule code:** marker is missing (G-13)`);
  else if (nextFree <= previous) findings.push(`${register.path}: next free FAC-SEM-${String(nextFree).padStart(3, "0")} is not above the highest allocated code (G-13)`);

  const definitions = new Map<string, string[]>();
  for (const spec of specs) {
    for (const code of definedCodes(spec.text)) definitions.set(code, [...(definitions.get(code) ?? []), spec.path]);
  }
  for (const [code, files] of definitions) {
    if (files.length > 1) findings.push(`${code} is defined in ${files.length} semantic-rules rows (${files.join(", ")}) (G-13)`);
    if (!seen.has(code)) findings.push(`${files.join(", ")}: ${code} is defined but not allocated in ${register.path} (G-13)`);
  }
  for (const { code, home } of rows) {
    const files = definitions.get(code) ?? [];
    if (home === undefined && files.length > 0) findings.push(`${code}: the register defines it, yet ${files.join(", ")} defines it too (G-13)`);
    if (home !== undefined && !files.some((file) => file.endsWith(`/${home}`) || file === home)) findings.push(`${code}: the register names ${home}, whose semantic-rules table does not define it (G-13)`);
  }

  const emitted = new Set<string>();
  for (const source of sources) {
    for (const match of source.text.matchAll(EMITTED)) {
      const code = match[1] ?? "";
      emitted.add(code);
      if (!seen.has(code)) findings.push(`${source.path}: emits ${code}, which has no row in ${register.path} (G-13)`);
    }
  }
  for (const code of seen) if (!emitted.has(code)) findings.push(`${register.path}: ${code} is allocated but no checker in src/ emits it (G-13)`);
  return findings;
}
// #endregion rule-codes
