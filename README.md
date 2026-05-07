# EduTech Education Website

EduTech is a full-stack education website developed for an academic group project. The system supports undergraduate students by combining learning resources, quizzes, student progress tracking, saved resources, discussion forum features, bookstore browsing, cart/order history, moderation support, and a read-only Admin dashboard.

The backend has been verified and locked. The frontend backbone has been integrated against the verified backend contract using Next.js and TypeScript.

## Tech Stack

### Backend

- Python
- Flask
- SQLAlchemy
- MySQL
- Session-based authentication
- Role-based access control

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

## User Roles

The system supports three main roles:

- Student
- Moderator
- Admin

Frontend route guards are used for user experience only. Actual access control is enforced by the backend through session authentication and role-required backend routes.

## Main Features

### Authentication

- User registration
- User login
- User logout
- Current-session checking
- Role-aware navigation display

### Student Learning

- Course catalogue
- Course detail pages
- Module and resource display
- Resource completion tracking
- Quiz access from course modules
- Quiz attempt and submission flow
- Student progress overview
- Saved resources

### Forum

- Forum thread listing
- Thread creation
- Thread detail page
- Reply/post display
- Reply creation
- Post reporting and unreporting

### Moderation

- Moderator/Admin report review page
- Report list or safe empty-state display
- Hide reported post
- Unhide reported post
- Remove post action protected by confirmation

### Bookstore

- Bookstore catalogue
- Search by title or author
- Category filtering
- Book detail page
- Out-of-stock handling
- Cart page
- Order history
- Order detail page

### Admin

The current Admin frontend scope is read-only.

Admin pages include:

- Admin dashboard shell
- User overview
- Academic content overview
- Bookstore inventory overview
- Order review overview

No frontend Admin create, update, or delete workflow is included in the current backbone.

## Project Structure

```txt
backend/   Flask backend API, models, routes, and setup scripts
frontend/  Next.js frontend application
docs/      Project documentation and implementation references
```

## Documentation

Detailed project documentation is stored in the `docs/` folder:

- [Database Reference](docs/DATABASE_README.md)
- [Frontend Integration Contract](docs/FRONTEND_README.md)
- [Project Handoff Guide](docs/PROJECT_HANDOFF_README.md)
- [Implementation Log](docs/IMPLEMENTATION_LOG.md)

## Backend Setup

1. Go to the backend folder.

```powershell
cd backend
```

2. Create and activate a Python virtual environment.

3. Install the backend dependencies.

4. Create a local `.env` file using local credentials only.

5. Create a local MySQL database.

6. Run the verified database initialization scripts from the backend scripts folder in the documented order.

7. Start the Flask backend server.

Refer to the following documents for the full backend and database setup process:

- [Database Reference](docs/DATABASE_README.md)
- [Project Handoff Guide](docs/PROJECT_HANDOFF_README.md)

## Frontend Setup

1. Go to the frontend folder.

```powershell
cd frontend
```

2. Install frontend dependencies.

```powershell
npm install
```

3. Run the frontend development server.

```powershell
npm run dev
```

4. For production build validation, run:

```powershell
npm run build
```

The frontend uses the Next.js rewrite configuration to forward `/api/...` requests to the Flask backend during local development.

## Local Development Notes

Run the backend and frontend in separate terminals.

Typical local URLs:

```txt
Backend:  http://127.0.0.1:5000
Frontend: http://localhost:3000
```

The frontend expects the backend API to be available through the `/api` path. Session-based requests must preserve cookies.

## Validation Status

The frontend backbone integration has been validated against the locked backend contract.

Validated areas:

- Unauthenticated access behavior
- Student login, session, logout, course, resource, quiz, progress, saved resource, forum, bookstore, cart, and order flows
- Moderator access to moderation routes
- Moderator denial from Admin routes
- Admin access to read-only Admin routes
- Admin access to moderation routes
- Logout and session switching
- Role-aware Navbar behavior
- Backend, database, and schema files remained untouched during frontend integration

Known validation caveats:

- Checkout was not fully retested with a fresh in-stock cart item because the available bookstore item was out of stock.
- Cart empty state and existing order history/detail were validated.
- Moderation hide/unhide was validated.
- Admin pages are intentionally read-only in the current frontend backbone.

## Git Safety Notes

Do not commit:

- `.env`
- Python virtual environments
- `node_modules/`
- `.next/`
- build output
- local logs
- local database dumps

Backend, database, and schema changes should only be made through approved implementation steps.

## Current Project Status

The backend is verified and locked. The frontend backbone is integrated and ready for UI/design polish, as long as future work preserves the backend contract and does not introduce unapproved backend, database, schema, or CRUD changes.
