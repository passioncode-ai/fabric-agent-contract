// #region rule-codes — docs: docs/specification/conformance.md#semantic-rule-codes
/**
 * G-13 (DEC-0029): every semantic rule code is allocated once, in the register in
 * conformance.md, and has one meaning:
 *
 * - it is defined once — in the register for FAC-SEM-000…008, otherwise in one row, of one table,
 *   of the one specification the register names (a row anywhere in the specifications that starts
 *   with the code is a definition, the register's own rows excepted), with the kinds the register
 *   gives it;
 * - one module in src/ checks it, and every code a module names is allocated;
 * - the next-free marker is above every allocated code.
 *
 * Two runs that numbered rules by hand gave FAC-SEM-028 and FAC-SEM-029 two meanings; the register is
 * what an id reservation reads, and this check is what refuses the collision when either branch
 * reaches main — including the branch that deletes the other's table rows to get past it.
 */
export interface TextFile { path: string; text: string }

const ROW = /^\|\s*`(FAC-SEM-\d{3})`\s*\|([^|]*)\|([^|]*)\|/gm;
const NEXT_FREE = /\*\*Next free rule code:\*\* `FAC-SEM-(\d{3})`/;
/** A code as a string literal: how a checker names it, directly or through a constant. */
const LITERAL = /["'`](FAC-SEM-\d{3})["'`]/g;
/** The register's codes defined in the register itself; every later code lives in a specification. */
const LAST_REGISTER_DEFINED = 8;

const number = (code: string) => Number(/FAC-SEM-(\d{3})/.exec(code)?.[1] ?? Number.NaN);
const kinds = (cell: string) => [...cell.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((match) => match[1] ?? "").sort().join(",");
const section = (text: string, heading: RegExp) => {
  const start = text.search(heading);
  if (start < 0) return { inside: "", outside: text };
  const rest = text.slice(start);
  const next = rest.slice(1).search(/^## /m);
  const end = next < 0 ? text.length : start + 1 + next;
  return { inside: text.slice(start, end), outside: text.slice(0, start) + text.slice(end) };
};

export interface RegisterRow { code: string; kinds: string; home: string | undefined }

/** The register's rows, in file order, with the specification each names (undefined: defined in the register). */
export function registerRows(register: string): RegisterRow[] {
  const { inside } = section(register, /^## Semantic rule codes$/m);
  return [...inside.matchAll(ROW)].map((match) => ({
    code: match[1] ?? "",
    kinds: kinds(match[2] ?? ""),
    home: /\]\(([a-z-]+\.md)#semantic-rules\)/.exec(match[3] ?? "")?.[1]
  }));
}

/** Every definition row a specification holds: a table row that starts with a code. */
export function definitionRows(spec: string): Array<{ code: string; kinds: string }> {
  return [...spec.matchAll(ROW)].map((match) => ({ code: match[1] ?? "", kinds: kinds(match[2] ?? "") }));
}

export function ruleCodeFindings(register: TextFile, specs: TextFile[], sources: TextFile[]): string[] {
  const findings: string[] = [];
  const rows = registerRows(register.text);
  const allocated = new Map<string, RegisterRow>();
  let previous = -1;
  for (const row of rows) {
    if (allocated.has(row.code)) findings.push(`${register.path}: ${row.code} is allocated twice (G-13)`);
    allocated.set(row.code, row);
    if (number(row.code) <= previous) findings.push(`${register.path}: ${row.code} is out of order (G-13)`);
    previous = Math.max(previous, number(row.code));
    if (row.home === undefined && number(row.code) > LAST_REGISTER_DEFINED) findings.push(`${register.path}: ${row.code} must be defined in a specification's semantic-rules table, not in the register (G-13)`);
  }

  const nextFree = Number(NEXT_FREE.exec(register.text)?.[1] ?? Number.NaN);
  if (!Number.isInteger(nextFree)) findings.push(`${register.path}: the **Next free rule code:** marker is missing (G-13)`);
  else if (nextFree <= previous) findings.push(`${register.path}: next free FAC-SEM-${String(nextFree).padStart(3, "0")} is not above the highest allocated code (G-13)`);

  // The register file outside its own section is a specification like any other.
  const documents = [...specs, { path: register.path, text: section(register.text, /^## Semantic rule codes$/m).outside }];
  const definitions = new Map<string, Array<{ path: string; kinds: string }>>();
  for (const document of documents) {
    for (const row of definitionRows(document.text)) definitions.set(row.code, [...(definitions.get(row.code) ?? []), { path: document.path, kinds: row.kinds }]);
  }
  for (const [code, rowsFound] of definitions) {
    const where = rowsFound.map((row) => row.path).join(", ");
    if (rowsFound.length > 1) findings.push(`${code} is defined in ${rowsFound.length} rows (${where}) (G-13)`);
    const entry = allocated.get(code);
    if (!entry) { findings.push(`${where}: ${code} is defined but not allocated in ${register.path} (G-13)`); continue; }
    for (const row of rowsFound) if (entry.kinds && row.kinds && entry.kinds !== row.kinds) findings.push(`${row.path}: ${code} checks ${row.kinds}, the register says ${entry.kinds} (G-13)`);
  }
  for (const { code, home } of rows) {
    const rowsFound = definitions.get(code) ?? [];
    if (home === undefined && rowsFound.length > 0) findings.push(`${code}: the register defines it, yet ${rowsFound.map((row) => row.path).join(", ")} defines it too (G-13)`);
    if (home !== undefined && !rowsFound.some((row) => row.path.endsWith(`/${home}`) || row.path === home)) findings.push(`${code}: the register names ${home}, which does not define it (G-13)`);
  }

  const checkers = new Map<string, Set<string>>();
  for (const source of sources) {
    for (const match of source.text.matchAll(LITERAL)) {
      const code = match[1] ?? "";
      checkers.set(code, (checkers.get(code) ?? new Set()).add(source.path));
    }
  }
  for (const [code, files] of checkers) {
    if (!allocated.has(code)) findings.push(`${[...files].join(", ")}: names ${code}, which has no row in ${register.path} (G-13)`);
    if (files.size > 1) findings.push(`${code} is checked by ${files.size} modules (${[...files].join(", ")}): one code, one rule, one checker (G-13)`);
  }
  for (const code of allocated.keys()) if (!checkers.has(code)) findings.push(`${register.path}: ${code} is allocated but no checker in src/ names it (G-13)`);
  return findings;
}
// #endregion rule-codes
