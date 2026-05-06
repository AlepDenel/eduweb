# EduTech Backend Implementation Log

## Step 1 - Setup and Database Connection
- Objective: Establish the Flask project foundation and connect to MySQL.
- Major components implemented: App factory setup, environment-based configuration, DB initialization, health endpoint.
- Important structural behavior introduced: Centralized app bootstrap and connectivity check at `/api/health`.
- Verification status: Verified and locked.

## Step 2 - Users and Roles
- Objective: Build the base authentication schema layer.
- Major components implemented: `Role` and `User` models, role foreign key relationship, default role seed (`Student`, `Moderator`, `Admin`).
- Important structural behavior introduced: Role-driven user architecture with password hash storage field.
- Verification status: Verified and locked.

## Step 3 - Authentication
- Objective: Add session-based authentication flows.
- Major components implemented: Registration, login, logout, and current-session user endpoint.
- Important structural behavior introduced: Session-backed login state with duplicate email and credential validation.
- Verification status: Verified and locked.

## Step 4 - Authorization
- Objective: Enforce reusable route protection.
- Major components implemented: `login_required` and `role_required` decorators, protected test routes.
- Important structural behavior introduced: Consistent `401` unauthenticated and `403` role-restricted route handling.
- Verification status: Verified and locked.

## Step 5 - Courses
- Objective: Create course management foundation.
- Major components implemented: `Course` model and CRUD routes with role restrictions.
- Important structural behavior introduced: Read access for logged-in users, write access for `Moderator/Admin`, delete access for `Admin`.
- Verification status: Verified and locked.

## Step 6 - Modules
- Objective: Organize content under courses.
- Major components implemented: `Module` model, course-to-module relation, module CRUD routes.
- Important structural behavior introduced: Parent-child validation for module actions under existing courses.
- Verification status: Verified and locked.

## Step 7 - Resources
- Objective: Store learning content under modules.
- Major components implemented: `Resource` model, module-to-resource relation, resource CRUD routes.
- Important structural behavior introduced: Flexible resource fields (`resource_type`, `content_url`, `content_text`) with RBAC enforcement.
- Verification status: Verified and locked.

## Step 8 - Quizzes
- Objective: Add quiz containers under modules.
- Major components implemented: `Quiz` model, module-to-quiz relation, quiz CRUD routes.
- Important structural behavior introduced: Quiz content routing aligned to module hierarchy and existing access controls.
- Verification status: Verified and locked.

## Step 9 - Questions
- Objective: Add question entities under quizzes.
- Major components implemented: `Question` model, quiz-to-question relation, question CRUD routes.
- Important structural behavior introduced: Question points validation and strict parent quiz validation.
- Verification status: Verified and locked.

## Step 10 - Answer Options
- Objective: Support selectable answers for questions.
- Major components implemented: `AnswerOption` model, question-to-option relation, option CRUD routes.
- Important structural behavior introduced: Question-scoped answer option management with role restrictions.
- Verification status: Verified and locked.

## Step 11 - Quiz Attempts
- Objective: Track user quiz attempt records.
- Major components implemented: `QuizAttempt` model, quiz/user relations, attempt CRUD-style routes.
- Important structural behavior introduced: Attempt ownership-aware update rules and admin-only delete.
- Verification status: Verified and locked.

## Step 12 - Attempt Answers
- Objective: Record submitted answers per attempt.
- Major components implemented: `AttemptAnswer` model, attempt/question/option relations, answer CRUD routes.
- Important structural behavior introduced: One-answer-per-question-per-attempt uniqueness and question-type validation.
- Verification status: Verified and locked.

## Step 13 - Grading Foundation
- Objective: Calculate correctness and attempt score.
- Major components implemented: Grading routes, short-answer key support, correctness updates, score persistence.
- Important structural behavior introduced: Admin-only grading trigger and owner/admin result access checks.
- Verification status: Verified and locked.

## Step 14 - Lifecycle Protection
- Objective: Enforce safe attempt state transitions.
- Major components implemented: Submit attempt route and state-gated answer/grading/result rules.
- Important structural behavior introduced: Protected flow `in_progress -> submitted -> graded` with immutable graded behavior.
- Verification status: Verified and locked.

