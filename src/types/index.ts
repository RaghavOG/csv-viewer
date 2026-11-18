export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'url' | 'email';

export interface CSVNode {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  delimiter: string;
  color: 'indigo' | 'emerald' | 'sky' | 'amber' | 'rose' | 'purple' | 'slate';
  isMinimized: boolean;
  isMaximized: boolean;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | null;
  searchQuery: string;
  hiddenColumns: number[];
  columnAlignments: Record<number, 'left' | 'center' | 'right'>;
  hasHeaderRow: boolean;
  showStats: boolean;
  viewMode: 'table' | 'chart';
  chartConfig?: {
    xCol: number;
    yCol: number;
    chartType: 'bar' | 'line';
  };
}

export interface ConnectorArrow {
  id: string;
  fromNodeId: string;
  fromSide: 'top' | 'right' | 'bottom' | 'left';
  toNodeId: string;
  toSide: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
}

export interface PeerCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastActive: number;
}

export interface CanvasState {
  pan: { x: number; y: number };
  zoom: number;
  isPanning: boolean;
  theme: 'light' | 'dark';
}
