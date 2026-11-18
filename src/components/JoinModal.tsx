'use client';

import React, { useState, useEffect } from 'react';
import { X, GitMerge, Sparkles } from 'lucide-react';
import { CSVNode } from '@/types';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CSVNode[];
  onJoinTables: (newTable: {
    title: string;
    headers: string[];
    rows: any[][];
    delimiter: string;
  }) => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onJoinTables,
}) => {
  const [tableAId, setTableAId] = useState(nodes[0]?.id || '');
  const [tableBId, setTableBId] = useState(nodes[1]?.id || nodes[0]?.id || '');
  const [colAIdx, setColAIdx] = useState(0);
  const [colBIdx, setColBIdx] = useState(0);
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'outer'>('left');

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

  const tableA = nodes.find((n) => n.id === tableAId) || nodes[0];
  const tableB = nodes.find((n) => n.id === tableBId) || nodes[1] || nodes[0];

  const handleExecuteJoin = () => {
    if (!tableA || !tableB) return;

    const headersA = tableA.headers.map((h) => `${tableA.title.slice(0, 8)}.${h}`);
    const headersB = tableB.headers.map((h) => `${tableB.title.slice(0, 8)}.${h}`);
    const mergedHeaders = [...headersA, ...headersB];

    // Build index lookup for Table B by key
    const bLookup = new Map<string, any[]>();
    tableB.rows.forEach((r) => {
      const key = String(r[colBIdx] ?? '').trim().toLowerCase();
      if (key) {
        bLookup.set(key, r);
      }
    });

    const joinedRows: any[][] = [];

    // Left & Inner Join processing
    tableA.rows.forEach((rowA) => {
      const keyA = String(rowA[colAIdx] ?? '').trim().toLowerCase();
      const matchB = bLookup.get(keyA);

      if (matchB) {
        joinedRows.push([...rowA, ...matchB]);
      } else if (joinType === 'left' || joinType === 'outer') {
        const emptyB = Array(tableB.headers.length).fill('');
        joinedRows.push([...rowA, ...emptyB]);
      }
    });

    // Outer Join: append unmatched rows from B
    if (joinType === 'outer') {
      const aKeys = new Set(tableA.rows.map((r) => String(r[colAIdx] ?? '').trim().toLowerCase()));
      tableB.rows.forEach((rowB) => {
        const keyB = String(rowB[colBIdx] ?? '').trim().toLowerCase();
        if (!aKeys.has(keyB)) {
          const emptyA = Array(tableA.headers.length).fill('');
          joinedRows.push([...emptyA, ...rowB]);
        }
      });
    }

    onJoinTables({
      title: `Joined: ${tableA.title.slice(0, 10)} ⋈ ${tableB.title.slice(0, 10)}`,
      headers: mergedHeaders,
      rows: joinedRows,
      delimiter: ',',
    });

    onClose();
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Join / VLOOKUP Two Tables
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Table Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Left Table (Table A)
              </label>
              <select
                value={tableA?.id}
                onChange={(e) => {
                  setTableAId(e.target.value);
                  setColAIdx(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-medium text-slate-500">
                Match Key Column in A:
              </label>
              <select
                value={colAIdx}
                onChange={(e) => setColAIdx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400"
              >
                {tableA?.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Right Table (Table B)
              </label>
              <select
                value={tableB?.id}
                onChange={(e) => {
                  setTableBId(e.target.value);
                  setColBIdx(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-medium text-slate-500">
                Match Key Column in B:
              </label>
              <select
                value={colBIdx}
                onChange={(e) => setColBIdx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400"
              >
                {tableB?.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Join Type Options */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Join Strategy
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setJoinType('left')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  joinType === 'left'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Left Join (VLOOKUP)
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Keep all rows from Table A, add matching fields from Table B.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJoinType('inner')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  joinType === 'inner'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Inner Join
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Only keep rows where keys exist in BOTH tables.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJoinType('outer')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  joinType === 'outer'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Full Outer Join
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Keep all rows from both tables, filling blanks where missing.
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteJoin}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-600/25"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Joined Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
