/**
 * Safe spreadsheet formula parser and computation engine
 */
export function evaluateFormula(
  expression: string,
  headers: string[],
  currentRow: (string | number | boolean | null)[],
  allRows: (string | number | boolean | null)[][]
): string | number {
  if (!expression.startsWith('=')) {
    return expression;
  }

  const raw = expression.slice(1).trim();

  // Helper: resolve column values
  const getColValues = (colIdentifier: string): number[] => {
    let colIdx = -1;
    const cleanId = colIdentifier.trim().replace(/^["']|["']$/g, '');

    // check if it's a column name
    const foundIdx = headers.findIndex((h) => h.toLowerCase() === cleanId.toLowerCase());
    if (foundIdx !== -1) {
      colIdx = foundIdx;
    } else if (!isNaN(Number(cleanId))) {
      colIdx = parseInt(cleanId, 10);
    }

    if (colIdx < 0 || colIdx >= headers.length) return [];

    return allRows
      .map((r) => {
        const val = r[colIdx];
        if (typeof val === 'number') return val;
        const cleaned = Number(String(val ?? '').replace(/[$,€£₹\s]/g, ''));
        return isNaN(cleaned) ? 0 : cleaned;
      })
      .filter((n) => !isNaN(n));
  };

  try {
    // 1. =SUM(Col)
    const sumMatch = raw.match(/^SUM\(([^)]+)\)$/i);
    if (sumMatch) {
      const vals = getColValues(sumMatch[1]);
      return vals.reduce((a, b) => a + b, 0);
    }

    // 2. =AVG(Col) or =AVERAGE(Col)
    const avgMatch = raw.match(/^(?:AVG|AVERAGE)\(([^)]+)\)$/i);
    if (avgMatch) {
      const vals = getColValues(avgMatch[1]);
      if (vals.length === 0) return 0;
      const sum = vals.reduce((a, b) => a + b, 0);
      return Math.round((sum / vals.length) * 100) / 100;
    }

    // 3. =COUNT(Col)
    const countMatch = raw.match(/^COUNT\(([^)]+)\)$/i);
    if (countMatch) {
      const vals = getColValues(countMatch[1]);
      return vals.length;
    }

    // 4. =MIN(Col)
    const minMatch = raw.match(/^MIN\(([^)]+)\)$/i);
    if (minMatch) {
      const vals = getColValues(minMatch[1]);
      return vals.length ? Math.min(...vals) : 0;
    }

    // 5. =MAX(Col)
    const maxMatch = raw.match(/^MAX\(([^)]+)\)$/i);
    if (maxMatch) {
      const vals = getColValues(maxMatch[1]);
      return vals.length ? Math.max(...vals) : 0;
    }

    // 6. =CONCAT(...)
    const concatMatch = raw.match(/^CONCAT\(([^)]+)\)$/i);
    if (concatMatch) {
      const parts = concatMatch[1].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      return parts
        .map((p) => {
          const colIdx = headers.findIndex((h) => h.toLowerCase() === p.toLowerCase());
          return colIdx !== -1 ? String(currentRow[colIdx] ?? '') : p;
        })
        .join('');
    }

    // 7. Simple Safe Math expressions (e.g. 10 * 4.5 or Price * 1.2)
    let mathExpr = raw;
    headers.forEach((h, idx) => {
      const regex = new RegExp(`\\b${h}\\b`, 'gi');
      const val = currentRow[idx];
      const num = typeof val === 'number' ? val : Number(String(val ?? '').replace(/[$,€£₹\s]/g, '')) || 0;
      mathExpr = mathExpr.replace(regex, String(num));
    });

    // Only allow digits, decimals, +, -, *, /, (, ), spaces
    if (/^[0-9+\-*/().\s]+$/.test(mathExpr)) {
      // Safe function evaluation without scope access
      const result = Function(`"use strict"; return (${mathExpr})`)();
      if (typeof result === 'number' && isFinite(result)) {
        return Math.round(result * 1000) / 1000;
      }
    }

    return '#VALUE!';
  } catch {
    return '#ERROR!';
  }
}
