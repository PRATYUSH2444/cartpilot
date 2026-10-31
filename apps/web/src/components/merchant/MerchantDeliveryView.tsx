import React, { useState } from 'react';
import {
  Truck,
  Clock,
  Coffee,
  Check,
  Hourglass,
  Users,
  AlertCircle,
  Save,
  MapPin,
  Shield,
  Zap,
  PauseCircle,
  PlayCircle,
  Power,
} from 'lucide-react';
import { MerchantStoreData, MerchantDeliverySettings } from './types';

interface MerchantDeliveryViewProps {
  store: MerchantStoreData | null;
  onSaveDeliverySettings: (settings: MerchantDeliverySettings) => Promise<void>;
  isSaving: boolean;
}

export const MerchantDeliveryView: React.FC<MerchantDeliveryViewProps> = ({
  store,
  onSaveDeliverySettings,
  isSaving,
}) => {
  const currentSettings = store?.deliverySettings || {
    standardPrepMinutes: 20,
    currentPrepMinutes: 30,
    estimatedTravelMinutes: 15,
    totalDeliveryMinutes: 45,
    orderAcceptanceMode: 'OPEN',
    workloadPreset: 'NORMAL',
    maxActiveOrders: 10,
    autoWorkloadCalculation: true,
    deliveryRadiusKm: 6,
    minOrderPaise: 9900,
    deliveryFeePaise: 3500,
    operatingHours: {
      openTime: '07:30',
      closeTime: '22:30',
      lunchBreakStart: '14:00',
      lunchBreakEnd: '15:30',
    },
  };

  const [form, setForm] = useState<MerchantDeliverySettings>(currentSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [servicePincodes, setServicePincodes] = useState<string[]>(
    store?.serviceAreaPincodes || ['560038', '560103', '560034', '560008']
  );

  const handlePresetSelect = (
    preset: 'NOT_BUSY' | 'NORMAL' | 'BUSY' | 'VERY_BUSY',
    prepMinutes: number
  ) => {
    const travel = form.estimatedTravelMinutes || 15;
    setForm((prev) => ({
      ...prev,
      workloadPreset: preset,
      currentPrepMinutes: prepMinutes,
      totalDeliveryMinutes: prepMinutes + travel,
    }));
    setHasUnsavedChanges(true);
  };

  const handlePrepMinutesChange = (prepMins: number) => {
    const travel = form.estimatedTravelMinutes || 15;
    setForm((prev) => ({
      ...prev,
      workloadPreset: 'CUSTOM',
      currentPrepMinutes: prepMins,
      totalDeliveryMinutes: prepMins + travel,
    }));
    setHasUnsavedChanges(true);
  };

  const handleTravelMinutesChange = (travelMins: number) => {
    setForm((prev) => ({
      ...prev,
      estimatedTravelMinutes: travelMins,
      totalDeliveryMinutes: (prev.currentPrepMinutes || 30) + travelMins,
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddPincode = () => {
    const trimmed = pincodeInput.trim();
    if (trimmed && trimmed.length === 6 && !servicePincodes.includes(trimmed)) {
      setServicePincodes([...servicePincodes, trimmed]);
      setPincodeInput('');
      setHasUnsavedChanges(true);
    }
  };

  const handleRemovePincode = (pincode: string) => {
    setServicePincodes(servicePincodes.filter((p) => p !== pincode));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    await onSaveDeliverySettings(form);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                Delivery & Availability Operations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage live preparation speed, ETA promises, operating hours, and delivery fees.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              isSaving
                ? 'bg-emerald-800 text-white opacity-70 cursor-wait'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Delivery Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Live Status Card ─────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
            </span>
            <div>
              <h2 className="text-base font-bold">
                Shopper ETA Promise:{' '}
                <span className="underline decoration-emerald-400 decoration-2">
                  {form.totalDeliveryMinutes} Minutes
                </span>
              </h2>
              <p className="text-xs text-emerald-100 opacity-90">
                Shoppers within {form.deliveryRadiusKm} km will see &quot;Delivery in {form.totalDeliveryMinutes} mins&quot;
              </p>
            </div>
          </div>

          {/* Quick Acceptance Mode Switch */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/25 backdrop-blur-xs border border-white/10">
            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, orderAcceptanceMode: 'OPEN' }));
                setHasUnsavedChanges(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                form.orderAcceptanceMode === 'OPEN'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Accepting</span>
            </button>
            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, orderAcceptanceMode: 'PAUSED' }));
                setHasUnsavedChanges(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                form.orderAcceptanceMode === 'PAUSED'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Paused</span>
            </button>
            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, orderAcceptanceMode: 'CLOSED' }));
                setHasUnsavedChanges(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                form.orderAcceptanceMode === 'CLOSED'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Closed</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 1: Workload Presets & Live ETA ────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Store Workload Presets</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch your store status with a single tap during peak rush or peaceful hours.
          </p>
        </div>

        {/* 4 Large Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Preset 1: Not Busy */}
          <div
            onClick={() => handlePresetSelect('NOT_BUSY', 10)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              form.workloadPreset === 'NOT_BUSY'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              {form.workloadPreset === 'NOT_BUSY' && (
                <span className="p-1 rounded-full bg-emerald-600 text-white">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Not Busy
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                15 min total
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Prep: 10m + Travel: 5m
              </span>
            </div>
          </div>

          {/* Preset 2: Normal */}
          <div
            onClick={() => handlePresetSelect('NORMAL', 20)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              form.workloadPreset === 'NORMAL'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              {form.workloadPreset === 'NORMAL' && (
                <span className="p-1 rounded-full bg-emerald-600 text-white">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Normal Flow
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                30 min total
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Prep: 20m + Travel: 10m
              </span>
            </div>
          </div>

          {/* Preset 3: Busy */}
          <div
            onClick={() => handlePresetSelect('BUSY', 30)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              form.workloadPreset === 'BUSY'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Hourglass className="w-5 h-5" />
              </div>
              {form.workloadPreset === 'BUSY' && (
                <span className="p-1 rounded-full bg-emerald-600 text-white">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Busy Rush
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                45 min total
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Prep: 30m + Travel: 15m
              </span>
            </div>
          </div>

          {/* Preset 4: Very Busy */}
          <div
            onClick={() => handlePresetSelect('VERY_BUSY', 45)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              form.workloadPreset === 'VERY_BUSY'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              {form.workloadPreset === 'VERY_BUSY' && (
                <span className="p-1 rounded-full bg-emerald-600 text-white">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Very Busy / Peak
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                60 min total
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Prep: 45m + Travel: 15m
              </span>
            </div>
          </div>
        </div>

        {/* Custom Sliders for Fine-Tuning */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span>Kitchen/Store Packing Time:</span>
              <span className="font-mono font-bold text-emerald-600">
                {form.currentPrepMinutes} Minutes
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={form.currentPrepMinutes}
              onChange={(e) => handlePrepMinutesChange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>5m (Quick pick)</span>
              <span>30m (Standard)</span>
              <span>60m (High rush)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span>Rider Travel Buffer:</span>
              <span className="font-mono font-bold text-emerald-600">
                {form.estimatedTravelMinutes} Minutes
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={form.estimatedTravelMinutes}
              onChange={(e) => handleTravelMinutesChange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>5m (Immediate neighborhood)</span>
              <span>15m (Normal traffic)</span>
              <span>30m (Heavy traffic/rain)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Smart Auto Workload & Capacity Guards ─────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Automated Capacity & Rush Protection</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prevent kitchen bottlenecks and customer dissatisfaction by automatically adapting ETA.
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                autoWorkloadCalculation: !prev.autoWorkloadCalculation,
              }));
              setHasUnsavedChanges(true);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.autoWorkloadCalculation ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                form.autoWorkloadCalculation ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {form.autoWorkloadCalculation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                0 - 2 active orders
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                → ETA: 20-25 min
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Immediate packing priority
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                3 - 5 active orders
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                → ETA: 35-45 min
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Normal queue processing
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Queue reached {form.maxActiveOrders} orders
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
                → Auto-pause acceptance
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Protects customer rating
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Operating Hours & Breaks ──────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Store Operating Hours & Afternoon Break</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            During break times, customers will see your catalog but checkout is deferred to reopen time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Store Opens At
            </label>
            <input
              type="time"
              value={form.operatingHours?.openTime || '07:30'}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  operatingHours: {
                    openTime: e.target.value,
                    closeTime: prev.operatingHours?.closeTime || '22:30',
                    lunchBreakStart: prev.operatingHours?.lunchBreakStart,
                    lunchBreakEnd: prev.operatingHours?.lunchBreakEnd,
                  },
                }));
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Store Closes At
            </label>
            <input
              type="time"
              value={form.operatingHours?.closeTime || '22:30'}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  operatingHours: {
                    openTime: prev.operatingHours?.openTime || '07:30',
                    closeTime: e.target.value,
                    lunchBreakStart: prev.operatingHours?.lunchBreakStart,
                    lunchBreakEnd: prev.operatingHours?.lunchBreakEnd,
                  },
                }));
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Lunch/Restock Break Starts
            </label>
            <input
              type="time"
              value={form.operatingHours?.lunchBreakStart || '14:00'}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  operatingHours: {
                    openTime: prev.operatingHours?.openTime || '07:30',
                    closeTime: prev.operatingHours?.closeTime || '22:30',
                    lunchBreakStart: e.target.value,
                    lunchBreakEnd: prev.operatingHours?.lunchBreakEnd || '15:30',
                  },
                }));
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Break Ends (Reopen)
            </label>
            <input
              type="time"
              value={form.operatingHours?.lunchBreakEnd || '15:30'}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  operatingHours: {
                    openTime: prev.operatingHours?.openTime || '07:30',
                    closeTime: prev.operatingHours?.closeTime || '22:30',
                    lunchBreakStart: prev.operatingHours?.lunchBreakStart || '14:00',
                    lunchBreakEnd: e.target.value,
                  },
                }));
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Radius, Minimum Order & Fees ──────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Delivery Radius, Fees & Serviceable Pincodes</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure how far you deliver and your order threshold economics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Radius */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Max Delivery Radius (km)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={25}
                value={form.deliveryRadiusKm}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, deliveryRadiusKm: Number(e.target.value) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">km</span>
            </div>
          </div>

          {/* Min Order Value */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Minimum Order Value (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={10}
                value={(form.minOrderPaise || 9900) / 100}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, minOrderPaise: Number(e.target.value) * 100 }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
              />
              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">₹</span>
            </div>
          </div>

          {/* Delivery Fee */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Standard Delivery Fee (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={5}
                value={(form.deliveryFeePaise || 3500) / 100}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, deliveryFeePaise: Number(e.target.value) * 100 }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
              />
              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">₹</span>
            </div>
          </div>
        </div>

        {/* Serviceable Pincodes Tag Manager */}
        <div className="pt-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
            Serviceable Postal Pincodes
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {servicePincodes.map((pin) => (
              <span
                key={pin}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
              >
                <span>{pin}</span>
                <button
                  onClick={() => handleRemovePincode(pin)}
                  className="hover:text-rose-500 transition-colors ml-1"
                  title="Remove pincode"
                >
                  ×
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Enter 6-digit pin"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPincode()}
                className="w-32 px-3 py-1 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPincode}
                className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Add Pin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