## Step 15 - Progress Tracking Foundation
- Objective: Track per-user completion for learning resources.
- Major components implemented: `ProgressRecord` model, unique `(user_id, resource_id)` rule, complete/reset/my-progress routes.
- Important structural behavior introduced: Strict per-user isolation for resource progress state.
- Verification status: Verified and locked.

## Step 16 - Portal Progress Aggregation
- Objective: Aggregate user progress by course and module.
- Major components implemented: Portal overview and per-course summary routes with computed percentages.
- Important structural behavior introduced: Dynamic aggregation across courses/modules/resources for the logged-in user.
- Verification status: Verified and locked.

## Step 17 - Course Completion Evaluation
- Objective: Determine course completion from progress data.
- Major components implemented: Completion evaluation helper, `is_completed`, and `completed_at` computation.
- Important structural behavior introduced: Read-time completion logic without persisting completion state.
- Verification status: Verified and locked.

## Step 18 - Progress Overview Filtering and Sorting
- Objective: Improve portal overview browsing.
- Major components implemented: Query validation plus status filtering and sorting options.
- Important structural behavior introduced: Additive filtering/sorting on top of existing per-user progress aggregation.
- Verification status: Verified and locked.

## Step 19 - Saved Resources
- Objective: Add user bookmarking for resources.
- Major components implemented: `SavedResource` model, unique `(user_id, resource_id)` rule, save/unsave/status/my-saved routes.
- Important structural behavior introduced: Idempotent save and safe no-op unsave behavior with strict user scoping.
- Verification status: Verified and locked.

## Step 20 - Forum Thread Foundation
- Objective: Start discussion forum with thread-level management.
- Major components implemented: `ForumThread` model and thread CRUD routes.
- Important structural behavior introduced: Owner-or-admin update/delete controls for threads.
- Verification status: Verified and locked.

## Step 21 - Forum Post and Reply Foundation
- Objective: Support replies under forum threads.
- Major components implemented: `ForumPost` model, thread/user relationships, post CRUD routes.
- Important structural behavior introduced: Thread-scoped post creation and owner-or-admin post management.
- Verification status: Verified and locked.

## Step 22 - Forum Reporting Foundation
- Objective: Allow users to report problematic forum posts.
- Major components implemented: `ForumReport` model with unique `(user_id, post_id)` and report routes.
- Important structural behavior introduced: Idempotent report submission and report-state management per logged-in user.
- Verification status: Verified and locked.

## Step 23 - Forum Moderation Foundation
- Objective: Provide moderation actions for reported posts.
- Major components implemented: Post moderation fields, moderation routes (`hide`, `unhide`, `moderation-remove`), report review route.
- Important structural behavior introduced: Hidden-post visibility separation between moderation and normal post views.
- Verification status: Verified and locked.

## Step 24 - Bookstore Catalogue Foundation
- Objective: Introduce bookstore categories and books.
- Major components implemented: `Category` and `Book` models, category/book catalogue routes with search and category filtering.
- Important structural behavior introduced: Admin-managed catalogue writes with login-protected catalogue reads.
- Verification status: Verified and locked.

## Step 25 - Shopping Cart Foundation
- Objective: Build per-user cart behavior for bookstore flow.
- Major components implemented: `Cart` and `CartItem` models, cart view/add/update/remove routes.
- Important structural behavior introduced: One active cart per user, additive quantity updates, stock-aware cart quantity validation.
- Verification status: Verified and locked.

## Step 26 - Checkout Foundation
- Objective: Convert cart contents into a simulated completed order.
- Major components implemented: `Order` and `OrderItem` models, checkout route, user order list/detail routes.
- Important structural behavior introduced: Atomic checkout with order snapshotting, stock deduction, and cart clear on success.
- Verification status: Verified and locked.

## Step 27 - Order History and Purchase History
- Objective: Improve user-scoped order browsing after checkout.
- Major components implemented: Order list filtering/sorting/limit support and enhanced summary/detail fields.
- Important structural behavior introduced: Read-only purchase-history browsing with validated query parameters.
- Verification status: Verified and locked.

