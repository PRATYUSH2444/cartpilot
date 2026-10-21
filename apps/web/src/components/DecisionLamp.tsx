import React from 'react';
import { LampStatus, PolicyRemedy } from '../types';
import { ArrowUpRight, Power, Clock, ShoppingCart } from 'lucide-react';

interface DecisionLampProps {
  status: LampStatus;
  reasonCode?: string;
  reasonText?: string;
  compact?: boolean;
  remedies?: PolicyRemedy[];
  onApplyRemedy?: (action: string, requiredCapPaise?: number) => void;
}

export const DecisionLamp: React.FC<DecisionLampProps> = ({
  status,
  reasonCode,
  reasonText,
  compact = false,
  remedies = [],
  onApplyRemedy,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'go':
        return {
          colorClass: 'bg-emerald-500',
          glowClass: 'lamp-glow-go',
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          defaultCode: 'WITHIN_LIMIT',
          defaultText: 'Autonomous execution authorized under configured spending mandate.',
          label: 'AUTONOMOUS',
        };
      case 'ask':
        return {
          colorClass: 'bg-amber-500',
          glowClass: 'lamp-glow-ask',
          badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
          defaultCode: 'ABOVE_AUTO_LIMIT',
          defaultText: 'Cart exceeds autonomous threshold. Explicit human approval required.',
          label: 'NEEDS APPROVAL',
        };
      case 'stop':
        return {
          colorClass: 'bg-rose-500',
          glowClass: 'lamp-glow-stop',
          badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
          defaultCode: 'ABOVE_ORDER_CAP',
          defaultText: 'Order violates safety constraints or hard budget ceiling.',
          label: 'BLOCKED',
        };
      case 'none':
      default:
        return {
          colorClass: 'bg-slate-400 dark:bg-slate-500',
          glowClass: 'lamp-glow-none',
          badgeBg: 'bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400',
          defaultCode: 'POLICY_IDLE',
          defaultText: 'Awaiting shopping activity to evaluate spending rules.',
          label: 'IDLE',
        };
    }
  };

  const config = getStatusConfig();
  const displayCode = reasonCode || config.defaultCode;
  const displayText = reasonText || config.defaultText;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-3 h-3 rounded-full ${config.colorClass} ${config.glowClass} transition-all duration-300 animate-pulse-subtle`}
          />
        </div>
        <span
          className={`text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${config.badgeBg}`}
        >
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-brd bg-card/60 dark:bg-card-top/60 backdrop-blur-md flex flex-col gap-2.5 transition-all">
      <div className="flex items-start gap-3.5">
        {/* Glowing Orb */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className={`w-4 h-4 rounded-full ${config.colorClass} ${config.glowClass} animate-pulse-subtle transition-all duration-300`}
          />
        </div>

        {/* Decision Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-ink font-display tracking-wide uppercase">
              Policy Decision Lamp
            </span>
            <span
              className={`text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded-md border ${config.badgeBg}`}
            >
              {displayCode}
            </span>
          </div>
          <p className="text-xs text-mut leading-relaxed font-sans">{displayText}</p>
        </div>
      </div>

      {/* Novelty N2: 1-Tap Counterfactual Remedies */}
      {remedies && remedies.length > 0 && onApplyRemedy && (
        <div className="pt-2 border-t border-brd/60 mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-mut uppercase">1-Tap Remedy:</span>
          {remedies.map((remedy) => (
            <button
              key={remedy.id}
              onClick={() => onApplyRemedy(remedy.action)}
              className="px-2.5 py-1 rounded-lg bg-acc/10 hover:bg-acc hover:text-white text-acc border border-acc/25 text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              title={remedy.effect}
            >
              {remedy.action === 'RAISE_CAP' && <ArrowUpRight className="w-3 h-3" />}
              {remedy.action === 'ENABLE_AGENT' && <Power className="w-3 h-3" />}
              {remedy.action === 'ORDER_LATER' && <Clock className="w-3 h-3" />}
              {remedy.action === 'REDUCE_QTY' && <ShoppingCart className="w-3 h-3" />}
              <span>{remedy.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
