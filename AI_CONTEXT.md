# AI_CONTEXT.md — SplitEasy

## Purpose

This document serves as the complete source of truth for the SplitEasy project.

It captures product understanding, scope, architecture, engineering decisions, implementation details, deployment configuration, AI collaboration process, and known limitations.

The objective is that another developer or AI system should be able to reproduce a functionally similar application using this document.

---

# Project Overview

## Product Name

SplitEasy

## Project Goal

SplitEasy is a simplified Splitwise-inspired expense sharing application that allows users to:

* Create groups
* Add shared expenses
* Split expenses using multiple strategies
* View balances
* Record settlements
* Communicate through real-time expense discussions

The project was built as a full-stack software engineering internship assignment focused on product understanding, AI-assisted development, deployment, and reproducibility.

---

# Product Research

## Product Studied

Splitwise

## Core Workflows Identified

### User Management

* Register account
* Login
* Join expense groups

### Group Management

* Create group
* Add members
* Remove members
* View group balances

### Expense Management

* Add expense
* Split expense
* Track debts
* View balances

### Settlement Workflow

* Record payments
* Reduce outstanding balances

### Communication Workflow

* Discuss expenses using comments/messages

---

# MVP Scope

## Included Features

### Authentication

* User registration
* User login
* JWT-based session handling

### Groups

* Create groups
* Add users by username
* Remove users
* View members

### Expenses

* Equal split
* Unequal split
* Percentage split
* Share-based split

### Balances

* Group-level balances
* Individual summaries
* Debt simplification

### Settlements

* Record payments
* Settlement history

### Real-Time Features

* Expense-specific chat
* Socket.io updates

---

## Out of Scope

To keep the project achievable within the assignment timeline, the following features were intentionally excluded:

* Email verification
* Social login
* File uploads
* Receipt scanning
* Multi-currency support
* Recurring expenses
* Notifications
* Activity feeds
* Payment gateway integration

---

# User Roles

## Group Admin

Responsibilities:

* Create groups
* Add members
* Remove members
* Delete expenses

## Member

Responsibilities:

* Add expenses
* View balances
* Record settlements
* Participate in chat

---

# Technology Stack

## Frontend

* React 18
* Vite
* React Router v6
* Axios
* Socket.io Client

## Backend

* Node.js
* Express.js
* Socket.io

## Database

* PostgreSQL

## ORM

* Prisma

## Authentication

* JWT
* bcryptjs

## Deployment

* Railway

---

# Database Design

## User

Fields:

* id
* email
* username
* displayName
* passwordHash
* avatarColor
* createdAt

Constraints:

* email unique
* username unique

---

## Group

Fields:

* id
* name
* description
* color
* createdById
* createdAt

---

## GroupMember

Fields:

* id
* groupId
* userId
* role
* joinedAt

Constraint:

* unique(groupId, userId)

Purpose:

Represents group membership and permissions.

---

## Expense

Fields:

* id
* groupId
* description
* amount
* currency
* splitType
* paidById
* createdAt
* updatedAt

---

## ExpenseSplit

Fields:

* id
* expenseId
* userId
* amount
* percentage
* shares
* settled

Constraint:

* unique(expenseId, userId)

Purpose:

Stores the calculated share of each participant.

---

## Settlement

Fields:

* id
* groupId
* fromId
* toId
* amount
* note
* createdAt

Purpose:

Represents debt repayment transactions.

---

## Message

Fields:

* id
* expenseId
* userId
* content
* createdAt

Purpose:

Supports expense-level discussion.

---

# Expense Splitting Logic

## Equal Split

Formula:

Total Expense ÷ Number of Members

Rounding:

The first participant absorbs any fractional remainder.

---

## Unequal Split

Each participant receives a manually specified amount.

Validation:

Sum of all participant amounts must equal the expense total.

---

## Percentage Split

Each participant receives a percentage allocation.

Validation:

Total percentages must equal 100%.

---

## Share-Based Split

Formula:

Participant Amount =
(Participant Shares ÷ Total Shares) × Expense Amount

---

# Balance Calculation Strategy

## Step 1

For each expense:

* Payer receives +expense amount
* Participants receive −their split amount

## Step 2

For each settlement:

* Sender receives +settlement amount
* Receiver receives −settlement amount

## Step 3

Aggregate all values per user.

## Step 4

Generate simplified debt recommendations using a greedy matching algorithm:

