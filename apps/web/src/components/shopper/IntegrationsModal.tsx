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
  Key,
  Zap,
  Check,
  Eye,
  EyeOff,
  Server,
  Sparkles,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

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

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
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

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/system/integrations`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live & Connected
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <Check className="w-3.5 h-3.5" /> Configured
          </span>
        );
      case 'UNCONFIGURED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Setup Required
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Error
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                External Integrations & Real AI Engine
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Production architecture: Cloud services, transactional providers, and live generative models
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Runtime AI API key updated successfully! Live inference is now active.
            </div>
          )}

          {/* Section 1: Live Status Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Live Ecosystem Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {integrations.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-850/60 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-750">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {item.service}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.provider}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {item.details}
                  </div>
                  {item.maskedKey && (
                    <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-750 text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Key className="w-3 h-3" /> Key: {item.maskedKey}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: AI Key Configuration Form */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Configure Live Generative AI Key
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switch providers or enter your key to activate live reasoning without server restart
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('gemini')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    selectedProvider === 'gemini'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                    {selectedProvider === 'gemini' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Google Gemini</div>
                    <div className="text-[11px] text-gray-500">gemini-2.5-flash / native tools</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('openai')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    selectedProvider === 'openai'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                    {selectedProvider === 'openai' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">OpenAI</div>
                    <div className="text-[11px] text-gray-500">gpt-4o-mini / function calling</div>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full pl-3.5 pr-20 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
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
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
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
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>CartPilot Pure Vegetarian Production Architecture</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium rounded-lg bg-gray-200 dark:bg-gray-750 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
