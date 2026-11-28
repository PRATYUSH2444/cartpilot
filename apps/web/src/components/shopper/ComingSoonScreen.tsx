import React, { useState } from 'react';
import { MapPin, Bell, CheckCircle2, ArrowRight, Sparkles, Navigation, RefreshCw } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';

interface ComingSoonScreenProps {
  onExplorePreview?: () => void;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ onExplorePreview }) => {
  const { currentLocation, selectedAddress, serviceability, openAddressModal, joinWaitlist, isDetectingLocation, detectCurrentLocation } = useLocation();
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayLocality = currentLocation?.locality || selectedAddress?.areaLocality || currentLocation?.city || 'Your Area';
  const displayCity = currentLocation?.city || selectedAddress?.city || 'Your City';
  const displayLabel = currentLocation?.label || (displayLocality ? `${displayLocality}, ${displayCity}` : 'Your Location');
  const displaySubLabel = currentLocation?.subLabel || (currentLocation?.pincode ? `PIN ${currentLocation.pincode}` : '');

  const waitlistCount = serviceability?.waitlistCount || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setSubmitError('Please enter your email address');
      return;
    }
    if (!consent) {
      setSubmitError('Please accept the notification consent');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await joinWaitlist(email.trim(), phone.trim(), consent);
      setIsJoined(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--bg-main] text-[--fg-main] flex flex-col justify-between p-4 sm:p-6 md:p-8 transition-colors duration-300">
      {/* Top Header Location Bar */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[--card-bg] border border-[--card-border] shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                Outside Service Radius
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[--fg-main] truncate">
              {displayLabel}
            </h2>
            {displaySubLabel && (
              <p className="text-xs text-[--mut] truncate">{displaySubLabel}</p>
            )}
          </div>
        </div>

        <button
          onClick={openAddressModal}
          className="shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-xl bg-[--bg-sec] hover:bg-[--border] text-[--fg-main] border border-[--border] transition-all flex items-center space-x-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Change</span>
        </button>
      </div>

      {/* Main Hero Card */}
      <div className="w-full max-w-xl mx-auto my-auto py-8 sm:py-12 flex flex-col items-center text-center">
        {/* Floating Delivery Hub Illustration */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-[--card-bg] to-[--bg-sec] border border-[--card-border] p-5 shadow-2xl flex items-center justify-center">
            <svg
              className="w-full h-full text-emerald-400"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dark Store Hub Building */}
              <rect x="25" y="38" width="50" height="42" rx="6" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.5" />
              <rect x="33" y="52" width="14" height="28" rx="2" fill="currentColor" fillOpacity="0.25" />
              <rect x="53" y="52" width="14" height="14" rx="2" fill="currentColor" fillOpacity="0.25" />
              {/* Roof Antenna & Star */}
              <line x1="50" y1="38" x2="50" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="22" r="3" fill="#10b981" />
              {/* Signal waves */}
              <path d="M42 22C42 17.5 45.5 14 50 14C54.5 14 58 17.5 58 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
              <path d="M36 22C36 14.3 42.3 8 50 8C57.7 8 64 14.3 64 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4" opacity="0.3" />
              {/* Delivery E-Van Accent */}
              <circle cx="75" cy="74" r="9" fill="#047857" stroke="#10b981" strokeWidth="2" />
              <path d="M72 74L74 76L78 72" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Personalized Locality Message */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Expanding Fast</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[--fg-main] mb-3 leading-tight">
          We're not in <span className="text-emerald-400">{displayLocality}</span> yet.
        </h1>

        <p className="text-sm sm:text-base text-[--mut] max-w-md mb-6 leading-relaxed">
          We are setting up zero-emission dark-store hubs to deliver farm-harvested vegetarian groceries and fresh milk directly to your society. Tell us you're here so we can prioritize your neighborhood!
        </p>

        {/* Waitlist Demand Badge */}
        {waitlistCount >= 3 && (
          <div className="mb-6 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold flex items-center space-x-2">
            <span>🔥</span>
            <span>
              <strong>{waitlistCount} neighbors</strong> in {displayLocality} have requested delivery
            </span>
          </div>
        )}

        {/* Waitlist Subscription Form */}
        <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-[--card-bg] border border-[--card-border] shadow-2xl backdrop-blur-xl">
          {isJoined ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[--fg-main] mb-1">
                You're on the priority list!
              </h3>
              <p className="text-xs sm:text-sm text-[--mut]">
                We'll notify you the moment our delivery slots open in {displayLocality}. Thank you for your support!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              <div className="flex items-center space-x-2 pb-1">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-[--fg-main]">
                  Get notified when we arrive in {displayLocality}
                </h3>
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address *"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[--bg-sec] border border-[--border] text-sm text-[--fg-main] placeholder-[--mut] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp or Mobile number (optional)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[--bg-sec] border border-[--border] text-sm text-[--fg-main] placeholder-[--mut] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <label className="flex items-start space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[--border] text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-[--mut] leading-tight">
                  I agree to receive a one-time launch alert via email/WhatsApp under DPDP guidelines.
                </span>
              </label>

              {submitError && (
                <p className="text-xs text-rose-500 font-medium">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Adding to Waitlist...</span>
                  </>
                ) : (
                  <>
                    <span>Notify Me When We Launch</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[--border]">
        <button
          onClick={detectCurrentLocation}
          disabled={isDetectingLocation}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[--card-bg] hover:bg-[--bg-sec] border border-[--card-border] text-xs font-semibold text-[--fg-main] transition-all flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isDetectingLocation ? 'animate-spin' : ''}`} />
          <span>{isDetectingLocation ? 'Re-triangulating GPS...' : 'Re-check GPS Location'}</span>
        </button>

        <button
          onClick={openAddressModal}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[--card-bg] hover:bg-[--bg-sec] border border-[--card-border] text-xs font-semibold text-[--fg-main] transition-all flex items-center justify-center space-x-2"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Search Another PIN or Locality</span>
        </button>

        {onExplorePreview && (
          <button
            onClick={onExplorePreview}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-[--mut] hover:text-[--fg-main] transition-all"
          >
            Explore Catalog (Preview Mode)
          </button>
        )}
      </div>
    </div>
  );
};
