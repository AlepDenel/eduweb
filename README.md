# EduTech Education Website

EduTech is a full-stack education website developed for an academic group project. The system provides a student learning platform with course resources, quizzes, progress tracking, saved resources, discussion forum features, bookstore browsing, cart/order history, moderation support, and a read-only Admin dashboard.

The backend has been verified and locked, while the frontend backbone has been integrated against the verified backend contract using Next.js and TypeScript.

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
- Session-based current user checking
- Role-aware frontend navigation

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
