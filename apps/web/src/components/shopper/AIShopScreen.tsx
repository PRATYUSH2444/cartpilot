import React, { useRef, useEffect, useState } from 'react';
import {
  Menu,
  Plus,
  Send,
  Square,
  Loader2,
  Sparkles,
  Leaf,
  ArrowDown,
  ArrowRight,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, LampStatus, CartData } from '../../types';
import { ItemsCard } from '../cards/ItemsCard';
import { CartCard } from '../cards/CartCard';
import { ApprovalCard } from '../cards/ApprovalCard';
import { OrderCard } from '../cards/OrderCard';

interface AIShopScreenProps {
  messages: ChatMessage[];
  isLoading: boolean;
  composerText: string;
  setComposerText: (text: string) => void;
  onSendMessage: (text: string) => void;
  onStopGeneration?: () => void;
  onOpenDrawer: () => void;
  onOpenCartDrawer?: () => void;
  onNewChat: () => void;
  cart: CartData | null;
  onAddToCart?: (productId: string, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onAddProposedItems: (items: Array<{ productId: string; quantity: number }>) => void;
  onApproveSpending?: (approvalId: string) => void;
  onRejectSpending?: (approvalId: string) => void;
  lampStatus: LampStatus;
  lampReasonCode: string;
  lampReasonText: string;
}

const EXAMPLE_PROMPTS = [
  { emoji: '🍲', label: 'Quick Paneer Pulao for 4', prompt: 'Make Paneer Pulao for 4 people with all ingredients' },
  { emoji: '🍛', label: 'Spicy Dal Tadka, serves 2', prompt: 'Dal Tadka recipe with ingredients for 2 servings' },
  { emoji: '📖', label: 'Weekly groceries under ₹1,500', prompt: 'Weekly grocery list under ₹1500' },
  { emoji: '🧄', label: 'Aloo Matar curry, feeds 6', prompt: 'Aloo Matar curry ingredients for 6 people' },
];

const PROMPT_CHIPS = [
  'Quick Paneer Pulao',
  'Dal Tadka for 2',
  'Weekly budget ₹1500',
  'High protein items',
];

export const AIShopScreen: React.FC<AIShopScreenProps> = ({
  messages,
  isLoading,
  composerText,
  setComposerText,
  onSendMessage,
  onStopGeneration,
  onOpenDrawer,
  onOpenCartDrawer,
  onNewChat,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onAddProposedItems,
  onApproveSpending,
  onRejectSpending,
  lampStatus,
  lampReasonCode,
  lampReasonText,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [usedChips, setUsedChips] = useState<string[]>([]);
  const isNearBottomRef = useRef(true);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom <= 80;
    isNearBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowJumpToLatest(false);
    isNearBottomRef.current = true;
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && composerText.trim()) {
        onSendMessage(composerText);
        if (composerRef.current) {
          composerRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleChipClick = (chipText: string) => {
    setUsedChips((prev) => [...prev, chipText]);
    onSendMessage(chipText);
  };

  // Helper to determine if timestamp should show (> 5 minutes apart from previous message)
  const shouldShowTimestamp = (currMsg: ChatMessage, prevMsg?: ChatMessage) => {
    if (!prevMsg) return true;
    if (!currMsg.createdAt || !prevMsg.createdAt) {
      return currMsg.timestamp !== prevMsg.timestamp;
    }
    const tCurr = typeof currMsg.createdAt === 'number' ? currMsg.createdAt : new Date(currMsg.createdAt).getTime();
    const tPrev = typeof prevMsg.createdAt === 'number' ? prevMsg.createdAt : new Date(prevMsg.createdAt).getTime();
    if (isNaN(tCurr) || isNaN(tPrev)) return true;
    return Math.abs(tCurr - tPrev) >= 5 * 60 * 1000;
  };

  const renderMessageContent = (msg: ChatMessage, index: number) => {
    const isUser = msg.sender === 'user';
    const prevMsg = index > 0 ? messages[index - 1] : undefined;
    // Group assistant avatars: only render avatar on the first message of a consecutive assistant run
    const isFirstInAssistantRun = !isUser && (!prevMsg || prevMsg.sender !== 'agent');
    const showTimestamp = shouldShowTimestamp(msg, prevMsg);

    return (
      <div
        key={msg.id}
        className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {!isUser && (
          isFirstInAssistantRun ? (
            <div className="w-8 h-8 rounded-full bg-[--brand] flex items-center justify-center flex-shrink-0 text-white shadow-xs mt-0.5">
              <Leaf className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 flex-shrink-0" />
          )
        )}

        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[78%]`}>
          {msg.isError ? (
            <div className="px-4 py-3 text-sm leading-relaxed rounded-[18px] rounded-bl-xs border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium">{msg.content}</p>
                  {msg.retryText && (
                    <button
                      type="button"
                      onClick={() => onSendMessage(msg.retryText!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            msg.content && (
              <div
                className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[--brand] text-white rounded-[18px] rounded-br-xs shadow-xs font-medium'
                    : 'bg-[--surface] text-[--ink] rounded-[18px] rounded-bl-xs border border-[--line] shadow-card'
                }`}
              >
                <p>{msg.content}</p>

                {/* Tool Calls audit badge */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[--line]/40 space-y-1">
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[--brand-soft] text-[--brand] text-[10px] font-mono mr-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{tc.toolName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* Cards attached to Agent Message */}
          {Boolean(msg.cardType === 'items' && msg.cardData) && (
            <div className="w-full">
              <ItemsCard
                cardData={msg.cardData as any}
                onAddToCart={(prodId, qty) => {
                  if (onAddToCart) {
                    onAddToCart(prodId, qty);
                  } else {
                    onAddProposedItems([{ productId: prodId, quantity: qty }]);
                  }
                }}
                onAddAllToCart={onAddProposedItems}
                cartItems={cart?.items}
                onUpdateQuantity={onUpdateQuantity}
              />
            </div>
          )}

          {Boolean(msg.cardType === 'cart' && cart) && (
            <div className="w-full">
              <CartCard
                cart={cart!}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={(id) => onUpdateQuantity(id, 0)}
                onClearCart={() => {}}
                onInitiateCheckout={() => {}}
                lampStatus={lampStatus}
                lampReasonCode={lampReasonCode}
                lampReasonText={lampReasonText}
                isLoading={isLoading}
              />
            </div>
          )}

          {Boolean(msg.cardType === 'approval' && msg.cardData) && (
            <div className="w-full">
              <ApprovalCard
                cartTotal={(msg.cardData as any)?.cartTotal || '₹0'}
                reason={(msg.cardData as any)?.reason || 'Autonomy check'}
                cartVersion={(msg.cardData as any)?.cartVersion || 1}
                status={(msg.cardData as any)?.approvalStatus || 'PENDING'}
                approvalHash={(msg.cardData as any)?.approvalHash}
                onApprove={() => {
                  const id = (msg.cardData as any)?.approvalId;
                  if (id && onApproveSpending) onApproveSpending(id);
                }}
                onReject={() => {
                  const id = (msg.cardData as any)?.approvalId;
                  if (id && onRejectSpending) onRejectSpending(id);
                }}
                isLoading={isLoading}
              />
            </div>
          )}

          {Boolean(msg.cardType === 'order' && msg.cardData) && (
            <div className="w-full">
              <OrderCard
                order={msg.cardData as any}
                onAdvanceFulfillment={() => {}}
                isLoading={isLoading}
              />
            </div>
          )}

          {showTimestamp && (
            <span className="text-[10px] text-[--mut] px-1 select-none font-sans">
              {msg.timestamp}
            </span>
          )}
        </div>
      </div>
    );
  };

  const visiblePromptChips = PROMPT_CHIPS.filter((q) => !usedChips.includes(q));

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[--bg] relative overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[--line] bg-[--surface]/95 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawer}
            className="p-2 -ml-2 rounded-xl text-[--mut] hover:text-[--ink] hover:bg-[--surface-2] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open sessions drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[--brand] flex items-center justify-center text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-[--ink] leading-tight">
                CartPilot AI
              </h2>
              <p className="text-[10px] text-[--mut]">Your agentic grocery assistant</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[--brand-soft] hover:bg-[--brand] text-[--brand] hover:text-white font-heading font-bold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* ── Messages Canvas ────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden px-4 py-4 space-y-4 relative"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[--brand] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-xl text-[--ink]">
                How can CartPilot help you today?
              </h3>
              <p className="text-xs text-[--mut]">
                Ask for custom meal plans, recipes, or grocery shopping within your budget.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onSendMessage(p.prompt)}
                  className="flex items-start gap-2 p-3 rounded-2xl bg-[--surface] border border-[--line] hover:border-[--brand]/40 text-left transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-base">{p.emoji}</span>
                  <span className="text-[11px] font-semibold text-[--ink] group-hover:text-[--brand] line-clamp-2">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-[760px] mx-auto w-full space-y-4">
            {messages.map(renderMessageContent)}

            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-[--brand] flex items-center justify-center text-white mt-0.5 shadow-xs">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 bg-[--surface] border border-[--line] rounded-[18px] rounded-bl-xs shadow-card">
                  <div className="flex items-center gap-2 text-xs text-[--mut]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[--brand]" />
                    <span>CartPilot is planning your groceries…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Floating Jump to Latest button */}
        {showJumpToLatest && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="sticky bottom-4 ml-auto mr-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[--surface] border border-[--line] text-xs font-semibold text-[--ink] shadow-lg hover:bg-[--surface-2] transition-all cursor-pointer z-30"
            aria-label="Jump to latest message"
          >
            <span className="w-2 h-2 rounded-full bg-[--brand] animate-pulse" />
            <span>Jump to latest</span>
            <ArrowDown className="w-3.5 h-3.5 text-[--mut]" />
          </button>
        )}
      </div>

            {/* Floating Cart Bar for < 1100px */}
      {Boolean(cart && cart.items && cart.items.length > 0 && onOpenCartDrawer) && (
        <div className="min-[1100px]:hidden px-4 pt-1 flex-shrink-0 z-20 max-w-[760px] mx-auto w-full">
          <button
            type="button"
            onClick={onOpenCartDrawer}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[--ink] text-[--surface] shadow-md hover:opacity-95 transition-opacity cursor-pointer font-sans"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[--brand] text-white text-[11px] font-bold flex items-center justify-center font-sans">
                {cart!.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="text-xs font-semibold">View Cart</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold font-sans">
              <span>
                ₹{(cart!.items.reduce((s, i) => s + (i.itemTotalPaise || i.pricePaise * i.quantity), 0) / 100).toFixed(2)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[--brand]" />
            </div>
          </button>
        </div>
      )}

      {/* ── Composer Bar ───────────────────────────────────────────────────── */}
      <div className="bg-[--surface]/95 backdrop-blur-md border-t border-[--line] px-4 py-3 flex-shrink-0 z-20 shadow-md">
        <div className="max-w-[760px] mx-auto space-y-2">
          {/* Quick suggestion prompt chips (hide on click) */}
          {visiblePromptChips.length > 0 && (
            <div
              className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {visiblePromptChips.map((q) => (
                <button
                  key={q}
                  onClick={() => handleChipClick(q)}
                  className="flex-shrink-0 px-3 py-1 rounded-full bg-[--surface-2] hover:bg-[--brand-soft] text-[--mut] hover:text-[--brand] text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={composerRef}
              rows={1}
              value={composerText}
              onChange={(e) => {
                setComposerText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask CartPilot for groceries, recipes, or meal ideas…"
              className="flex-1 resize-none rounded-[var(--radius-input)] bg-[--surface-2] border border-[--line] px-4 py-2.5 text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-2 focus:ring-[--brand]/20 focus:border-[--brand] min-h-[44px] max-h-24 leading-relaxed font-sans"
            />

            {isLoading ? (
              <button
                onClick={onStopGeneration}
                className="w-11 h-11 rounded-[var(--radius-input)] bg-rose-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (composerText.trim()) {
                    onSendMessage(composerText);
                    if (composerRef.current) {
                      composerRef.current.style.height = 'auto';
                    }
                  }
                }}
                disabled={!composerText.trim()}
                className="w-11 h-11 rounded-[var(--radius-input)] bg-[--brand] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex-shrink-0 shadow-xs"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
