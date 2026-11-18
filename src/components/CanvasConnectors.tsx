'use client';

import React, { useState } from 'react';
import { ConnectorArrow, CSVNode } from '@/types';
import { X } from 'lucide-react';

interface CanvasConnectorsProps {
  arrows: ConnectorArrow[];
  nodes: CSVNode[];
  onDeleteArrow: (id: string) => void;
  onUpdateArrow?: (id: string, updates: Partial<ConnectorArrow>) => void;
  activeConnecting?: {
    fromNodeId: string;
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    currentX: number;
    currentY: number;
  } | null;
}

export function getNodePortCoord(
  node: CSVNode,
  side: 'top' | 'right' | 'bottom' | 'left'
): { x: number; y: number } {
  const actualH = node.isMinimized ? 44 : node.height;
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: node.y + actualH / 2 };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + actualH };
    case 'left':
      return { x: node.x, y: node.y + actualH / 2 };
  }
}

export const CanvasConnectors: React.FC<CanvasConnectorsProps> = ({
  arrows,
  nodes,
  onDeleteArrow,
  onUpdateArrow,
  activeConnecting,
}) => {
  const nodeMap = new Map<string, CSVNode>(nodes.map((n) => [n.id, n]));
  const [editingArrowId, setEditingArrowId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20">
      <defs>
        <marker
          id="arrowhead-default"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <polygon points="0 1, 8 4, 0 7" fill="#6366f1" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <polygon points="0 1, 8 4, 0 7" fill="#818cf8" />
        </marker>
      </defs>

      {/* Render all confirmed arrows */}
      {arrows.map((arrow) => {
        const fromNode = nodeMap.get(arrow.fromNodeId);
        const toNode = nodeMap.get(arrow.toNodeId);
        if (!fromNode || !toNode) return null;

        const start = getNodePortCoord(fromNode, arrow.fromSide);
        const end = getNodePortCoord(toNode, arrow.toSide);

        // Calculate smooth cubic bezier control points
        const dx = Math.abs(end.x - start.x) * 0.5;
        const dy = Math.abs(end.y - start.y) * 0.5;
        const offset = Math.max(40, Math.min(120, Math.max(dx, dy)));

        const cp1 = { x: start.x, y: start.y };
        const cp2 = { x: end.x, y: end.y };

        if (arrow.fromSide === 'right') cp1.x += offset;
        else if (arrow.fromSide === 'left') cp1.x -= offset;
        else if (arrow.fromSide === 'bottom') cp1.y += offset;
        else if (arrow.fromSide === 'top') cp1.y -= offset;

        if (arrow.toSide === 'left') cp2.x -= offset;
        else if (arrow.toSide === 'right') cp2.x += offset;
        else if (arrow.toSide === 'top') cp2.y -= offset;
        else if (arrow.toSide === 'bottom') cp2.y += offset;

        const pathD = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g key={arrow.id} className="group/arrow pointer-events-auto">
            {/* Thick hover hit area */}
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              className="pointer-events-auto cursor-pointer"
            />

            {/* Visual Arrow Line */}
            <path
              d={pathD}
              fill="none"
              stroke={arrow.color || '#6366f1'}
              strokeWidth="2.5"
              markerEnd="url(#arrowhead-default)"
              className="transition-colors group-hover/arrow:stroke-rose-500"
            />

            {/* Label & Delete Badge at Midpoint */}
            <foreignObject
              x={midX - 50}
              y={midY - 14}
              width="100"
              height="28"
              className="overflow-visible pointer-events-auto"
            >
              <div className="flex items-center justify-center">
                {editingArrowId === arrow.id ? (
                  <input
                    type="text"
                    autoFocus
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={() => {
                      if (onUpdateArrow && editingLabel.trim()) {
                        onUpdateArrow(arrow.id, { label: editingLabel.trim() });
                      }
                      setEditingArrowId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (onUpdateArrow && editingLabel.trim()) {
                          onUpdateArrow(arrow.id, { label: editingLabel.trim() });
                        }
                        setEditingArrowId(null);
                      }
                      if (e.key === 'Escape') setEditingArrowId(null);
                    }}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-white dark:bg-slate-800 border border-indigo-500 text-slate-800 dark:text-slate-100 outline-none w-20 text-center font-semibold shadow-lg"
                  />
                ) : (
                  <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-md flex items-center gap-1.5 group/btn">
                    <span
                      onDoubleClick={() => {
                        setEditingArrowId(arrow.id);
                        setEditingLabel(arrow.label || '1:N');
                      }}
                      className="cursor-pointer hover:underline truncate max-w-[65px]"
                      title="Double click to edit label"
                    >
                      {arrow.label || '1:N'}
                    </span>
                    <button
                      onClick={() => onDeleteArrow(arrow.id)}
                      title="Remove relation arrow"
                      className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Render active dragging arrow */}
      {activeConnecting && (() => {
        const fromNode = nodeMap.get(activeConnecting.fromNodeId);
        if (!fromNode) return null;

        const start = getNodePortCoord(fromNode, activeConnecting.fromSide);
        const end = { x: activeConnecting.currentX, y: activeConnecting.currentY };
        const pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

        return (
          <path
            d={pathD}
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            markerEnd="url(#arrowhead-active)"
            className="animate-pulse"
          />
        );
      })()}
    </svg>
  );
};
