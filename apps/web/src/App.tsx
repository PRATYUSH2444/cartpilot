import { useEffect, useState } from 'react';
import { ShieldCheck, ShoppingCart, Lock, Database, CheckCircle2, AlertCircle } from 'lucide-react';

interface HealthData {
  status: string;
  uptimeSeconds: number;
  service: string;
  version: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/health');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setHealth(json.data);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Backend unreachable');
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/40">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">CartPilot</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Agent Commerce Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">API Status:</span>
              {loading ? (
                <span className="text-amber-400 animate-pulse">Checking...</span>
              ) : health ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> UP ({health.service} v{health.version})
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Disconnected ({error})
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Core Architecture Principle Banner */}
        <section className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 text-center shadow-lg">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
            Governing Architectural Axiom
          </span>
          <h1 className="mt-2 text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            AI Proposes <span className="text-emerald-400">→</span> Backend Validates{' '}
            <span className="text-emerald-400">→</span> Policy Decides{' '}
            <span className="text-emerald-400">→</span> Commerce Executes{' '}
            <span className="text-emerald-400">→</span> Audit Records
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
            Zero-trust architecture ensuring autonomous shopping agents cannot bypass pricing,
            spending limits, explicit approvals, payment verification, or tamper-evident logging.
          </p>
        </section>

        {/* Development Status & Milestone Progress */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Phase 00
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 font-medium">
                Signed Off
              </span>
            </div>
            <h3 className="font-semibold text-slate-100">Requirements & Scope Freeze</h3>
            <p className="text-xs text-slate-400">
              Problem statement, functional requirements (FR-01 to FR-18), non-functional
              requirements (NFR-01 to NFR-10), and 20-scenario adversarial benchmark matrix
              completed in <code className="text-emerald-400">docs/00-requirements/</code>.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-emerald-600/40 rounded-xl p-5 space-y-3 ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Phase 01
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium animate-pulse">
                Active / Ready
              </span>
            </div>
            <h3 className="font-semibold text-slate-100">Monorepo & Environment Standards</h3>
            <p className="text-xs text-slate-400">
              TypeScript monorepo, Express backend with Zod configuration validation, React + Vite
              frontend with Tailwind, GitHub Actions CI, and{' '}
              <code className="text-emerald-400">/health</code> +{' '}
              <code className="text-emerald-400">/ready</code> diagnostics.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 opacity-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Phase 02
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                Next Milestone
              </span>
            </div>
            <h3 className="font-semibold text-slate-100">Data & Backend Core</h3>
            <p className="text-xs text-slate-400">
              MongoDB Mongoose schemas, vegetarian-only catalog seed verified, JWT session
              management, RBAC, and product search with alias resolution (e.g.{' '}
              <code className="text-indigo-400">pyaz</code>).
            </p>
          </div>
        </section>

        {/* Feature Preview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-slate-200">Catalog-Grounded Resolution</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps recipe requests (e.g., Paneer Pulao) to active merchant SKUs with exact pack
              calculations and server-side pricing.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-slate-200">Deterministic Policy Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates spending caps in integer paise outside the LLM, returning ALLOW,
              NEEDS_HUMAN_APPROVAL, or DENY.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-slate-200">Cryptographic Approvals</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Approvals are bound to a composite hash of cart items and total. Any cart mutation
              invalidates pending approval.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-rose-500/10 text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-slate-200">Tamper-Evident Audit Trail</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every consequential policy and commerce event is committed to a SHA-256 rolling hash
              chain with verification endpoint.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>CartPilot — University MVP & Startup Roadmap • Target Horizon: October–November 2026</p>
      </footer>
    </div>
  );
}
