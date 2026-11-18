# CSVee — Infinite Canvas CSV Viewer & Workspace

> An infinite free-plane workspace (like Excalidraw or Miro) for pasting, visualizing, analyzing, formatting, joining, and connecting multiple CSVs simultaneously.

🔗 **Live App:** [https://csvee.vercel.app/](https://csvee.vercel.app/)  
👨‍💻 **Author:** [RaghavOG](https://github.com/RaghavOG)

---

## ✨ Features

- **Infinite 2D Free Plane (Excalidraw Style)**
  - Infinite dot grid canvas with pan & zoom (15% to 300%).
  - Pan with mouse drag, middle click, or `Space + Drag`.
  - Smooth pinch-to-zoom and mouse-wheel zoom centered on cursor.
  - "Zoom to Fit" button to auto-frame all your tables.

- **Multiple CSVs in One Plane**
  - Drop or paste dozens of tables onto the same canvas.
  - Freely drag, resize, minimize, duplicate, or delete cards.
  - Color-accent cards (Indigo, Emerald, Sky, Amber, Rose, Purple, Slate) to visually organize datasets.

- **Virtual Scrolling (100,000+ Rows at 60 FPS)**
  - Powered by `@tanstack/react-virtual`, rendering only visible rows for instant performance.

- **Non-blocking Background Parsing**
  - Web Worker chunked parsing handles multi-megabyte files without freezing the canvas.

- **Gigabyte-Scale Persistence**
  - Uses browser `IndexedDB` (`idb-keyval`) to safely persist massive datasets across sessions.

- **Table Joining (VLOOKUP / SQL Join)**
  - Perform SQL-style **Left Join**, **Inner Join**, or **Full Outer Join** between any two tables on the canvas.

- **Visual Relationship Connector Arrows**
  - Drag from 4 anchor ports on card borders to connect related tables with customizable relation labels (`1:N`, `FK`, etc.).

- **Spreadsheet Formulas**
  - Live formula computation: `=SUM(Col)`, `=AVG(Col)`, `=MIN(Col)`, `=MAX(Col)`, `=COUNT(Col)`, `=CONCAT(ColA, ColB)`, and arithmetic (`=Price * 1.08`).

- **Hover Tooltip on Truncated Data**
  - Hover over long or multiline cells to view full unclipped text, character count, formatted JSON/URLs, and a 1-click "Copy" button.

- **Real-Time Collaboration**
  - Live peer cursor tracking and multi-tab synchronization via `BroadcastChannel` with room link sharing.

- **Export & Backup**
  - Export tables as `.csv`, `.tsv`, `.json`, or Markdown `.md`.
  - Backup and restore full workspaces using `.planecsv` files.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Test Suite
```bash
npm test
```

### 4. Build for production
```bash
npm run build
```

---

## 🌐 Deploy to Vercel

1. Push your changes to GitHub:
   ```bash
   git push origin main
   ```
2. In [Vercel](https://vercel.com/new), import your repository: `RaghavOG/csv-viewer`.
3. Set domain to **`csvee.vercel.app`** in Vercel project settings.
4. Click **Deploy**!
