# PlaneCSV — Infinite Canvas CSV Viewer & Editor

> An infinite, free-plane workspace (like Excalidraw or Miro) built with **Next.js**, **TypeScript**, and **Tailwind CSS**, designed for pasting, visualizing, analyzing, formatting, and comparing multiple CSVs simultaneously.

Made with ❤️ by [RaghavOG](https://github.com/RaghavOG)

---

## ✨ Key Features

- **Infinite 2D Free Plane (Excalidraw Style)**
  - Infinite dot grid canvas with pan & zoom (15% to 300%).
  - Pan with mouse drag, middle click, or `Space + Drag`.
  - Smooth pinch-to-zoom and mouse-wheel zoom centered on cursor.
  - "Zoom to Fit" button to auto-frame all your tables.

- **Multiple CSVs in One Plane**
  - Drop or paste dozens of tables onto the same canvas.
  - Freely drag, resize, minimize, duplicate, or delete cards.
  - Color-accent cards (Indigo, Emerald, Sky, Amber, Rose, Purple, Slate) to visually organize datasets.

- **Smart Pasting & Auto-Formatting**
  - Hit `Ctrl+V` anywhere on the plane to instantly spawn a formatted table right at your cursor.
  - Auto-detects Comma (CSV), Tab (TSV from Google Sheets / Excel), Semicolon (`;`), Pipe (`|`), or JSON array of objects.
  - Drag & drop `.csv`, `.tsv`, `.txt`, `.json` files directly from desktop onto the plane.

- **Hover Tooltip for Long Cell Content**
  - When cell data is long or clipped, hovering over the cell reveals a sleek floating popover.
  - Displays full unclipped text, character count, formatted JSON/URLs, and a 1-click "Copy full text" button.

- **All CSV Formatting Options**
  - **Sorting**: Single-click header sorting (Ascending / Descending / None).
  - **Search & Filter**: Real-time keyword filter across rows.
  - **Column Options**: Hide/show columns, column alignment (left, center, right), rename headers.
  - **Inline Cell Editing**: Double-click any cell to edit live.
  - **Add Row / Add Column**: Grow datasets directly in the UI.
  - **Stats Summary Row**: Toggleable footer showing row counts, sums, averages, and min/max for numerical columns.
  - **Quick Chart Mode**: Switch between Table View and interactive SVG Bar / Line Charts.

- **Compare / Diff Tables**
  - Side-by-side comparison modal between any 2 tables on your plane showing common headers, unique columns, and schemas.

- **Export Options**
  - Export any table as `.csv`, `.tsv`, `.json`, or Markdown `.md`.
  - Copy formatted CSV directly to clipboard.

- **Light & Dark Mode**
  - Full support for light and dark themes with persistent preference.

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

### 3. Build for production
```bash
npm run build
```

---

## 🌐 Deploy to Vercel

### Option 1: Vercel CLI
```bash
npx vercel
```

### Option 2: GitHub / Vercel Dashboard
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the repository — Next.js will be detected automatically.
4. Click **Deploy**!

---

## 👨‍💻 Author

Created with care by **[RaghavOG](https://github.com/RaghavOG)**.
Contributions and feature requests are welcome!
