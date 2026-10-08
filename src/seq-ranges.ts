// #region seq-ranges — docs: docs/specification/activity.md#streams
/**
 * Closed integer ranges of stream seqs. Every coverage question about a stream — what is held,
 * what an overflow accounted for, what is still missing — is answered by merging ranges, never by
 * walking seq by seq: an overflow may name 2^53 seqs.
 */
export type SeqRange = readonly [number, number];

/** Sorted, disjoint ranges; adjacent ranges are joined. Ranges with `to < from` are dropped. */
export function mergeRanges(ranges: Iterable<SeqRange>): SeqRange[] {
  const sorted = [...ranges].filter(([from, to]) => to >= from).sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [from, to] of sorted) {
    const last = merged[merged.length - 1];
    if (last && from <= last[1] + 1) last[1] = Math.max(last[1], to);
    else merged.push([from, to]);
  }
  return merged;
}

/** The parts of `from…to` that `covered` does not cover. */
export function uncovered(covered: Iterable<SeqRange>, from: number, to: number): SeqRange[] {
  const gaps: SeqRange[] = [];
  let next = from;
  for (const [a, b] of mergeRanges(covered)) {
    if (b < next) continue;
    if (a > to) break;
    if (a > next) gaps.push([next, Math.min(a - 1, to)]);
    next = Math.max(next, b + 1);
    if (next > to) break;
  }
  if (next <= to) gaps.push([next, to]);
  return gaps;
}

/** The highest seq `x >= start` such that every seq in `start + 1 … x` is covered. */
export function contiguousFrom(covered: Iterable<SeqRange>, start: number): number {
  let high = start;
  for (const [a, b] of mergeRanges(covered)) {
    if (b <= high) continue;
    if (a > high + 1) break;
    high = b;
  }
  return high;
}

/** Ranges from `[{fromSeq, toSeq}]` objects or `[from, to]` pairs; anything else is ignored. */
export function rangesOf(value: unknown): SeqRange[] {
  if (!Array.isArray(value)) return [];
  const out: SeqRange[] = [];
  for (const item of value) {
    if (Array.isArray(item) && typeof item[0] === "number" && typeof item[1] === "number") out.push([item[0], item[1]]);
    else if (typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).fromSeq === "number" && typeof (item as Record<string, unknown>).toSeq === "number") {
      out.push([(item as Record<string, number>).fromSeq as number, (item as Record<string, number>).toSeq as number]);
    }
  }
  return out;
}
// #endregion seq-ranges