## Step 28 - Admin Order Review Foundation
- Objective: Add admin-only read access to all system orders.
- Major components implemented: Admin order list/detail routes with filtering, sorting, and oversight fields.
- Important structural behavior introduced: Admin-scoped order visibility separated from student-facing history routes.
- Verification status: Verified and locked.

## Step 29 - Admin User Management Foundation
- Objective: Add admin-side user listing and account management routes.
- Major components implemented: Admin user list/detail, role update, and safe delete endpoints under `/api/admin/users`.
- Important structural behavior introduced: Admin-only user management with role validation, self-demotion/self-delete protection, and integrity-preserving delete checks against verified historical records.
- Verification status: Verified and locked.

## Step 30 - Admin Course Management Foundation
1) Step number: 30
2) Step title: Admin course management foundation
3) Objective: Add admin-scoped course management routes without redesigning the verified course system.
4) Reason for change: This step extends the Admin Module so administrators can manage courses through dedicated admin routes while preserving the Step 5 course foundation.
5) Scope type: additive
6) Major components implemented: Admin course list/detail/create/update/delete routes under `/api/admin/courses`.
7) Important structural behavior introduced: Admin-only course oversight with Step 5 validation reuse and safe delete protection when dependent modules exist.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 31 - Admin Module Management Foundation
1) Step number: 31
2) Step title: Admin module management foundation
3) Objective: Add admin-scoped module management routes without redesigning the verified Step 6 module system.
4) Reason for change: This step extends the Admin Module so administrators can manage academic module content through dedicated admin routes while preserving the general module foundation.
5) Scope type: additive
6) Major components implemented: Admin module list/detail/create/update/delete routes under `/api/admin`, including course-scoped module listing.
7) Important structural behavior introduced: Admin-only module oversight with Step 6 validation reuse and integrity protection against deleting modules that still have related resources or quizzes.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 32 - Admin Resource Management Foundation
1) Step number: 32
2) Step title: Admin resource management foundation
3) Objective: Add admin-scoped resource management routes without redesigning the verified Step 7 resource system.
4) Reason for change: This step extends the Admin Module so administrators can manage module-based learning resources through dedicated admin routes while preserving the general resource foundation.
5) Scope type: additive
6) Major components implemented: Admin resource list/detail/create/update/delete routes under `/api/admin`, including module-scoped resource listing.
7) Important structural behavior introduced: Admin-only resource oversight with Step 7 validation reuse and schema-based delete protection using verified `progress_records` and `saved_resources` dependencies.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 33 - Admin Quiz Management Foundation
1) Step number: 33
2) Step title: Admin quiz management foundation
3) Objective: Add admin-scoped quiz management routes without redesigning the verified Step 8 quiz system.
4) Reason for change: This step extends the Admin Module so administrators can manage quizzes through dedicated admin routes while preserving the general quiz foundation and quiz-linked learning structure.
5) Scope type: additive
6) Major components implemented: Admin quiz list/detail/create/update/delete routes under `/api/admin`, including module-scoped quiz listing.
7) Important structural behavior introduced: Admin-only quiz oversight with Step 8 validation reuse and schema-based delete protection using verified `questions` and `quiz_attempts` dependencies.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 34 - Admin Question Management Foundation
1) Step number: 34
2) Step title: Admin question management foundation
3) Objective: Add admin-scoped question management routes without redesigning the verified Step 9 question system.
4) Reason for change: This step extends the Admin Module so administrators can manage quiz questions through dedicated admin routes while preserving the general question foundation and quiz/question learning structure.
5) Scope type: additive
6) Major components implemented: Admin question list/detail/create/update/delete routes under `/api/admin`, including quiz-scoped question listing.
7) Important structural behavior introduced: Admin-only question oversight with Step 9 validation reuse and schema-based delete protection using verified `answer_options` and `attempt_answers` dependencies.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 35 - Admin Answer Option Management Foundation
1) Step number: 35
2) Step title: Admin answer option management foundation
3) Objective: Add admin-scoped AnswerOption management routes without redesigning the verified Step 10 answer option system.
4) Reason for change: This step extends the Admin Module so administrators can manage answer options through dedicated admin routes while preserving the general answer option foundation and quiz question structure.
5) Scope type: additive
6) Major components implemented: Admin answer option list/detail/create/update/delete routes under `/api/admin`, including question-scoped option listing.
7) Important structural behavior introduced: Admin-only AnswerOption oversight with Step 10 response-shape alignment and schema-based delete protection using verified `attempt_answers` dependencies.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

