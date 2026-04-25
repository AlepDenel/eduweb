# Project Handoff Guide

This is the start-here document for frontend teammates and AI-assisted frontend tooling.

The backend is implemented, verified, and locked. Frontend work must integrate with the verified backend contract rather than inventing new API behavior.

## 1) Overview

- Backend status: implemented, verified, and frozen for submission readiness
- Backend type: Flask REST-style API with session-based authentication
- Database: MySQL
- Frontend responsibility: build UI and page flow on top of documented backend contracts only

Use the existing backend as-is. Do not assume missing routes or undocumented response fields exist.

## 2) Required Reading Order

1. University requirement PDF
2. `PROJECT_HANDOFF_README.md`
3. `FRONTEND_README.md`
4. `DATABASE_README.md`

This order matters:

- the PDF defines the assignment goals
- this document explains how to hand off safely
- `FRONTEND_README.md` defines the actual backend integration contract
- `DATABASE_README.md` defines how to reproduce the database locally

## 3) Clone Workflow

From project handoff to local integration:

1. clone the repository
2. install Python dependencies from `backend/requirements.txt`
3. create `backend/.env` from `backend/.env.example`
4. create a local MySQL database
5. run the verified schema initialization scripts
6. create local test accounts
7. start the backend
8. verify `GET /api/health`
9. connect the frontend to the verified backend routes

Practical backend startup flow:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env
python app.py
```

Before running `python app.py`, make sure:

- MySQL is running
- `backend/.env` exists
- the local database exists
- initialization scripts have been run

## 4) Frontend Boundaries

Frontend may:

- design UI
- create pages
- call API endpoints
- manage client-side navigation and presentation

Frontend must:

- use documented endpoints only
- preserve documented field names exactly
- respect role access rules
- maintain session authentication

Frontend must not:

- invent endpoints
- invent payload fields
- modify backend behavior
- assume pagination exists unless documented
- assume extra sorting/filtering exists unless documented

## 5) Required Frontend Pages

Frontend layout may vary.

Backend feature coverage must remain complete.

Required page checklist:

- Homepage

- Authentication:
  - Register
  - Login
  - Logout

- Academic content:
  - Course list
  - Course detail
  - Module list
  - Resource view

- Quiz system:
  - Quiz list
  - Quiz attempt
  - Quiz submission
  - Quiz results

- Student portal:
  - Progress overview
  - Course progress summary
  - Saved resources

- Forum:
  - Thread list
  - Thread detail
  - Post creation
  - Post reporting

- Moderator:
  - Report review
  - Post moderation

- Bookstore:
  - Category list
  - Book list
  - Book detail

- Commerce:
  - Cart
  - Checkout
  - Order history

- Admin dashboard:
  - Admin users
  - Admin courses
  - Admin modules
  - Admin resources
  - Admin quizzes
  - Admin questions
  - Admin answer options
  - Admin categories
  - Admin books
  - Admin order review

Important scope note:

- Moderator pages should only expose moderator/admin features that actually exist in the backend, mainly forum moderation actions
- Admin pages must use the admin route set documented in `FRONTEND_README.md`

## 6) AI Prompt Guidance

If using AI to generate frontend code, upload or provide these files:

- University requirement PDF
- `PROJECT_HANDOFF_README.md`
- `FRONTEND_README.md`
- `DATABASE_README.md`

Recommended instruction:

Use the University requirement PDF, PROJECT_HANDOFF_README.md, FRONTEND_README.md, and DATABASE_README.md as the authoritative project context.

Build frontend pages only using documented:

- routes
- request fields
- response fields
- wrapper keys
- role permissions
- database setup guidance

Do not invent:

- endpoints
- identifiers
- payload fields
- response fields
- role permissions
- database tables
- schema behavior
- wrapper keys

Preserve snake_case when sending API payloads.

Use session-based authentication.

## 7) Debug Order

If something fails, debug in this order:

1. check backend server
2. check `/api/health`
3. check `.env` values
4. check MySQL connection
5. check initialization scripts
6. check roles exist
7. check login
8. check route path
9. check request payload
10. check response wrapper keys
11. check browser console
12. check backend terminal logs

Practical meaning:

- if login fails, verify user exists and roles are seeded
- if protected routes fail, verify session cookie is being preserved
- if resource lookups fail, verify IDs exist in the local database
- if page data is empty, confirm sample data exists
- do not invent frontend workarounds before confirming backend behavior

## 8) Frontend Compliance Checklist

- homepage implemented
- authentication implemented
- course content implemented
- quiz system implemented
- student portal implemented
- saved resources implemented
- forum implemented
- moderation implemented
- bookstore implemented
- cart implemented
- checkout implemented
- order history implemented
- admin management implemented
- role-based access respected
- session authentication preserved
- backend contract preserved

## 9) Stability Statement

This documentation introduces no backend behavior changes.
