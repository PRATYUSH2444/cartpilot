import React from 'react';
import { Clock, MapPin, ChevronDown } from 'lucide-react';

interface DeliveryChipProps {
  address?: string;
  etaText?: string;
  onClickAddress?: () => void;
}

export const DeliveryChip: React.FC<DeliveryChipProps> = ({
  address = 'Scheduled Delivery Address',
  etaText = 'Next-Day Delivery (Morning & Evening Slots)',
  onClickAddress,
}) => {
  return (
    <div
      data-testid="delivery-chip"
      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-paper/80 dark:bg-card-top/80 border border-brd/80 rounded-full text-xs backdrop-blur-md shadow-xs max-w-full overflow-hidden flex-shrink"
    >
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="flex items-center gap-1 font-medium text-ink truncate">
          <Clock className="w-3.5 h-3.5 text-acc flex-shrink-0" />
          <span className="truncate">{etaText}</span>
        </span>
      </div>

      <button
        onClick={onClickAddress}
        className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-mut hover:text-ink transition-colors flex-shrink-0 cursor-pointer pl-2 border-l border-brd truncate"
        title="View delivery address"
      >
        <MapPin className="w-3 h-3 text-acc flex-shrink-0" />
        <span className="truncate max-w-[120px]">{address}</span>
        {onClickAddress && <ChevronDown className="w-3 h-3 text-mut flex-shrink-0" />}
      </button>
    </div>
  );
};
