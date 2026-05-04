import { appState } from './state.js';
import { initRouter, addRoute } from './router.js';
import { renderNavbar } from './components/Navbar.js';
import { HomeView } from './views/home.js';
import { LoginView, RegisterView } from './views/auth.js';
import { CoursesView } from './views/courses.js';
import { CourseDetailView } from './views/courseDetail.js';
import { ModuleDetailView } from './views/moduleDetail.js';
import { ResourceView } from './views/resource.js';
import { PortalView } from './views/portal.js';

// Subscribe Navbar to state changes so it updates on login/logout
appState.subscribe(() => {
  renderNavbar();
});

// Register Routes
addRoute('/', HomeView);
addRoute('/login', LoginView);
addRoute('/register', RegisterView);

// Phase 2 Routes (Requires Auth)
addRoute('/courses', CoursesView, { requiresAuth: true });
addRoute('/courses/:id', CourseDetailView, { requiresAuth: true });
addRoute('/modules/:id', ModuleDetailView, { requiresAuth: true });
addRoute('/resources/:id', ResourceView, { requiresAuth: true });
addRoute('/portal', PortalView, { requiresAuth: true });

// App Initialization
async function initApp() {
  // Render initial navbar
  renderNavbar();

  // Initialize routing
  initRouter(appState);

  // Verify session (will trigger state update and re-render)
  await appState.verifySession();
}

// Start application
document.addEventListener('DOMContentLoaded', initApp);
