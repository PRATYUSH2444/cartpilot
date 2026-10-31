import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  MessageSquare,
  Package,
  MapPin,
  Shield,
  User,
  Trash2,
  Edit2,
  Leaf,
  Zap,
} from 'lucide-react';

interface ChatSessionItem {
  _id: string;
  title: string;
  updatedAt?: string;
}

interface ConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionItem[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, currentTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onOpenRules: () => void;
  onOpenAccount: () => void;
  onOpenIntegrations?: () => void;
  activeOrdersCount?: number;
}

export const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onOpenOrders,
  onOpenAddresses,
  onOpenRules,
  onOpenAccount,
  onOpenIntegrations,
  activeOrdersCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group sessions into Today, Yesterday, Older
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todaySessions: ChatSessionItem[] = [];
  const yesterdaySessions: ChatSessionItem[] = [];
  const olderSessions: ChatSessionItem[] = [];

  filteredSessions.forEach((s) => {
    if (!s.updatedAt) {
      todaySessions.push(s);
      return;
    }
    const d = new Date(s.updatedAt);
    if (d.toDateString() === todayStr) {
      todaySessions.push(s);
    } else if (d.toDateString() === yesterdayStr) {
      yesterdaySessions.push(s);
    } else {
      olderSessions.push(s);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content: 82-85% width */}
      <div className="relative w-[85%] max-w-[340px] h-full bg-[--surface] flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-250">
        {/* Header */}
        <div className="p-4 border-b border-[--line] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[--brand] flex items-center justify-center text-white shadow-xs">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-[--ink] leading-tight">
                CartPilot
              </h2>
              <p className="text-[10px] text-[--mut]">AI Shopping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[--mut] hover:text-[--ink] rounded-full hover:bg-[--surface-2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-[--line]/60">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-[var(--radius-input)] bg-[--brand] hover:bg-[--brand-hover] text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 py-2 border-b border-[--line]/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[--mut] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[--surface-2] border-0 text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-1 focus:ring-[--brand]"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Today Group */}
          {todaySessions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[--mut] uppercase tracking-wider px-2">
                Today
              </span>
              {todaySessions.map((s) => (
                <div
                  key={s._id}
                  className={`w-full flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-left text-xs transition-colors group cursor-pointer ${
                    s._id === activeSessionId
                      ? 'bg-[--brand-soft] text-[--brand] font-semibold'
                      : 'text-[--ink] hover:bg-[--surface-2]'
                  }`}
                  onClick={() => {
                    onSelectSession(s._id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[--mut]" />
                    <span className="truncate">{s.title}</span>
                  </div>
                  <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onRenameSession(s._id, s.title)}
                      className="p-1 text-[--mut] hover:text-[--ink]"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteSession(s._id)}
                      className="p-1 text-[--mut] hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yesterday Group */}
          {yesterdaySessions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[--mut] uppercase tracking-wider px-2">
                Yesterday
              </span>
              {yesterdaySessions.map((s) => (
                <div
                  key={s._id}
                  className={`w-full flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-left text-xs transition-colors group cursor-pointer ${
                    s._id === activeSessionId
                      ? 'bg-[--brand-soft] text-[--brand] font-semibold'
                      : 'text-[--ink] hover:bg-[--surface-2]'
                  }`}
                  onClick={() => {
                    onSelectSession(s._id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[--mut]" />
                    <span className="truncate">{s.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Older Group */}
          {olderSessions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[--mut] uppercase tracking-wider px-2">
                Older
              </span>
              {olderSessions.map((s) => (
                <div
                  key={s._id}
                  className={`w-full flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-left text-xs transition-colors group cursor-pointer ${
                    s._id === activeSessionId
                      ? 'bg-[--brand-soft] text-[--brand] font-semibold'
                      : 'text-[--ink] hover:bg-[--surface-2]'
                  }`}
                  onClick={() => {
                    onSelectSession(s._id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[--mut]" />
                    <span className="truncate">{s.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredSessions.length === 0 && (
            <p className="text-center text-[--mut] text-xs py-6">No chat sessions found</p>
          )}
        </div>

        {/* Quick Access Section */}
        <div className="border-t border-[--line] p-3 space-y-1 bg-[--surface-2]/60">
          <span className="text-[10px] font-bold text-[--mut] uppercase tracking-wider px-2 block mb-1">
            Quick Access
          </span>

          <button
            onClick={() => {
              onOpenOrders();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs text-[--ink] hover:bg-[--surface] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>My Orders</span>
            </div>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[--brand-soft] text-[--brand] font-bold text-[10px]">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenAddresses();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-[--ink] hover:bg-[--surface] transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Saved Addresses</span>
          </button>

          <button
            onClick={() => {
              onOpenRules();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-[--ink] hover:bg-[--surface] transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Spending Permissions</span>
          </button>

          <button
            onClick={() => {
              onOpenAccount();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-[--ink] hover:bg-[--surface] transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 text-[--mut]" />
            <span>My Account</span>
          </button>

          {onOpenIntegrations && (
            <button
              onClick={() => {
                onOpenIntegrations();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer mt-1"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">AI &amp; Integrations</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                Setup
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
