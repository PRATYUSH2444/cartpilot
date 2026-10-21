# ROLE & AUTHENTICATION BEHAVIOR CONTRACT FOR CARTPILOT

Save this as `docs/ROLE_CONTRACT.md`. Every phase must obey it.

## ROLES

- **Customer:** signs up publicly, lands on `/shopper`.
- **Merchant owner:** applies through a public "Become a merchant" form, lands on `/merchant`.
- **Merchant staff:** created only by owner invitation, lands on `/merchant` with limited screens.
- **Admin:** never public. Lands on `/admin`.

---

## CUSTOMER

- **Sign up:** name, email, password. Email is normalized. Password: at least 8 characters, checked against common passwords. A duplicate email shows a clear field error (rate limited).
- **Sign in:** email and password. Failures give one generic message. Progressive lockout after repeated failures.
- **Email verification:** behind a flag. When on, an unverified customer can chat and build a cart but cannot pay until verified.
- **First run:** the chat shows a setup card for address, optional avoid list, optional preferred merchant, and a rules preset. Skippable, with a nudge before the first payment.
- **Permissions:**
  - _Can:_ chat, cart, own rules, own addresses, own orders, ratings, own notifications, verify own order proofs.
  - _Cannot:_ see any other user's data, use merchant or admin routes.

---

## MERCHANT OWNER

- **Application form:** store name, owner name, email, password, phone, address, pincode and service area, and a declaration that the store sells only vegetarian products. This creates the user and a merchant in status "pending".
- **Pending:** can sign in and see an "Awaiting approval" screen with the submitted details (editable). Can prepare draft products but cannot go live or receive orders.
- **Status Lifecycle:**
  - _Approved by admin:_ store becomes active, owner is notified.
  - _Rejected:_ reason shown, can reapply.
  - _Suspended:_ read-only with a banner, no new orders, open orders must be completed or refunded.
- **Permissions:**
  - _Can:_ everything for their own store (products, variants, stock, visibility, pricing, orders, store settings, staff, API keys, analytics).
  - _Cannot:_ see another merchant's data, touch platform settings.
- **Staff Invitation:** Invites staff by email. The invite is a single-use token valid 7 days. Revoking a staff member ends their sessions.

---

## MERCHANT STAFF

- Gets only the permission flags the owner granted: `orders.update`, `products.edit`, `stock.adjust`, `pricing.edit`, `settings.edit`. Anything else returns 403 with a friendly message. All actions are audited.

---

## ADMIN

- Created only by a seed or CLI command using values from the environment, with a forced password change at first login. No API creates an admin except an existing admin, who must re-enter their password, and the action is audited.
- **Permissions:**
  - _Can:_ view all, approve, reject, suspend and restore users and merchants, reconcile payments, issue refunds, set policy defaults and presets, flip flags and the agent kill switch, verify the audit chain.
  - _Cannot:_ impersonate a user, edit or delete audit events, see raw card data (none exists).
- Sensitive actions need a confirmation and a reason.

---

## SESSIONS

- Access token about 15 minutes, held in memory only. Refresh token in an `httpOnly`, `secure`, `sameSite` cookie with rotation and reuse detection (reuse revokes the whole family).
- Lifetimes shorter for merchant and admin (defaults: customer 30 days, merchant 7 days, admin 1 day, configurable).
- Password change, role change, suspension and "sign out everywhere" revoke all sessions.
- An account security page lists active sessions with device and last-used time and allows revoking each.

---

## PASSWORD RESET

- The request always returns the same response whether or not the email exists.
- Reset tokens are single-use, stored hashed, expire in 30 minutes, are rate limited, and a successful reset revokes all sessions.
- Email goes through an adapter: console transport in development (the dev link may appear only in development), a real provider selected by environment in production.

---

## ROUTING

- After login, redirect by role. A wrong-role URL redirects to the user's own home with a notice.
- A 401 goes to login and returns to the original page afterward.
- Expired sessions show a "Session ended" dialog without losing server-side state (cart and drafts).
- Development quick sign-in buttons and seeded demo accounts exist only when a development flag is on and the environment is not production. The production build must not contain demo credentials.

---

## AUDIT

- Sign-ups, logins, failed logins, lockouts, resets, invites, approvals, suspensions, role changes and session revocations are all audited with a correlation id.
