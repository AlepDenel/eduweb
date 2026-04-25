# Frontend Integration Contract

This document reflects the verified backend state after Step 40 Final Backend System Lock.

No backend behavior changes are introduced by this document.

Frontend implementations must treat this document as the integration contract unless the backend is formally changed in a later approved step.

## 1) System Overview

- Purpose: The backend provides the data, authentication, authorization, quiz lifecycle, forum, bookstore, progress tracking, and admin management services for the EduTech platform.
- Backend role: Flask REST-style JSON backend.
- Base API path: `/api`
- Authentication model: Session-based login.
- Roles:
  - `Student`
  - `Moderator`
  - `Admin`
- Role model: Access is enforced server-side with session-aware role checks.
- Response format:
  - Success:
    ```json
    {
      "status": "success",
      "...": "..."
    }
    ```
  - Error:
    ```json
    {
      "status": "error",
      "message": "..."
    }
    ```
- Frontend rule: Any request that depends on a logged-in session must preserve the session cookie. In browser `fetch`, use `credentials: "include"` if needed by the environment.

## 2) Global Naming Conventions

Use backend field names exactly as written. Do not convert them to camelCase in API payloads.

### Core identifiers

- `id`: generic object primary key in object payloads
- `user_id`
- `role_id`
- `course_id`
- `module_id`
- `resource_id`
- `quiz_id`
- `question_id`
- `answer_option_id`
- `quiz_attempt_id`
- `attempt_id`: used in route params such as `/quiz-attempts/<attempt_id>/grade` and `/quiz-attempts/<attempt_id>/results`
- `attempt_answer_id`: exposed as `attempt_answer_id` inside grading result detail objects
- `category_id`
- `book_id`
- `cart_id`: not used as a field name; cart response uses `id` for the cart object
- `cart_item_id`: route param name is `item_id`
- `order_id`
- `order_item_id`: object uses `id` inside order item arrays
- `forum_thread_id`: not used as a field name; forum thread object uses `id`
- `thread_id`
- `forum_post_id`: not used as a field name; forum post object uses `id`
- `post_id`
- `report_id`: not used as a field name; forum report object uses `id`

### Naming rules

- Use snake_case exactly.
- Route params and payload fields are not always identical:
  - quiz attempt routes often use `<attempt_id>` while payload fields use `quiz_attempt_id`
  - forum routes use `<thread_id>` and `<post_id>` while object payloads usually expose `id`
  - cart item routes use `<item_id>` while item objects expose `id`
- Do not invent alternate names such as `courseId`, `attemptId`, or `forumPostId` in API payloads.

## 3) Authentication and Session Rules

### Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Session behavior

- Login stores session data on the server-side session mechanism and sets session values including `user_id` and `role_name`.
- Logout clears the session.
- `GET /api/auth/me` checks current session state.
- Protected routes use backend decorators:
  - `login_required`
  - `role_required(...)`

### Exact backend auth behavior

- Register request fields:
  - `name`
  - `email`
  - `password`
- Login request fields:
  - `email`
  - `password`
- Logout request payload: none
- Current user request payload: none

### Exact unauthenticated response for protected routes

```json
{
  "status": "error",
  "message": "You must log in before using this route."
}
```

HTTP status: `401`

### Exact forbidden-role response

```json
{
  "status": "error",
  "message": "This route requires one of these roles: ..."
}
```

HTTP status: `403`

The exact role list text depends on the route, for example `Admin` or `Moderator, Admin`.

### Current user endpoint behavior

- `GET /api/auth/me` does not return `401`.
- If no user is logged in:
  ```json
  {
    "status": "success",
    "authenticated": false,
    "message": "No user is currently logged in."
  }
  ```
- If session points to a deleted user:
  ```json
  {
    "status": "success",
    "authenticated": false,
    "message": "Session is no longer valid."
  }
  ```
- If authenticated:
  ```json
  {
    "status": "success",
    "authenticated": true,
    "user": {
      "id": 1,
      "name": "Example",
      "email": "user@example.com",
      "role": "Student",
      "created_at": "..."
    }
  }
  ```

## 4) Role Access Matrix

