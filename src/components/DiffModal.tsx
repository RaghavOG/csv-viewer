'use client';

import React, { useState } from 'react';
import { X, GitCompare, CheckCircle2, AlertCircle } from 'lucide-react';
import { CSVNode } from '@/types';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CSVNode[];
}

export const DiffModal: React.FC<DiffModalProps> = ({ isOpen, onClose, nodes }) => {
  const [tableAId, setTableAId] = useState<string>(nodes[0]?.id || '');
  const [tableBId, setTableBId] = useState<string>(nodes[1]?.id || nodes[0]?.id || '');

  if (!isOpen) return null;

  const tableA = nodes.find((n) => n.id === tableAId) || nodes[0];
  const tableB = nodes.find((n) => n.id === tableBId) || nodes[1] || nodes[0];

  // Compare header differences
  const headersA = tableA?.headers || [];
  const headersB = tableB?.headers || [];

  const commonHeaders = headersA.filter((h) => headersB.includes(h));
  const onlyInA = headersA.filter((h) => !headersB.includes(h));
  const onlyInB = headersB.filter((h) => !headersA.includes(h));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Side-by-Side Table Comparison
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Table Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Select Base Table (Table A)
              </label>
              <select
                value={tableA?.id}
                onChange={(e) => setTableAId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.rows.length} rows, {n.headers.length} cols)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Select Comparison Table (Table B)
              </label>
              <select
                value={tableB?.id}
                onChange={(e) => setTableBId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.rows.length} rows, {n.headers.length} cols)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Common Columns
              </span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {commonHeaders.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-center">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-medium">
                Table A Rows
              </span>
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {tableA?.rows.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-center">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-medium">
                Table B Rows
              </span>
              <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {tableB?.rows.length || 0}
              </span>
            </div>
          </div>

          {/* Schema Diff */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Schema & Column Matching
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  Matching in Both ({commonHeaders.length})
                </span>
                <div className="space-y-1">
                  {commonHeaders.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                  {commonHeaders.length === 0 && (
                    <span className="text-slate-400 italic">No common columns</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Only in Table A ({onlyInA.length})
                </span>
                <div className="space-y-1">
                  {onlyInA.map((h, i) => (
                    <div key={i} className="text-slate-600 dark:text-slate-300 truncate">
                      • {h}
                    </div>
                  ))}
                  {onlyInA.length === 0 && (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-1">
                  Only in Table B ({onlyInB.length})
                </span>
                <div className="space-y-1">
                  {onlyInB.map((h, i) => (
                    <div key={i} className="text-slate-600 dark:text-slate-300 truncate">
                      • {h}
                    </div>
                  ))}
                  {onlyInB.length === 0 && (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
