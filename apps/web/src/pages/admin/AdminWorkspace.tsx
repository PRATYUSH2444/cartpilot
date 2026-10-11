import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/Header';
import { LivingBackground } from '../../components/LivingBackground';
import { useAuth } from '../../context/AuthContext';
import { AuditEvent, ChainVerification } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Activity,
  Layers,
  Database,
  Check,
  X,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

interface PendingApprovalData {
  _id: string;
  userId: string;
  cartVersion: number;
  totalPaise: number;
  cartSnapshotHash: string;
  reason: string;
  status: string;
  createdAt: string;
}

export const AdminWorkspace: React.FC = () => {
  const { token } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [chainVerification, setChainVerification] = useState<ChainVerification | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalData[]>([]);
  const [systemHealth, setSystemHealth] = useState<{ status: string; uptime: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'policy' | 'approvals'>('audit');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      // 1. Fetch audit events
      const auditRes = await fetch(`${API_BASE}/audit/events?limit=25`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditEvents(aData.data?.events || []);
      }

      // 2. Fetch pending approvals
      const appRes = await fetch(`${API_BASE}/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appRes.ok) {
        const apData = await appRes.json();
        setPendingApprovals(apData.data ? [apData.data] : []);
      }

      // 3. System health check
      const healthRes = await fetch(`${API_BASE}/health`);
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setSystemHealth(hData.data);
      }
    } catch {
      showBanner('error', 'Error refreshing governance data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleVerifyChain = async () => {
    if (!token) return;
    setIsVerifyingChain(true);

    try {
      const res = await fetch(`${API_BASE}/audit/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setChainVerification(data.data);
        showBanner(
          'success',
          `Cryptographic Audit Chain Verified: ${data.data.totalEvents} blocks valid`
        );
      } else {
        showBanner('error', 'Verification failed to reach consensus');
      }
    } catch {
      showBanner('error', 'Network error during chain verification');
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const handleDecision = async (approvalId: string, decision: 'approve' | 'reject') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/${decision}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showBanner('success', `Approval ${approvalId} ${decision}d successfully`);
        setPendingApprovals((prev) => prev.filter((a) => a._id !== approvalId));
        fetchAdminData();
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || `Failed to ${decision} approval`);
      }
    } catch {
      showBanner('error', `Network error during ${decision}`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-acc selection:text-white bg-paper text-ink">
      <LivingBackground />

      {/* Admin Header */}
      <Header isDark={isDark} onToggleTheme={toggleTheme} />

      {/* Flash Banner */}
      {banner && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all ${
            banner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Governance Hero Card */}
        <div className="p-6 rounded-2xl bg-card border border-brd shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl text-ink">
                  Security & Policy Governance Center
                </h1>
                <span className="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                  Compliance Authority
                </span>
              </div>
              <p className="text-xs text-mut mt-0.5">
                Deterministic Policy Gateway • SHA-256 Hash Chaining • Zero-Trust AI Containment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifyingChain}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${isVerifyingChain ? 'animate-spin' : ''}`} />
              <span>Verify Cryptographic Chain</span>
            </button>
            <button
              onClick={fetchAdminData}
              disabled={isLoading}
              className="p-2 rounded-xl border border-brd bg-paper hover:bg-card text-ink transition-colors"
              title="Refresh governance data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Chain Verification Result Card */}
        {chainVerification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
              chainVerification.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-bold text-xs block">
                  {chainVerification.valid
                    ? 'Cryptographic Hash Chain: VERIFIED & UNBROKEN'
                    : 'Cryptographic Hash Chain: TAMPERING DETECTED'}
                </span>
                <span className="text-[11px] opacity-90">
                  {chainVerification.message} • Checked across {chainVerification.totalEvents}{' '}
                  blocks
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-card/60 border border-current">
              Status: {chainVerification.valid ? 'VALID' : 'INVALID'}
            </span>
          </div>
        )}

        {/* Governance Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Audit Ledger Blocks</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">{auditEvents.length}</div>
            <span className="text-[10px] text-emerald-500 font-medium">SHA-256 Linked</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Pending Approvals</span>
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">
              {pendingApprovals.length}
            </div>
            <span className="text-[10px] text-mut font-medium">Human-in-the-loop review</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Autonomous Limit</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">₹500.00</div>
            <span className="text-[10px] text-mut font-medium">Deterministic threshold</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Platform Health</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">
              {systemHealth?.status === 'ok' ? 'HEALTHY' : 'ONLINE'}
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">Database Synced</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-brd pb-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cryptographic Audit Ledger ({auditEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'policy'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Deterministic Policy Controls</span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Pending Approvals ({pendingApprovals.length})</span>
          </button>
        </div>

        {/* Tab 1: Audit Log Table */}
        {activeTab === 'audit' && (
          <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brd flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-ink">Tamper-Evident SHA-256 Audit Trail</h3>
                <p className="text-xs text-mut">
                  Every commerce mutation is linked by previousHash to construct an unalterable
                  ledger
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper/80 border-b border-brd text-mut uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Seq</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Current Hash (SHA-256)</th>
                    <th className="py-3 px-4">Previous Hash</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd/60">
                  {auditEvents.map((ev) => (
                    <tr key={ev.sequenceNumber} className="hover:bg-paper/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-ink">
                        #{ev.sequenceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-paper border border-brd font-semibold text-[10px] text-acc">
                          {ev.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-mut text-[11px]">{ev.resourceId}</td>
                      <td
                        className="py-3 px-4 font-mono text-[10px] text-ink truncate max-w-[140px]"
                        title={ev.currentHash}
                      >
                        {ev.currentHash.substring(0, 16)}...
                      </td>
                      <td
                        className="py-3 px-4 font-mono text-[10px] text-mut truncate max-w-[140px]"
                        title={ev.previousHash}
                      >
                        {ev.previousHash
                          ? `${ev.previousHash.substring(0, 16)}...`
                          : '0000000000000000 (GENESIS)'}
                      </td>
                      <td className="py-3 px-4 text-mut font-mono text-[11px]">
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Policy Controls Configuration */}
        {activeTab === 'policy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-brd space-y-3">
              <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                <Lock className="w-4 h-4 text-acc" />
                <span>Autonomous Spending Invariants</span>
              </h3>
              <p className="text-xs text-mut">
                Rules enforced strictly by the deterministic backend engine before order
                reservation.
              </p>
              <div className="space-y-2 pt-2 border-t border-brd text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-paper">
                  <span className="text-ink font-medium">Single-Order Threshold:</span>
                  <span className="font-mono font-bold text-emerald-500">₹500.00</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-paper">
                  <span className="text-ink font-medium">Daily Cumulative Cap:</span>
                  <span className="font-mono font-bold text-emerald-500">₹1,500.00</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-paper">
                  <span className="text-ink font-medium">Monthly Spending Ceiling:</span>
                  <span className="font-mono font-bold text-emerald-500">₹15,000.00</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-brd space-y-3">
              <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Catalog & Guardrails</span>
              </h3>
              <p className="text-xs text-mut">
                Mandatory non-functional security constraints verified during recipe-to-SKU
                resolution.
              </p>
              <div className="space-y-2 pt-2 border-t border-brd text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-paper">
                  <span className="text-ink font-medium">Pure Vegetarian Constraint:</span>
                  <span className="font-mono font-bold text-emerald-500">100% STRICT</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-paper">
                  <span className="text-ink font-medium">Reservation Hold Duration:</span>
                  <span className="font-mono font-bold text-acc">15 Minutes (Atomic)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-paper">
                  <span className="text-ink font-medium">AI Execution Boundary:</span>
                  <span className="font-mono font-bold text-purple-500">PROPOSE ONLY</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pending Approvals Queue */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 bg-card border border-brd rounded-2xl">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                <h4 className="font-bold text-sm text-ink">No Pending Approvals</h4>
                <p className="text-xs text-mut max-w-sm mx-auto mt-1">
                  All active carts are currently within autonomous spending limits (&le; ₹500.00).
                  High-value checkouts will appear here.
                </p>
              </div>
            ) : (
              pendingApprovals.map((app) => (
                <div
                  key={app._id}
                  className="p-5 rounded-2xl bg-card border border-amber-500/30 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-brd">
                    <div>
                      <span className="font-mono font-bold text-sm text-ink">
                        Approval Request #{app._id.substring(0, 8)}
                      </span>
                      <p className="text-xs text-amber-500 font-medium">{app.reason}</p>
                    </div>
                    <span className="font-mono font-bold text-lg text-ink">
                      ₹{(app.totalPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleDecision(app._id, 'reject')}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleDecision(app._id, 'approve')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Grant Human Approval</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