| Route group | Public | Student | Moderator | Admin | Notes |
|---|---:|---:|---:|---:|---|
| Authentication | Yes | Yes | Yes | Yes | `register`, `login`, `logout`, `me` are public |
| Courses / Modules / Resources | No | Read | Read + create/update | Read + create/update + delete | Delete is Admin-only |
| Quizzes / Questions / Answer Options | No | Read | Read + create/update | Read + create/update + delete | Delete is Admin-only |
| Quiz Attempts / Results | No | Own attempt flow | Own attempt flow | All + grading | Grading is Admin-only |
| Progress / Portal | No | Own data | Own data | Own data | Portal routes are per logged-in user |
| Saved Resources | No | Own saved items | Own saved items | Own saved items | Per logged-in user only |
| Forum Threads / Posts / Reports | No | Create/manage own | Create/manage own + moderation | Create/manage own + moderation | Moderation endpoints are `Moderator` or `Admin` |
| Bookstore Catalogue | No | Read | Read | Read + public admin layer | Public catalogue reads require login |
| Cart / Checkout / Orders | No | Own cart/orders | Own cart/orders | Own cart/orders + admin order review | Admin order review is separate |
| Homepage | Yes | Yes | Yes | Yes | Public read-only |
| Admin Users | No | No | No | Yes | Admin-only |
| Admin Academic Content | No | No | No | Yes | Admin-only courses/modules/resources/quizzes/questions/options |
| Admin Bookstore Inventory | No | No | No | Yes | Admin-only categories/books |
| Admin Order Review | No | No | No | Yes | Admin-only order oversight |

## 5) Module-by-Module Endpoint Reference

### A) Academic Content Hierarchy

#### Course

- Purpose: top-level academic content container.
- Endpoints:
  - `GET /api/courses`
  - `GET /api/courses/<course_id>`
  - `POST /api/courses`
  - `PUT /api/courses/<course_id>`
  - `DELETE /api/courses/<course_id>`
- Access:
  - Read: logged-in users
  - Create/update: `Moderator`, `Admin`
  - Delete: `Admin`
- Request payload for create/update:
  - `title`
  - `description`
- Response wrapper keys:
  - list: `courses`
  - single/create/update: `course`
- Course object fields:
  - `id`
  - `title`
  - `description`
  - `created_at`
- Validation:
  - both `title` and `description` required

#### Module

- Purpose: organize content under a course.
- Endpoints:
  - `GET /api/courses/<course_id>/modules`
  - `GET /api/modules/<module_id>`
  - `POST /api/courses/<course_id>/modules`
  - `PUT /api/modules/<module_id>`
  - `DELETE /api/modules/<module_id>`
- Access:
  - Read: logged-in users
  - Create/update: `Moderator`, `Admin`
  - Delete: `Admin`
- Request payload for create/update:
  - `title`
  - `description`
- Response wrapper keys:
  - list: `modules`
  - single/create/update: `module`
- Module object fields:
  - `id`
  - `course_id`
  - `title`
  - `description`
  - `created_at`

#### Resource

- Purpose: learning content under a module.
- Endpoints:
  - `GET /api/modules/<module_id>/resources`
  - `GET /api/resources/<resource_id>`
  - `POST /api/modules/<module_id>/resources`
  - `PUT /api/resources/<resource_id>`
  - `DELETE /api/resources/<resource_id>`
- Access:
  - Read: logged-in users
  - Create/update: `Moderator`, `Admin`
  - Delete: `Admin`
- Request payload for create/update:
  - `title`
  - `resource_type`
  - `content_url`
  - `content_text`
- Response wrapper keys:
  - list: `resources`
  - single/create/update: `resource`
- Resource object fields:
  - `id`
  - `module_id`
  - `title`
  - `resource_type`
  - `content_url`
  - `content_text`
  - `created_at`

### B) Quiz System

#### Quiz

- Endpoints:
  - `GET /api/modules/<module_id>/quizzes`
  - `GET /api/quizzes/<quiz_id>`
  - `POST /api/modules/<module_id>/quizzes`
  - `PUT /api/quizzes/<quiz_id>`
  - `DELETE /api/quizzes/<quiz_id>`
- Access:
  - Read: logged-in users
  - Create/update: `Moderator`, `Admin`
  - Delete: `Admin`
- Request payload for create/update:
  - `title`
  - `description`
  - `time_limit_minutes`
  - `passing_score`
- Quiz object fields:
  - `id`
  - `module_id`
  - `title`
  - `description`
  - `time_limit_minutes`
  - `passing_score`
  - `created_at`

#### Question

- Endpoints:
  - `GET /api/quizzes/<quiz_id>/questions`
  - `GET /api/questions/<question_id>`
  - `POST /api/quizzes/<quiz_id>/questions`
  - `PUT /api/questions/<question_id>`
  - `DELETE /api/questions/<question_id>`
