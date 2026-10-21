Save this verbatim as docs/UX_CONTRACT.md. Every task below obeys it. It overrides older UI wording where they conflict.

PRODUCT IDEA
CartPilot is quick-commerce with an agent on top. The core is the fast grocery loop (browse, add, see ETA, pay, track, reorder), and the agent is the faster path to the same cart: it can build a cart from a request, explain choices, apply policy remedies and reorder. The shopper never needs a separate page: the chat is home, and browsing, cart, payment, orders and rules open as sheets or panels above it.

ONE SOURCE OF TRUTH
- The server cart is the only cart. Every cart view (chat proposal lines, product tiles, cart drawer, checkout card, header badge) reads it through one shared query and writes through one mutation path with the cart version. No component keeps its own copy of quantities.
- The same typed OrderLine (variantId, name, pack label, unit price in paise, quantity, optional flag, image reference) is used by cart, checkout snapshot, order and merchant view. A contract test proves cart lines equal snapshot lines equal order lines.
- Everything the user sees on reload is rebuilt from persisted server data: conversation, cards, cart, orders, rules, addresses.

LAYOUTS (all three are first-class)
- Mobile (360 to 640 px): single column chat. Bottom tab bar: Chat, Browse, Cart (with count and total), Orders, More. Product, cart, payment and order details open as bottom sheets with a drag handle. Composer sits above the tab bar. Sticky "View cart, N items, ₹X" bar appears after the first add. Safe areas and on-screen keyboard handled.
- Tablet (641 to 1023 px): collapsible navigation rail plus chat. Browse and cart open as a right slide-over (about 420 px). Product details open as a centered sheet.
- Laptop (1024 px and wider): three zones: conversation sidebar (280 px), chat column (max 760 px), and a persistent context panel (about 360 px) showing the live cart, delivery estimate and rules summary, collapsible. Browse opens as a large modal grid. 1440 px and wider add margins, not stretched content.

QUICK-COMMERCE CORE (inspired by the pattern, not by any brand's visuals)
- Delivery chip at the top: "Delivery in about 30 min (estimated, simulated)" and the saved address.
- Browse sheet: search with aliases, category chips (vegetables, dairy, grains and atta, pulses, spices, oils, dry fruits), product tiles with image, name, pack, price, stock state and a stepper that edits the cart directly.
- "Buy again" row from order history, re-priced with a diff.
- Free-delivery progress ("Add ₹X more for free delivery") only when the merchant configured such a threshold.
- No fake discounts, fake scarcity or fake social proof. Strike-through prices only when the merchant has set a real compare-at price.

AGENTIC LAYER
- Every browse action has a chat equivalent and vice versa. The agent builds and edits the same cart. Policy card, remedies, approval, proof and "why this item" stay central.
- The agent can never pay, confirm or approve. Consent is a button bound to the exact checkout snapshot.
- Permission card pattern (from the reference): "CartPilot wants to place an order with {merchant}. Verify the details before allowing." with exact items, payment method row, estimated total, Deny and Allow, and a status chip such as "Waiting for your confirmation".

DESIGN RULES
- Warm white and cream surfaces, deep green brand, mint user bubbles, soft assistant bubbles. Green, amber and red are reserved for allowed, needs approval and blocked.
- Bricolage Grotesque for headings and amounts, Instrument Sans for body. No monospace for ordinary labels (hashes and order ids only). No ALL CAPS labels. Sentence case. No emojis; use consistent line icons.
- 14 px minimum body text, 12 px minimum for secondary text, contrast at least 4.5:1 in light and dark. Money formatted from integer paise only.
- Every screen has loading, empty, error, offline and success states.

PERSISTENCE RULES
Orders, order history, carts, chat sessions and messages, mandates, addresses and notifications survive page reloads, API restarts and redeploys. Seed scripts never wipe user data.

ACCESSIBILITY
WCAG 2.2 AA target: keyboard-only use for every flow, visible focus, logical focus order, focus trap and return for sheets and dialogs, Escape closes, named icon buttons, aria-live for the chat stream, role=status for policy and payment state, text resizable to 200 percent, touch targets at least 44 px, prefers-reduced-motion and a Reduce effects setting, color never the only signal, labelled form fields with error summaries.
