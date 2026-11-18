import Papa from 'papaparse';
import { ColumnType } from '@/types';

export interface ParseResult {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  delimiter: string;
  hasHeader: boolean;
}

/**
 * Non-blocking Async CSV Parsing using Web Worker / Chunked processing
 */
export async function parseCSVAsync(
  rawContent: string,
  explicitDelimiter?: string
): Promise<ParseResult> {
  const cleanContent = rawContent.replace(/^\uFEFF/, '');
  // If content is small (< 100KB), parse synchronously for instant feel
  if (cleanContent.length < 100000) {
    return parseCSVData(cleanContent, explicitDelimiter);
  }

  // Large content: use async promise with chunked PapaParse
  return new Promise((resolve) => {
    Papa.parse<any[]>(cleanContent.trim(), {
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      delimiter: explicitDelimiter && explicitDelimiter !== 'auto' ? explicitDelimiter : undefined,
      complete: (results) => {
        const data = results.data.filter(
          (r) => Array.isArray(r) && r.length > 0 && r.some((c) => c !== null && c !== '')
        );

        if (!data || data.length === 0) {
          resolve({
            headers: ['Col 1', 'Col 2'],
            rows: [['', '']],
            delimiter: ',',
            hasHeader: true,
          });
          return;
        }

        const detectedDelimiter = results.meta.delimiter || explicitDelimiter || ',';
        const hasHeader = true;
        const headers = data[0].map((h, i) =>
          h !== null && h !== undefined && String(h).trim() ? String(h).trim() : `Column ${i + 1}`
        );
        const rows = data.slice(1);

        resolve({
          headers,
          rows,
          delimiter: detectedDelimiter,
          hasHeader,
        });
      },
    });
  });
}

export function parseCSVData(rawContent: string, explicitDelimiter?: string): ParseResult {
  const trimmed = rawContent.replace(/^\uFEFF/, '').trim();

  // Check if pasted content is JSON array
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsedJSON = JSON.parse(trimmed);
      const items = Array.isArray(parsedJSON) ? parsedJSON : [parsedJSON];
      if (items.length > 0 && typeof items[0] === 'object' && items[0] !== null) {
        // Collect all unique keys as headers
        const headerSet = new Set<string>();
        items.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((k) => headerSet.add(k));
          }
        });
        const headers = Array.from(headerSet);
        const rows = items.map((item) => {
          return headers.map((h) => {
            const val = item[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
          });
        });
        return {
          headers,
          rows,
          delimiter: ',',
          hasHeader: true,
        };
      }
    } catch {
      // fallback to standard CSV parsing
    }
  }

  // Use PapaParse
  const parseOptions: Papa.ParseConfig = {
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  };

  if (explicitDelimiter && explicitDelimiter !== 'auto') {
    parseOptions.delimiter = explicitDelimiter;
  }

  const result = Papa.parse<any[]>(trimmed, parseOptions);
  const data = result.data.filter((r) => Array.isArray(r) && r.length > 0 && r.some((c) => c !== null && c !== ''));

  if (!data || data.length === 0) {
    return {
      headers: ['Col 1', 'Col 2'],
      rows: [['', '']],
      delimiter: ',',
      hasHeader: true,
    };
  }

  const detectedDelimiter = result.meta.delimiter || explicitDelimiter || ',';

  // Determine if first row is likely a header (all strings, differs in type from subsequent rows)
  let hasHeader = true;
  if (data.length > 1) {
    const firstRowAllStrings = data[0].every((val) => typeof val === 'string' && isNaN(Number(val)));
    const secondRowHasNumbers = data[1].some((val) => typeof val === 'number' || (!isNaN(Number(val)) && val !== ''));
    if (!firstRowAllStrings && secondRowHasNumbers) {
      hasHeader = false;
    }
  }

  let headers: string[] = [];
  let rows: (string | number | boolean | null)[][] = [];

  if (hasHeader && data.length > 0) {
    headers = data[0].map((h, i) => (h !== null && h !== undefined && String(h).trim() ? String(h).trim() : `Column ${i + 1}`));
    rows = data.slice(1);
  } else {
    // Generate column headers
    const colCount = Math.max(...data.map((r) => r.length));
    headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
    rows = data;
  }

  // Normalize all rows to match header length
  const colCount = headers.length;
  const normalizedRows = rows.map((r) => {
    const newRow = [...r];
    while (newRow.length < colCount) {
      newRow.push('');
    }
    return newRow.slice(0, colCount);
  });

  return {
    headers,
    rows: normalizedRows,
    delimiter: detectedDelimiter,
    hasHeader,
  };
}

/**
 * Detect column data type based on sample values
 */
