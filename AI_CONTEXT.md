# AI_CONTEXT.md — SplitEasy

This file is the single source of truth for the SplitEasy project.
Another developer or AI agent should be able to read this file and rebuild a similar app.

---

## Product Understanding

SplitEasy is a simplified Splitwise clone for tracking shared expenses within groups.
Core jobs: track who paid what, calculate who owes whom, and allow debt settlement.

---

## Product Scope (MVP)

### In scope
- Email + password authentication (JWT)
- Create and manage groups (create, invite by username, remove members)
- Add expenses with 4 split types: equal, unequal, percentage, by share
- Per-expense real-time chat (Socket.io)
- Group-wise balance summary + simplified debt view (greedy algorithm)
- Individual dashboard showing total owed / total owing
- Record settlements (debt payments)

### Out of scope
- Email verification
- Profile pictures / file uploads
- Currency conversion (INR only)
- Push / email notifications
- Recurring expenses
- Activity feed / audit trail

---

## User Personas

1. **Group creator (admin)** — Creates the group, adds members, can remove members, can delete any expense
2. **Member** — Can add expenses, record settlements, view balances. Can delete own expenses

---

## Data Model

### Users
- id, email (unique), username (unique), displayName, passwordHash, avatarColor, createdAt

### Groups
- id, name, description, color, createdById, createdAt

### GroupMembers
- id, groupId, userId, role (admin|member), joinedAt
- Unique constraint: (groupId, userId)

### Expenses
- id, groupId, description, amount, currency (INR default), splitType (equal|unequal|percentage|share), paidById, createdAt, updatedAt

### ExpenseSplits
- id, expenseId, userId, amount, percentage (nullable), shares (nullable), settled (boolean)
- Unique constraint: (expenseId, userId)

### Settlements
- id, groupId, fromId, toId, amount, note, createdAt

### Messages
- id, expenseId, userId, content, createdAt

---

## Split Type Logic

### Equal
- amount / number_of_members per person
- Rounding: first person absorbs remainder

### Unequal
- Each person's exact amount is specified
- Validation: sum of amounts must equal total (within ₹0.01)

### Percentage
- Each person gets a % of total
- Validation: percentages must sum to 100 (within 0.01%)

### By Share
- Each person gets N shares
- Person's amount = (their_shares / total_shares) × total
- No validation needed (any share counts work)

---

## Balance Calculation

1. For each expense: paidBy gets +amount, each split member gets -split.amount
2. For each settlement: fromId gets +amount (they paid it), toId gets -amount (received)
3. Net result per user = sum of above
4. Simplified debts use greedy algorithm: sort creditors (positive balance) and debtors (negative), match largest creditor with largest debtor, repeat

---

## API Design

### Auth
- POST /api/auth/register — { email, username, displayName, password }
- POST /api/auth/login — { email, password }
- GET /api/auth/me — returns current user

### Groups
- GET /api/groups — user's groups
- POST /api/groups — { name, description, color }
- GET /api/groups/:id — group detail
- POST /api/groups/:id/members — { username } (admin only)
- DELETE /api/groups/:id/members/:userId (admin only)
- GET /api/groups/:id/balances — { memberBalances, debts }

### Expenses
- POST /api/expenses — { groupId, description, amount, splitType, paidById, memberIds, splitData }
- GET /api/expenses/group/:groupId
- GET /api/expenses/:id
- DELETE /api/expenses/:id (paidBy or admin)
- GET /api/expenses/my-balances — { totalOwed, totalOwe }

### Settlements
- POST /api/settlements — { groupId, toId, amount, note }
- GET /api/settlements/group/:groupId

### Messages
- GET /api/messages/:expenseId

### Socket.io Events
- Client emits: join_expense(expenseId), leave_expense(expenseId), send_message({ expenseId, content })
- Server emits: new_message(messageObject)
- Auth: JWT token passed in socket.handshake.auth.token

---

## Frontend Architecture

### Pages
- /login — LoginPage
- /register — RegisterPage
- / — DashboardPage (groups overview, global balances)
- /groups/:id — GroupPage (tabs: Expenses, Balances, Settlements, Members)
- /expenses/:id — ExpensePage (split detail + real-time chat)

### Components
- Layout — sidebar with group nav, balance summary, user info
- ExpenseForm — modal, handles all 4 split types with live validation
- SettleModal — record payment modal with pre-fill from balance data

### State management
- AuthContext — user, login(), logout()
- ToastContext — success/error notifications
- Local useState per page — no global state library needed at this scale

### API Layer
- Axios instance with base URL + JWT interceptor
- 401 responses auto-logout + redirect

