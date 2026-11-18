import { test, expect } from '@playwright/test';
import { parseCSVData, formatCellValue, calculateColumnStats, exportToCSV, exportToJSON } from '../src/utils/csvParser';
import { evaluateFormula } from '../src/utils/formulaEngine';

test.describe('CSV Parser Unit Tests', () => {
  test('parses comma-separated values correctly', () => {
    const csv = `Name,Age,Role\nAlice,30,Developer\nBob,25,Designer`;
    const result = parseCSVData(csv);
    expect(result.headers).toEqual(['Name', 'Age', 'Role']);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0][0]).toBe('Alice');
    expect(result.rows[0][1]).toBe(30);
  });

  test('parses tab-separated values from Excel/Google Sheets', () => {
    const tsv = `ID\tProduct\tPrice\n101\tLaptop\t1200\n102\tMouse\t45`;
    const result = parseCSVData(tsv);
    expect(result.headers).toEqual(['ID', 'Product', 'Price']);
    expect(result.rows.length).toBe(2);
    expect(result.delimiter).toBe('\t');
  });

  test('parses JSON array of objects into tabular format', () => {
    const json = JSON.stringify([
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
    ]);
    const result = parseCSVData(json);
    expect(result.headers).toContain('id');
    expect(result.headers).toContain('name');
    expect(result.rows.length).toBe(2);
  });

  test('calculates column stats accurately for numbers', () => {
    const stats = calculateColumnStats([10, 20, 30, 40]);
    expect(stats.isNumeric).toBe(true);
    if (stats.isNumeric) {
      expect(stats.sum).toBe(100);
      expect(stats.avg).toBe(25);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(40);
    }
  });

  test('exports to formatted CSV and JSON', () => {
    const headers = ['A', 'B'];
    const rows = [[1, 'One'], [2, 'Two']];
    const csv = exportToCSV(headers, rows);
    expect(csv).toContain('A,B');
    expect(csv).toContain('1,One');

    const json = exportToJSON(headers, rows);
    const parsed = JSON.parse(json);
    expect(parsed[0].A).toBe(1);
    expect(parsed[0].B).toBe('One');
  });
});

test.describe('Spreadsheet Formula Engine Unit Tests', () => {
  const headers = ['Product', 'Price', 'Tax'];
  const currentRow = ['Monitor', 300, 30];
  const allRows = [
    ['Monitor', 300, 30],
    ['Mouse', 50, 5],
    ['Keyboard', 150, 15],
  ];

  test('evaluates =SUM(Col)', () => {
    const res = evaluateFormula('=SUM(Price)', headers, currentRow, allRows);
    expect(res).toBe(500);
  });

  test('evaluates =AVG(Col)', () => {
    const res = evaluateFormula('=AVG(Price)', headers, currentRow, allRows);
    expect(res).toBe(166.67);
  });

  test('evaluates =COUNT(Col)', () => {
    const res = evaluateFormula('=COUNT(Product)', headers, currentRow, allRows);
    expect(res).toBe(3);
  });

  test('evaluates arithmetic expressions =Price + Tax', () => {
    const res = evaluateFormula('=Price + Tax', headers, currentRow, allRows);
    expect(res).toBe(330);
  });
});