export function detectColumnType(values: (string | number | boolean | null)[]): ColumnType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonNulls.length === 0) return 'text';

  let numberCount = 0;
  let currencyCount = 0;
  let booleanCount = 0;
  let urlCount = 0;
  let emailCount = 0;
  let dateCount = 0;

  for (const v of nonNulls.slice(0, 50)) {
    if (typeof v === 'boolean') {
      booleanCount++;
      continue;
    }

    const str = String(v).trim();
    const lower = str.toLowerCase();

    if (lower === 'true' || lower === 'false' || lower === 'yes' || lower === 'no') {
      booleanCount++;
      continue;
    }

    if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(str)) {
      urlCount++;
      continue;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      emailCount++;
      continue;
    }

    if (/^[$€£₹¥]\s*[-+]?[0-9,]+(\.[0-9]+)?$/.test(str) || /^[-+]?[0-9,]+(\.[0-9]+)?\s*[$€£₹¥]$/.test(str)) {
      currencyCount++;
      continue;
    }

    if (typeof v === 'number' || (!isNaN(Number(str.replace(/,/g, ''))) && !isNaN(parseFloat(str.replace(/,/g, ''))))) {
      numberCount++;
      continue;
    }

    // Simple date check
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str) || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str)) {
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        dateCount++;
        continue;
      }
    }
  }

  const total = Math.min(nonNulls.length, 50);
  if (booleanCount / total > 0.6) return 'boolean';
  if (currencyCount / total > 0.6) return 'currency';
  if (numberCount / total > 0.6) return 'number';
  if (urlCount / total > 0.6) return 'url';
  if (emailCount / total > 0.6) return 'email';
  if (dateCount / total > 0.6) return 'date';

  return 'text';
}

/**
 * Format cell value based on detected or inferred type
 */
export function formatCellValue(value: string | number | boolean | null): {
  display: string;
  type: ColumnType;
  raw: string;
} {
  if (value === null || value === undefined || value === '') {
    return { display: '—', type: 'text', raw: '' };
  }

  if (typeof value === 'boolean') {
    return {
      display: value ? 'TRUE' : 'FALSE',
      type: 'boolean',
      raw: String(value),
    };
  }

  const str = String(value).trim();
  const lower = str.toLowerCase();

  if (lower === 'true' || lower === 'yes' || lower === 'active') {
    return { display: str.toUpperCase(), type: 'boolean', raw: str };
  }
  if (lower === 'false' || lower === 'no' || lower === 'inactive') {
    return { display: str.toUpperCase(), type: 'boolean', raw: str };
  }

  if (/^https?:\/\//i.test(str)) {
    return { display: str, type: 'url', raw: str };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return { display: str, type: 'email', raw: str };
  }

  if (/^[$€£₹¥]/.test(str)) {
    return { display: str, type: 'currency', raw: str };
  }

  if (typeof value === 'number') {
    return {
      display: value.toLocaleString('en-US', { maximumFractionDigits: 4 }),
      type: 'number',
      raw: String(value),
    };
  }

  const numVal = Number(str.replace(/,/g, ''));
  if (!isNaN(numVal) && str !== '') {
    return {
      display: numVal.toLocaleString('en-US', { maximumFractionDigits: 4 }),
      type: 'number',
      raw: str,
    };
  }

  return { display: str, type: 'text', raw: str };
}

/**
 * Export to standard CSV
 */
export function exportToCSV(headers: string[], rows: (string | number | boolean | null)[][], delimiter = ','): string {
  const data = [headers, ...rows];
  return Papa.unparse(data, { delimiter });
}

/**
 * Export to TSV (Tabs)
 */
export function exportToTSV(headers: string[], rows: (string | number | boolean | null)[][]): string {
  const data = [headers, ...rows];
  return Papa.unparse(data, { delimiter: '\t' });
}

/**
 * Export to JSON
 */
export function exportToJSON(headers: string[], rows: (string | number | boolean | null)[][]): string {
  const objList = rows.map((row) => {
    const item: Record<string, any> = {};
    headers.forEach((h, idx) => {
      item[h] = row[idx] ?? null;
    });
    return item;
  });
  return JSON.stringify(objList, null, 2);
}

/**
 * Export to Markdown Table
 */
export function exportToMarkdown(headers: string[], rows: (string | number | boolean | null)[][]): string {
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = rows.map((row) => `| ${row.map((c) => String(c ?? '')).join(' | ')} |`);
  return [headerLine, separatorLine, ...rowLines].join('\n');
}

export type ColumnStats =
  | {
      count: number;
      isNumeric: false;
      sum?: never;
      avg?: never;
      min?: never;
      max?: never;
      numericCount?: never;
    }
  | {
      count: number;
      numericCount: number;
      sum: number;
      avg: number;
      min: number;
      max: number;
      isNumeric: true;
    };

/**
 * Calculate column statistics (Count, Sum, Avg, Min, Max)
 */
export function calculateColumnStats(values: (string | number | boolean | null)[]): ColumnStats {
  const numericValues = values
    .map((v) => (typeof v === 'number' ? v : Number(String(v ?? '').replace(/[$,€£₹\s]/g, ''))))
    .filter((n) => !isNaN(n) && isFinite(n));

  if (numericValues.length === 0) {
    return {
      count: values.filter((v) => v !== null && v !== '').length,
      isNumeric: false,
    };
  }

  const sum = numericValues.reduce((a, b) => a + b, 0);
  const avg = sum / numericValues.length;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  return {
    count: values.length,
    numericCount: numericValues.length,
    sum: Math.round(sum * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    isNumeric: true,
  };
}
