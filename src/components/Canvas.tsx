'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CSVNode, ConnectorArrow, PeerCursor } from '@/types';
import { SAMPLE_NODES } from '@/utils/sampleData';
import { parseCSVAsync } from '@/utils/csvParser';
import {
  saveTablesToStorage,
  loadTablesFromStorage,
  saveArrowsToStorage,
  loadArrowsFromStorage,
} from '@/utils/storage';
import { CollabManager } from '@/utils/collaboration';
import { CSVCard } from './CSVCard';
import { CanvasConnectors, getNodePortCoord } from './CanvasConnectors';
import { PeerCursors } from './PeerCursors';
import { Toolbar } from './Toolbar';
import { PasteModal } from './PasteModal';
import { DiffModal } from './DiffModal';
import { JoinModal } from './JoinModal';
import { HelpModal } from './HelpModal';
import { CellTooltip } from './CellTooltip';

export const Canvas: React.FC = () => {
  // Canvas coordinate & zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Nodes (Tables on the plane)
  const [nodes, setNodes] = useState<CSVNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Connector Arrows
  const [arrows, setArrows] = useState<ConnectorArrow[]>([]);
  const [connectingState, setConnectingState] = useState<{
    fromNodeId: string;
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    currentX: number;
    currentY: number;
  } | null>(null);

  // Dragging a specific card
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
  } | null>(null);

  // Hover Tooltip for long cell values
  const [hoveredCell, setHoveredCell] = useState<{
    content: string;
    columnName: string;
    x: number;
    y: number;
  } | null>(null);

  // Collaboration State
  const [peers, setPeers] = useState<Map<string, PeerCursor>>(new Map());
  const collabRef = useRef<CollabManager | null>(null);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Mouse screen coordinate tracker for pasting right at cursor
  const mousePosRef = useRef({ x: 600, y: 400 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Initialize theme, IndexedDB, and Collaboration Channel
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('plane_csv_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load tables from high-capacity IndexedDB
    loadTablesFromStorage().then((savedNodes) => {
      if (savedNodes && savedNodes.length > 0) {
        setNodes(savedNodes);
      } else {
        setNodes(SAMPLE_NODES);
      }
    });

    // Load arrows from IndexedDB
    loadArrowsFromStorage().then((savedArrows) => {
      if (savedArrows) {
        setArrows(savedArrows);
      }
    });

    // Collaboration engine init
    const collab = new CollabManager();
    collabRef.current = collab;

    collab.onCursor((peerCursor) => {
      setPeers((prev) => {
        const next = new Map(prev);
        next.set(peerCursor.id, peerCursor);
        return next;
      });
    });

    collab.onSyncNodes((syncedNodes) => {
      setNodes(syncedNodes);
    });

    collab.onSyncArrows((syncedArrows) => {
      setArrows(syncedArrows);
    });

    // Cleanup stale cursors every 5 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      setPeers((prev) => {
        const next = new Map();
        prev.forEach((p, k) => {
          if (now - p.lastActive < 10000) {
            next.set(k, p);
          }
        });
        return next;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      collab.destroy();
    };
  }, []);

  // Save nodes and arrows to IndexedDB whenever modified
  useEffect(() => {
    if (nodes.length > 0) {
      saveTablesToStorage(nodes);
    }
  }, [nodes]);

  useEffect(() => {
    saveArrowsToStorage(arrows);
  }, [arrows]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('plane_csv_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Zoom to Fit All
  const handleFitAll = () => {
    if (nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + (n.isMinimized ? 60 : n.height));
    });

    const padding = 100;
    const boundsW = maxX - minX + padding * 2;
    const boundsH = maxY - minY + padding * 2;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const scaleX = screenW / boundsW;
    const scaleY = screenH / boundsH;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: screenW / 2 - centerX * newZoom,
      y: screenH / 2 - centerY * newZoom,
    });
  };

  // Add Table Helper
  const addNewTable = useCallback(
    (data: { title: string; headers: string[]; rows: any[][]; delimiter: string }, screenPosition?: { x: number; y: number }) => {
      const pos = screenPosition || mousePosRef.current;
      const worldPos = screenToWorld(pos.x, pos.y);

      const colors: CSVNode['color'][] = ['indigo', 'emerald', 'sky', 'amber', 'rose', 'purple', 'slate'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newNode: CSVNode = {
        id: `table-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: data.title,
        x: Math.round(worldPos.x - 200),
        y: Math.round(worldPos.y - 100),
        width: Math.min(760, Math.max(480, data.headers.length * 130)),
        height: Math.min(520, Math.max(340, data.rows.length * 34 + 180)),
        headers: data.headers,
        rows: data.rows,
        delimiter: data.delimiter,
        color: randomColor,
        isMinimized: false,
        isMaximized: false,
        sortColumn: null,
        sortDirection: null,
        searchQuery: '',
        hiddenColumns: [],
        columnAlignments: {},
        hasHeaderRow: true,
        showStats: true,
        viewMode: 'table',
      };

      setNodes((prev) => {
        const next = [...prev, newNode];
        collabRef.current?.broadcastNodes(next);
        return next;
      });
      setSelectedNodeId(newNode.id);
    },
    [screenToWorld]
  );

  // Global Clipboard Paste (`Ctrl+V` on canvas)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const text = e.clipboardData?.getData('text');
      if (!text || !text.trim()) return;

      const parsed = await parseCSVAsync(text);
      if (parsed && parsed.rows.length > 0) {
        addNewTable({
          title: `Pasted Table (${parsed.rows.length.toLocaleString()} rows)`,
          headers: parsed.headers,
          rows: parsed.rows,
          delimiter: parsed.delimiter,
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addNewTable]);

  // Space key pan tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setSpacePressed(true);
        }
      }
      if ((e.key === 'Delete') && selectedNodeId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          handleDeleteNode(selectedNodeId);
          setSelectedNodeId(null);
        }
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse Wheel Zooming & Trackpad Panning
  const handleWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    const isInsideCard = !!(
      target.closest('.group\\/card') ||
      target.closest('[data-scrollable="true"]') ||
      target.closest('table') ||
      target.closest('tbody') ||
      target.closest('thead')
    );

    // If scrolling inside a table card and not pinching/zooming with Ctrl/Cmd, do NOT pan canvas!
    if (isInsideCard && !e.ctrlKey && !e.metaKey) {
      return;
    }

    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = -e.deltaY * 0.002;
      const newZoom = Math.min(Math.max(zoom * (1 + zoomFactor), 0.15), 3.0);

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't start canvas pan if clicking inside a card unless Space is held or middle-clicked
    if (target.closest('.group\\/card') && !spacePressed && e.button !== 1) {
      return;
    }

    if (e.button === 1 || spacePressed || e.target === canvasRef.current) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeId(null);
    }
  };

  // Canvas Mouse Move
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    // Broadcast world cursor to peers
    const worldPos = screenToWorld(e.clientX, e.clientY);
    collabRef.current?.sendCursor(worldPos.x, worldPos.y);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingNode) {
      const deltaX = (e.clientX - draggingNode.startX) / zoom;
      const deltaY = (e.clientY - draggingNode.startY) / zoom;

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === draggingNode.id) {
            return {
              ...node,
              x: Math.round(draggingNode.initialNodeX + deltaX),
              y: Math.round(draggingNode.initialNodeY + deltaY),
            };
          }
          return node;
        })
      );
      return;
    }

    if (connectingState) {
      setConnectingState((prev) => (prev ? { ...prev, currentX: worldPos.x, currentY: worldPos.y } : null));
    }
  };

  // Canvas Mouse Up
  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (draggingNode) {
      collabRef.current?.broadcastNodes(nodes);
      setDraggingNode(null);
    }
    setIsPanning(false);

    // If dragging a connector arrow, check if released over a target node
    if (connectingState) {
      const worldPos = screenToWorld(e.clientX, e.clientY);

      // Find node under release
      const targetNode = nodes.find(
        (n) =>
          n.id !== connectingState.fromNodeId &&
          worldPos.x >= n.x &&
          worldPos.x <= n.x + n.width &&
          worldPos.y >= n.y &&
          worldPos.y <= n.y + (n.isMinimized ? 44 : n.height)
      );

      if (targetNode) {
        const newArrow: ConnectorArrow = {
          id: `arrow-${Date.now()}`,
          fromNodeId: connectingState.fromNodeId,
          fromSide: connectingState.fromSide,
          toNodeId: targetNode.id,
          toSide: 'left',
          label: '1:N',
        };
        setArrows((prev) => {
          const next = [...prev, newArrow];
          collabRef.current?.broadcastArrows(next);
          return next;
        });
      }

      setConnectingState(null);
    }
  };

  // Start dragging a node
  const handleStartDragNode = (e: React.MouseEvent, node: CSVNode) => {
    e.stopPropagation();
    setIsPanning(false);
    setSelectedNodeId(node.id);
    setDraggingNode({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x,
      initialNodeY: node.y,
    });
  };

  // Start pulling a connector from a port
  const handleStartConnecting = (
    nodeId: string,
    side: 'top' | 'right' | 'bottom' | 'left',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setConnectingState({
      fromNodeId: nodeId,
      fromSide: side,
      currentX: worldPos.x,
      currentY: worldPos.y,
    });
  };

  // Delete an arrow
  const handleDeleteArrow = (id: string) => {
    setArrows((prev) => {
      const next = prev.filter((a) => a.id !== id);
      collabRef.current?.broadcastArrows(next);
      return next;
    });
  };

  // Update an arrow (label, color)
  const handleUpdateArrow = (id: string, updates: Partial<ConnectorArrow>) => {
    setArrows((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      collabRef.current?.broadcastArrows(next);
      return next;
    });
  };

  // Update a single node
  const handleUpdateNode = (id: string, updates: Partial<CSVNode>) => {
    setNodes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      collabRef.current?.broadcastNodes(next);
      return next;
    });
  };

  // Delete a node
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      collabRef.current?.broadcastNodes(next);
      return next;
    });
    setArrows((prev) => prev.filter((a) => a.fromNodeId !== id && a.toNodeId !== id));
  };

  // Clear all tables and arrows
  const handleClearAll = () => {
    setNodes([]);
    setArrows([]);
    setSelectedNodeId(null);
    collabRef.current?.broadcastNodes([]);
    collabRef.current?.broadcastArrows([]);
  };

  // Duplicate a node
  const handleDuplicateNode = (node: CSVNode) => {
    const copy: CSVNode = {
      ...node,
      id: `table-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${node.title} (Copy)`,
      x: node.x + 40,
      y: node.y + 40,
    };
    setNodes((prev) => {
      const next = [...prev, copy];
      collabRef.current?.broadcastNodes(next);
      return next;
    });
  };

  // Async File Upload via Toolbar or Drag & Drop
  const processUploadedFile = (file: File, clientCoords?: { x: number; y: number }) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const parsed = await parseCSVAsync(content);
      addNewTable(
        {
          title: file.name.replace(/\.[^/.]+$/, ''),
          headers: parsed.headers,
          rows: parsed.rows,
          delimiter: parsed.delimiter,
        },
        clientCoords
      );
    };
    reader.readAsText(file);
  };

  const handleToolbarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Export Entire Workspace to .planecsv JSON
  const handleExportWorkspace = () => {
    const project = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      nodes,
      arrows,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PlaneCSV_Workspace_${new Date().toISOString().slice(0, 10)}.planecsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Entire Workspace from .planecsv JSON
  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          setNodes(parsed.nodes);
          collabRef.current?.broadcastNodes(parsed.nodes);
        }
        if (parsed.arrows && Array.isArray(parsed.arrows)) {
          setArrows(parsed.arrows);
          collabRef.current?.broadcastArrows(parsed.arrows);
        }
      } catch {
        alert('Invalid .planecsv project file.');
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop files directly onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        processUploadedFile(file, { x: e.clientX + i * 40, y: e.clientY + i * 40 });
      }
    }
  };

  // Add Sample Data
  const handleAddSample = async () => {
    const templates = [
      {
        title: 'SaaS Subscription Churn Analysis',
        data: `Company Name,Industry,ARR ($),Renewal Month,Status,Health Score,Key Contact
Stripe,Fintech,450000,December,Renewed,95,patrick@stripe.com
Figma,Design Tech,320000,January,Renewed,98,dylan@figma.com
Notion,Productivity,280000,November,In Negotiation,88,ivan@notion.so
Linear,Developer Tools,150000,March,Renewed,96,karri@linear.app
Retool,Internal Ops,190000,February,Pending,82,david@retool.com`,
      },
      {
        title: 'Global City Air Quality & Climate',
        data: `City,Country,AQI Index,Dominant Pollutant,Avg Temp (°C),Humidity (%),Green Canopy (%)
Tokyo,Japan,28,PM2.5,16.4,58,34.2
Zurich,Switzerland,14,Ozone,12.8,64,48.5
Singapore,Singapore,35,PM10,29.1,82,46.7
Vancouver,Canada,18,PM2.5,11.2,71,52.1
Copenhagen,Denmark,21,PM10,9.5,75,41.9`,
      },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    const parsed = await parseCSVAsync(pick.data);
    addNewTable({
      title: pick.title,
      headers: parsed.headers,
      rows: parsed.rows,
      delimiter: parsed.delimiter,
    });
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full h-screen overflow-hidden select-none cursor-default bg-slate-50 dark:bg-[#080c14] canvas-dot-grid ${
        spacePressed ? 'cursor-grab active:cursor-grabbing' : isPanning ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Top Floating App Toolbar */}
      <Toolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z * 1.15, 3.0))}
        onZoomOut={() => setZoom((z) => Math.max(z / 1.15, 0.15))}
        onResetZoom={() => setZoom(1)}
        onFitAll={handleFitAll}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onUploadFile={handleToolbarUpload}
        onAddSample={handleAddSample}
        onOpenDiffModal={() => setIsDiffModalOpen(true)}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onExportWorkspace={handleExportWorkspace}
        onImportWorkspace={handleImportWorkspace}
        onClearAll={handleClearAll}
        totalTables={nodes.length}
        peerCount={peers.size}
      />

      {/* Infinite Canvas Coordinate Plane Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className={`absolute inset-0 pointer-events-auto ${
          isPanning || draggingNode ? 'transition-none' : 'transition-transform duration-75 ease-out'
        }`}
      >
        {/* Canvas Connector Arrows Layer */}
        <CanvasConnectors
          arrows={arrows}
          nodes={nodes}
          onDeleteArrow={handleDeleteArrow}
          onUpdateArrow={handleUpdateArrow}
          activeConnecting={connectingState}
        />

        {/* Live Collaborator Cursors Layer */}
        <PeerCursors cursors={Array.from(peers.values())} />

        {/* CSV Tables */}
        {nodes.map((node) => (
          <CSVCard
            key={node.id}
            node={node}
            zoom={zoom}
            isSelected={selectedNodeId === node.id}
            onSelect={() => setSelectedNodeId(node.id)}
            onUpdate={(updates) => handleUpdateNode(node.id, updates)}
            onDelete={() => handleDeleteNode(node.id)}
            onDuplicate={() => handleDuplicateNode(node)}
            onStartDrag={(e) => handleStartDragNode(e, node)}
            onHoverCell={(info) => setHoveredCell(info)}
            onStartConnecting={handleStartConnecting}
          />
        ))}

        {nodes.length === 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 text-xl font-bold">
              📊
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
              Welcome to CSVee
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Your infinite canvas for tabular data. Paste CSV via <kbd className="font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Ctrl+V</kbd>, drag & drop files, or load samples below.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleAddSample}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20"
              >
                Load Sample Datasets
              </button>
              <button
                onClick={() => setIsPasteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                Paste CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hover Cell Full Preview Tooltip */}
      {hoveredCell && (
        <CellTooltip
          content={hoveredCell.content}
          columnName={hoveredCell.columnName}
          x={hoveredCell.x}
          y={hoveredCell.y}
          onClose={() => setHoveredCell(null)}
        />
      )}

      {/* Paste & Import Modal */}
      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onAddTable={(data) => addNewTable(data)}
      />

      {/* Diff / Compare Modal */}
      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        nodes={nodes}
      />

      {/* Join / VLOOKUP Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        nodes={nodes}
        onJoinTables={(data) => addNewTable(data)}
      />

      {/* Shortcuts & Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
