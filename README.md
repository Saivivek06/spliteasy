# SplitEasy – Splitwise Clone

## Overview

SplitEasy is a full-stack expense-sharing application inspired by Splitwise. The platform allows users to create groups, add expenses using multiple split strategies, track balances, record settlements, and communicate through real-time expense discussions.

The project was developed as part of a software engineering internship assignment and demonstrates full-stack application development, database design, authentication, real-time communication, and cloud deployment.

---

## Live Deployment

**Frontend:**
https://wonderful-dream-production-a8d7.up.railway.app

**Backend API:**
https://spliteasy-production-a979.up.railway.app

**GitHub Repository:**
https://github.com/Saivivek06/spliteasy

---

## Features

### Authentication

* User registration
* User login
* JWT-based authentication
* Protected routes

### Group Management

* Create expense groups
* Invite members by username
* View group members
* Remove members from groups

### Expense Management

* Add expenses within groups
* Multiple expense splitting methods:

  * Equal Split
  * Unequal Split
  * Percentage Split
  * Share-Based Split
* Expense history tracking

### Balance Tracking

* Individual balance calculations
* Group-wise balance summaries
* Debt simplification logic

### Settlements

* Record payments between members
* Settlement history tracking
* Balance updates after settlement

### Real-Time Communication

* Expense-specific chat system
* Socket.IO powered messaging
* Live updates without page refresh

---

## Technology Stack

| Layer                   | Technology          |
| ----------------------- | ------------------- |
| Frontend                | React 18, Vite      |
| Backend                 | Node.js, Express.js |
| Database                | PostgreSQL          |
| ORM                     | Prisma              |
| Authentication          | JWT, bcrypt         |
| Real-Time Communication | Socket.IO           |
| Deployment              | Railway             |

---

## System Architecture

Frontend (React + Vite)

↓

Backend API (Express.js)

↓

Prisma ORM

↓

PostgreSQL Database

↓

Socket.IO (Real-Time Communication)

---

## Database Design

The application uses a relational PostgreSQL database managed through Prisma ORM.

### Core Models

* User
* Group
* GroupMember
* Expense
* ExpenseSplit
* Settlement
* Message

Relationships are designed to support:

* Many-to-many user-group membership
* One-to-many expense ownership
* Expense split tracking
* Settlement records
* Real-time discussion threads

---

## Local Development Setup

### Prerequisites

* Node.js 18+
* PostgreSQL
* Git

---

### Clone Repository

```bash
git clone https://github.com/Saivivek06/spliteasy.git
cd spliteasy
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/spliteasy"
JWT_SECRET="your-secret-key"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

Push database schema:

```bash
npx prisma db push
```

Start backend server:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Start frontend:

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend

```env
DATABASE_URL=
JWT_SECRET=
PORT=
FRONTEND_URL=
```

### Frontend

```env
VITE_API_URL=
VITE_SOCKET_URL=
```

---

## API Modules

### Authentication

* Register User
* Login User

### Groups

* Create Group
* Add Member
* Remove Member
* Get Group Details

### Expenses

* Create Expense
* Fetch Expenses
* Calculate Balances

### Settlements

* Record Settlement
* Settlement History

### Messages

* Expense Chat Messages
* Real-Time Messaging Events

---

## Deployment

The application is deployed using Railway.

### Services

1. Frontend Service

   * React production build
   * Static hosting

2. Backend Service

   * Node.js Express server
   * REST API
   * Socket.IO server

3. PostgreSQL Database

   * Managed Railway PostgreSQL instance
   * Prisma ORM integration

Deployment planning and implementation details are documented in `BUILD_PLAN.md`.

---

## AI Usage Disclosure

AI-assisted development tools were used during the project for:

* Project planning
* Architecture discussion
* Debugging support
* Code review assistance
* Documentation generation

All final implementation decisions, deployment configuration, testing, debugging, and integration were completed by the project author.

Additional details are documented in `AI_CONTEXT.md`.

---

## Testing

The following workflows were successfully tested on the deployed application:

* User Registration
* User Login
* Group Creation
* Group Membership Management
* Expense Creation
* Equal Expense Split
* Unequal Expense Split
* Percentage Expense Split
* Share-Based Expense Split
* Settlement Recording
* Balance Calculation
* Real-Time Messaging

---

## Author

Sai Vivek

GitHub: https://github.com/Saivivek06