Correction note:
- Reason for change: Validation and update parity alignment with Step 10.
- Scope type: corrective consistency patch
- Components modified: `admin_answer_options.py`
- Backward compatibility status: preserved
- Verification status: Verified and locked

## Step 36 - Homepage Support Foundation
1) Step number: 36
2) Step title: Homepage support foundation
3) Objective: Add public read-only homepage support endpoints without redesigning verified course or bookstore behavior.
4) Reason for change: This step supports the university homepage requirement by exposing existing Course and Book data through a thin backend read layer.
5) Scope type: additive
6) Major components implemented: Public homepage composite endpoint, featured courses endpoint, popular books endpoint, and announcements endpoint.
7) Important structural behavior introduced: Homepage responses reuse verified Course and Book response contracts with deterministic five-record maximum lists and empty non-persistent announcements.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 37 - Admin Bookstore Inventory Management Foundation
1) Step number: 37
2) Step title: Admin bookstore inventory management foundation
3) Objective: Add admin-scoped category and book inventory management routes without redesigning the verified Step 24 bookstore catalogue system.
4) Reason for change: This step extends the Admin Module so administrators can manage bookstore inventory through dedicated admin routes while preserving the general catalogue foundation and commerce flow.
5) Scope type: additive
6) Major components implemented: Admin category list/detail/create/update/delete routes and admin book list/detail/create/update/delete routes under `/api/admin`.
7) Important structural behavior introduced: Admin-only inventory oversight reusing verified Step 24 category/book response contracts and book validation, with schema-based delete protection for category-to-book and book-to-cart/order dependencies.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

Correction note:
- Admin category list ordering corrected from name-based to deterministic id-based ordering to comply with Step 37 contract.

## Step 38 - Integration Sanity Verification
1) Step number: 38
2) Step title: Integration sanity verification
3) Objective: Verify that critical subsystem integrations remain stable after Step 37 without changing application behavior.
4) Reason for change: This step provides a targeted continuity check across the major academic, quiz, bookstore, homepage, portal, and forum flows required by the backend plan and university project scope.
5) Scope type: verification-only
6) Major components / verification scope: Academic content hierarchy, quiz lifecycle, bookstore transaction flow, admin inventory integration, homepage data retrieval, student portal integration, and forum integration.
7) Important structural behavior introduced: No application behavior changes; this step formalizes a manual integration verification checkpoint across verified subsystems.
8) Backward compatibility status: Preserved
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 39 - Final implementation log synchronization
1) Step number: 39
2) Step title: Final implementation log synchronization
3) Objective: Synchronize the implementation log with the verified backend state before final system lock.
4) Reason for change: The backend feature implementation and integration sanity verification have been completed, so the project record must accurately reflect the verified state.
5) Scope type: documentation-only synchronization
6) Major components implemented: IMPLEMENTATION_LOG.md verification-status synchronization and final continuity record update.
7) Important structural behavior introduced: No application behavior introduced; this step formalizes project-state traceability and documentation continuity.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 40 - Final backend system lock
1) Step number: 40
2) Step title: Final backend system lock
3) Objective: Declare the backend implementation complete and freeze application behavior for submission readiness.
4) Reason for change: All planned features and integration verification steps have been completed, and the system must now be stabilized to prevent accidental modification.
5) Scope type: governance / system stabilization
6) Major components implemented: System lock declaration and implementation freeze.
7) Important structural behavior introduced: No runtime behavior changes; this step formally transitions the project into a stable submission-ready state.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 41 - Frontend integration contract documentation
1) Step number: 41
2) Step title: Frontend integration contract documentation
3) Objective: Create a frontend-facing reference document that describes the verified backend routes, payloads, response structures, access expectations, and integration safety rules.
4) Reason for change: Frontend developers and AI-assisted tooling need an authoritative backend contract reference to reduce integration mismatch risk and prevent invented identifiers, wrappers, and route paths.
5) Scope type: documentation-only integration handoff
6) Major components implemented: `FRONTEND_README.md` covering system overview, naming conventions, session rules, role matrix, endpoint reference, response fields, request payloads, error behavior, integration safety rules, and frontend checklist.
7) Important structural behavior introduced: No runtime behavior changes; this step formalizes a deterministic frontend-backend integration contract based on the verified backend state.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 42 - Frontend and database handoff documentation
1) Step number: 42
2) Step title: Frontend and database handoff documentation
3) Objective: Create reproducible frontend and database handoff documentation so teammates and AI-assisted tooling can set up the project safely and integrate against the verified backend contract.
4) Reason for change: The backend is locked and documented, so the project now needs setup and handoff guidance that prevents invented routes, schema, credentials, and unsafe local assumptions.
5) Scope type: documentation-only handoff support
6) Major components implemented: `DATABASE_README.md` and `PROJECT_HANDOFF_README.md` covering local database setup, initialization order, environment variables, reading order, clone workflow, frontend boundaries, and debugging guidance.
7) Important structural behavior introduced: No runtime behavior changes; this step formalizes reproducible setup and integration handoff documentation for teammates and AI-assisted frontend workflows.
8) Backward compatibility status: Fully backward compatible
9) Dependencies introduced: None
10) Verification status: Verified and locked

