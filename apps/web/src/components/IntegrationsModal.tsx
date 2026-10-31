import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Database,
  CreditCard,
  Mail,
  MessageSquare,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Check,
  Eye,
  EyeOff,
  Server,
  Sparkles,
} from 'lucide-react';
import { API_BASE } from '../config/api';

export interface IntegrationStatus {
  service: string;
  category: 'DATABASE' | 'AI' | 'PAYMENTS' | 'EMAIL' | 'SMS' | 'MAPS';
  status: 'CONNECTED' | 'CONFIGURED' | 'UNCONFIGURED' | 'ERROR';
  provider: string;
  details: string;
  isLive: boolean;
  maskedKey?: string;
}

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose, token }) => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key configuration form state
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/system/integrations`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data?.integrations) {
        setIntegrations(data.data.integrations);
      } else {
        setError(data.error || 'Failed to fetch platform status');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to CartPilot server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIntegrations();
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setError('Please provide an API key');
      return;
    }

    setSavingKey(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/system/integrations/config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setApiKeyInput('');
        fetchIntegrations();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setError(data.error || 'Failed to update key configuration');
      }
    } catch (err: any) {
      setError(err.message || 'Network error saving configuration');
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      setError('Enter an API key in the field below to test connection');
      return;
    }

    setTestingKey(true);
    setTestResult(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/system/integrations/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setTestResult(data.data);
      } else {
        setTestResult({
          success: false,
          message: data.error || data.data?.message || 'Connection test failed',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to test endpoint',
      });
    } finally {
      setTestingKey(false);
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DATABASE':
        return <Database className="w-5 h-5 text-indigo-500" />;
      case 'AI':
        return <Cpu className="w-5 h-5 text-emerald-500" />;
      case 'PAYMENTS':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'EMAIL':
        return <Mail className="w-5 h-5 text-amber-500" />;
      case 'SMS':
        return <MessageSquare className="w-5 h-5 text-teal-500" />;
      case 'MAPS':
        return <MapPin className="w-5 h-5 text-rose-500" />;
      default:
        return <Server className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Live &amp; Connected
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Configured
          </span>
        );
      case 'UNCONFIGURED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Setup Required
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                External Integrations &amp; Real AI Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Production architecture: Cloud services, transactional providers, and live generative models
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Provider key activated dynamically! Live AI reasoning is now enabled.</span>
            </div>
          )}

          {/* Grid of integrations */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Live Ecosystem Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {integrations.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {item.service}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {item.provider}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5">
                      {item.details}
                    </p>
                  </div>

                  {item.maskedKey && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                      <span>Key: {item.maskedKey}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Management Form */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Configure Live Generative AI Key
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Switch providers or enter your key to activate live reasoning without server restart
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Provider toggle buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('gemini')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedProvider === 'gemini'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedProvider === 'gemini'
                        ? 'border-emerald-600 dark:border-emerald-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selectedProvider === 'gemini' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold">Google Gemini</div>
                    <div className="text-[10px] text-slate-400">gemini-1.5-flash / native tools</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('openai')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedProvider === 'openai'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedProvider === 'openai'
                        ? 'border-emerald-600 dark:border-emerald-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selectedProvider === 'openai' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold">OpenAI</div>
                    <div className="text-[10px] text-slate-400">gpt-4o-mini / function calling</div>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {selectedProvider === 'gemini' ? 'Google AI Studio API Key' : 'OpenAI API Key'}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      selectedProvider === 'gemini'
                        ? 'Paste AIzaSy... key from Google AI Studio'
                        : 'Paste sk-proj-... key from OpenAI Platform'
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">
                      {testResult.success
                        ? `Live Ping Succeeded (${testResult.latencyMs}ms)`
                        : 'Ping Failed'}
                    </div>
                    <div className="mt-0.5 text-[11px] opacity-90">{testResult.message}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingKey || !apiKeyInput.trim()}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {testingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" /> Test Live Ping
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={savingKey || !apiKeyInput.trim()}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  {savingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Applying...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Apply Key to Platform
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>CartPilot Pure Vegetarian Production Architecture</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
