// Base API Client

const BASE_URL = '/api';

/**
 * Core API fetch wrapper
 */
async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Important: preserves session cookie
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const config: RequestInit = { ...defaultOptions, ...options };

  // Merge headers if provided
  if (options.headers) {
    config.headers = { ...defaultOptions.headers, ...options.headers };
  }

  // Stringify body if it's an object and not already a string
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      throw new Error(data.message || 'An error occurred while fetching data');
    }

    return data as T;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// API Export Methods
export const api = {
  get: <T = any>(endpoint: string) => apiClient<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => apiClient<T>(endpoint, { method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: any) => apiClient<T>(endpoint, { method: 'PUT', body }),
  patch: <T = any>(endpoint: string, body?: any) => apiClient<T>(endpoint, { method: 'PATCH', body }),
  delete: <T = any>(endpoint: string) => apiClient<T>(endpoint, { method: 'DELETE' })
};

// Types for Auth
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

// Authentication specific fetch functions
export const auth = {
  /**
   * Register a new user
   * Payload uses snake_case as per backend contract
   */
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password
    });
  },

  /**
   * Log in an existing user
   * Session cookie is preserved automatically by apiClient's credentials: 'include'
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', {
      email,
      password
    });
  },

  /**
   * Log out current user
   */
  logout: async (): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  me: async (): Promise<AuthMeResponse> => {
    return api.get<AuthMeResponse>('/auth/me');
  }
};

// Types for Portal and Progress
export interface CourseProgressSummary {
  course_id: number;
  course_title: string;
  total_modules: number;
  total_resources: number;
  completed_resources: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface ProgressOverviewResponse {
  status: string;
  // According to the frontend contract, it could be wrapped in a key. Let's assume it returns an array of CourseProgressSummary or an object containing it.
  // The contract says: Portal progress overview GET /api/portal/progress/overview
  // The list of course progress summaries might be returned directly or wrapped. Let's assume a generic response holding an array.
  progress_overview?: CourseProgressSummary[];
  courses?: CourseProgressSummary[]; // Sometimes the backend uses 'courses' as wrapper
}

// Portal specific fetch functions
export const portal = {
  /**
   * Get progress overview for all courses the student is taking
   * Supported query params: status (completed, in_progress, not_started), sort (progress, title, completed_at)
   */
  getProgressOverview: async (params?: { status?: string; sort?: string }): Promise<ProgressOverviewResponse> => {
    let endpoint = '/portal/progress/overview';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.sort) searchParams.append('sort', params.sort);
      
      const queryString = searchParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    return api.get<ProgressOverviewResponse>(endpoint);
  }
};

// Types for Academic Content
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

// Academic Content specific fetch functions
export const academic = {
  /**
   * Get all courses
   */
  getCourses: async (): Promise<CoursesResponse> => {
    return api.get<CoursesResponse>('/courses');
  },
  
  /**
   * Get a specific course
   */
  getCourse: async (course_id: string | number): Promise<{ status: string; course: Course }> => {
    return api.get<{ status: string; course: Course }>(`/courses/${course_id}`);
  },

  /**
   * Get modules for a course
   */
  getModules: async (course_id: string | number): Promise<{ status: string; modules: Module[] }> => {
    return api.get<{ status: string; modules: Module[] }>(`/courses/${course_id}/modules`);
  },

  /**
   * Get resources for a module
   */
  getResources: async (module_id: string | number): Promise<{ status: string; resources: Resource[] }> => {
    return api.get<{ status: string; resources: Resource[] }>(`/modules/${module_id}/resources`);
  },

  /**
   * Mark a resource as complete
   */
  completeResource: async (resource_id: string | number): Promise<{ status: string; message?: string }> => {
    return api.post<{ status: string; message?: string }>(`/resources/${resource_id}/progress/complete`);
  }
};

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

// Types for Bookstore
export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  price: number;
  stock_quantity: number;
}

export interface BooksResponse {
  status: string;
  books?: Book[];
}

export interface CartItemPayload {
  book_id: number;
  quantity: number;
}

