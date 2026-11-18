import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 text-slate-100 canvas-dot-grid relative overflow-hidden select-none">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-6 bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-black/60">
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>STATUS: #REF! / ROW_OUT_OF_BOUNDS</span>
        </div>

        {/* Big Glitch / Spreadsheet 404 */}
        <div>
          <h1 className="text-7xl font-black tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400">
            404
          </h1>
          <p className="text-xl font-bold text-slate-200 mt-2">
            You fell off the edge of the Infinite Canvas.
          </p>
        </div>

        {/* Sarcastic commentary */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono space-y-2 text-slate-400">
          <div className="flex items-center justify-between text-slate-500 border-b border-slate-800/80 pb-2">
            <span>TERMINAL_OUTPUT</span>
            <span>CELL: [ROW: -1, COL: -1]</span>
          </div>
          <p className="text-rose-300">
            &gt; SELECT * FROM internet WHERE route = window.location.pathname;
          </p>
          <p className="text-amber-300">
            &gt; Warning: 0 rows returned. Did someone parse this URL with a broken delimiter (;)?
          </p>
          <p className="text-slate-400">
            &gt; Diagnosis: Either you typed random gibberish, an uncommitted branch was deleted, or an overenthusiastic <code className="text-indigo-400">=VLOOKUP()</code> returned <code className="text-rose-400">#N/A</code>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
          >
            <span>Return to Safety (Canvas)</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
          <a
            href="https://github.com/RaghavOG/csv-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-colors border border-slate-700/60"
          >
            Blame RaghavOG on GitHub
          </a>
        </div>

        {/* Footer attribution */}
        <p className="text-[11px] text-slate-500 pt-2">
          CSVee &bull; Made with ❤️ by{' '}
          <a
            href="https://github.com/RaghavOG"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            RaghavOG
          </a>
        </p>
      </div>
    </div>
  );
}
