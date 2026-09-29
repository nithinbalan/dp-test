/**
 * Minimal RFC 4180 CSV parser — quoted fields (with embedded commas, newlines,
 * and `""` escapes), CRLF or LF line endings, an optional leading BOM. No
 * dependency: correctly handling the quoting rules is a couple dozen lines,
 * not a reason to pull in a package (docs/SECURITY_HYGIENE.md §7).
 *
 * Returns one array per row, one string per cell — no header handling, no
 * type coercion. `./service.ts` owns what the columns mean.
 */

/** Parser state threaded through one character at a time. */
type ParseState = {
  rows: string[][];
  row: string[];
  field: string;
  inQuotes: boolean;
  sawAnyField: boolean;
};

/** Inside a quoted field: `""` is a literal quote, any other `"` closes it. */
function consumeQuotedChar(state: ParseState, ch: string, next: string | undefined): number {
  if (ch !== '"') {
    state.field += ch;
    return 0;
  }
  if (next === '"') {
    state.field += '"';
    return 1;
  }
  state.inQuotes = false;
  return 0;
}

/** Outside a quote: the structural characters that end a field or a row. */
function consumeUnquotedChar(state: ParseState, ch: string): void {
  if (ch === '"') {
    state.inQuotes = true;
  } else if (ch === ',') {
    state.row.push(state.field);
    state.field = '';
    state.sawAnyField = true;
  } else if (ch === '\n') {
    state.row.push(state.field);
    state.rows.push(state.row);
    state.row = [];
    state.field = '';
    state.sawAnyField = false;
  } else if (ch !== '\r') {
    // '\r' is consumed as part of the following '\n', or a lone CR — either way, ignored.
    state.field += ch;
  }
}

export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const state: ParseState = { rows: [], row: [], field: '', inQuotes: false, sawAnyField: false };

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i] ?? '';
    if (state.inQuotes) {
      i += consumeQuotedChar(state, ch, src[i + 1]);
    } else {
      consumeUnquotedChar(state, ch);
    }
  }
  if (state.sawAnyField || state.field.length > 0) {
    state.row.push(state.field);
    state.rows.push(state.row);
  }

  return state.rows;
}
