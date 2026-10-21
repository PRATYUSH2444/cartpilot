import React, { useState } from 'react';
import { DEMO_CREDENTIALS } from '../config/demo-credentials';
import {
  X,
  Key,
  Copy,
  Check,
  User,
  Store,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  onSelectRole: (role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN') => void;
}

interface CredentialDetail {
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  title: string;
  badge: string;
  color: string;
  icon: React.ReactNode;
  email: string;
  aliasEmail: string;
  password: string;
  description: string;
  capabilities: string[];
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !DEMO_CREDENTIALS) return null;

  const credentialsList: CredentialDetail[] = [
    {
      role: 'CUSTOMER',
      title: 'Shopper / Customer',
      badge: 'Autonomous Shopper',
      color: 'emerald',
      icon: <User className="w-5 h-5 text-emerald-500" />,
      email: DEMO_CREDENTIALS.CUSTOMER.email,
      aliasEmail: 'customer@cartpilot.com',
      password: DEMO_CREDENTIALS.CUSTOMER.password,
      description: 'End shopper empowered by natural-language AI agent with spending boundaries.',
      capabilities: [
        'Pure vegetarian product browsing',
        'Natural-language grocery conversation',
        'Autonomous recipe resolution to cart',
        'Spending mandate rules (₹500.00 limits)',
        'Razorpay checkout & tamper tests',
      ],
    },
    {
      role: 'MERCHANT',
      title: 'Merchant (Fresh Greens Organics)',
      badge: 'Catalog & Orders',
      color: 'blue',
      icon: <Store className="w-5 h-5 text-blue-500" />,
      email: DEMO_CREDENTIALS.MERCHANT.email,
      aliasEmail: 'merchant@freshgrocers.com',
      password: DEMO_CREDENTIALS.MERCHANT.password,
      description: 'Verified organic produce vendor managing live stock and order fulfillment.',
      capabilities: [
        'Manage certified vegetarian inventory',
        'Real-time order intake tracking',
        'Advance fulfillment lifecycle steps',
        'Audit-verified stock reservations',
      ],
    },
    {
      role: 'ADMIN',
      title: 'Administrator / Compliance Officer',
      badge: 'Gateway Authority',
      color: 'purple',
      icon: <ShieldAlert className="w-5 h-5 text-purple-500" />,
      email: DEMO_CREDENTIALS.ADMIN.email,
      aliasEmail: 'admin@cartpilot.com',
      password: DEMO_CREDENTIALS.ADMIN.password,
      description: 'Governance officer inspecting policy enforcements and cryptographic proof.',
      capabilities: [
        'Deterministic policy engine oversight',
        'Human-in-the-loop spend approvals',
        'SHA-256 tamper-evident hash chain verification',
        'Zero-trust AI containment governance',
      ],
    },
  ];

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card border border-brd rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brd">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-acc to-emerald-500 flex items-center justify-center text-white shadow-md shadow-acc/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-ink">
                  Application Credentials & Roles
                </h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Pre-Seeded & Ready
                </span>
              </div>
              <p className="text-xs text-mut">
                Switch roles instantly or copy credentials to authenticate via API/Postman
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-mut hover:text-ink hover:bg-paper rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials Cards Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {credentialsList.map((cred) => {
            const isSelected = currentRole === cred.role;

            return (
              <div
                key={cred.role}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-acc bg-acc/5 ring-1 ring-acc/20 shadow-sm'
                    : 'border-brd bg-card/60 hover:border-brd/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-paper border border-brd">{cred.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">{cred.title}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase bg-acc text-white px-1.5 py-0.5 rounded shadow-sm">
                            Active Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mut">{cred.description}</p>
                    </div>
                  </div>

                  {!isSelected && (
                    <button
                      onClick={() => {
                        onSelectRole(cred.role);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-paper border border-brd text-ink hover:bg-acc hover:text-white hover:border-acc transition-all flex items-center gap-1 shadow-xs"
                    >
                      <span>Switch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Credentials grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-brd/60 text-xs">
                  {/* Email */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-paper/60 border border-brd">
                    <div className="truncate mr-2">
                      <span className="text-[10px] uppercase font-bold text-mut block">Email</span>
                      <span
                        className="font-mono text-ink text-xs truncate block"
                        title={cred.email}
                      >
                        {cred.email}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(cred.email, `${cred.role}-email`)}
                      className="p-1 text-mut hover:text-ink rounded hover:bg-card transition-colors flex-shrink-0"
                      title="Copy email"
                    >
                      {copiedKey === `${cred.role}-email` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-paper/60 border border-brd">
                    <div className="truncate mr-2">
                      <span className="text-[10px] uppercase font-bold text-mut block">
                        Password
                      </span>
                      <span className="font-mono text-ink text-xs">{cred.password}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(cred.password, `${cred.role}-pwd`)}
                      className="p-1 text-mut hover:text-ink rounded hover:bg-card transition-colors flex-shrink-0"
                      title="Copy password"
                    >
                      {copiedKey === `${cred.role}-pwd` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Capabilities Tags */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {cred.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-paper text-mut border border-brd/50 flex items-center gap-1"
                    >
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-brd flex items-center justify-between text-xs text-mut">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All accounts auto-seeded in database</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-paper border border-brd text-ink font-semibold hover:bg-card transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
