const BASE_URL = "/api";

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ReadableStream ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function toRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  return JSON.stringify(body);
}

async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  const config: RequestInit = { ...defaultOptions, ...options };

  if (options.headers) {
    config.headers = { ...defaultOptions.headers, ...options.headers };
  }

  if ("body" in options) {
    config.body = toRequestBody(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || data.status === "error") {
    throw new Error(data.message || "An error occurred while fetching data");
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(endpoint: string) => apiClient<T>(endpoint, { method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "POST", body: toRequestBody(body) }),
  put: <T = unknown>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "PUT", body: toRequestBody(body) }),
  patch: <T = unknown>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "PATCH", body: toRequestBody(body) }),
  delete: <T = unknown>(endpoint: string) => apiClient<T>(endpoint, { method: "DELETE" }),
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id?: number;
  created_at: string;
}

export interface AuthMeResponse {
  status: string;
  authenticated: boolean;
  message?: string;
  user?: User;
}

export interface AuthResponse {
  status: string;
  message?: string;
}

export const auth = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/register", { name, email, password }),

  login: async (email: string, password: string): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  logout: async (): Promise<AuthResponse> => api.post<AuthResponse>("/auth/logout"),

  me: async (): Promise<AuthMeResponse> => api.get<AuthMeResponse>("/auth/me"),
};

