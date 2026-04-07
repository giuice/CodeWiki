const START_MARKER = "<!-- codewiki:start -->";
const END_MARKER = "<!-- codewiki:end -->";

type MergeableRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is MergeableRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge<T extends MergeableRecord>(target: T, source: Partial<T>): T {
  const result: MergeableRecord = { ...target };

  for (const [key, sourceValue] of Object.entries(source as MergeableRecord)) {
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = result[key];
    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
      continue;
    }

    result[key] = Array.isArray(sourceValue) ? [...sourceValue] : sourceValue;
  }

  return result as T;
}

export function deduplicateHookArray(existing: string[], incoming: string[]): string[] {
  const merged = [...existing];
  const seen = new Set(existing);

  for (const entry of incoming) {
    if (seen.has(entry)) {
      continue;
    }

    seen.add(entry);
    merged.push(entry);
  }

  return merged;
}

export function mergeMarkerSection(existing: string, newContent: string, force: boolean): string {
  const startIndex = existing.indexOf(START_MARKER);
  const endIndex = existing.indexOf(END_MARKER);

  if (startIndex !== -1 && endIndex !== -1) {
    if (!force) {
      return existing;
    }

    return `${existing.slice(0, startIndex)}${START_MARKER}\n${newContent}\n${END_MARKER}${existing.slice(endIndex + END_MARKER.length)}`;
  }

  const separator = existing.length > 0 ? "\n\n" : "";
  return `${existing}${separator}${START_MARKER}\n${newContent}\n${END_MARKER}\n`;
}