## Step 42A - Documentation completeness correction
1) Step number: 42A
2) Step title: Documentation completeness correction
3) Step classification: Documentation correction sub-step under Step 42
4) Objective: Finalize documentation completeness and eliminate ambiguity in database and frontend handoff guides.
5) Reason for change: Step 42 documentation was structurally correct but still left avoidable ambiguity for beginner teammates and AI-assisted tooling.
6) Scope type: Documentation-only correction
7) Major components implemented: Expanded table reference documentation, strengthened AI integration guidance, explicit frontend page checklist, and compliance verification checklist.
8) Runtime behavior impact: None
9) Backward compatibility: Fully preserved
10) Verification status: Verified and locked

## Step 43 - Frontend Integration Rescue and Build Verification
Branch: codex/frontend-contract-rescue
Status at time of log: Build verification passed; browser/system testing pending.

### 1. Objective
The objective of this step was to correct confirmed frontend/backend integration blockers so the frontend could safely consume the locked backend API contract without requiring backend changes.

### 2. Background
Frontend files had been pushed before formal integration validation. A validation pass against the locked backend contract identified multiple issues, including API response mismatches, malformed route structure, conflicting frontend architecture artifacts, and build-related problems that prevented safe integration.

### 3. Scope Control
- Backend files were not changed.
- Database and schema files were not changed.
- No new features were added.
- No UI redesign was intended.
- Changes were limited to frontend integration repair, route cleanup, API contract alignment, and build correctness.

### 4. Issues Identified
- Duplicate frontend architecture conflict
- Malformed duplicate quiz route
- Quiz attempt response mismatch
- Quiz attempt timestamp mismatch
- Quiz grading/result field mismatch
- Forum wrapper mismatch
- Bookstore book object mismatch
- Saved-resource field mismatch
- Order status assumptions not established by the backend contract
- Build/install environment issues
- TypeScript request body build error in `frontend/src/lib/api.ts`

### 5. Fixes Applied
- The earlier duplicate frontend architecture issue was resolved by retaining the Next.js / TypeScript / Tailwind frontend structure and removing the conflicting vanilla SPA structure.
- The malformed route file was deleted:
  - `frontend/src/app/courses/[course_id/]/quiz/[quiz_id/]/page.tsx`
- Quiz attempt API handling was aligned to backend `quiz_attempt` responses.
- Quiz questions were fetched from the documented quiz/question endpoints instead of being assumed from the attempt endpoint.
- Quiz attempt timestamp usage was corrected from `completed_at` to `submitted_at`.
- Quiz grading/result handling was aligned to backend fields:
  - `total_score`
  - `correct_answers`
  - `incorrect_answers`
  - `results`
