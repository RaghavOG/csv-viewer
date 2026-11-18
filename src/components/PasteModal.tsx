'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Clipboard, Sparkles, Check } from 'lucide-react';
import { parseCSVData } from '@/utils/csvParser';
import { CSVNode } from '@/types';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTable: (tableData: { title: string; headers: string[]; rows: any[][]; delimiter: string }) => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Inventory Stock',
    data: `SKU,Item Name,Category,Warehouse,In Stock,Reorder Level,Unit Cost ($)
INV-001,4K Webcam Auto Focus,Electronics,Austin Hub,142,50,45.00
INV-002,Ergonomic Aluminum Laptop Stand,Accessories,Seattle Hub,320,100,18.50
INV-003,USB-C Braided Cable 2M (2-Pack),Cables,Austin Hub,850,200,6.20
INV-004,Mechanical Numpad RGB,Keyboards,New York Hub,78,30,34.00
INV-005,Desk Mat Wool Felt Extra Large,Accessories,Seattle Hub,210,60,22.00
INV-006,GaN Fast Charger 65W Triple Port,Electronics,Austin Hub,195,50,27.50`,
  },
  {
    name: 'Team & Compensation',
    data: `Employee ID,Full Name,Department,Role,Location,Annual Salary ($),Status
EMP-101,Maya Lin,Engineering,Senior Backend Architect,San Francisco,185000,Active
EMP-102,David Patel,Product,Lead Technical Product Manager,New York,172000,Active
EMP-103,Chloe Dubois,Design,Staff Product Designer,London,145000,Active
EMP-104,Arjun Rao,Data Science,Machine Learning Engineer,Bengaluru,115000,Active
EMP-105,Sarah Jenkins,Marketing,Head of Growth & Acquisition,Austin,155000,Active
EMP-106,Liam O'Connor,Customer Support,Support Engineering Lead,Dublin,98000,Active`,
  },
];

export const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onAddTable }) => {
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('New Table');
  const [delimiter, setDelimiter] = useState('auto');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsed = rawText.trim() ? parseCSVData(rawText, delimiter) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const res = parseCSVData(rawText, delimiter);
    onAddTable({
      title: title.trim() || 'New Table',
      headers: res.headers,
      rows: res.rows,
      delimiter: res.delimiter,
    });
    setRawText('');
    setTitle('New Table');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Paste or Upload CSV / Tabular Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title and Delimiter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Dataset / Table Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sales Report 2024"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Delimiter
              </label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="auto">Auto-detect (CSV, TSV, ;, |)</option>
                <option value=",">Comma (,)</option>
                <option value="&#9;">Tab (\t)</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          </div>

          {/* Quick Sample Presets */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Try a sample:
            </span>
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => {
                  setRawText(tmpl.data);
                  setTitle(tmpl.name);
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors font-medium"
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Paste Raw CSV, TSV, or JSON
            </label>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste comma-separated, tab-separated (from Excel/Sheets), or JSON data here..."
              className="w-full p-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* File Upload Trigger */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Or select a file from your computer
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports .csv, .tsv, .txt, .json
                </p>
              </div>
            </div>
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors">
              Choose File
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Live Preview */}
          {parsed && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Parsed Live Preview:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {parsed.rows.length} rows × {parsed.headers.length} columns (delimiter: &quot;{parsed.delimiter === '\t' ? 'TAB' : parsed.delimiter}&quot;)
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-36 overflow-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold sticky top-0">
                    <tr>
                      {parsed.headers.map((h, i) => (
                        <th key={i} className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-700 last:border-r-0 truncate max-w-[120px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {parsed.rows.slice(0, 3).map((r, ri) => (
                      <tr key={ri}>
                        {r.map((c, ci) => (
                          <td key={ci} className="px-2.5 py-1 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0 truncate max-w-[120px]">
                            {String(c ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rawText.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-lg shadow-indigo-600/20"
            >
              Drop onto Canvas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