- Access:
  - Read: logged-in users
  - Create/update: `Moderator`, `Admin`
  - Delete: `Admin`
- Request payload for create/update:
  - `question_text`
  - `question_type`
  - `points`
  - `correct_short_answer` only for `short_answer`
- Question response fields:
  - `id`
  - `quiz_id`
  - `question_text`
  - `question_type`
  - `points`
  - `created_at`
- Important note:
  - `correct_short_answer` is used internally for validation/grading but is not returned in question response payloads.

#### AnswerOption

- Endpoints:
  - `GET /api/questions/<question_id>/answer-options`
  - `GET /api/answer-options/<option_id>`
  - `POST /api/questions/<question_id>/answer-options`
  - `PUT /api/answer-options/<option_id>`
  - `DELETE /api/answer-options/<option_id>`
- Access:
  - Read: logged-in users
  - Create/update: `Moderator`, `Admin`
  - Delete: `Admin`
- Request payload for create/update:
  - `option_text`
  - `is_correct`
- Response fields:
  - `id`
  - `question_id`
  - `option_text`
  - `is_correct`
  - `created_at`

#### QuizAttempt

- Endpoints:
  - `GET /api/quizzes/<quiz_id>/attempts`
  - `GET /api/quiz-attempts/<attempt_id>`
  - `POST /api/quizzes/<quiz_id>/attempts`
  - `PUT /api/quiz-attempts/<attempt_id>`
  - `POST /api/quiz-attempts/<attempt_id>/submit`
  - `DELETE /api/quiz-attempts/<attempt_id>`
- Access:
  - Read/create/submit/update-lifecycle-error: logged-in users
  - Delete: `Admin`
- Important notes:
  - `POST /attempts` attaches the logged-in user automatically.
  - `PUT /quiz-attempts/<attempt_id>` does not update fields; it returns a lifecycle-management error.
- Response fields:
  - `id`
  - `quiz_id`
  - `user_id`
  - `score`
  - `started_at`
  - `submitted_at`
  - `status`

#### AttemptAnswer

- Endpoints:
  - `GET /api/quiz-attempts/<attempt_id>/answers`
  - `GET /api/attempt-answers/<answer_id>`
  - `POST /api/quiz-attempts/<attempt_id>/answers`
  - `PUT /api/attempt-answers/<answer_id>`
  - `DELETE /api/attempt-answers/<answer_id>`
- Access:
  - Read/create/update: logged-in user owning the attempt or `Admin`
  - Delete: `Admin`
- Request payload for create:
  - `question_id`
  - `answer_option_id` for non-short-answer questions
  - `short_answer_text` for short-answer questions
- Response fields:
  - `id`
  - `quiz_attempt_id`
  - `question_id`
  - `answer_option_id`
  - `short_answer_text`
  - `is_correct`
  - `created_at`
- Important notes:
  - Answers can only be changed while attempt status is `in_progress`.
  - Duplicate answer per question per attempt is blocked.

#### Grading and Results

- Endpoints:
  - `POST /api/quiz-attempts/<attempt_id>/grade`
  - `GET /api/quiz-attempts/<attempt_id>/results`
- Access:
  - Grade: `Admin`
  - Results: attempt owner or `Admin`
- Grade response wrapper:
  - `grading_result`
- Results response wrapper:
  - `result`
- Result object fields:
  - `attempt_id`
  - `user_id`
  - `quiz_id`
  - `status`
  - `total_score`
  - `correct_answers`
  - `incorrect_answers`
  - `results`
- Result detail fields:
  - `attempt_answer_id`
  - `question_id`
  - `question_type`
  - `answer_option_id`
  - `short_answer_text`
  - `is_correct`
  - `points_awarded`

### C) Progress Tracking

#### Resource progress

- Endpoints:
  - `GET /api/progress/me`
  - `GET /api/resources/<resource_id>/progress`
  - `POST /api/resources/<resource_id>/progress/complete`
  - `POST /api/resources/<resource_id>/progress/reset`
- Access: logged-in users only
- Progress record fields:
  - `id`
  - `user_id`
  - `resource_id`
  - `completed`
  - `completed_at`
  - `created_at`

#### Portal progress overview

- Endpoints:
  - `GET /api/portal/progress/overview`
  - `GET /api/courses/<course_id>/progress-summary`
