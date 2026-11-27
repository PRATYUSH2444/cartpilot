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

  // Auto-resize composer textarea smoothly as user types or when text changes
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.style.height = '44px';
      const scrollH = composerRef.current.scrollHeight;
      if (composerText.trim()) {
        composerRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 112)}px`;
      }
    }
  }, [composerText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && composerText.trim()) {
        onSendMessage(composerText);
        if (composerRef.current) {
          composerRef.current.style.height = '44px';
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
            <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white shadow-2xs mt-0.5 ring-1 ring-emerald-600/20">
              <Leaf className="w-3.5 h-3.5 fill-white/20" />
            </div>
          ) : (
            <div className="w-7.5 h-7.5 flex-shrink-0" />
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
                className={`px-4 py-2.5 sm:py-3 text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-[18px] rounded-br-xs shadow-2xs font-medium'
                    : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-[18px] rounded-bl-xs border border-stone-200/80 dark:border-stone-800 shadow-2xs'
                }`}
              >
                <p>{msg.content}</p>

                {/* Tool Calls audit badge */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 space-y-1">
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-mono mr-1 border border-stone-200/50 dark:border-stone-750"
                      >
                        <Sparkles className="w-3 h-3 text-stone-500" />
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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-stone-50/60 dark:bg-zinc-950 relative overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="h-13.5 sm:h-14 flex items-center justify-between px-3.5 sm:px-4 border-b border-stone-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 -ml-1 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Open sessions drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-600 flex items-center justify-center text-white shadow-2xs">
              <Leaf className="w-3.5 h-3.5 fill-white/20" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-stone-900 dark:text-white leading-tight">
                CartPilot AI
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-zinc-400">Your agentic grocery assistant</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-200/80 dark:border-zinc-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* ── Messages Canvas ────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden px-3.5 sm:px-4 py-3.5 sm:py-4 space-y-4 relative"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center py-8 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-850 text-stone-800 dark:text-stone-200 flex items-center justify-center border border-stone-200 dark:border-stone-800 shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg sm:text-xl text-stone-900 dark:text-white">
                How can CartPilot help you today?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Ask for custom meal plans, recipes, or grocery shopping within your budget.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onSendMessage(p.prompt)}
                  className="flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-left transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-base">{p.emoji}</span>
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white line-clamp-2">
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
              <div className="flex gap-2.5 items-start">
                <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-600 flex items-center justify-center text-white mt-0.5 shadow-2xs flex-shrink-0">
                  <Leaf className="w-3.5 h-3.5 fill-white/20" />
                </div>
                <div className="px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-[18px] rounded-bl-xs shadow-2xs">
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-700 dark:text-stone-300" />
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
            className="sticky bottom-3 ml-auto mr-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 shadow-md hover:bg-stone-100 dark:hover:bg-stone-850 transition-all cursor-pointer z-30"
            aria-label="Jump to latest message"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100 animate-pulse" />
            <span>Jump to latest</span>
            <ArrowDown className="w-3.5 h-3.5 text-stone-400" />
          </button>
        )}
      </div>

      {/* Floating Cart Bar for < 1100px */}
      {Boolean(cart && cart.items && cart.items.length > 0 && onOpenCartDrawer) && (
        <div className="min-[1100px]:hidden px-3 sm:px-4 pt-1.5 pb-0.5 flex-shrink-0 z-20 max-w-[760px] mx-auto w-full">
          <button
            type="button"
            onClick={onOpenCartDrawer}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-900 hover:from-emerald-700 hover:to-emerald-850 text-white shadow-md shadow-emerald-950/20 border border-emerald-700/60 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center shadow-xs">
                {cart!.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-tight">View Cart</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold font-mono">
              <span>
                ₹{(cart!.items.reduce((s, i) => s + (i.itemTotalPaise || i.pricePaise * i.quantity), 0) / 100).toFixed(2)}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-300 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      )}

      {/* ── Composer Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-stone-200/80 dark:border-zinc-800 px-3 sm:px-4 pt-2 sm:pt-2.5 pb-[calc(76px+env(safe-area-inset-bottom,0px))] lg:pb-3 flex-shrink-0 z-20 shadow-2xs">
        <div className="max-w-[760px] mx-auto space-y-2">
          {/* Quick suggestion prompt chips (hide on click) */}
          {visiblePromptChips.length > 0 && (
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {visiblePromptChips.map((q) => (
                <button
                  key={q}
                  onClick={() => handleChipClick(q)}
                  className="flex-shrink-0 px-3 py-1 rounded-full bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 border border-stone-200/80 dark:border-zinc-800 text-xs font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2.5">
            <textarea
              ref={composerRef}
              rows={1}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for groceries, recipes, or meals…"
              className="flex-1 resize-none rounded-2xl bg-stone-100/90 dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 px-4 py-2.5 text-[14px] text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:ring-emerald-500/30 h-[44px] min-h-[44px] max-h-28 leading-[22px] font-sans box-border transition-all"
            />

            {isLoading ? (
              <button
                onClick={onStopGeneration}
                className="w-12 h-11 sm:w-12 sm:h-12 rounded-2xl bg-stone-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm active:scale-95"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (composerText.trim()) {
                    onSendMessage(composerText);
                    if (composerRef.current) {
                      composerRef.current.style.height = '44px';
                    }
                  }
                }}
                disabled={!composerText.trim()}
                className={`w-12 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer shadow-sm active:scale-95 ${
                  composerText.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                    : 'bg-stone-200/80 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                }`}
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-5.5 h-5.5 stroke-[2.4px] ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
