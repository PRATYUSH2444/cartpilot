import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  Search,
  Sparkles,
  Shield,
  Layers,
  Send,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

interface ServiceArea {
  _id: string;
  pincode: string;
  city: string;
  locality?: string;
  state: string;
  status: 'active' | 'planned' | 'paused';
  type: string;
  createdAt: string;
}

interface DemandStats {
  totalWaitlistSubscribers: number;
  totalServiceAreas: number;
  activeServiceAreas: number;
  topUnserviceableAreas: Array<{
    _id: string;
    locality: string;
    city: string;
    state: string;
    waitlistCount: number;
    lastRequest: string;
  }>;
}

interface ServiceabilitySettings {
  enforcement: 'off' | 'report_only' | 'on';
  allowBrowseWhenUnserviceable: boolean;
  minDemandDisplayThreshold: number;
}

export const AdminServiceAreasView: React.FC<{ token: string | null }> = ({ token }) => {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [demandStats, setDemandStats] = useState<DemandStats | null>(null);
  const [settings, setSettings] = useState<ServiceabilitySettings>({
    enforcement: 'on',
    allowBrowseWhenUnserviceable: false,
    minDemandDisplayThreshold: 3,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // New Area Form State
  const [newPincode, setNewPincode] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newLocality, setNewLocality] = useState('');
  const [newState, setNewState] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'planned'>('active');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const [areasRes, statsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/location/admin/areas`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/location/admin/demand-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/location/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (areasRes.ok) {
        const d = await areasRes.json();
        setAreas(d.data || []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setDemandStats(d.data || null);
      }
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        if (d.data) setSettings(d.data);
      }
    } catch (err) {
      console.error('Failed to load admin service area data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update Global Enforcement Setting
  const handleUpdateEnforcement = async (newEnforcement: 'off' | 'report_only' | 'on') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/location/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enforcement: newEnforcement }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, enforcement: newEnforcement }));
      }
    } catch (err) {
      console.error('Failed to update enforcement:', err);
    }
  };

  // Add New Service Area
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPincode.trim() || !newCity.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/location/admin/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pincode: newPincode.trim(),
          city: newCity.trim(),
          locality: newLocality.trim() || undefined,
          state: newState.trim() || 'Uttar Pradesh',
          status: newStatus,
          type: 'pincode',
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setNewPincode('');
        setNewCity('');
        setNewLocality('');
        setNewState('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create service area:', err);
    }
  };

  // Delete Service Area
  const handleDeleteArea = async (id: string) => {
    if (!token || !window.confirm('Are you sure you want to remove this service area?')) return;
    try {
      const res = await fetch(`${API_BASE}/location/admin/areas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete area:', err);
    }
  };

  // Notify Waitlist Subscribers for a newly launched PIN
  const handleNotifyWaitlist = async (pincode: string) => {
    if (!token) return;
    setNotificationStatus(`Notifying subscribers in ${pincode}...`);
    try {
      const res = await fetch(`${API_BASE}/location/admin/areas/${pincode}/notify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setNotificationStatus(`🎉 Successfully notified ${d.data?.notifiedCount || 0} waiting neighbors in ${pincode}!`);
        setTimeout(() => setNotificationStatus(null), 4000);
        fetchData();
      }
    } catch (err) {
      setNotificationStatus('Failed to send notifications.');
      setTimeout(() => setNotificationStatus(null), 4000);
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.pincode.includes(searchQuery) ||
      a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.locality && a.locality.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ── Top Control & KPI Strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Areas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[--card-bg] border border-[--card-border] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[--mut] uppercase tracking-wider">Active PIN Codes</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[--fg-main]">{demandStats?.activeServiceAreas ?? areas.length}</div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">Live delivery active</div>
        </div>

        {/* Total Waitlist Subscribers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[--card-bg] border border-[--card-border] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[--mut] uppercase tracking-wider">Waitlist Customers</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-[--fg-main]">{demandStats?.totalWaitlistSubscribers ?? 0}</div>
          <div className="text-[11px] text-amber-500 font-medium mt-1">Awaiting local launch</div>
        </div>

        {/* Global Enforcement Mode */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[--card-bg] border border-[--card-border] shadow-sm sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[--mut] uppercase tracking-wider">Serviceability Enforcement</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleUpdateEnforcement('on')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                settings.enforcement === 'on'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-[--bg-sec] text-[--mut] hover:text-[--fg-main]'
              }`}
            >
              Strict (ON)
            </button>
            <button
              onClick={() => handleUpdateEnforcement('report_only')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                settings.enforcement === 'report_only'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-[--bg-sec] text-[--mut] hover:text-[--fg-main]'
              }`}
            >
              Report Only (Browse Allowed)
            </button>
            <button
              onClick={() => handleUpdateEnforcement('off')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                settings.enforcement === 'off'
                  ? 'bg-stone-600 text-white shadow-md'
                  : 'bg-[--bg-sec] text-[--mut] hover:text-[--fg-main]'
              }`}
            >
              Disabled (OFF)
            </button>
          </div>
        </div>
      </div>

      {notificationStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* ── Top Unserviceable Areas & Demand Table ───────────────────────────── */}
      {demandStats?.topUnserviceableAreas && demandStats.topUnserviceableAreas.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[--card-bg] border border-[--card-border] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[--fg-main] flex items-center space-x-2">
                <span>🔥</span>
                <span>High-Demand Unserviceable Areas</span>
              </h3>
              <p className="text-xs text-[--mut] mt-0.5">
                Neighbors who visited and joined the "Coming Soon" waitlist. Launch delivery to notify them!
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[--border] text-[--mut] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">PIN Code</th>
                  <th className="py-2.5 px-3">Locality / Colony</th>
                  <th className="py-2.5 px-3">City & State</th>
                  <th className="py-2.5 px-3">Waitlist Count</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {demandStats.topUnserviceableAreas.map((area) => (
                  <tr key={area._id} className="hover:bg-[--bg-sec]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{area._id}</td>
                    <td className="py-3 px-3 font-semibold text-[--fg-main]">{area.locality || 'General Area'}</td>
                    <td className="py-3 px-3 text-[--mut]">{area.city}, {area.state}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                        {area.waitlistCount} waiting
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleNotifyWaitlist(area._id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center space-x-1.5 ml-auto"
                      >
                        <Send className="w-3 h-3" />
                        <span>Launch & Notify</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Active Service Areas Management Table ───────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[--card-bg] border border-[--card-border] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-[--fg-main] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Configured Service Areas ({areas.length})</span>
            </h3>
            <p className="text-xs text-[--mut] mt-0.5">
              Postal codes where Dark Store dispatch and next-day scheduled fulfillment are enabled.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[--mut]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PIN or city..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[--bg-sec] border border-[--border] text-xs text-[--fg-main] placeholder-[--mut] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PIN</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[--mut] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">Loading service areas...</span>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="py-10 text-center text-[--mut] text-xs border border-dashed border-[--border] rounded-2xl">
            No service areas found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[--border] text-[--mut] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">PIN Code</th>
                  <th className="py-2.5 px-3">Locality</th>
                  <th className="py-2.5 px-3">City & State</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {filteredAreas.map((area) => (
                  <tr key={area._id} className="hover:bg-[--bg-sec]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">{area.pincode}</td>
                    <td className="py-3 px-3 font-semibold text-[--fg-main]">{area.locality || 'Full Pincode'}</td>
                    <td className="py-3 px-3 text-[--mut]">{area.city}, {area.state}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          area.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-stone-500/10 text-stone-400 border border-stone-500/20'
                        }`}
                      >
                        {area.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteArea(area._id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Area"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Service Area Modal ──────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[--card-bg] border border-[--card-border] shadow-2xl">
            <h3 className="text-base font-bold text-[--fg-main] mb-3">Add Service Area</h3>
            <form onSubmit={handleAddArea} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[--mut] block mb-1">PIN Code *</label>
                <input
                  type="text"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  placeholder="e.g. 201308"
                  maxLength={6}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[--bg-sec] border border-[--border] text-xs text-[--fg-main] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[--mut] block mb-1">City *</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Greater Noida"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[--bg-sec] border border-[--border] text-xs text-[--fg-main] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[--mut] block mb-1">Locality (Optional)</label>
                <input
                  type="text"
                  value={newLocality}
                  onChange={(e) => setNewLocality(e.target.value)}
                  placeholder="e.g. La Residencia / Sector 137"
                  className="w-full px-3.5 py-2 rounded-xl bg-[--bg-sec] border border-[--border] text-xs text-[--fg-main] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[--mut] block mb-1">State</label>
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  className="w-full px-3.5 py-2 rounded-xl bg-[--bg-sec] border border-[--border] text-xs text-[--fg-main] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[--mut] block mb-1">Launch Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'active' | 'planned')}
                  className="w-full px-3.5 py-2 rounded-xl bg-[--bg-sec] border border-[--border] text-xs text-[--fg-main] focus:outline-none focus:border-emerald-500"
                >
                  <option value="active">Active (Immediate Deliveries)</option>
                  <option value="planned">Planned (Coming Soon Waitlist)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[--bg-sec] hover:bg-[--border] text-xs font-bold text-[--fg-main]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30"
                >
                  Save Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
