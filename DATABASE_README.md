# Database Handoff Reference

This document describes the verified database setup and schema groupings used by the EduTech backend.

It is intended for teammates and AI-assisted tooling that need to reproduce the local database safely without inventing tables, columns, roles, or setup behavior.

This document is GitHub-safe. It contains no private credentials.

## 1) Database Purpose

The MySQL database supports:

- authentication and role-based access control
- course, module, and resource hierarchy
- quizzes, questions, answer options, attempts, and grading
- progress tracking and portal overview
- saved resources
- forum threads, posts, reports, and moderation
- bookstore catalogue
- cart and checkout
- orders and purchase history
- admin management
- homepage data retrieval

Important homepage note:

- homepage announcements are non-persistent
- homepage announcements always return an empty list
- homepage featured courses and popular books are derived from existing `courses` and `books` data

## 2) Expected Database Setup

- Database engine: MySQL
- SQLAlchemy driver: `mysql+pymysql`
- Default example database name from configuration: `edutech_backend`

Local setup rules:

- each developer must create their own local database
- do not rely on another teammate’s running database
- do not invent schema manually
- use the verified initialization scripts in `backend/scripts`

## 3) Environment Variables

Use local placeholder values only.

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
SECRET_KEY=your_local_secret_key
APP_HOST=127.0.0.1
APP_PORT=5000
DEBUG=True
```

Safety rules:

- values are local to each developer machine
- secrets must not be committed
- `.env` files must not be pushed to GitHub

The backend already expects these variables through `backend/.env` and `backend/.env.example`.

## 4) Table Groups

### Authentication

- `roles`
- `users`

### Academic

- `courses`
- `modules`
- `resources`

### Quiz

- `quizzes`
- `questions`
- `answer_options`
- `quiz_attempts`
- `attempt_answers`

### Progress

- `progress_records`
- `saved_resources`

### Forum

- `forum_threads`
- `forum_posts`
- `forum_reports`

### Bookstore

- `categories`
- `books`

### Cart

- `carts`
- `cart_items`

### Orders

- `orders`
- `order_items`

## 5) Relationship Map

- User → Role
- Course → Module → Resource
- Module → Quiz
- Quiz → Question → AnswerOption
- User → QuizAttempt → AttemptAnswer
- User → ProgressRecord
- User → SavedResource
- ForumThread → ForumPost → ForumReport
- Category → Book
- User → Cart → CartItem
- User → Order → OrderItem

Practical interpretation:

- a `module` belongs to one `course`
- a `resource` belongs to one `module`
- a `quiz` belongs to one `module`
- a `question` belongs to one `quiz`
- an `answer_option` belongs to one `question`
- a `quiz_attempt` belongs to one `quiz` and one `user`
- an `attempt_answer` belongs to one `quiz_attempt` and one `question`
- a `saved_resource` links a `user` to one `resource`
- a `progress_record` links a `user` to one `resource`
- a `forum_post` belongs to one `forum_thread`
- a `forum_report` belongs to one `forum_post`
- a `book` belongs to one `category`
- a `cart_item` belongs to one `cart` and one `book`
- an `order_item` belongs to one `order` and one `book`

## 6) Initialization Order

Run the existing scripts in dependency order from the `backend` directory.

Suggested safe order:

1. `python scripts/init_auth_schema.py`
2. `python scripts/verify_auth_schema.py`
3. `python scripts/init_course_schema.py`
4. `python scripts/init_module_schema.py`
5. `python scripts/init_resource_schema.py`
6. `python scripts/init_quiz_schema.py`
7. `python scripts/init_question_schema.py`
8. `python scripts/init_answer_option_schema.py`
9. `python scripts/init_quiz_attempt_schema.py`
10. `python scripts/init_attempt_answer_schema.py`
11. `python scripts/init_grading_schema.py`
12. `python scripts/init_progress_schema.py`
13. `python scripts/init_saved_resources_schema.py`
14. `python scripts/init_forum_thread_schema.py`
15. `python scripts/init_forum_post_schema.py`
16. `python scripts/init_forum_report_schema.py`
17. `python scripts/init_forum_moderation_schema.py`
18. `python scripts/init_bookstore_schema.py`
19. `python scripts/init_cart_schema.py`
20. `python scripts/init_order_schema.py`

Do not invent extra initialization scripts.

### Initialization Safety Notes

- run these scripts only once on a fresh database
- re-running schema scripts on an existing schema may cause conflicts or duplicate-setup problems
- do not manually create tables outside the verified scripts
- do not change the script order
- if a setup mistake happens, fix it by recreating a clean local database rather than improvising schema edits

## 7) Required Roles

These roles must exist before users are created:

- `Student`
- `Moderator`
- `Admin`

Role setup is part of the auth schema initialization flow.

## 8) Test Accounts

Use placeholder examples only.

- Student: `student@example.test`
- Moderator: `moderator@example.test`
- Admin: `admin@example.test`

Rules:

- passwords are local and developer-defined
- do not commit credentials
- do not publish private account files

## 9) Sample Data

Recommended minimum local dataset:

- one course
- one module
- one resource
- one quiz
- one multiple-choice question
- one short-answer question
- one answer option
- one category
- one book with `stock_quantity > 0`
- one forum thread
- one forum post

Purpose:

Allow frontend UI testing without inventing schema.

## 10) Backup / Import

### Export example

```powershell
mysqldump -u your_mysql_user -p your_database_name > edutech_backup.sql
```

### Import example

```powershell
mysql -u your_mysql_user -p your_database_name < edutech_backup.sql
```

Safety guidance:

- keep dumps local unless explicitly needed for team coordination
- ensure dumps do not include private secrets or `.env` files
- do not commit SQL dumps to GitHub unless the team explicitly approves a sanitized sample

## 11) Database Safety Rules

Do not:

- rename tables
- rename columns
- bypass role setup
- invent schema
- hardcode IDs
- commit `.env`
- commit database dumps casually
- modify schema to satisfy frontend convenience

Always treat the verified backend models and scripts as the source of truth.

## 12) Stability Statement

Database schema is locked after Step 40.

This document introduces no schema changes.

Database Version:
Locked after Step 40 Final Backend System Lock.

Schema changes require a new approved implementation step.

## 13) Table Reference

### roles

Purpose:
Stores the available system roles used for access control.

Primary key:
`id`

Important foreign keys:
None

Key fields:
`name`

Important constraints:
Role names must remain consistent with the verified backend: `Student`, `Moderator`, `Admin`.

### users

Purpose:
Stores system users and authentication identity.

Primary key:
`id`

Important foreign keys:
`role_id` -> `roles.id`

Key fields:
`name`
`email`
`password_hash`
`created_at`

Important constraints:
`email` must be unique.
`role_id` must reference an existing role.
Passwords are stored as `password_hash`, not plain text.

### courses

Purpose:
Stores top-level academic course records.

Primary key:
`id`

Important foreign keys:
None

Key fields:
`title`
`description`
`created_at`

Important constraints:
Courses are referenced by `modules`.

### modules

Purpose:
Stores course modules under a parent course.

Primary key:
`id`

Important foreign keys:
`course_id` -> `courses.id`

Key fields:
`title`
`description`
`created_at`

Important constraints:
Each module must reference an existing course.
Modules are referenced by `resources` and `quizzes`.

### resources

Purpose:
Stores learning resources inside a module.

Primary key:
`id`

Important foreign keys:
`module_id` -> `modules.id`

Key fields:
`title`
`resource_type`
`content_url`
`content_text`
`created_at`

Important constraints:
Each resource must reference an existing module.
Resources are referenced by `progress_records` and `saved_resources`.

### quizzes

Purpose:
Stores quizzes attached to modules.

Primary key:
`id`

Important foreign keys:
`module_id` -> `modules.id`

Key fields:
`title`
`description`
`time_limit_minutes`
`passing_score`
`created_at`

Important constraints:
Each quiz must reference an existing module.
Quizzes are referenced by `questions` and `quiz_attempts`.

### questions

Purpose:
Stores quiz questions.

Primary key:
`id`

Important foreign keys:
`quiz_id` -> `quizzes.id`

Key fields:
`question_text`
`question_type`
`correct_short_answer`
`points`
`created_at`

Important constraints:
Each question must reference an existing quiz.
Questions are referenced by `answer_options` and `attempt_answers`.

### answer_options

Purpose:
Stores selectable answer options for questions.

Primary key:
`id`

Important foreign keys:
`question_id` -> `questions.id`

Key fields:
`option_text`
`is_correct`
`created_at`

Important constraints:
Each answer option must reference an existing question.
Answer options are referenced by `attempt_answers`.

### quiz_attempts

Purpose:
Stores user quiz attempt lifecycle and scoring state.

Primary key:
`id`

Important foreign keys:
`quiz_id` -> `quizzes.id`
`user_id` -> `users.id`

Key fields:
`score`
`started_at`
`submitted_at`
`status`

Important constraints:
Each attempt must reference an existing quiz and user.
Attempts are referenced by `attempt_answers`.

### attempt_answers

Purpose:
Stores submitted answers inside a specific quiz attempt.

Primary key:
`id`

Important foreign keys:
`quiz_attempt_id` -> `quiz_attempts.id`
`question_id` -> `questions.id`
`answer_option_id` -> `answer_options.id` (nullable)

Key fields:
`short_answer_text`
`is_correct`
`created_at`

Important constraints:
Only one answer per question per attempt is allowed through a unique constraint on `quiz_attempt_id + question_id`.

### progress_records

Purpose:
Stores per-user completion state for resources.

Primary key:
`id`

Important foreign keys:
`user_id` -> `users.id`
`resource_id` -> `resources.id`

Key fields:
`completed_at`
`created_at`

Important constraints:
Only one progress record per user per resource is allowed.

### saved_resources

Purpose:
Stores per-user saved or bookmarked resources.

Primary key:
`id`

Important foreign keys:
`user_id` -> `users.id`
`resource_id` -> `resources.id`

Key fields:
`created_at`

Important constraints:
Only one saved-resource record per user per resource is allowed.

### forum_threads

Purpose:
Stores discussion threads created by users.

Primary key:
`id`

Important foreign keys:
`user_id` -> `users.id`

Key fields:
`title`
`content`
`created_at`

Important constraints:
Each thread must reference an existing user.
Threads are referenced by `forum_posts`.

### forum_posts

Purpose:
Stores replies or posts inside a forum thread.

Primary key:
`id`

Important foreign keys:
`thread_id` -> `forum_threads.id`
`user_id` -> `users.id`
`moderated_by_user_id` -> `users.id` (nullable)

Key fields:
`content`
`is_hidden`
`moderated_at`
`created_at`

Important constraints:
Each post must reference an existing thread and user.
Posts are referenced by `forum_reports`.

### forum_reports

Purpose:
Stores user reports against forum posts.

Primary key:
`id`

Important foreign keys:
`post_id` -> `forum_posts.id`
`user_id` -> `users.id`

Key fields:
`reason`
`created_at`

Important constraints:
Only one report per user per post is allowed.

### categories

Purpose:
Stores bookstore categories.

Primary key:
`id`

Important foreign keys:
None

Key fields:
`name`
`created_at`

Important constraints:
`name` must be unique.
Categories are referenced by `books`.

### books

Purpose:
Stores bookstore inventory items.

Primary key:
`id`

Important foreign keys:
`category_id` -> `categories.id`

Key fields:
`title`
`author`
`price`
`stock_quantity`
`created_at`

Important constraints:
Each book must reference an existing category.
Books are referenced by `cart_items` and `order_items`.

### carts

Purpose:
Stores the active cart for a user.

Primary key:
`id`

Important foreign keys:
`user_id` -> `users.id`

Key fields:
`created_at`

Important constraints:
The verified cart flow expects one active cart per user.
The cart is referenced by `cart_items`.

### cart_items

Purpose:
Stores selected books inside a cart.

Primary key:
`id`

Important foreign keys:
`cart_id` -> `carts.id`
`book_id` -> `books.id`

Key fields:
`quantity`
`created_at`

Important constraints:
Unique constraint on `cart_id + book_id`.
Each cart item must reference an existing cart and book.

### orders

Purpose:
Stores completed simulated checkout records.

Primary key:
`id`

Important foreign keys:
`user_id` -> `users.id`

Key fields:
`status`
`total_amount`
`created_at`

Important constraints:
Each order must reference an existing user.
Orders are referenced by `order_items`.

### order_items

Purpose:
Stores purchased book snapshots inside an order.

Primary key:
`id`

Important foreign keys:
`order_id` -> `orders.id`
`book_id` -> `books.id`

Key fields:
`quantity`
`price`
`created_at`

Important constraints:
Each order item must reference an existing order and book.
`price` stores a purchase-time snapshot and must not depend on later book price changes.
