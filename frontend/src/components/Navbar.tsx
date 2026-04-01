export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(8, 11, 16, 0.85)", borderColor: "#21262d", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight" style={{ color: "#f0f6fc" }}>
            📡 Regime
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}
          >
            Beta
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs hidden sm:block" style={{ color: "#8b949e" }}>
            NSE MomGold v2 · Regime-Aware Allocation
          </span>
        </div>
      </div>
    </nav>
  );
}
