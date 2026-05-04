import { appState } from '../state.js';
import { api } from '../api.js';

export function renderNavbar() {
  const container = document.getElementById('navbar-container');
  const state = appState.get();

  let authLinks = '';

  if (state.isAuthenticated && state.user) {
    authLinks = \`
      <div class="flex items-center gap-5">
        <div class="hidden sm:block text-right">
          <p class="text-sm font-bold text-slate-900 leading-none">\${state.user.name}</p>
          <p class="text-xs font-medium text-indigo-600 mt-1">\${state.user.role}</p>
        </div>
        <button id="nav-logout-btn" class="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow">Logout</button>
      </div>
    \`;
  } else if (!state.isLoadingAuth) {
    authLinks = \`
      <div class="flex items-center gap-3">
        <a href="#/login" class="px-5 py-2.5 text-slate-700 hover:text-slate-900 font-bold text-sm transition-colors">Login</a>
        <a href="#/register" class="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">Register</a>
      </div>
    \`;
  }

  // Common links based on role
  let portalLinks = '';
  if (state.isAuthenticated) {
    portalLinks += \`<a href="#/courses" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">Courses</a>\`;
    portalLinks += \`<a href="#/portal" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">Dashboard</a>\`;
    portalLinks += \`<a href="#/forum" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">Forum</a>\`;
    portalLinks += \`<a href="#/books" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">Bookstore</a>\`;
    if (state.user?.role === 'Admin') {
      portalLinks += \`<a href="#/admin" class="px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all">Admin</a>\`;
    }
  }

  container.innerHTML = \`
    <nav class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-center h-20">
          
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center">
            <a href="#/" class="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span class="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-lg">E</span>
              EduTech
            </a>
          </div>

          <!-- Center Links -->
          <div class="hidden md:flex items-center space-x-1">
            \${portalLinks}
          </div>

          <!-- Right Side Auth Actions -->
          <div class="flex items-center gap-4">
            \${authLinks}
          </div>
          
        </div>
      </div>
    </nav>
  \`;

  // Attach logout handler if it exists
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api.post('/auth/logout');
        appState.setUser(null, false);
        window.location.hash = '#/login';
      } catch (err) {
        console.error('Logout failed:', err);
      }
    });
  }
}
