import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  Play,
  Zap,
} from 'lucide-react';
import { MandateRules, PolicyEvaluation } from '../../types';

interface RulesCardProps {
  rules: MandateRules;
  currentCartTotalPaise?: number;
  onSelectPreset?: (presetKey: string) => Promise<void>;
  activePresetKey?: string;
  onApplyRemedy?: (action: string, requiredCapPaise?: number) => Promise<void>;
}

const PRESET_OPTIONS = [
  {
    key: 'careful',
    name: 'Careful',
    icon: '🛡️',
    tagline: '₹300 / ₹1k / ₹1.5k',
    desc: 'Strict approval for any big basket',
  },
  {
    key: 'everyday',
    name: 'Everyday',
    icon: '⚡',
    tagline: '₹800 / ₹2k / ₹3k',
    desc: 'Balanced autonomy for routine meals',
  },
  {
    key: 'family_week',
    name: 'Family Week',
    icon: '👨‍👩‍👧‍👦',
    tagline: '₹1.5k / ₹4k / ₹5k',
    desc: 'Higher headroom for weekly family bulk shops',
  },
];

export const RulesCard: React.FC<RulesCardProps> = ({
  rules,
  currentCartTotalPaise = 0,
  onSelectPreset,
  activePresetKey = 'careful',
  onApplyRemedy,
}) => {
  const maxOrderRupees = (rules.maxOrderAmountPaise / 100).toFixed(2);
  const dailyBudgetRupees = (rules.dailyBudgetPaise / 100).toFixed(2);
  const cartRupees = (currentCartTotalPaise / 100).toFixed(2);

  const percentUsed = Math.min(
    100,
    Math.round((currentCartTotalPaise / rules.maxOrderAmountPaise) * 100)
  );

  // Policy Playground Simulator State
  const [showPlayground, setShowPlayground] = useState(false);
  const [simAmountRupees, setSimAmountRupees] = useState<number>(500);
  const [simResult, setSimResult] = useState<PolicyEvaluation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState<string | null>(null);

  // Run simulation against backend
  const runSimulation = React.useCallback(async (rupees: number) => {
    setIsSimulating(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/policy/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaise: Math.round(rupees * 100) }),
      });
      if (res.ok) {
        const body = await res.json();
        setSimResult(body.data);
      }
    } catch {
      // Offline fallback evaluation
      const amountPaise = rupees * 100;
      let outcome: PolicyEvaluation['outcome'] = 'ALLOW';
      let reasonCode = 'WITHIN_LIMIT';
      let explanation = `₹${rupees.toFixed(2)} is within autonomous limit.`;

      if (amountPaise > rules.dailyBudgetPaise) {
        outcome = 'DENY';
        reasonCode = 'DAILY_BUDGET_EXCEEDED';
        explanation = `Exceeds daily budget of ₹${(rules.dailyBudgetPaise / 100).toFixed(2)}`;
      } else if (amountPaise > (rules.perOrderCapPaise || 100000)) {
        outcome = 'DENY';
        reasonCode = 'ABOVE_ORDER_CAP';
        explanation = `Exceeds per-order cap of ₹${((rules.perOrderCapPaise || 100000) / 100).toFixed(2)}`;
      } else if (amountPaise > rules.maxOrderAmountPaise) {
        outcome = 'NEEDS_APPROVAL';
        reasonCode = 'THRESHOLD_EXCEEDED';
        explanation = `Exceeds autonomous auto-approve limit of ₹${(rules.maxOrderAmountPaise / 100).toFixed(2)}`;
      }

      setSimResult({
        outcome,
        reasonCode,
        explanation,
        dailyBudgetPaise: rules.dailyBudgetPaise,
        todaySpentPaise: 0,
        cartTotalPaise: amountPaise,
        maxOrderAmountPaise: rules.maxOrderAmountPaise,
        requiresApproval: outcome === 'NEEDS_APPROVAL',
      });
    } finally {
      setIsSimulating(false);
    }
  }, [rules.dailyBudgetPaise, rules.perOrderCapPaise, rules.maxOrderAmountPaise]);

  useEffect(() => {
    if (showPlayground) {
      runSimulation(simAmountRupees);
    }
  }, [showPlayground, simAmountRupees, runSimulation]);

  const handlePresetClick = async (key: string) => {
    if (!onSelectPreset || isApplyingPreset) return;
    setIsApplyingPreset(key);
    try {
      await onSelectPreset(key);
    } finally {
      setIsApplyingPreset(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-brd bg-card/85 dark:bg-card-top/85 backdrop-blur-xl p-5 shadow-lg shadow-black/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-acc">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-ink tracking-tight">
              Spending Mandate & Guardrails
            </h3>
            <p className="text-xs text-mut">Deterministic autonomous policy controls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className={`text-xs px-2.5 py-1 rounded-xl font-medium border transition-all flex items-center gap-1.5 ${
              showPlayground
                ? 'bg-acc text-white border-acc'
                : 'border-brd bg-paper/60 text-ink hover:border-acc/50'
            }`}
          >
            <Play className="w-3 h-3" />
            {showPlayground ? 'Hide Simulator' : 'Playground'}
          </button>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            ENFORCED
          </span>
        </div>
      </div>

      {/* Novelty N1: Mandate Starter Presets */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-mut uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Starter Presets (1-Tap Activation)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_OPTIONS.map((p) => {
            const isActive = activePresetKey === p.key;
            const isPending = isApplyingPreset === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handlePresetClick(p.key)}
                disabled={isPending}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  isActive
                    ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm'
                    : 'border-brd bg-paper/40 hover:border-acc/40 hover:bg-paper/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] font-mono text-mut mb-0.5">{p.tagline}</div>
                <div className="text-[10px] text-mut/80 line-clamp-1">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl border border-brd bg-paper/50">
          <span className="text-[11px] text-mut uppercase font-mono">Autonomous Limit</span>
          <div className="text-lg font-display font-bold text-ink mt-0.5">₹{maxOrderRupees}</div>
          <p className="text-[11px] text-mut mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Auto-approved under threshold
          </p>
        </div>

        <div className="p-3 rounded-xl border border-brd bg-paper/50">
          <span className="text-[11px] text-mut uppercase font-mono">Daily Order Cap</span>
          <div className="text-lg font-display font-bold text-ink mt-0.5">₹{dailyBudgetRupees}</div>
          <p className="text-[11px] text-mut mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Hard cap ceiling
          </p>
        </div>
      </div>

      {/* Live Limit Meter */}
      <div className="p-3 rounded-xl border border-brd bg-paper/40">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-mut font-medium flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Order Cap Utilization
          </span>
          <span className="font-mono font-bold text-ink">
            ₹{cartRupees} / ₹{maxOrderRupees} ({percentUsed}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-brd overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentUsed > 100
                ? 'bg-rose-500'
                : percentUsed > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
      </div>

      {/* Novelty N7: Policy Playground & Dry-Run Simulator */}
      {showPlayground && (
        <div className="mt-4 pt-4 border-t border-brd bg-blue-500/5 rounded-xl p-3.5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-acc" />
              <span className="text-xs font-display font-bold text-ink">
                Policy Playground & Dry-Run Simulator
              </span>
            </div>
            <span className="text-[10px] font-mono text-mut">
              {isSimulating ? 'Simulating...' : 'Read-Only Dry Run'}
            </span>
          </div>

          <p className="text-[11px] text-mut mb-3">
            Hypothetical spend: "If an agent wants to spend ₹{simAmountRupees.toFixed(0)}, how would
            the gateway respond?"
          </p>

          {/* Amount Slider */}
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-mut">₹100</span>
              <span className="font-bold text-ink text-sm">₹{simAmountRupees.toFixed(0)}</span>
              <span className="text-mut">₹4,000</span>
            </div>
            <input
              type="range"
              min={100}
              max={4000}
              step={50}
              value={simAmountRupees}
              onChange={(e) => setSimAmountRupees(Number(e.target.value))}
              className="w-full h-1.5 bg-brd rounded-lg appearance-none cursor-pointer accent-acc"
            />
          </div>

          {/* Real-time Decision Lamp Preview */}
          {simResult && (
            <div
              className={`p-3 rounded-xl border text-xs transition-all ${
                simResult.outcome === 'ALLOW'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : simResult.outcome === 'NEEDS_APPROVAL'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      simResult.outcome === 'ALLOW'
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                        : simResult.outcome === 'NEEDS_APPROVAL'
                          ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                          : 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    }`}
                  />
                  <span className="font-bold uppercase tracking-wider text-[11px] text-ink">
                    {simResult.outcome === 'ALLOW'
                      ? 'Autonomous Auto-Approve'
                      : simResult.outcome === 'NEEDS_APPROVAL'
                        ? 'Human Approval Required'
                        : 'Blocked by Policy'}
                  </span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/10 text-ink font-semibold">
                  {simResult.reasonCode}
                </span>
              </div>
              <p className="text-[11px] text-mut mb-2">{simResult.explanation}</p>

              {/* Counterfactual Remedy Action if Blocked */}
              {simResult.outcome === 'DENY' && onApplyRemedy && (
                <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                  <span className="text-[10px] text-mut">Need this purchase to pass?</span>
                  <button
                    onClick={() =>
                      onApplyRemedy(
                        'RAISE_CAP',
                        Math.max(simAmountRupees * 100, rules.maxOrderAmountPaise + 20000)
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-acc text-white text-[11px] font-bold hover:bg-blue-600 transition-all flex items-center gap-1"
                  >
                    Raise Order Cap to ₹{simAmountRupees.toFixed(0)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

