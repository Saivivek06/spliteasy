# BUILD_PLAN.md — SplitEasy

---

## 1. Product Research

### How I Studied Splitwise
- Analyzed core user flows: creating groups, adding expenses, viewing balances, settling up
- Identified 4 split types Splitwise supports: equal, exact amounts, percentages, shares
- Noted real-time comment feature per expense
- Studied balance simplification: Splitwise reduces multiple debts into minimum transactions

### Key Workflows Identified
1. **Registration/Login** → JWT-based, stateless
2. **Group Creation** → Admin creates group, invites others by username
3. **Add Expense** → Choose payer, split type, members included, validate amounts
4. **View Balances** → Per group: who paid how much vs what they owe; simplified to fewest debts
5. **Settle Up** → Record a manual payment, reduces balance
6. **Expense Chat** → Real-time comment thread per expense

### Product Assumptions Made
- Single currency (INR ₹) — no conversion needed at MVP
- Invite by username (no email invite links)
- No expense editing — delete and re-add
- No mobile app — responsive web only
- Settlements are manual / honor-system (no payment gateway)

---

## 2. Architecture

### Tech Stack
- **Frontend**: React 18 + Vite (fast HMR, lightweight)
- **Backend**: Express.js (familiar, minimal boilerplate)
- **Database**: PostgreSQL (relational, required by assignment)
- **ORM**: Prisma (schema-first, type-safe, auto-migrations)
- **Auth**: JWT + bcrypt (no third-party dependency)
- **Real-time**: Socket.io (WebSocket + polling fallback)
- **Deployment**: Railway (supports Node.js + PostgreSQL in one project)

### Database Schema (6 tables)
```
users → group_members ← groups
expenses → expense_splits
expenses → messages
settlements → groups
```

### API Design
REST over HTTP. Auth via Bearer JWT header. All routes authenticated except /auth/login and /auth/register.
Socket.io used only for real-time chat (messages); all other data via REST.

### Frontend Structure
- Pages: Login, Register, Dashboard, Group detail, Expense detail
- Global state: AuthContext (user), ToastContext (notifications)
- Per-page local state with useEffect + API calls
- No Redux/Zustand — not needed at this scale

### Deployment Approach
- Backend + DB on Railway (one project, two services)
- Frontend on Railway static site or Vercel
- Environment variables for all secrets and URLs

---

## 3. AI Collaboration Process

### How I Instructed the AI
- Provided the full assignment PDF as context
- Asked Claude to build the entire project from scratch
- Specified to note what steps require manual action (GitHub, deployment, secrets)

### Build Order
1. Database schema (Prisma)
2. Backend: Auth → Groups → Expenses → Settlements → Messages → Socket
3. Frontend: Layout → Auth pages → Dashboard → Group page → Expense page
4. Documentation: README, AI_CONTEXT, BUILD_PLAN

### How AI_CONTEXT.md Was Maintained
This file was written during the build to document every decision as it was made,
so another developer or AI can reconstruct the app from it.

---

## 4. Trade-offs

### Simplified
- No email verification (just register → use)
- No expense editing (delete + recreate)
- No pagination (all expenses loaded at once)
- No file uploads / receipts
- Manual settlements (no Razorpay/Stripe integration)

### Hardcoded
- Currency: INR (₹)
- Avatar colors: 8 preset hex values, randomly assigned at registration
- Group colors: 8 preset hex values, user-selectable

### Avoided
- Email invite links (too much infra for MVP)
- Activity feed / expense history timeline
- Mobile push notifications
- Multi-currency

### Would Improve With More Time
- Expense editing (not just delete)
- Email invite flow with tokenized links
- Pagination / infinite scroll for expenses
- Recurring expense templates
- Export to CSV / PDF
- Real payment integration (Razorpay UPI)
- Mobile responsive sidebar (hamburger menu)
- Full test suite (Jest + Supertest for backend)
