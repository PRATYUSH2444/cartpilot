import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { StaffMemberData } from './types';

interface StaffViewProps {
  staffList: StaffMemberData[];
  onInviteStaff: (name: string, email: string, permissions: string[]) => Promise<{ token: string; link: string; email: string } | null>;
  onRevokeStaff: (userId: string) => Promise<void>;
  isInviting: boolean;
}

export const MerchantStaffView: React.FC<StaffViewProps> = ({
  staffList,
  onInviteStaff,
  onRevokeStaff,
  isInviting,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'FULFILLMENT' | 'INVENTORY'>('FULFILLMENT');
  const [permissions, setPermissions] = useState<string[]>(['orders.update', 'products.edit']);
  const [inviteResult, setInviteResult] = useState<{ token: string; link: string; email: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const availablePermissions = [
    { key: 'orders.read', label: 'View Customer Orders' },
    { key: 'orders.update', label: 'Update Order Fulfillment Status' },
    { key: 'products.edit', label: 'Create & Edit Catalog Products' },
    { key: 'stock.adjust', label: 'Perform Warehouse Stock Adjustments' },
    { key: 'staff.invite', label: 'Invite New Employees' },
  ];

  const togglePermission = (key: string) => {
    if (permissions.includes(key)) {
      setPermissions(permissions.filter((p) => p !== key));
    } else {
      setPermissions([...permissions, key]);
    }
  };

  const handleRoleSelect = (role: 'MANAGER' | 'FULFILLMENT' | 'INVENTORY') => {
    setInviteRole(role);
    if (role === 'MANAGER') {
      setPermissions(['orders.read', 'orders.update', 'products.edit', 'stock.adjust', 'staff.invite']);
    } else if (role === 'FULFILLMENT') {
      setPermissions(['orders.read', 'orders.update']);
    } else {
      setPermissions(['products.edit', 'stock.adjust']);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const result = await onInviteStaff(inviteName, inviteEmail, permissions);
    if (result) {
      setInviteResult(result);
    }
  };

  const copyToClipboard = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.link);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Staff & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your store operations team, access control and role-based permissions (RBAC)
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setInviteResult(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Employee</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Permissions</th>
                <th className="py-3 px-3">Joined Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-slate-400">
                    No active staff members registered yet. Click &ldquo;Invite Employee&rdquo; to add your first team member.
                  </td>
                </tr>
              ) : (
                staffList.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {member.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {member.role || 'Fulfillment Staff'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {member.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRevokeStaff(member.userId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Invite Team Member
            </h3>

            {!inviteResult ? (
              <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. rahul@freshgreens.in"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'FULFILLMENT', label: 'Fulfillment Staff' },
                      { id: 'INVENTORY', label: 'Inventory Clerk' },
                      { id: 'MANAGER', label: 'Store Manager' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelect(r.id as any)}
                        className={`p-2 rounded-xl text-center font-semibold transition-colors ${
                          inviteRole === r.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Granular Access Permissions
                  </label>
                  <div className="space-y-1.5">
                    {availablePermissions.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-semibold"
                  >
                    {isInviting ? 'Generating Invitation...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                      Invitation Created Successfully!
                    </h4>
                    <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Share this secure invitation link with <strong>{inviteResult.email}</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {inviteResult.link}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1 flex-shrink-0"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-semibold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
