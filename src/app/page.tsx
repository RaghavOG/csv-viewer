'use client';

import dynamic from 'next/dynamic';

// Dynamically import Canvas with SSR disabled since it relies on browser window, localStorage, and Canvas events
const Canvas = dynamic(() => import('@/components/Canvas').then((mod) => mod.Canvas), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-sm font-semibold tracking-wide text-slate-300">
        Loading CSVee Workspace...
      </span>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <Canvas />
    </main>
  );
}
