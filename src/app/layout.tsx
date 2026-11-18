import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlaneCSV — Infinite Canvas CSV Viewer & Editor",
  description: "An infinite plane like Excalidraw for pasting, visualizing, analyzing, and formatting multiple CSVs simultaneously.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full w-full m-0 p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
