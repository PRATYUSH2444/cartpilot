import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, Sliders } from 'lucide-react';
import { MandateRules } from '../../types';

interface RulesCardProps {
  rules: MandateRules;
  currentCartTotalPaise?: number;
}

export const RulesCard: React.FC<RulesCardProps> = ({ rules, currentCartTotalPaise = 0 }) => {
  const maxOrderRupees = (rules.maxOrderAmountPaise / 100).toFixed(2);
  const dailyBudgetRupees = (rules.dailyBudgetPaise / 100).toFixed(2);
  const cartRupees = (currentCartTotalPaise / 100).toFixed(2);

  const percentUsed = Math.min(
    100,
    Math.round((currentCartTotalPaise / rules.maxOrderAmountPaise) * 100)
  );

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
              Active Spending Mandate Rules
            </h3>
            <p className="text-xs text-mut">Deterministic policy guardrails</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          ENFORCED
        </span>
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
    </div>
  );
};
