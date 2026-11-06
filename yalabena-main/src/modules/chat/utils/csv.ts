/**
 * Minimal RFC-4180-style CSV field escaping.
 * Quotes a field only when it contains a comma, quote, or newline,
 * and doubles any internal quotes.
 */
export function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvLine(fields: unknown[]): string {
  return fields.map(escapeCsvField).join(',');
}
