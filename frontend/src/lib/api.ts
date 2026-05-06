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

export interface CartItemPayload {
  book_id: number;
  quantity: number;
}

export const bookstore = {
  getBooks: async (): Promise<BooksResponse> => api.get<BooksResponse>("/books"),

  addToCart: async (payload: CartItemPayload): Promise<{ status: string; message?: string }> =>
    api.post<{ status: string; message?: string }>("/cart/items", payload),

  checkout: async (): Promise<{ status: string; message?: string }> =>
    api.post<{ status: string; message?: string }>("/checkout"),
};

export interface ForumThread {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface ForumThreadsResponse {
  status: string;
  forum_threads?: ForumThread[];
}

export interface CreateThreadPayload {
  title: string;
  content: string;
}

export const forum = {
  getThreads: async (): Promise<ForumThreadsResponse> =>
    api.get<ForumThreadsResponse>("/forum-threads"),

  createThread: async (payload: CreateThreadPayload): Promise<{ status: string; message?: string }> =>
    api.post<{ status: string; message?: string }>("/forum-threads", payload),
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

export const savedResourcesApi = {
  getSavedResources: async (): Promise<SavedResourcesResponse> =>
    api.get<SavedResourcesResponse>("/saved-resources/me"),
};

export interface Order {
  id: number;
  user_id: number;
  total_amount: string;
  status: string;
  created_at: string;
  item_count?: number;
  total_quantity?: number;
}

export interface OrdersResponse {
  status: string;
  orders?: Order[];
}

export const ordersApi = {
  getOrders: async (): Promise<OrdersResponse> => api.get<OrdersResponse>("/orders"),
};
