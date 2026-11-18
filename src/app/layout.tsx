import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://csvee.vercel.app'),
  title: 'CSVee — Infinite Canvas CSV Viewer, Editor & SQL Joiner',
  description:
    'Free, privacy-first infinite 2D canvas workspace for CSVs. View 500,000+ rows at 60 FPS, visually join tables, compute formulas, and connect relational datasets with zero server uploads.',
  keywords: [
    'CSVee',
    'CSV Viewer',
    'Large CSV Viewer Online',
    'Open 100MB CSV without Excel freezing',
    'Infinite Canvas CSV',
    'Excalidraw for CSV',
    'Visual CSV Joiner',
    'SQL Join CSV online free',
    'Spreadsheet Canvas',
    'Client side CSV editor',
    'Virtual table viewer',
    'RaghavOG',
  ],
  authors: [{ name: 'RaghavOG', url: 'https://github.com/RaghavOG' }],
  creator: 'RaghavOG',
  publisher: 'RaghavOG',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://csvee.vercel.app',
    siteName: 'CSVee',
    title: 'CSVee — Infinite Canvas CSV Viewer & Workspace',
    description:
      'The infinite 2D plane for tabular data. View 500,000+ rows with zero lag, paste multiple CSVs, visually connect relational tables, and perform SQL joins in the browser.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CSVee — Infinite Canvas CSV Viewer & Workspace',
    description:
      'The infinite 2D plane for tabular data. View 500,000+ rows with zero lag, paste multiple CSVs, visually connect relational tables, and perform SQL joins in the browser.',
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://csvee.vercel.app/#webapp',
        name: 'CSVee',
        url: 'https://csvee.vercel.app',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All modern web browsers',
        browserRequirements: 'Requires JavaScript and HTML5 Canvas support',
        author: {
          '@type': 'Person',
          name: 'Raghav Singla',
          alternateName: 'RaghavOG',
          url: 'https://github.com/RaghavOG',
        },
        description:
          'Open-source, privacy-preserving infinite 2D plane workspace for tabular data. Render 500,000+ rows at 60 FPS, visually join datasets, evaluate formulas, and draw relational schema diagrams.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Infinite 2D Pan and Zoom Plane',
          'Virtual DOM Scrolling up to 500k rows',
          'Client-Side Web Worker CSV Parsing',
          'Visual Table Joining (Left, Inner, Full Outer)',
          'Diagram Connector Arrows',
          'High-capacity IndexedDB Persistence',
          'Real-time Multi-Tab Collaboration',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://csvee.vercel.app/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I open a large CSV file without Excel freezing or crashing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'CSVee solves Excel crashes using TanStack Virtual DOM windowing and Web Worker streaming. Instead of loading 500,000 DOM rows into memory simultaneously, CSVee only renders the ~25 rows currently visible in your viewport, maintaining 60 FPS even on low-end laptops.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is my CSV data uploaded to any server or cloud?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. CSVee operates 100% client-side in your web browser. All file parsing, table joining, formula evaluation, and storage are executed locally on your machine using IndexedDB. No rows or personally identifiable information ever leave your computer.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I visually join two CSV files online without SQL or Python?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. In CSVee, paste or upload both CSV tables onto the infinite canvas, click the "SQL Join" button in the toolbar, select your primary and foreign key columns, choose Inner, Left, or Full Outer Join, and CSVee will instantly generate a merged table node on your plane.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" className="h-full dark">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full w-full m-0 p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