// Bookstore specific fetch functions
export const bookstore = {
  /**
   * Get list of books
   */
  getBooks: async (): Promise<BooksResponse> => {
    return api.get<BooksResponse>('/books');
  },

  /**
   * Add a book to the cart
   */
  addToCart: async (payload: CartItemPayload): Promise<{ status: string; message?: string }> => {
    return api.post<{ status: string; message?: string }>('/cart/items', payload);
  },

  /**
   * Checkout the cart
   */
  checkout: async (): Promise<{ status: string; message?: string }> => {
    return api.post<{ status: string; message?: string }>('/checkout');
  }
};

// Types for Forum
export interface ForumThread {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface ForumThreadsResponse {
  status: string;
  threads?: ForumThread[];
}

export interface CreateThreadPayload {
  title: string;
  content: string;
}

// Forum specific fetch functions
export const forum = {
  /**
   * Get all forum threads
   */
  getThreads: async (): Promise<ForumThreadsResponse> => {
    return api.get<ForumThreadsResponse>('/forum-threads');
  },

  /**
   * Create a new forum thread
   */
  createThread: async (payload: CreateThreadPayload): Promise<{ status: string; message?: string }> => {
    return api.post<{ status: string; message?: string }>('/forum-threads', payload);
  }
};

// Types for Quiz System
export interface Quiz {
  id: number;
  module_id: number;
  title: string;
  time_limit_minutes: number;
  passing_score: number;
}

export interface AnswerOption {
  id: number;
  option_text: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_type: string;
  question_text: string;
  points: number;
  options?: AnswerOption[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  status: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  questions?: Question[]; // Populated when fetching attempt
}

export interface SubmitAnswerPayload {
  question_id: number;
  answer_option_id?: number;
  short_answer_text?: string;
}

export interface QuizResult {
  attempt_id: number;
  score: number;
  passed: boolean;
  total_points: number;
  earned_points: number;
}

// Quiz specific fetch functions
export const quizApi = {
  /**
   * Get quiz details
   */
  getQuiz: async (quiz_id: string | number): Promise<{ status: string; quiz: Quiz }> => {
    return api.get<{ status: string; quiz: Quiz }>(`/quizzes/${quiz_id}`);
  },

  /**
   * Start a new quiz attempt
   */
  startAttempt: async (quiz_id: string | number): Promise<{ status: string; attempt_id: number }> => {
    return api.post<{ status: string; attempt_id: number }>(`/quizzes/${quiz_id}/attempts`);
  },

  /**
   * Get attempt details (includes questions)
   */
  getAttempt: async (attempt_id: string | number): Promise<{ status: string; attempt: QuizAttempt; questions: Question[] }> => {
    return api.get<{ status: string; attempt: QuizAttempt; questions: Question[] }>(`/quiz-attempts/${attempt_id}`);
  },

  /**
   * Submit an answer for a question in the attempt
   */
  submitAnswer: async (attempt_id: string | number, payload: SubmitAnswerPayload): Promise<{ status: string; message?: string }> => {
    return api.post<{ status: string; message?: string }>(`/quiz-attempts/${attempt_id}/answers`, payload);
  },

  /**
   * Submit the quiz attempt
   */
  submitAttempt: async (attempt_id: string | number): Promise<{ status: string; message?: string }> => {
    return api.post<{ status: string; message?: string }>(`/quiz-attempts/${attempt_id}/submit`);
  },

  /**
   * Get attempt results
   */
  getResults: async (attempt_id: string | number): Promise<{ status: string; result: QuizResult }> => {
    return api.get<{ status: string; result: QuizResult }>(`/quiz-attempts/${attempt_id}/results`);
  }
};

// Types for Saved Resources
export interface SavedResource {
  id: number;
  resource_id: number;
  resource_title: string;
  resource_type: string;
  saved_at: string;
}

export interface SavedResourcesResponse {
  status: string;
  saved_resources?: SavedResource[];
}

// Saved Resources specific fetch functions
export const savedResourcesApi = {
  /**
   * Get saved resources for the current user
   */
  getSavedResources: async (): Promise<SavedResourcesResponse> => {
    return api.get<SavedResourcesResponse>('/saved-resources/me');
  }
};

// Types for Orders
export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface OrdersResponse {
  status: string;
  orders?: Order[];
}

// Orders specific fetch functions
export const ordersApi = {
  /**
   * Get orders for the current user
   */
  getOrders: async (): Promise<OrdersResponse> => {
    return api.get<OrdersResponse>('/orders');
  }
};