- Access: logged-in users only
- Supported overview query params:
  - `status`: `completed`, `in_progress`, `not_started`
  - `sort`: `progress`, `title`, `completed_at`
- Course progress summary fields:
  - `course_id`
  - `course_title`
  - `total_modules`
  - `total_resources`
  - `completed_resources`
  - `progress_percentage`
  - `is_completed`
  - `completed_at`
- Single-course summary adds:
  - `modules`

#### Completion logic

- Computed dynamically from completed resource records.
- No separate completion-write endpoint exists.

### D) Saved Resources

- Endpoints:
  - `GET /api/saved-resources/me`
  - `GET /api/resources/<resource_id>/saved`
  - `POST /api/resources/<resource_id>/save`
  - `DELETE /api/resources/<resource_id>/save`
- Access: logged-in users only
- Saved resource fields:
  - `id`
  - `resource_id`
  - `resource_title`
  - `resource_type`
  - `module_id`
  - `created_at`

### E) Forum System

#### ForumThread

- Endpoints:
  - `GET /api/forum-threads`
  - `GET /api/forum-threads/<thread_id>`
  - `POST /api/forum-threads`
  - `PUT /api/forum-threads/<thread_id>`
  - `DELETE /api/forum-threads/<thread_id>`
- Access:
  - Read/create: logged-in users
  - Update/delete: owner or `Admin`
- Thread fields:
  - `id`
  - `user_id`
  - `title`
  - `content`
  - `created_at`

#### ForumPost

- Endpoints:
  - `GET /api/forum-threads/<thread_id>/posts`
  - `GET /api/forum-posts/<post_id>`
  - `POST /api/forum-threads/<thread_id>/posts`
  - `PUT /api/forum-posts/<post_id>`
  - `DELETE /api/forum-posts/<post_id>`
- Access:
  - Read/create: logged-in users
  - Update/delete: owner or `Admin`
  - Hidden post visibility: owner, `Moderator`, `Admin`
- Post fields:
  - `id`
  - `thread_id`
  - `user_id`
  - `content`
  - `created_at`

#### ForumReport

- Endpoints:
  - `GET /api/forum-reports/me`
  - `GET /api/forum-posts/<post_id>/report-status`
  - `POST /api/forum-posts/<post_id>/report`
  - `DELETE /api/forum-posts/<post_id>/report`
- Access: logged-in users only
- Report fields:
  - `id`
  - `post_id`
  - `thread_id`
  - `post_content`
  - `reason`
  - `created_at`

#### Moderation actions

- Endpoints:
  - `GET /api/forum-reports`
  - `POST /api/forum-posts/<post_id>/hide`
  - `POST /api/forum-posts/<post_id>/unhide`
  - `DELETE /api/forum-posts/<post_id>/moderation-remove`
- Access: `Moderator`, `Admin`
- Moderation post fields:
  - `id`
  - `thread_id`
  - `user_id`
  - `content`
  - `is_hidden`
  - `moderated_at`
  - `moderated_by_user_id`
  - `created_at`

### F) Bookstore System

#### Category and Book catalogue

- Endpoints:
  - `GET /api/book-categories`
  - `POST /api/book-categories`
  - `GET /api/books`
  - `GET /api/books/<book_id>`
  - `POST /api/books`
  - `PUT /api/books/<book_id>`
  - `DELETE /api/books/<book_id>`
- Access:
  - `GET` routes: logged-in users
  - create/update/delete: `Admin`
- Supported book list query params:
  - `category_id`
  - `search`
- Category fields:
  - `id`
  - `name`
  - `created_at`
- Book fields:
  - `id`
  - `category_id`
  - `category_name`
  - `title`
  - `author`
  - `price`
  - `stock_quantity`
  - `created_at`

#### Cart and CartItem

