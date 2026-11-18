import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://csvee.vercel.app'),
  title: 'CSVee — Infinite Canvas CSV Viewer & Workspace',
  description:
    'An infinite free-plane workspace like Excalidraw for pasting, visualizing, analyzing, formatting, joining, and connecting multiple CSVs simultaneously.',
  keywords: [
    'CSVee',
    'CSV Viewer',
    'Infinite Canvas',
    'Excalidraw for CSV',
    'Spreadsheet Canvas',
    'Data Visualization',
    'Online CSV Editor',
    'RaghavOG',
  ],
  authors: [{ name: 'RaghavOG', url: 'https://github.com/RaghavOG' }],
  creator: 'RaghavOG',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://csvee.vercel.app',
    siteName: 'CSVee',
    title: 'CSVee — Infinite Canvas CSV Viewer & Workspace',
    description:
      'The infinite 2D plane for your tabular data. Paste, format, join, and visualize multiple CSVs with zero friction.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CSVee — Infinite Canvas CSV Viewer & Workspace',
    description:
      'The infinite 2D plane for your tabular data. Paste, format, join, and visualize multiple CSVs with zero friction.',
    creator: '@RaghavOG',
  },
  alternates: {
    canonical: 'https://csvee.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />
      </head>
      <body className="h-full w-full m-0 p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