1. Sort creditors descending.
2. Sort debtors descending.
3. Match largest creditor with largest debtor.
4. Repeat until all balances are settled.

---

# API Design

## Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

---

## Groups

GET /api/groups

POST /api/groups

GET /api/groups/:id

POST /api/groups/:id/members

DELETE /api/groups/:id/members/:userId

GET /api/groups/:id/balances

---

## Expenses

POST /api/expenses

GET /api/expenses/group/:groupId

GET /api/expenses/:id

DELETE /api/expenses/:id

GET /api/expenses/my-balances

---

## Settlements

POST /api/settlements

GET /api/settlements/group/:groupId

---

## Messages

GET /api/messages/:expenseId

---

# Real-Time Architecture

Socket.io rooms are used for expense-specific communication.

Client Events:

* join_expense
* leave_expense
* send_message

Server Events:

* new_message

Authentication:

JWT token passed during socket connection.

---

# Frontend Architecture

## Pages

/login

/register

/

/groups/:id

/expenses/:id

---

## State Management

### AuthContext

Maintains:

* current user
* login state
* logout state

### ToastContext

Maintains:

* success notifications
* error notifications

### Local Component State

Used for page-level interactions.

No Redux or Zustand was used because application complexity did not justify additional state-management overhead.

---

# Deployment Architecture

## Production URLs

Frontend:

https://wonderful-dream-production-a8d7.up.railway.app

Backend:

https://spliteasy-production-a979.up.railway.app

Repository:

https://github.com/Saivivek06/spliteasy

---

## Deployment Process

1. Push code to GitHub.
2. Create Railway project.
3. Provision PostgreSQL service.
4. Deploy backend service.
5. Configure environment variables.
6. Deploy frontend service.
7. Connect frontend and backend URLs.
8. Push Prisma schema to production database.
9. Perform smoke testing.

---

# Testing Strategy

The following scenarios were validated:

* Registration
* Login
* Group creation
* Member invitation
* Member removal
* Equal split expenses
* Unequal split expenses
* Percentage split expenses
* Share split expenses
* Balance calculations
* Settlements
* Real-time chat
* Production deployment

---

# Major Changes During Development

### Deployment URL Migration

Initial builds referenced localhost endpoints.

Updated to Railway production URLs.

### CORS Resolution

Production requests were blocked by CORS configuration.

Resolved by updating FRONTEND_URL in backend deployment variables.

### Database Synchronization Issue

Production registration failed because the Railway PostgreSQL database did not contain required Prisma tables.

Resolved by connecting Prisma to the Railway PostgreSQL database and executing:

npx prisma db push

### Production Frontend Deployment

Frontend deployment configuration was updated to correctly serve the production React build.

---

# Trade-Offs

| Decision                   | Reason                                    |
| -------------------------- | ----------------------------------------- |
| Username invitations       | Simpler than email invitation system      |
| Single currency (INR)      | Reduced complexity                        |
| No expense editing         | Faster MVP delivery                       |
| Manual settlements         | No payment integration required           |
| No pagination              | Data volume expected to remain small      |
| Greedy debt simplification | Easy to understand and sufficient for MVP |

---

# Known Limitations

* No expense editing workflow
* No recurring expenses
* No multi-currency support
* No push notifications
* No email verification
* No payment gateway integration
* No automated settlement reconciliation

---

# Key Prompts Used

## Product Planning

"Reverse engineer Splitwise and identify the minimum viable workflows required for a 2–3 day implementation."

## Database Design

"Design a PostgreSQL schema for a Splitwise clone supporting users, groups, expenses, settlements, and expense discussions."

## Expense Logic

"Implement equal, unequal, percentage, and share-based expense splitting with validation."

## Authentication

"Implement JWT authentication with secure password hashing."

## Real-Time Communication

"Implement expense-level chat using Socket.io."

## Deployment

"Deploy a React frontend, Express backend, and PostgreSQL database on Railway."

## Production Debugging

"Diagnose CORS, deployment, and Prisma database synchronization issues in Railway."

---

# AI Collaboration Summary

AI tools were used as development collaborators for:

* Product planning
* Database design
* Architecture design
* API design
* Frontend implementation
* Backend implementation
* Deployment guidance
* Debugging assistance
* Documentation generation

Final implementation decisions, testing, deployment verification, production debugging, and project submission preparation were completed manually by the developer.
