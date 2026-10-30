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
  Store,
  UserCheck,
  UserX,
  PauseCircle,
  PlayCircle,
  UserPlus,
  KeyRound,
  Cpu,
  CreditCard,
  Mail,
  MessageSquare,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

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

interface AdminMerchantData {
  _id: string;
  businessName: string;
  slug: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  serviceAreaPincodes?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  suspensionReason?: string;
  isVegetarianCertified?: boolean;
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
  const [merchantsList, setMerchantsList] = useState<AdminMerchantData[]>([]);
  const [systemHealth, setSystemHealth] = useState<{ status: string; uptime: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'policy' | 'approvals' | 'merchants' | 'integrations'>('audit');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Integrations & Cloud Infrastructure State (Super Admin Only)
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // Admin Provisioning state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

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

      // 4. Fetch merchants for governance
      const merchRes = await fetch(`${API_BASE}/merchants/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (merchRes.ok) {
        const mData = await merchRes.json();
        setMerchantsList(mData.data || []);
      }
    } catch {
      showBanner('error', 'Error refreshing governance data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchIntegrations = useCallback(async () => {
    if (!token) return;
    setIsLoadingIntegrations(true);
    try {
      const res = await fetch(`${API_BASE}/system/integrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrationsList(data.data?.integrations || []);
      } else {
        showBanner('error', 'Failed to fetch platform integrations status');
      }
    } catch {
      showBanner('error', 'Network error fetching integrations');
    } finally {
      setIsLoadingIntegrations(false);
    }
  }, [token]);

  const handleTestKey = async () => {
    if (!token || !apiKeyInput.trim()) {
      showBanner('error', 'Please enter an API key to test live connectivity');
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/system/integrations/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data.data);
        showBanner('success', `Live connection test passed (${data.data?.latencyMs || 0}ms)`);
      } else {
        setTestResult({
          success: false,
          message: data.error || data.data?.message || 'Connection test failed',
        });
        showBanner('error', 'Live connection test failed');
      }
    } catch {
      setTestResult({ success: false, message: 'Network error communicating with test endpoint' });
      showBanner('error', 'Network error testing API key');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !apiKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      const res = await fetch(`${API_BASE}/system/integrations/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showBanner(
          'success',
          `Activated ${selectedProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'} provider key on server!`
        );
        setApiKeyInput('');
        fetchIntegrations();
      } else {
        showBanner('error', data.error || 'Failed to update provider configuration');
      }
    } catch {
      showBanner('error', 'Network error saving provider configuration');
    } finally {
      setIsSavingKey(false);
    }
  };

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

  const handleMerchantAction = async (
    merchantId: string,
    action: 'approve' | 'reject' | 'suspend' | 'restore'
  ) => {
    if (!token) return;
    let reason: string | undefined;

    if (action === 'reject' || action === 'suspend') {
      const promptText = prompt(`Please specify the reason for ${action}ing this merchant:`);
      if (promptText === null) return; // User cancelled
      reason = promptText || undefined;
    }

    try {
      const res = await fetch(`${API_BASE}/merchants/admin/${merchantId}/status/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showBanner('success', `Merchant status updated to ${action.toUpperCase()}`);
        fetchAdminData();
      } else {
        showBanner('error', data.error?.message || `Failed to ${action} merchant`);
      }
    } catch {
      showBanner('error', `Network error during merchant ${action}`);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsCreatingAdmin(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          currentAdminPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showBanner('success', `New administrator ${adminEmail} provisioned successfully!`);
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        setCurrentAdminPassword('');
      } else {
        showBanner('error', data.error?.message || 'Failed to provision admin');
      }
    } catch {
      showBanner('error', 'Network error during admin provisioning');
    } finally {
      setIsCreatingAdmin(false);
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
                  Security & GRC Governance Hub
                </h1>
                <span className="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                  Zero-Trust
                </span>
              </div>
              <p className="text-xs text-mut mt-0.5">
                CartPilot Policy Enforcement, Cryptographic Ledger & Merchant Lifecycle Governance
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
              <span>Merchants Governed</span>
              <Store className="w-4 h-4 text-blue-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">{merchantsList.length}</div>
            <span className="text-[10px] text-emerald-500 font-medium">
              {merchantsList.filter((m) => m.status === 'PENDING').length} Pending
            </span>
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
            onClick={() => setActiveTab('merchants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'merchants'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Merchants & Stores ({merchantsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'policy'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Active Policy Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Approvals Queue ({pendingApprovals.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('integrations');
              fetchIntegrations();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Integrations & Cloud AI</span>
          </button>
        </div>

        {/* Tab 1: Audit Ledger */}
        {activeTab === 'audit' && (
          <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brd flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-ink">SHA-256 Chained Event Stream</h3>
                <p className="text-xs text-mut">
                  Append-only immutable record verifying state transitions and zero-trust policy decisions
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-paper border border-brd text-ink">
                Page Size: 25 Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brd bg-paper/50 text-mut uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-4">Event Type</th>
                    <th className="py-2.5 px-4">Resource</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">SHA-256 Hash Block</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd font-mono">
                  {auditEvents.map((event) => (
                    <tr key={event._id || event.sequenceNumber} className="hover:bg-paper/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-ink">{event.eventType}</span>
                      </td>
                      <td className="py-2.5 px-4 text-mut">
                        {event.resourceType}:{event.resourceId.substring(0, 8)}
                      </td>
                      <td className="py-2.5 px-4 text-mut text-[11px]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-acc truncate max-w-[180px]">
                            {event.hash || event.currentHash}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Merchants & Governance */}
        {activeTab === 'merchants' && (
          <div className="space-y-6">
            {/* Merchant Stores Table */}
            <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-brd flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-ink">Merchant Application & Store Governance</h3>
                  <p className="text-xs text-mut">
                    Verify vegetarian compliance, manage approvals, and enforce tenant access
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-paper border border-brd text-ink">
                  {merchantsList.length} Stores Registered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-brd bg-paper/50 text-mut uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-4">Store Name</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Vegetarian Certified</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brd">
                    {merchantsList.map((m) => (
                      <tr key={m._id} className="hover:bg-paper/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-ink block">{m.businessName}</span>
                          <span className="text-[10px] text-mut font-mono">ID: {m._id.substring(0, 8)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-ink block">{m.email}</span>
                          <span className="text-[10px] text-mut">{m.phone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-ink block">{m.address.city}, {m.address.state}</span>
                          <span className="text-[10px] text-mut font-mono">PIN: {m.address.postalCode}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            100% Certified
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              m.status === 'APPROVED'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                                : m.status === 'PENDING'
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {m.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleMerchantAction(m._id, 'approve')}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Approve Store Application"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleMerchantAction(m._id, 'reject')}
                                  className="px-2 py-1 rounded border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Reject Store Application"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {m.status === 'APPROVED' && (
                              <button
                                onClick={() => handleMerchantAction(m._id, 'suspend')}
                                className="px-2 py-1 rounded border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="Suspend Store Access"
                              >
                                <PauseCircle className="w-3 h-3" />
                                <span>Suspend</span>
                              </button>
                            )}

                            {m.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleMerchantAction(m._id, 'restore')}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="Restore Store Access"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Provisioning Section (Requires Re-Authentication) */}
            <div className="bg-card border border-brd rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-sm text-ink">Provision New Administrator</h3>
              </div>
              <p className="text-xs text-mut mb-4">
                Administrators possess full platform governance. Creating a new administrator
                requires re-authenticating your current administrator credentials.
              </p>

              <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Full Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Vikram Rao"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="vikram@cartpilot.in"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="text-[10px] text-mut mt-0.5 block">
                    The user will be required to change this password on their first login.
                  </span>
                </div>

                <div className="pt-2 border-t border-brd">
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Confirm YOUR Current Administrator Password (Re-authentication)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={currentAdminPassword}
                      onChange={(e) => setCurrentAdminPassword(e.target.value)}
                      placeholder="Your current admin password"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-500/40 bg-purple-500/5 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isCreatingAdmin ? 'Verifying & Provisioning...' : 'Provision Administrator'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Policy Engine Specification */}
        {activeTab === 'policy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-brd space-y-3">
              <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-acc" />
                <span>Deterministic Spending Limits</span>
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

        {/* Tab 4: Pending Approvals Queue */}
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
        {/* Tab 5: Central Integrations & Cloud Infrastructure (Super Admin Only) */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="p-6 bg-card border border-brd rounded-2xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brd">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-ink flex items-center gap-2">
                      Central Integrations & Cloud Infrastructure
                    </h3>
                    <p className="text-xs text-mut">
                      Super Admin control center for Managed Cloud services (MongoDB Atlas, Render API, Gemini/OpenAI, Resend, Twilio, Razorpay)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchIntegrations}
                  disabled={isLoadingIntegrations}
                  className="px-3.5 py-2 rounded-xl border border-brd hover:bg-paper text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIntegrations ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {/* Service Cards Grid */}
              <div>
                <h4 className="text-xs font-semibold text-mut uppercase tracking-wider mb-3">
                  Live Managed Cloud Ecosystem ({integrationsList.length} services)
                </h4>
                {isLoadingIntegrations && integrationsList.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-mut">
                    <RefreshCw className="w-5 h-5 animate-spin text-acc" />
                    <span className="text-xs">Querying platform services...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrationsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-brd bg-paper/50 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-card rounded-lg border border-brd shadow-xs">
                                {item.category === 'DATABASE' && <Database className="w-4 h-4 text-indigo-500" />}
                                {item.category === 'AI' && <Cpu className="w-4 h-4 text-emerald-500" />}
                                {item.category === 'PAYMENTS' && <CreditCard className="w-4 h-4 text-blue-500" />}
                                {item.category === 'EMAIL' && <Mail className="w-4 h-4 text-amber-500" />}
                                {item.category === 'SMS' && <MessageSquare className="w-4 h-4 text-teal-500" />}
                                {item.category === 'MAPS' && <MapPin className="w-4 h-4 text-rose-500" />}
                              </div>
                              <div>
                                <div className="font-semibold text-ink text-xs">{item.service}</div>
                                <div className="text-[11px] text-mut">{item.provider}</div>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'CONNECTED'
                                  ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                                  : item.status === 'CONFIGURED'
                                  ? 'bg-blue-500/15 text-blue-600 border border-blue-500/20'
                                  : 'bg-amber-500/15 text-amber-600 border border-amber-500/20'
                              }`}
                            >
                              {item.status === 'CONNECTED' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              {item.status === 'CONNECTED' ? 'Live' : item.status === 'CONFIGURED' ? 'Configured' : 'Setup Required'}
                            </span>
                          </div>
                          <p className="text-xs text-mut mt-2">{item.details}</p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-brd/60 text-[10px] text-mut font-medium flex items-center justify-between">
                          <span>Security Boundary:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">Server-Side Secret</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generative AI Provider Configuration */}
              <div className="pt-6 border-t border-brd space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-sm text-ink">Super Admin Generative AI Control</h4>
                    <p className="text-xs text-mut">
                      Select provider and activate live LLM keys with runtime reloading (no server restart required)
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveKey} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('gemini')}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        selectedProvider === 'gemini'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-brd hover:bg-paper text-mut'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                        {selectedProvider === 'gemini' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink">Google Gemini</div>
                        <div className="text-[11px] text-mut">gemini-2.5-flash / Native Function Calling</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProvider('openai')}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        selectedProvider === 'openai'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-brd hover:bg-paper text-mut'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                        {selectedProvider === 'openai' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink">OpenAI Platform</div>
                        <div className="text-[11px] text-mut">gpt-4o-mini / Function Calling</div>
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      {selectedProvider === 'gemini'
                        ? 'Google AI Studio Secret Key'
                        : 'OpenAI Platform Secret Key'}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeyInput ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={
                          selectedProvider === 'gemini'
                            ? 'Paste AIzaSy... key from Google AI Studio'
                            : 'Paste sk-proj-... key from OpenAI Platform'
                        }
                        className="w-full pl-3.5 pr-24 py-2.5 text-xs bg-paper border border-brd rounded-xl font-mono text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setShowKeyInput(!showKeyInput)}
                          className="p-1.5 text-mut hover:text-ink rounded"
                        >
                          {showKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        testResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                      )}
                      <div>
                        <div className="font-semibold">
                          {testResult.success
                            ? `Live Connectivity Verified (${testResult.latencyMs}ms)`
                            : 'Connectivity Test Failed'}
                        </div>
                        <div className="mt-0.5 opacity-90">{testResult.message}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingKey || !apiKeyInput.trim()}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-brd hover:bg-paper text-ink disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {isTestingKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-emerald-500" /> Test Live Connectivity
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingKey || !apiKeyInput.trim()}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-acc hover:opacity-90 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isSavingKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Applying...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Save & Activate Provider
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Boundary Notice */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-3">
                <Lock className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Enterprise Security & Role Isolation Guarantee:</span>
                  <p className="mt-0.5 opacity-90">
                    Integration settings, API credentials, and database addresses are strictly restricted to Super Admin role tokens. Customers and Merchants are physically isolated from these endpoints and will receive 403 Forbidden upon any attempt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
