'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  BarChart2,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  MoreVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  EyeOff,
  Eye,
  FileSpreadsheet,
  FileCode,
  FileText,
  Copy,
  Check,
  Calculator,
  Palette,
  FunctionSquare,
} from 'lucide-react';
import { CSVNode, ColumnType } from '@/types';
import {
  detectColumnType,
  formatCellValue,
  calculateColumnStats,
  exportToCSV,
  exportToTSV,
  exportToJSON,
  exportToMarkdown,
} from '@/utils/csvParser';
import { evaluateFormula } from '@/utils/formulaEngine';

interface CSVCardProps {
  node: CSVNode;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updatedNode: Partial<CSVNode>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
  onHoverCell: (info: { content: string; columnName: string; x: number; y: number } | null) => void;
  onStartConnecting?: (nodeId: string, side: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => void;
}

const COLOR_MAP = {
  indigo: {
    banner: 'bg-indigo-600 dark:bg-indigo-700',
    border: 'border-indigo-200 dark:border-indigo-900',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    accent: '#6366f1',
  },
  emerald: {
    banner: 'bg-emerald-600 dark:bg-emerald-700',
    border: 'border-emerald-200 dark:border-emerald-900',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    accent: '#10b981',
  },
  sky: {
    banner: 'bg-sky-600 dark:bg-sky-700',
    border: 'border-sky-200 dark:border-sky-900',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    accent: '#0284c7',
  },
  amber: {
    banner: 'bg-amber-600 dark:bg-amber-700',
    border: 'border-amber-200 dark:border-amber-900',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    accent: '#d97706',
  },
  rose: {
    banner: 'bg-rose-600 dark:bg-rose-700',
    border: 'border-rose-200 dark:border-rose-900',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    accent: '#e11d48',
  },
  purple: {
    banner: 'bg-purple-600 dark:bg-purple-700',
    border: 'border-purple-200 dark:border-purple-900',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    accent: '#9333ea',
  },
  slate: {
    banner: 'bg-slate-700 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    accent: '#64748b',
  },
};

export const CSVCard: React.FC<CSVCardProps> = ({
  node,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onStartDrag,
  onHoverCell,
  onStartConnecting,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleVal, setEditingTitleVal] = useState(node.title);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellEditValue, setCellEditValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const resizeRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const theme = COLOR_MAP[node.color] || COLOR_MAP.indigo;

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!node.searchQuery.trim()) return node.rows;
    const query = node.searchQuery.toLowerCase();
    return node.rows.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(query))
    );
  }, [node.rows, node.searchQuery]);

  // Sort rows if sortColumn is active
  const sortedRows = useMemo(() => {
    if (node.sortColumn === null || !node.sortDirection) return filteredRows;
    const colIdx = node.sortColumn;
    const isAsc = node.sortDirection === 'asc';

    return [...filteredRows].sort((a, b) => {
      const valA = a[colIdx];
      const valB = b[colIdx];

      if (valA === null || valA === undefined || valA === '') return isAsc ? 1 : -1;
      if (valB === null || valB === undefined || valB === '') return isAsc ? -1 : 1;

      // Numeric comparison
      const numA = typeof valA === 'number' ? valA : Number(String(valA).replace(/[$,€£₹\s]/g, ''));
      const numB = typeof valB === 'number' ? valB : Number(String(valB).replace(/[$,€£₹\s]/g, ''));

      if (!isNaN(numA) && !isNaN(numB)) {
        return isAsc ? numA - numB : numB - numA;
      }

      // String comparison
      return isAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, node.sortColumn, node.sortDirection]);

  // Virtualizer for smooth 60 FPS scrolling with tens of thousands of rows
  const rowVirtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 33,
    overscan: 8,
  });

  // Column types
  const columnTypes: ColumnType[] = useMemo(() => {
    return node.headers.map((_, colIdx) => {
      const colValues = node.rows.map((r) => r[colIdx]);
      return detectColumnType(colValues);
    });
  }, [node.headers, node.rows]);

  // Column stats
  const columnStats = useMemo(() => {
    if (!node.showStats) return [];
    return node.headers.map((_, colIdx) => {
      const colValues = node.rows.map((r) => r[colIdx]);
      return calculateColumnStats(colValues);
    });
  }, [node.headers, node.rows, node.showStats]);

  // Handle Sort Cycle
  const handleSort = (colIdx: number) => {
    if (node.sortColumn !== colIdx) {
      onUpdate({ sortColumn: colIdx, sortDirection: 'asc' });
    } else if (node.sortDirection === 'asc') {
      onUpdate({ sortColumn: colIdx, sortDirection: 'desc' });
    } else {
      onUpdate({ sortColumn: null, sortDirection: null });
    }
  };

  // Title edit save
  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (editingTitleVal.trim()) {
      onUpdate({ title: editingTitleVal.trim() });
    } else {
      setEditingTitleVal(node.title);
    }
  };

  // Cell edit start
  const handleStartCellEdit = (rowIdx: number, colIdx: number, currentVal: any) => {
    setEditingCell({ row: rowIdx, col: colIdx });
    setCellEditValue(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
  };

  // Cell edit commit
  const handleSaveCell = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const newRows = [...node.rows];
    let parsedVal: string | number | boolean = cellEditValue;

    if (cellEditValue.startsWith('=')) {
      // Formula expression preserved in cell
      parsedVal = cellEditValue;
    } else if (cellEditValue.toLowerCase() === 'true') {
      parsedVal = true;
    } else if (cellEditValue.toLowerCase() === 'false') {
      parsedVal = false;
    } else if (!isNaN(Number(cellEditValue)) && cellEditValue.trim() !== '') {
      parsedVal = Number(cellEditValue);
    }

    newRows[row] = [...newRows[row]];
    newRows[row][col] = parsedVal;
    onUpdate({ rows: newRows });
    setEditingCell(null);
  };

  // Add new row
  const handleAddRow = () => {
    const emptyRow = Array(node.headers.length).fill('');
    onUpdate({ rows: [...node.rows, emptyRow] });
  };

  // Add new column
  const handleAddColumn = () => {
    const newColName = `Column ${node.headers.length + 1}`;
    const newHeaders = [...node.headers, newColName];
    const newRows = node.rows.map((r) => [...r, '']);
    onUpdate({ headers: newHeaders, rows: newRows });
  };

  // Column Alignment toggle
  const handleSetAlignment = (colIdx: number, align: 'left' | 'center' | 'right') => {
    onUpdate({
      columnAlignments: {
        ...node.columnAlignments,
        [colIdx]: align,
      },
    });
    setShowColumnMenu(null);
  };

  // Hide column
  const handleToggleColumnHide = (colIdx: number) => {
    const hidden = node.hiddenColumns || [];
    const newHidden = hidden.includes(colIdx)
      ? hidden.filter((i) => i !== colIdx)
      : [...hidden, colIdx];
    onUpdate({ hiddenColumns: newHidden });
    setShowColumnMenu(null);
  };

  // Delete column
  const handleDeleteColumn = (colIdx: number) => {
    if (node.headers.length <= 1) return;
    const newHeaders = node.headers.filter((_, i) => i !== colIdx);
    const newRows = node.rows.map((r) => r.filter((_, i) => i !== colIdx));
    onUpdate({ headers: newHeaders, rows: newRows });
    setShowColumnMenu(null);
  };

  // Handle Export Downloads
  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(node.headers, node.rows, node.delimiter);
    downloadFile(`${node.title.replace(/\s+/g, '_')}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const handleExportTSV = () => {
    const tsv = exportToTSV(node.headers, node.rows);
    downloadFile(`${node.title.replace(/\s+/g, '_')}.tsv`, tsv, 'text/tab-separated-values;charset=utf-8;');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(node.headers, node.rows);
    downloadFile(`${node.title.replace(/\s+/g, '_')}.json`, json, 'application/json');
  };

  const handleExportMarkdown = () => {
    const md = exportToMarkdown(node.headers, node.rows);
    downloadFile(`${node.title.replace(/\s+/g, '_')}.md`, md, 'text/markdown');
  };

  const handleCopyClipboard = () => {
    const csv = exportToCSV(node.headers, node.rows, node.delimiter);
    navigator.clipboard.writeText(csv);
    setCopiedExport(true);
    setTimeout(() => {
      setCopiedExport(false);
      setShowExportMenu(false);
    }, 1500);
  };

  // Card Resizing
  const handleStartResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = node.width;
    const startH = node.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      const newW = Math.max(360, Math.round(startW + deltaX));
      const newH = Math.max(240, Math.round(startH + deltaY));
      onUpdate({ width: newW, height: newH });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onClick={onSelect}
      onWheel={(e) => {
        // Prevent canvas panning when wheeling anywhere inside the card
        e.stopPropagation();
      }}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: `${node.width}px`,
        height: node.isMinimized ? 'auto' : `${node.height}px`,
      }}
      className={`absolute select-none rounded-2xl bg-white dark:bg-slate-900 border shadow-xl flex flex-col overflow-visible transition-shadow duration-200 group/card ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-2xl z-30'
          : 'hover:shadow-2xl z-10'
      } ${theme.border}`}
    >
      {/* Connector Ports (Top, Right, Bottom, Left) */}
      {onStartConnecting && (
        <>
          <div
            onMouseDown={(e) => onStartConnecting(node.id, 'top', e)}
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md cursor-crosshair opacity-0 group-hover/card:opacity-100 hover:scale-125 transition-all z-40"
            title="Drag to connect from Top port"
          />
          <div
            onMouseDown={(e) => onStartConnecting(node.id, 'right', e)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md cursor-crosshair opacity-0 group-hover/card:opacity-100 hover:scale-125 transition-all z-40"
            title="Drag to connect from Right port"
          />
          <div
            onMouseDown={(e) => onStartConnecting(node.id, 'bottom', e)}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md cursor-crosshair opacity-0 group-hover/card:opacity-100 hover:scale-125 transition-all z-40"
            title="Drag to connect from Bottom port"
          />
          <div
            onMouseDown={(e) => onStartConnecting(node.id, 'left', e)}
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md cursor-crosshair opacity-0 group-hover/card:opacity-100 hover:scale-125 transition-all z-40"
            title="Drag to connect from Left port"
          />
        </>
      )}

      {/* Card Header (Drag handle) */}
      <div
        onMouseDown={onStartDrag}
        className={`px-4 py-3 flex items-center justify-between text-white cursor-grab active:cursor-grabbing rounded-t-2xl ${
          node.isMinimized ? 'rounded-b-2xl' : ''
        } ${theme.banner} transition-colors`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
          <FileSpreadsheet className="w-4 h-4 shrink-0 text-white/90" />
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={editingTitleVal}
              onChange={(e) => setEditingTitleVal(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setEditingTitleVal(node.title);
                }
              }}
              className="bg-black/30 text-white px-2 py-0.5 rounded text-sm font-semibold outline-none border border-white/40 w-full"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingTitle(true)}
              className="font-semibold text-sm truncate cursor-pointer hover:underline decoration-white/40 underline-offset-2"
              title="Double click to rename"
            >
              {node.title}
            </span>
          )}

          {/* Row & Col Pill */}
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0 font-medium">
            {node.rows.length.toLocaleString()}r × {node.headers.length}c
          </span>
        </div>

        {/* Card Header Actions */}
        <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {/* Quick Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${
              showSearch ? 'bg-white/30 text-white' : 'text-white/80'
            }`}
            title="Search rows"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Toggle (Table / Chart) */}
          <button
            onClick={() => onUpdate({ viewMode: node.viewMode === 'table' ? 'chart' : 'table' })}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title={node.viewMode === 'table' ? 'Switch to Quick Chart' : 'Switch to Table'}
          >
            {node.viewMode === 'table' ? (
              <BarChart2 className="w-3.5 h-3.5" />
            ) : (
              <TableIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Stats Toggle */}
          <button
            onClick={() => onUpdate({ showStats: !node.showStats })}
            className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${
              node.showStats ? 'bg-white/30 text-white' : 'text-white/80'
            }`}
            title="Toggle column statistics summary"
          >
            <Calculator className="w-3.5 h-3.5" />
          </button>

          {/* Color Accent Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Change table theme color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-8 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 flex gap-1.5 animate-in fade-in zoom-in-95">
                {(Object.keys(COLOR_MAP) as (keyof typeof COLOR_MAP)[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onUpdate({ color: c });
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: COLOR_MAP[c].accent }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      node.color === c ? 'border-white ring-2 ring-slate-400' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Export Table"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Download as CSV (.csv)</span>
                </button>
                <button
                  onClick={handleExportTSV}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-500" />
                  <span>Download as TSV (.tsv)</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>Download as JSON (.json)</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>Download as Markdown (.md)</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <button
                  onClick={handleCopyClipboard}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  {copiedExport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Minimize / Expand */}
          <button
            onClick={() => onUpdate({ isMinimized: !node.isMinimized })}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title={node.isMinimized ? 'Expand' : 'Minimize'}
          >
            {node.isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Node */}
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/80 text-white/80 hover:text-white transition-colors"
            title="Delete Table"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body (Collapsed if minimized) */}
      {!node.isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-b-2xl overflow-hidden">
          {/* Secondary Toolbar (Search + Quick Actions) */}
          {showSearch && (
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search values in table..."
                value={node.searchQuery}
                onChange={(e) => onUpdate({ searchQuery: e.target.value })}
                className="bg-transparent text-xs w-full text-slate-700 dark:text-slate-200 outline-none"
              />
              {node.searchQuery && (
                <button
                  onClick={() => onUpdate({ searchQuery: '' })}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Table View with Virtual Scrolling */}
          {node.viewMode === 'table' ? (
            <div
              ref={tableContainerRef}
              data-scrollable="true"
              onWheel={(e) => {
                e.stopPropagation();
                // Support Shift + vertical mouse wheel for smooth horizontal scrolling
                if (e.shiftKey && e.deltaY !== 0 && tableContainerRef.current) {
                  tableContainerRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex-1 overflow-auto relative"
            >
              <table className="min-w-full w-max text-left text-xs border-collapse">
                {/* Table Header */}
                <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {/* Index header */}
                    <th className="w-12 px-2 py-2 text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono border-r border-slate-200/80 dark:border-slate-700/80 select-none">
                      #
                    </th>

                    {/* Column Headers */}
                    {node.headers.map((colName, colIdx) => {
                      if (node.hiddenColumns?.includes(colIdx)) return null;
                      const align = node.columnAlignments?.[colIdx] || 'left';
                      const colType = columnTypes[colIdx];
                      const isSorted = node.sortColumn === colIdx;

                      return (
                        <th
                          key={colIdx}
                          className="px-3 py-2 text-slate-700 dark:text-slate-200 font-semibold group/th border-r border-slate-200/80 dark:border-slate-700/80 last:border-r-0 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors"
                        >
                          <div className={`flex items-center justify-between gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
                            <div
                              onClick={() => handleSort(colIdx)}
                              className="flex items-center gap-1 cursor-pointer truncate max-w-[180px]"
                              title={`Sort by ${colName} (Type: ${colType})`}
                            >
                              <span className="truncate">{colName}</span>
                              {isSorted ? (
                                node.sortDirection === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-500" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-500" />
                                )
                              ) : (
                                <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                              )}
                            </div>

                            {/* Column Options Menu Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowColumnMenu(showColumnMenu === colIdx ? null : colIdx);
                                }}
                                className="p-0.5 rounded opacity-0 group-hover/th:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-opacity text-slate-500 dark:text-slate-400"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>

                              {showColumnMenu === colIdx && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-0 top-6 z-50 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-slate-700 dark:text-slate-300 font-normal animate-in fade-in zoom-in-95"
                                >
                                  <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700/60">
                                    Alignment
                                  </div>
                                  <div className="flex items-center justify-around py-1 px-2 border-b border-slate-100 dark:border-slate-700/60">
                                    <button
                                      onClick={() => handleSetAlignment(colIdx, 'left')}
                                      className={`p-1 rounded ${align === 'left' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                      title="Left Align"
                                    >
                                      <AlignLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleSetAlignment(colIdx, 'center')}
                                      className={`p-1 rounded ${align === 'center' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                      title="Center Align"
                                    >
                                      <AlignCenter className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleSetAlignment(colIdx, 'right')}
                                      className={`p-1 rounded ${align === 'right' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                      title="Right Align"
                                    >
                                      <AlignRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleToggleColumnHide(colIdx)}
                                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Hide Column</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteColumn(colIdx)}
                                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Column</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body (Virtualized Window) */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {/* Top virtual spacer */}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px` }}>
                      <td colSpan={node.headers.length + 1} />
                    </tr>
                  )}

                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rowIdx = virtualRow.index;
                    const row = sortedRows[rowIdx];
                    if (!row) return null;

                    return (
                      <tr
                        key={rowIdx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Row Index */}
                        <td className="w-12 px-2 py-1.5 text-[10px] text-slate-400 dark:text-slate-500 text-center border-r border-slate-100 dark:border-slate-800 select-none bg-slate-50/40 dark:bg-slate-900/40">
                          {rowIdx + 1}
                        </td>

                        {/* Row Cells */}
                        {row.map((cellValue, colIdx) => {
                          if (node.hiddenColumns?.includes(colIdx)) return null;
                          const align = node.columnAlignments?.[colIdx] || 'left';
                          const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

                          // Evaluate formula if cell starts with '='
                          const isFormula = typeof cellValue === 'string' && cellValue.startsWith('=');
                          const evaluatedVal = isFormula
                            ? evaluateFormula(cellValue, node.headers, row, node.rows)
                            : cellValue;

                          const formatted = formatCellValue(evaluatedVal);
                          const rawStr = String(cellValue ?? '');

                          return (
                            <td
                              key={colIdx}
                              onDoubleClick={() => handleStartCellEdit(rowIdx, colIdx, cellValue)}
                              onMouseEnter={(e) => {
                                if (rawStr.length > 20 || rawStr.includes('\n') || isFormula) {
                                  onHoverCell({
                                    content: isFormula ? `${rawStr} => ${evaluatedVal}` : rawStr,
                                    columnName: node.headers[colIdx],
                                    x: e.clientX,
                                    y: e.clientY,
                                  });
                                }
                              }}
                              onMouseLeave={() => onHoverCell(null)}
                              className={`px-3 py-1.5 border-r border-slate-100 dark:border-slate-800 last:border-r-0 max-w-[240px] truncate ${
                                align === 'right'
                                  ? 'text-right'
                                  : align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={cellEditValue}
                                  onChange={(e) => setCellEditValue(e.target.value)}
                                  onBlur={handleSaveCell}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-400 outline-none text-slate-900 dark:text-slate-100 text-xs"
                                />
                              ) : isFormula ? (
                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold" title={rawStr}>
                                  <FunctionSquare className="w-2.5 h-2.5" />
                                  <span>{formatted.display}</span>
                                </span>
                              ) : formatted.type === 'boolean' ? (
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    formatted.display === 'TRUE'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400'
                                  }`}
                                >
                                  {formatted.display}
                                </span>
                              ) : formatted.type === 'url' ? (
                                <a
                                  href={formatted.raw}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline truncate block"
                                >
                                  {formatted.display}
                                </a>
                              ) : formatted.type === 'email' ? (
                                <a
                                  href={`mailto:${formatted.raw}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sky-500 hover:text-sky-600 dark:text-sky-400 underline truncate block"
                                >
                                  {formatted.display}
                                </a>
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300">
                                  {formatted.display}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Bottom virtual spacer */}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr
                      style={{
                        height: `${Math.max(
                          0,
                          rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0)
                        )}px`,
                      }}
                    >
                      <td colSpan={node.headers.length + 1} />
                    </tr>
                  )}
                </tbody>
              </table>

              {sortedRows.length === 0 && (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No matching rows found
                </div>
              )}
            </div>
          ) : (
            /* Quick Chart Mode */
            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-3 mb-3 text-xs text-slate-600 dark:text-slate-300 shrink-0">
                <span>X Axis:</span>
                <select
                  value={node.chartConfig?.xCol ?? 0}
                  onChange={(e) =>
                    onUpdate({
                      chartConfig: {
                        ...(node.chartConfig || { chartType: 'bar', yCol: 1, xCol: 0 }),
                        xCol: Number(e.target.value),
                      },
                    })
                  }
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {node.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>

                <span>Y Axis:</span>
                <select
                  value={node.chartConfig?.yCol ?? 1}
                  onChange={(e) =>
                    onUpdate({
                      chartConfig: {
                        ...(node.chartConfig || { chartType: 'bar', xCol: 0, yCol: 1 }),
                        yCol: Number(e.target.value),
                      },
                    })
                  }
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {node.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() =>
                      onUpdate({
                        chartConfig: {
                          ...(node.chartConfig || { xCol: 0, yCol: 1, chartType: 'bar' }),
                          chartType: 'bar',
                        },
                      })
                    }
                    className={`px-2 py-0.5 rounded text-xs ${
                      node.chartConfig?.chartType === 'bar'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() =>
                      onUpdate({
                        chartConfig: {
                          ...(node.chartConfig || { xCol: 0, yCol: 1, chartType: 'line' }),
                          chartType: 'line',
                        },
                      })
                    }
                    className={`px-2 py-0.5 rounded text-xs ${
                      node.chartConfig?.chartType === 'line'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="w-full flex-1 max-h-72 flex items-end gap-2 pt-6 px-4 pb-2 border-b border-l border-slate-300 dark:border-slate-700">
                {(() => {
                  const xIdx = node.chartConfig?.xCol ?? 0;
                  const yIdx = node.chartConfig?.yCol ?? 1;
                  const chartData = node.rows.slice(0, 15).map((r) => {
                    const xVal = String(r[xIdx] ?? '');
                    const rawY = r[yIdx];
                    const numY = typeof rawY === 'number' ? rawY : Number(String(rawY).replace(/[$,€£₹\s]/g, ''));
                    return { x: xVal, y: isNaN(numY) ? 0 : numY };
                  });

                  const maxY = Math.max(...chartData.map((d) => d.y), 1);

                  return chartData.map((d, i) => {
                    const heightPct = Math.max(8, Math.min(100, (d.y / maxY) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                        <span className="text-[9px] text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                          {d.y.toLocaleString()}
                        </span>
                        <div
                          style={{ height: `${heightPct}%`, backgroundColor: theme.accent }}
                          className="w-full rounded-t-sm transition-all group-hover/bar:brightness-110"
                        />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[45px] text-center">
                          {d.x}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Stats Summary Footer */}
          {node.showStats && columnStats.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 px-3 py-2 text-[10px] font-mono flex items-center gap-4 overflow-x-auto text-slate-600 dark:text-slate-300 shrink-0">
              <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Stats:
              </span>
              {node.headers.map((h, colIdx) => {
                if (node.hiddenColumns?.includes(colIdx)) return null;
                const stats = columnStats[colIdx];
                if (!stats) return null;

                return (
                  <div key={colIdx} className="shrink-0 flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{h}:</span>
                    {stats.isNumeric && stats.sum !== undefined && stats.avg !== undefined ? (
                      <span className="text-indigo-600 dark:text-indigo-400">
                        Sum: {stats.sum.toLocaleString()} | Avg: {stats.avg.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">{stats.count} rows</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Bar (Add Row / Add Column controls) */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Row</span>
              </button>
              <button
                onClick={handleAddColumn}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Column</span>
              </button>

              {node.hiddenColumns?.length > 0 && (
                <button
                  onClick={() => onUpdate({ hiddenColumns: [] })}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px]"
                >
                  <Eye className="w-3 h-3" />
                  <span>Unhide {node.hiddenColumns.length} cols</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-slate-400">
                Delimiter: <span className="font-mono font-semibold">{node.delimiter === '\t' ? 'TAB' : node.delimiter}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Resize Handle at Bottom-Right */}
      {!node.isMinimized && (
        <div
          ref={resizeRef}
          onMouseDown={handleStartResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 group-hover:bg-slate-300/60 dark:group-hover:bg-slate-600/60 rounded-tl transition-colors flex items-center justify-center"
          title="Drag to resize card"
        >
          <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-slate-400" />
        </div>
      )}
    </div>
  );
};