export interface CourseProgressSummary {
  course_id: number;
  course_title: string;
  total_modules: number;
  total_resources: number;
  completed_resources: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface ProgressOverviewResponse {
  status: string;
  courses: CourseProgressSummary[];
}

export const portal = {
  getProgressOverview: async (params?: { status?: string; sort?: string }): Promise<ProgressOverviewResponse> => {
    let endpoint = "/portal/progress/overview";

    if (params) {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append("status", params.status);
      if (params.sort) searchParams.append("sort", params.sort);

      const queryString = searchParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    return api.get<ProgressOverviewResponse>(endpoint);
  },
};

export interface Course {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface CoursesResponse {
  status: string;
  courses?: Course[];
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface Resource {
  id: number;
  module_id: number;
  title: string;
  resource_type: string;
  content_url: string | null;
  content_text: string | null;
  created_at: string;
}

export const academic = {
  getCourses: async (): Promise<CoursesResponse> => api.get<CoursesResponse>("/courses"),

  getCourse: async (course_id: string | number): Promise<{ status: string; course: Course }> =>
    api.get<{ status: string; course: Course }>(`/courses/${course_id}`),

  getModules: async (course_id: string | number): Promise<{ status: string; modules: Module[] }> =>
    api.get<{ status: string; modules: Module[] }>(`/courses/${course_id}/modules`),

  getResources: async (module_id: string | number): Promise<{ status: string; resources: Resource[] }> =>
    api.get<{ status: string; resources: Resource[] }>(`/modules/${module_id}/resources`),

  completeResource: async (resource_id: string | number): Promise<{ status: string; message?: string }> =>
    api.post<{ status: string; message?: string }>(`/resources/${resource_id}/progress/complete`),
};

export interface Book {
  id: number;
  category_id: number;
  category_name: string;
  title: string;
  author: string;
  price: string;
  stock_quantity: number;
  created_at: string;
}

export interface BooksResponse {
  status: string;
  books?: Book[];
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface CategoriesResponse {
  status: string;
  categories?: Category[];
}

export interface CartItemPayload {
  book_id: number;
  quantity: number;
}

export interface CartItem {
  id: number;
  book_id: number;
  title: string;
  author: string;
  price: string;
  stock_quantity: number;
  quantity: number;
  line_subtotal: string;
  created_at: string;
}

export interface Cart {
  id: number | null;
  user_id: number;
  items: CartItem[];
  total_items: number;
  total_amount: string;
}

export interface CartResponse {
  status: string;
  cart: Cart;
}

export const bookstore = {
  getCategories: async (): Promise<CategoriesResponse> =>
    api.get<CategoriesResponse>("/book-categories"),

  getBooks: async (params?: {
    category_id?: string | number;
    search?: string;
  }): Promise<BooksResponse> => {
    let endpoint = "/books";

    if (params) {
      const searchParams = new URLSearchParams();
      if (params.category_id !== undefined && params.category_id !== "") {
        searchParams.append("category_id", String(params.category_id));
      }
      if (params.search) {
        searchParams.append("search", params.search);
      }

      const queryString = searchParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    return api.get<BooksResponse>(endpoint);
  },

  getBook: async (book_id: string | number): Promise<{ status: string; book: Book }> =>
    api.get<{ status: string; book: Book }>(`/books/${book_id}`),

  getCart: async (): Promise<CartResponse> => api.get<CartResponse>("/cart"),

  addToCart: async (
    book_id_or_payload: number | CartItemPayload,
    quantity?: number
  ): Promise<{ status: string; message?: string; cart?: Cart }> => {
    const payload =
      typeof book_id_or_payload === "number"
        ? { book_id: book_id_or_payload, quantity: quantity ?? 1 }
        : book_id_or_payload;

    return api.post<{ status: string; message?: string; cart?: Cart }>("/cart/items", payload);
  },

  updateCartItem: async (
    item_id: string | number,
    quantity: number
  ): Promise<{ status: string; message?: string; cart?: Cart }> =>
    api.put<{ status: string; message?: string; cart?: Cart }>(`/cart/items/${item_id}`, {
      quantity,
    }),

  removeCartItem: async (
    item_id: string | number
  ): Promise<{ status: string; message?: string; cart?: Cart }> =>
    api.delete<{ status: string; message?: string; cart?: Cart }>(`/cart/items/${item_id}`),

  checkout: async (): Promise<{ status: string; message?: string; order?: OrderDetail }> =>
    api.post<{ status: string; message?: string; order?: OrderDetail }>("/checkout"),
};

export interface ForumThread {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface ForumPost {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface ForumThreadsResponse {
  status: string;
  forum_threads?: ForumThread[];
}

export interface ForumThreadResponse {
  status: string;
  forum_thread: ForumThread;
}

export interface ForumPostsResponse {
  status: string;
  thread_id: number;
  forum_posts?: ForumPost[];
}

export interface CreateThreadPayload {
  title: string;
  content: string;
}

export interface CreatePostPayload {
  content: string;
}

export interface ForumReport {
  id: number;
  post_id: number;
  thread_id: number;
  post_content: string;
  reason: string;
  created_at: string;
}

export interface ForumReportStatusResponse {
  status: string;
  post_id: number;
  reported: boolean;
  forum_report: ForumReport | null;
}

export interface ReportPostPayload {
  reason: string;
}

export interface ModerationForumReport {
  id: number;
  post_id: number;
  thread_id: number;
  post_content: string;
  reason: string;
  reporting_user_id: number;
  created_at: string;
}

export interface ModerationForumReportsResponse {
  status: string;
  forum_reports: ModerationForumReport[];
}

export interface ModerationForumPost {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
  is_hidden: boolean;
  moderated_at: string | null;
  moderated_by_user_id: number | null;
  created_at: string;
}

export const forum = {
  getThreads: async (): Promise<ForumThreadsResponse> =>
    api.get<ForumThreadsResponse>("/forum-threads"),

  getThread: async (thread_id: string | number): Promise<ForumThreadResponse> =>
    api.get<ForumThreadResponse>(`/forum-threads/${thread_id}`),

  getPosts: async (thread_id: string | number): Promise<ForumPostsResponse> =>
    api.get<ForumPostsResponse>(`/forum-threads/${thread_id}/posts`),

  createThread: async (payload: CreateThreadPayload): Promise<{ status: string; message?: string }> =>
    api.post<{ status: string; message?: string }>("/forum-threads", payload),

  createPost: async (
    thread_id: string | number,
    payload: CreatePostPayload
  ): Promise<{ status: string; message?: string; forum_post?: ForumPost }> =>
    api.post<{ status: string; message?: string; forum_post?: ForumPost }>(
      `/forum-threads/${thread_id}/posts`,
      payload
    ),

  getReportStatus: async (post_id: string | number): Promise<ForumReportStatusResponse> =>
    api.get<ForumReportStatusResponse>(`/forum-posts/${post_id}/report-status`),

  reportPost: async (
    post_id: string | number,
    payload: ReportPostPayload
  ): Promise<{ status: string; message?: string; forum_report?: ForumReport }> =>
    api.post<{ status: string; message?: string; forum_report?: ForumReport }>(
      `/forum-posts/${post_id}/report`,
      payload
    ),

  unreportPost: async (post_id: string | number): Promise<{ status: string; message?: string }> =>
    api.delete<{ status: string; message?: string }>(`/forum-posts/${post_id}/report`),
};

export const moderationApi = {
  getReports: async (): Promise<ModerationForumReportsResponse> =>
    api.get<ModerationForumReportsResponse>("/forum-reports"),

  hidePost: async (
    post_id: string | number
  ): Promise<{ status: string; message?: string; forum_post?: ModerationForumPost }> =>
    api.post<{ status: string; message?: string; forum_post?: ModerationForumPost }>(
      `/forum-posts/${post_id}/hide`
    ),

  unhidePost: async (
    post_id: string | number
  ): Promise<{ status: string; message?: string; forum_post?: ModerationForumPost }> =>
    api.post<{ status: string; message?: string; forum_post?: ModerationForumPost }>(
      `/forum-posts/${post_id}/unhide`
    ),

  removePost: async (post_id: string | number): Promise<{ status: string; message?: string }> =>
    api.delete<{ status: string; message?: string }>(`/forum-posts/${post_id}/moderation-remove`),
};

export interface Quiz {
  id: number;
  module_id: number;
  title: string;
  description?: string | null;
  time_limit_minutes: number | null;
  passing_score: number | null;
  created_at?: string;
}

export interface AnswerOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  created_at: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_type: string;
  question_text: string;
  points: number;
  created_at: string;
  options?: AnswerOption[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  status: string;
  score: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface QuizAttemptResponse {
  status: string;
  message?: string;
  quiz_attempt: QuizAttempt;
}

export interface QuizzesForModuleResponse {
  status: string;
  module_id: number;
  quizzes: Quiz[];
}

export interface QuestionsResponse {
  status: string;
  quiz_id: number;
  questions: Question[];
}

export interface AnswerOptionsResponse {
  status: string;
  question_id: number;
  answer_options: AnswerOption[];
}

export interface SubmitAnswerPayload {
  question_id: number;
  answer_option_id?: number;
  short_answer_text?: string;
}

export interface QuizResultDetail {
  attempt_answer_id: number;
  question_id: number;
  question_type: string;
  answer_option_id: number | null;
  short_answer_text: string | null;
  is_correct: boolean | null;
  points_awarded: number;
}

export interface QuizResult {
  attempt_id: number;
  user_id: number;
  quiz_id: number;
  status: string;
  total_score: number | null;
  correct_answers: number;
  incorrect_answers: number;
  results: QuizResultDetail[];
}

export const quizApi = {
  getQuizzesForModule: async (module_id: string | number): Promise<QuizzesForModuleResponse> =>
    api.get<QuizzesForModuleResponse>(`/modules/${module_id}/quizzes`),

  getQuiz: async (quiz_id: string | number): Promise<{ status: string; quiz: Quiz }> =>
    api.get<{ status: string; quiz: Quiz }>(`/quizzes/${quiz_id}`),

  getQuestions: async (quiz_id: string | number): Promise<QuestionsResponse> =>
    api.get<QuestionsResponse>(`/quizzes/${quiz_id}/questions`),

  getAnswerOptions: async (question_id: string | number): Promise<AnswerOptionsResponse> =>
    api.get<AnswerOptionsResponse>(`/questions/${question_id}/answer-options`),

  startAttempt: async (quiz_id: string | number): Promise<QuizAttemptResponse> =>
    api.post<QuizAttemptResponse>(`/quizzes/${quiz_id}/attempts`),

  getAttempt: async (attempt_id: string | number): Promise<QuizAttemptResponse> =>
    api.get<QuizAttemptResponse>(`/quiz-attempts/${attempt_id}`),

  submitAnswer: async (
    attempt_id: string | number,
    payload: SubmitAnswerPayload
  ): Promise<{ status: string; message?: string }> =>
    api.post<{ status: string; message?: string }>(`/quiz-attempts/${attempt_id}/answers`, payload),

  submitAttempt: async (attempt_id: string | number): Promise<QuizAttemptResponse> =>
    api.post<QuizAttemptResponse>(`/quiz-attempts/${attempt_id}/submit`),

  getResults: async (attempt_id: string | number): Promise<{ status: string; result: QuizResult }> =>
    api.get<{ status: string; result: QuizResult }>(`/quiz-attempts/${attempt_id}/results`),
};

export interface SavedResource {
  id: number;
  resource_id: number;
  resource_title: string;
  resource_type: string;
  module_id: number;
  created_at: string;
}

export interface SavedResourcesResponse {
  status: string;
  saved_resources?: SavedResource[];
}

export interface SavedResourceStatusResponse {
  status: string;
  resource_id: number;
  saved: boolean;
  saved_resource: SavedResource | null;
}

export const savedResourcesApi = {
  getMySavedResources: async (): Promise<SavedResourcesResponse> =>
    api.get<SavedResourcesResponse>("/saved-resources/me"),

  getSavedResources: async (): Promise<SavedResourcesResponse> =>
    api.get<SavedResourcesResponse>("/saved-resources/me"),

  getResourceSavedStatus: async (
    resource_id: string | number
  ): Promise<SavedResourceStatusResponse> =>
    api.get<SavedResourceStatusResponse>(`/resources/${resource_id}/saved`),

  saveResource: async (
    resource_id: string | number
  ): Promise<{ status: string; message?: string; saved_resource?: SavedResource }> =>
    api.post<{ status: string; message?: string; saved_resource?: SavedResource }>(
      `/resources/${resource_id}/save`
    ),

  unsaveResource: async (
    resource_id: string | number
  ): Promise<{ status: string; message?: string }> =>
    api.delete<{ status: string; message?: string }>(`/resources/${resource_id}/save`),
};

export interface Order {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
  item_count?: number;
  total_quantity?: number;
}

export interface OrderItem {
  id: number;
  book_id: number;
  title: string;
  quantity: number;
  price: string;
  line_subtotal: string;
  created_at: string;
}

export interface OrderDetail {
  id: number;
  user_id: number;
  status: string;
  total_amount: string;
  created_at: string;
  item_count: number;
  total_quantity: number;
  items: OrderItem[];
}

export interface OrdersResponse {
  status: string;
  orders?: Order[];
}

export const ordersApi = {
  getOrders: async (): Promise<OrdersResponse> => api.get<OrdersResponse>("/orders"),

  getOrder: async (order_id: string | number): Promise<{ status: string; order: OrderDetail }> =>
    api.get<{ status: string; order: OrderDetail }>(`/orders/${order_id}`),
};

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string | null;
  created_at: string;
}

export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  created_at: string;
  module_count: number;
}

export interface AdminModule {
  id: number;
  course_id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface AdminResource {
  id: number;
  module_id: number;
  title: string;
  resource_type: string;
  content_url: string | null;
  content_text: string | null;
  created_at: string;
}

export interface AdminQuiz {
  id: number;
  module_id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number | null;
  created_at: string;
}

export interface AdminQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: string;
  points: number;
  created_at: string;
}

export interface AdminAnswerOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  created_at: string;
}

export interface AdminOrderSummary {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: string;
  total_amount: string;
  created_at: string;
  item_count: number;
  total_quantity: number;
}

export interface AdminUsersResponse {
  status: string;
  users: AdminUser[];
}

export interface AdminCoursesResponse {
  status: string;
  courses: AdminCourse[];
}

export interface AdminModulesResponse {
  status: string;
  course_id: number;
  modules: AdminModule[];
}

export interface AdminResourcesResponse {
  status: string;
  module_id: number;
  resources: AdminResource[];
}

export interface AdminQuizzesResponse {
  status: string;
  module_id: number;
  quizzes: AdminQuiz[];
}

export interface AdminQuestionsResponse {
  status: string;
  quiz_id: number;
  questions: AdminQuestion[];
}

export interface AdminAnswerOptionsResponse {
  status: string;
  question_id: number;
  answer_options: AdminAnswerOption[];
}

export interface AdminOrdersResponse {
  status: string;
  orders: AdminOrderSummary[];
}

export const adminApi = {
  getUsers: async (): Promise<AdminUsersResponse> =>
    api.get<AdminUsersResponse>("/admin/users"),

  getCourses: async (): Promise<AdminCoursesResponse> =>
    api.get<AdminCoursesResponse>("/admin/courses"),

  getModulesForCourse: async (
    course_id: string | number
  ): Promise<AdminModulesResponse> =>
    api.get<AdminModulesResponse>(`/admin/courses/${course_id}/modules`),

  getResourcesForModule: async (
    module_id: string | number
  ): Promise<AdminResourcesResponse> =>
    api.get<AdminResourcesResponse>(`/admin/modules/${module_id}/resources`),

  getQuizzesForModule: async (
    module_id: string | number
  ): Promise<AdminQuizzesResponse> =>
    api.get<AdminQuizzesResponse>(`/admin/modules/${module_id}/quizzes`),

  getQuestionsForQuiz: async (
    quiz_id: string | number
  ): Promise<AdminQuestionsResponse> =>
    api.get<AdminQuestionsResponse>(`/admin/quizzes/${quiz_id}/questions`),

  getAnswerOptionsForQuestion: async (
    question_id: string | number
  ): Promise<AdminAnswerOptionsResponse> =>
    api.get<AdminAnswerOptionsResponse>(`/admin/questions/${question_id}/options`),

  getCategories: async (): Promise<CategoriesResponse> =>
    api.get<CategoriesResponse>("/admin/categories"),

  getBooks: async (): Promise<BooksResponse> =>
    api.get<BooksResponse>("/admin/books"),

  getOrders: async (): Promise<AdminOrdersResponse> =>
    api.get<AdminOrdersResponse>("/admin/orders"),
};
