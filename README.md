# SplitEasy — Splitwise Clone

A full-stack expense-splitting app built as an internship assignment for Spreetail.

**AI Used:** Claude (Anthropic) — claude.ai

---

## Features

- **Auth** — Register / Login with JWT
- **Groups** — Create groups, invite members by username, remove members
- **Expenses** — Add expenses with 4 split types: equal, unequal, percentage, by share
- **Real-time Chat** — Comment on each expense via Socket.io
- **Balances** — Group-wise and individual balance summaries using a greedy debt-simplification algorithm
- **Settlements** — Record debt payments, track history

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| Deployment | Railway |

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a cloud PostgreSQL URL)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd spliteasy
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npx prisma db push      # Creates all tables
npm run dev             # Starts on port 4000
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env
# Edit .env if backend is not on localhost:4000
npm install
npm run dev             # Starts on port 5173
```

Open http://localhost:5173

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL="postgresql://user:password@localhost:5432/spliteasy"
JWT_SECRET="any-random-secret-string"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

---

## Deployment (Railway)

See `BUILD_PLAN.md` → Deployment section for step-by-step Railway deployment instructions.

---

## Project Structure

```
spliteasy/
├── backend/
│   ├── prisma/schema.prisma     # Database schema
│   ├── src/
│   │   ├── index.js             # Entry point
│   │   ├── middleware/auth.js   # JWT middleware
│   │   ├── routes/              # Express routes
│   │   ├── controllers/         # Business logic
│   │   └── socket/index.js      # Socket.io real-time chat
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Route-level components
│   │   ├── components/          # Reusable UI
│   │   ├── context/             # Auth + Toast context
│   │   ├── hooks/               # useSocket hook
│   │   └── utils/api.js         # Axios instance
│   └── .env.example
├── AI_CONTEXT.md
├── BUILD_PLAN.md
└── README.md
```