### Socket Layer
- Singleton socket instance (one connection per session)
- useExpenseSocket hook joins/leaves expense rooms, receives real_time messages

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Fonts**: Inter (body), Syne (display)
- **Design**: Custom CSS with CSS variables, dark theme (#0f0f13 bg, #7c6aff accent)

---

## Deployment Plan (Railway)

1. Push code to GitHub
2. Create new project on Railway (railway.app)
3. Add a PostgreSQL database service
4. Add a Node.js service from GitHub repo, root directory: backend/
5. Set environment variables in Railway:
   - DATABASE_URL (auto-set by Railway if linked)
   - JWT_SECRET
   - FRONTEND_URL (set after frontend deploy)
   - PORT (Railway sets this automatically)
6. Railway start command: `node src/index.js`
7. Add build command: `npx prisma generate && npx prisma db push`
8. Deploy frontend to Railway as a static site (or Vercel):
   - Build: `npm run build`
   - Output: dist/
   - Set VITE_API_URL and VITE_SOCKET_URL to backend Railway URL

---

## Testing Plan

Manual testing checklist:
- [ ] Register two users
- [ ] Create a group as user 1, add user 2 by username
- [ ] Add expense (equal split), verify both users see correct balances
- [ ] Add expense (unequal split), verify validation
- [ ] Add expense (percentage split), verify validation
- [ ] Add expense (share split), verify amounts calculated correctly
- [ ] Open expense, send chat messages, verify real-time in second browser tab
- [ ] Record a settlement, verify balance changes
- [ ] Remove member (admin), verify they're gone
- [ ] Delete expense, verify balance recalculates

---

## Trade-offs

| Simplified | Reason |
|---|---|
| No email verification | Reduces setup complexity |
| Invite by username (not email link) | Faster to implement |
| INR only | Single currency scope |
| No expense editing | Harder state management; delete+recreate instead |
| Greedy debt simplification | Simple and correct for small groups |
| No pagination | MVP scope; not needed under 100 expenses |

---

## Known Limitations

- Balance calculation loads all expenses at once (not paginated) — fine for MVP
- Socket connection is a singleton, not cleaned up on logout (refresh handles it)
- No optimistic UI updates — always waits for server response
- Group color is decorative only, not used in balance grouping
- Settlement does not mark individual ExpenseSplit rows as settled (tracked separately)

---

## Implementation Notes
# Key Prompts Used

## Initial Assignment Prompt

"You are a junior engineer helping me complete an internship assignment.

The assignment is to reverse engineer Splitwise, scope a realistic 3-day version, and build a working deployed app.

Important instructions:

1. Do not assume product requirements.
2. Do not jump directly into implementation.
3. Ask me detailed questions about product scope, UX, workflows, edge cases, and engineering decisions.
4. Ask about every implementation detail needed to build the app.
5. After each answer I give, update a Markdown file called AI_CONTEXT.md.
6. AI_CONTEXT.md must become the source of truth for the entire project.
7. The final app must be buildable from AI_CONTEXT.md.
8. Another evaluator should be able to paste AI_CONTEXT.md into the same AI tool and recreate a similar app.
9. Before writing code, produce a build plan based only on the agreed context.
10. During implementation, keep updating AI_CONTEXT.md whenever requirements, architecture, schema, UI, or logic changes.
11. Do not recommend technical solutions. Your job is to let me think through the technical solution."

---

## Database Design Prompt

"Design a PostgreSQL database schema for a Splitwise-inspired application supporting users, groups, group memberships, expenses, settlements, expense comments, and multiple expense splitting methods."

---

## Expense Splitting Logic Prompt

"Implement equal, unequal, percentage-based, and share-based expense splitting with validation rules and balance calculations."

---

## Authentication Prompt

"Implement JWT-based authentication with secure password hashing using bcrypt and protected API routes."

---

## Real-Time Chat Prompt

"Implement real-time expense comments using Socket.io. Users viewing the same expense should receive new messages instantly."

---

## Frontend Architecture Prompt

"Design a React frontend with pages for authentication, dashboard, group details, expense details, balances, settlements, and expense chat."

---

## Deployment Prompt

"Deploy a React frontend, Express backend, and PostgreSQL database using Railway. Configure environment variables, production URLs, Prisma, and Socket.io."

---

## Debugging Prompts Used During Development

### CORS Issue

"Diagnose and fix CORS errors occurring between the deployed frontend and backend services."

### Railway Deployment Issue

"Investigate why API requests are failing after deployment despite successful builds."

### Database Migration Issue

"Diagnose Prisma errors indicating that database tables do not exist in the production PostgreSQL database."

### Production Database Fix

"Connect Prisma to the Railway PostgreSQL database and synchronize the schema using Prisma commands."

---

## AI Collaboration Notes

AI was used as a development collaborator for:

* Product planning
* Architecture design
* Database schema design
* API design
* React frontend implementation
* Express backend implementation
* Prisma ORM integration
* Socket.io integration
* Railway deployment
* Debugging production issues
* Documentation generation

Final implementation decisions, testing, deployment, validation, and debugging were performed manually by the developer.


- Prisma's `@@unique([groupId, userId])` prevents duplicate group memberships
- Split rounding: first member in the array absorbs rounding remainder (< ₹0.01)
- Socket.io uses both websocket and polling transports for Railway compatibility
- Avatar colors are randomly assigned from a preset palette at registration
- Group creator is always admin; admins can remove non-creator members

- ## Major Changes During Development

1. Initial deployment used localhost URLs for frontend-backend communication.
   Updated to Railway production URLs during deployment.

2. Registration initially failed in production because the Railway PostgreSQL database did not contain the Prisma schema.
   Resolved by connecting Prisma to the Railway PostgreSQL instance and running:
   npx prisma db push

3. CORS configuration was updated to allow requests from the deployed frontend domain.

4. Added Railway environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - FRONTEND_URL

5. Frontend deployment was updated to serve the production React build correctly using Railway.

   ## Deployment URLs

Frontend:
https://wonderful-dream-production-a8d7.up.railway.app

Backend:
https://spliteasy-production-a979.up.railway.app

Repository:
https://github.com/Saivivek06/spliteasy