- Endpoints:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PUT /api/cart/items/<item_id>`
  - `DELETE /api/cart/items/<item_id>`
- Access: logged-in users only
- Cart response fields:
  - `id`
  - `user_id`
  - `items`
  - `total_items`
  - `total_amount`
- Cart item fields:
  - `id`
  - `book_id`
  - `title`
  - `author`
  - `price`
  - `stock_quantity`
  - `quantity`
  - `line_subtotal`
  - `created_at`

#### Checkout and Order history

- Endpoints:
  - `POST /api/checkout`
  - `GET /api/orders`
  - `GET /api/orders/<order_id>`
- Access: logged-in users only
- Supported order list query params:
  - `status`
  - `created_from`
  - `created_to`
  - `sort`
  - `limit`
- Order summary fields:
  - `id`
  - `status`
  - `total_amount`
  - `created_at`
  - `item_count`
  - `total_quantity`
- Order detail fields:
  - `id`
  - `user_id`
  - `status`
  - `total_amount`
  - `created_at`
  - `item_count`
  - `total_quantity`
  - `items`
- Order item fields:
  - `id`
  - `book_id`
  - `title`
  - `quantity`
  - `price`
  - `line_subtotal`
  - `created_at`

### G) Homepage

- Endpoints:
  - `GET /api/homepage`
  - `GET /api/homepage/featured-courses`
  - `GET /api/homepage/popular-books`
  - `GET /api/homepage/announcements`
- Access: public
- Wrapper keys:
  - composite: `homepage`
  - featured list: `featured_courses`
  - book list: `popular_books`
  - announcements list: `announcements`
- Composite homepage payload:
  - `featured_courses`
  - `popular_books`
  - `announcements`

### H) Admin Management

All admin routes require an authenticated session and `Admin` role.

#### Admin users

- Endpoints:
  - `GET /api/admin/users`
  - `GET /api/admin/users/<user_id>`
  - `PATCH /api/admin/users/<user_id>/role`
  - `DELETE /api/admin/users/<user_id>`
- User admin fields:
  - `id`
  - `name`
  - `email`
  - `role_id`
  - `role_name`
  - `created_at`

#### Admin academic content

- Courses:
  - `GET /api/admin/courses`
  - `GET /api/admin/courses/<course_id>`
  - `POST /api/admin/courses`
  - `PUT /api/admin/courses/<course_id>`
  - `DELETE /api/admin/courses/<course_id>`
- Modules:
  - `GET /api/admin/courses/<course_id>/modules`
  - `GET /api/admin/modules/<module_id>`
  - `POST /api/admin/modules`
  - `PUT /api/admin/modules/<module_id>`
  - `DELETE /api/admin/modules/<module_id>`
- Resources:
  - `GET /api/admin/modules/<module_id>/resources`
  - `GET /api/admin/resources/<resource_id>`
  - `POST /api/admin/resources`
  - `PUT /api/admin/resources/<resource_id>`
  - `DELETE /api/admin/resources/<resource_id>`
- Quizzes:
  - `GET /api/admin/modules/<module_id>/quizzes`
  - `GET /api/admin/quizzes/<quiz_id>`
  - `POST /api/admin/quizzes`
  - `PUT /api/admin/quizzes/<quiz_id>`
  - `DELETE /api/admin/quizzes/<quiz_id>`
- Questions:
  - `GET /api/admin/quizzes/<quiz_id>/questions`
  - `GET /api/admin/questions/<question_id>`
  - `POST /api/admin/questions`
  - `PUT /api/admin/questions/<question_id>`
  - `DELETE /api/admin/questions/<question_id>`
- Answer options:
  - `GET /api/admin/questions/<question_id>/options`
  - `GET /api/admin/options/<option_id>`
  - `POST /api/admin/options`
  - `PUT /api/admin/options/<option_id>`
  - `DELETE /api/admin/options/<option_id>`

#### Admin bookstore inventory

- Endpoints:
  - `GET /api/admin/categories`
  - `GET /api/admin/categories/<category_id>`
  - `POST /api/admin/categories`
  - `PUT /api/admin/categories/<category_id>`
  - `DELETE /api/admin/categories/<category_id>`
  - `GET /api/admin/books`
  - `GET /api/admin/books/<book_id>`
  - `POST /api/admin/books`
  - `PUT /api/admin/books/<book_id>`
  - `DELETE /api/admin/books/<book_id>`

#### Admin order review

- Endpoints:
  - `GET /api/admin/orders`
  - `GET /api/admin/orders/<order_id>`
- Supported query params:
  - `status`
  - `user_id`
  - `created_from`
  - `created_to`
  - `sort`
  - `limit`

## 6) Response Field Reference

### User

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | User ID | Yes |
| `name` | string | User display name | Yes in responses |
| `email` | string | User email | Yes in responses |
| `role` | string | User role name in auth responses | Yes |
| `role_id` | integer | Role foreign key in admin user responses | Yes |
| `role_name` | string | Role name in admin user responses | Yes |
| `created_at` | string datetime | Creation timestamp | Yes |

### Role

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Role ID | Yes |
| `name` | string | Role name | Yes |

Note: roles are not exposed by a dedicated public roles endpoint.

### Course

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Course ID | Yes |
| `title` | string | Course title | Yes in responses |
| `description` | string | Course description | Yes in responses |
| `created_at` | string datetime | Creation timestamp | Yes |

### Module

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Module ID | Yes |
| `course_id` | integer | Parent course ID | Yes in responses |
| `title` | string | Module title | Yes in responses |
| `description` | string | Module description | Yes in responses |
| `created_at` | string datetime | Creation timestamp | Yes |

### Resource

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Resource ID | Yes |
| `module_id` | integer | Parent module ID | Yes in responses |
| `title` | string | Resource title | Yes in responses |
| `resource_type` | string | Resource type such as `video`, `text`, `link` | Yes in responses |
| `content_url` | string or null | URL content source | Yes in responses |
| `content_text` | string or null | Text content | Yes in responses |
| `created_at` | string datetime | Creation timestamp | Yes |

### Quiz

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Quiz ID | Yes |
| `module_id` | integer | Parent module ID | Yes in responses |
| `title` | string | Quiz title | Yes in responses |
| `description` | string or null | Quiz description | Yes in responses |
| `time_limit_minutes` | integer or null | Optional time limit | Yes in responses |
| `passing_score` | integer or null | Optional passing score | Yes in responses |
| `created_at` | string datetime | Creation timestamp | Yes |

### Question

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Question ID | Yes |
| `quiz_id` | integer | Parent quiz ID | Yes in responses |
| `question_text` | string | Question text | Yes in responses |
| `question_type` | string | Question type | Yes in responses |
| `points` | integer | Score value for question | Yes in responses |
| `created_at` | string datetime | Creation timestamp | Yes |

Internal-only note: `correct_short_answer` exists in backend logic but is not returned by question APIs.

### AnswerOption

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Answer option ID | Yes |
| `question_id` | integer | Parent question ID | Yes in responses |
| `option_text` | string | Option label/content | Yes in responses |
| `is_correct` | boolean | Correctness flag | Yes in responses |
| `created_at` | string datetime | Creation timestamp | Yes |

### QuizAttempt

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Quiz attempt ID | Yes |
| `quiz_id` | integer | Parent quiz ID | Yes |
| `user_id` | integer | Attempt owner | Yes |
| `score` | integer or null | Calculated score | Yes |
| `started_at` | string datetime | Attempt start time | Yes |
| `submitted_at` | string datetime or null | Submission time | Yes |
| `status` | string | `in_progress`, `submitted`, `graded` | Yes |

### AttemptAnswer

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Attempt answer ID | Yes |
| `quiz_attempt_id` | integer | Parent attempt ID | Yes |
| `question_id` | integer | Related question ID | Yes |
| `answer_option_id` | integer or null | Selected option ID | Yes in responses |
| `short_answer_text` | string or null | Short-answer value | Yes in responses |
| `is_correct` | boolean or null | Grading result | Yes |
| `created_at` | string datetime | Creation timestamp | Yes |

### ProgressRecord

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Progress record ID | Yes |
| `user_id` | integer | Owner user ID | Yes |
| `resource_id` | integer | Related resource ID | Yes |
| `completed` | boolean | Completion flag | Yes |
| `completed_at` | string datetime or null | Completion time | Yes |
| `created_at` | string datetime | Record creation time | Yes |

### SavedResource

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Saved resource record ID | Yes |
| `resource_id` | integer | Related resource ID | Yes |
| `resource_title` | string | Resource title snapshot for UI use | Yes |
| `resource_type` | string | Resource type | Yes |
| `module_id` | integer | Parent module ID | Yes |
| `created_at` | string datetime | Save time | Yes |

### ForumThread

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Thread ID | Yes |
| `user_id` | integer | Thread owner | Yes |
| `title` | string | Thread title | Yes in responses |
| `content` | string | Thread body | Yes in responses |
| `created_at` | string datetime | Creation time | Yes |

### ForumPost

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Post ID | Yes |
| `thread_id` | integer | Parent thread ID | Yes |
| `user_id` | integer | Post owner | Yes |
| `content` | string | Post body | Yes in responses |
| `created_at` | string datetime | Creation time | Yes |

### ForumReport

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Report ID | Yes |
| `post_id` | integer | Reported post ID | Yes |
| `thread_id` | integer | Parent thread ID | Yes |
| `post_content` | string | Reported post content snapshot | Yes |
| `reason` | string | Report reason | Yes in responses |
| `created_at` | string datetime | Report time | Yes |

### Category

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Category ID | Yes |
| `name` | string | Category name | Yes in responses |
| `created_at` | string datetime | Creation time | Yes |

### Book

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Book ID | Yes |
| `category_id` | integer | Category ID | Yes in responses |
| `category_name` | string | Category display name | Yes |
| `title` | string | Book title | Yes in responses |
| `author` | string | Book author | Yes in responses |
| `price` | string | Decimal price serialized as string | Yes in responses |
| `stock_quantity` | integer | Available stock | Yes in responses |
| `created_at` | string datetime | Creation time | Yes |

### Cart

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer or null | Cart ID | Yes |
| `user_id` | integer | Owner user ID | Yes |
| `items` | array | Cart item list | Yes |
| `total_items` | integer | Total quantity across all cart items | Yes |
| `total_amount` | string | Total price as string | Yes |

### CartItem

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Cart item ID | Yes |
| `book_id` | integer | Book ID | Yes |
| `title` | string | Book title | Yes |
| `author` | string | Book author | Yes |
| `price` | string | Unit price string | Yes |
| `stock_quantity` | integer | Current stock | Yes |
| `quantity` | integer | Quantity in cart | Yes in responses |
| `line_subtotal` | string | Quantity x price | Yes |
| `created_at` | string datetime | Creation time | Yes |

### Order

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Order ID | Yes |
| `user_id` | integer | Owner ID | Yes |
| `status` | string | Order status | Yes |
| `total_amount` | string | Total as string | Yes |
| `created_at` | string datetime | Order time | Yes |
| `item_count` | integer | Number of order item records | Yes |
| `total_quantity` | integer | Sum of quantities | Yes |
| `items` | array | Order item list in detail response only | Yes |
| `user_name` | string | Admin order review only | Yes |
| `user_email` | string | Admin order review only | Yes |

### OrderItem

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `id` | integer | Order item ID | Yes |
| `book_id` | integer | Purchased book ID | Yes |
| `title` | string | Book title snapshot via relation | Yes |
| `quantity` | integer | Purchased quantity | Yes |
| `price` | string | Snapshot unit price | Yes |
| `line_subtotal` | string | Quantity x price | Yes |
| `created_at` | string datetime | Creation time | Yes |

### Homepage payload

| Field | Type | Description | Read-only |
|---|---|---|---:|
| `featured_courses` | array of Course | Up to 5 latest courses | Yes |
| `popular_books` | array of Book | Up to 5 latest books | Yes |
| `announcements` | array | Always empty list in current backend | Yes |

## 7) Request Payload Reference

### Login

```json
{
  "email": "student@example.com",
  "password": "example-password"
}
```

### Course create/update

```json
{
  "title": "Introduction to Databases",
  "description": "Foundational database concepts."
}
```

### Module create/update

```json
{
  "title": "Normalization",
  "description": "First normal form to third normal form."
}
```

### Resource create/update

```json
{
  "title": "Normalization Notes",
  "resource_type": "text",
  "content_url": null,
  "content_text": "Normalization reduces data duplication."
}
```

### Quiz create/update

```json
{
  "title": "Normalization Quiz",
  "description": "Basic quiz on normalization",
  "time_limit_minutes": 15,
  "passing_score": 7
}
```

### Question create/update

Multiple choice:

```json
{
  "question_text": "Which normal form removes repeating groups?",
  "question_type": "multiple_choice",
  "points": 1
}
```

Short answer:

```json
{
  "question_text": "Write the short form of first normal form.",
  "question_type": "short_answer",
  "correct_short_answer": "1NF",
  "points": 1
}
```

### Answer option create/update

```json
{
  "option_text": "First Normal Form",
  "is_correct": true
}
```

### Attempt answer submission

Multiple choice:

```json
{
  "question_id": 1,
  "answer_option_id": 3
}
```

Short answer:

```json
{
  "question_id": 2,
  "answer_option_id": null,
  "short_answer_text": "1NF"
}
```

### Progress complete/reset

- `POST /api/resources/<resource_id>/progress/complete`: no request body required
- `POST /api/resources/<resource_id>/progress/reset`: no request body required

### Save / unsave resource

- `POST /api/resources/<resource_id>/save`: no request body required
- `DELETE /api/resources/<resource_id>/save`: no request body required

### Forum thread create/update

```json
{
  "title": "Need help with normalization",
  "content": "Can someone explain 2NF simply?"
}
```

### Forum post create/update

```json
{
  "content": "2NF removes partial dependency."
}
```

### Forum report

```json
{
  "reason": "Inappropriate content"
}
```

### Cart add

```json
{
  "book_id": 5,
  "quantity": 2
}
```

### Cart update

```json
{
  "quantity": 3
}
```

### Cart remove

- `DELETE /api/cart/items/<item_id>`: no request body required

### Checkout

- `POST /api/checkout`: no request body required

### Admin user role update

```json
{
  "role_id": 2
}
```

### Admin bookstore category create/update

```json
{
  "name": "Programming"
}
```

### Admin bookstore book create/update

```json
{
  "category_id": 1,
  "title": "Database Systems",
  "author": "Author Name",
  "price": "49.99",
  "stock_quantity": 10
}
```

## 8) Error Response Behavior

Standard error shape:

```json
{
  "status": "error",
  "message": "..."
}
```

### Validation failure

- Likely status: `400`
- Examples:
  - missing required fields
  - invalid integer/date values
  - lifecycle violations
- Frontend guidance:
  - show `message` directly when appropriate
  - do not guess fallback field names

### Unauthenticated access

- Likely status: `401`
- Exact protected-route message:
  ```json
  {
    "status": "error",
    "message": "You must log in before using this route."
  }
  ```
- Frontend guidance:
  - redirect to login or prompt session renewal

### Forbidden role access

- Likely status: `403`
- Example:
  ```json
  {
    "status": "error",
    "message": "This route requires one of these roles: Admin."
  }
  ```
- Frontend guidance:
  - hide or disable unauthorized controls
  - do not keep retrying admin endpoints with non-admin users

### Not found

- Likely status: `404`
- Examples:
  - `Course not found.`
  - `Book not found.`
  - `Forum post not found.`
- Frontend guidance:
  - show safe empty/error view
  - do not assume the object still exists

### Dependency-protected delete failure

- Likely status: `400`
- Examples:
  - related modules/resources/quizzes/options/attempt answers/books/cart items/order items exist
- Frontend guidance:
  - show exact backend message
  - do not assume delete can be retried immediately

### Lifecycle or state violation

- Likely status: `400`
- Examples:
  - quiz attempt must be submitted before grading
  - answers cannot be changed after attempt leaves `in_progress`
  - results unavailable until grading completes
- Frontend guidance:
  - refresh object state before showing action buttons

### Server error

- Likely status: `500`
- Example where explicitly implemented:
  ```json
  {
    "status": "error",
    "message": "Internal server error."
  }
  ```
- Frontend guidance:
  - show generic failure message
  - do not assume partial success

## 9) Integration Safety Rules

- Do not rename backend fields.
- Do not convert snake_case to camelCase in API payloads.
- Do not assume fields exist if not documented.
- Do not omit required request fields.
- Do not call admin endpoints without `Admin` role.
- Do not call moderation endpoints unless role access is confirmed.
- Do not bypass session login.
- Do not hardcode object IDs from test data into real UI logic.
- Do not invent pagination unless backend supports it.
- Do not invent filtering or sorting unless backend supports it.
- Treat response wrapper keys such as `course`, `courses`, `quiz_attempt`, `result`, `cart`, and `homepage` as contract keys.
- Use exact endpoint paths from this document.
- Do not expect `correct_short_answer` in question response payloads.
- Do not assume `GET /api/auth/me` returns `401`; it returns `200` with authentication state.

## 10) Frontend Testing Checklist

- Log in as `Student`, `Moderator`, and `Admin`.
- Verify route access by role.
- Load homepage data.
- Browse courses, modules, and resources.
- Run quiz attempt flow end-to-end.
- View progress overview and course progress summary.
- Save and unsave a resource.
- Create forum thread, post, and report.
- Browse bookstore catalogue.
- Add to cart, update cart, and remove from cart.
- Checkout and verify order history.
- Verify admin-only pages reject non-admin users.
- Verify moderation pages reject `Student`.
- Verify hidden forum posts are not shown to normal students.

## 11) Stability Statement

This document reflects the verified backend state after Step 40 Final Backend System Lock.

No backend behavior changes are introduced by this document.

Frontend implementations must treat this document as the integration contract unless the backend is formally changed in a later approved step.