- Forum thread response handling was corrected from `threads` to `forum_threads`.
- Bookstore handling removed dependency on nonexistent `description`.
- Book `price` handling was aligned with the backend serialized value format.
- Saved resource handling was corrected from `saved_at` to `created_at` and `module_id`.
- Undocumented order status assumptions `paid` and `pending` were removed.
- TypeScript request body handling in `frontend/src/lib/api.ts` was corrected by converting unknown request bodies into valid `BodyInit` values before passing them into `fetch` request options.

### 6. Files Changed
- `frontend/src/lib/api.ts`
- `frontend/src/app/bookstore/page.tsx`
- `frontend/src/app/courses/[course_id]/page.tsx`
- `frontend/src/app/courses/[course_id]/quiz/[quiz_id]/page.tsx`
- `frontend/src/app/courses/page.tsx`
- `frontend/src/app/forum/page.tsx`
- `frontend/src/app/portal/page.tsx`
- `frontend/src/components/Navbar.tsx`
- Deleted malformed route file:
  - `frontend/src/app/courses/[course_id/]/quiz/[quiz_id/]/page.tsx`

### 7. Verification Performed
- Static contract validation against:
  - `FRONTEND_README.md`
  - `PROJECT_HANDOFF_README.md`
  - `DATABASE_README.md`
  - backend route files
- Malformed route tracking check
- Dependency installation using:
  - `npm ci --prefer-online`
- Manual build verification using:
  - `npm run build`
- Successful Next.js build confirmation
- Generated build output `frontend/.next/` was removed after build verification and was not included as a tracked project change.
- Backend untouched confirmation
- Git scope audit confirming changes were limited to expected frontend rescue files

### 8. Remaining Verification Needed
Browser and system-level testing is still required.

Flows that still need verification:
- login
- course list/detail
- quiz start/submit
- forum list/create
- bookstore list/cart/checkout
- portal progress/saved resources/orders

### 9. Current Status
- Build verification passed
- Browser/system testing is pending
- The branch is not yet final merge-ready until browser/system testing and a final Git audit are completed

## Step 43A - Quiz Attempt Resume and Submit Validation

### 1. Objective
- Validate and document the quiz attempt resume/submit correction after the frontend integration rescue.

### 2. Reason for Change
- Browser validation showed that reopening `/courses/4/quiz/4` did not resume existing in-progress attempt `#14`, which blocked quiz submit/results validation.

### 3. Scope Control
- Backend files were not changed.
- Database/schema files were not changed.
- No UI redesign was intended.
- No new backend behavior was introduced.
- The change was limited to frontend quiz lifecycle handling.

### 4. Fix Summary
- Quiz page now checks for existing attempts for the current quiz.
- Existing `in_progress` attempt for the logged-in user is resumed.
- Saved answers are loaded and restored where available.
- Duplicate attempt creation is avoided when an in-progress attempt already exists.
- New attempt creation remains available only when no in-progress attempt exists.

### 5. Validation Evidence
- Student account: `student.validation@example.test`
- Route: `/courses/4/quiz/4`
- Attempt used: `#14`
- Attempt resumed successfully.
- Question UI appeared.
- Saved answer state was restored.
- Submit completed successfully.
- Attempt status changed from `in_progress` to `submitted`.
- No duplicate attempt was created.
- Results remain unavailable until grading, which is expected backend lifecycle behavior.

### 6. Verification Status
- Browser validation: Passed for quiz resume and submit lifecycle.
- Manual build: Executed by user after the fix.
- Final merge readiness: Still pending final Git audit and decision on remaining untested/limited flows.

### 7. Remaining Limitations
- Quiz results after grading were not tested because the grading path was not executed.
- Bookstore cart/checkout is still blocked by zero stock unless approved test stock or an Admin path is provided.
- Saved-resource creation still lacks a visible frontend save path.
- Admin and Moderator flows are not covered by this Student-side validation.
