// Simple Hash Router

const routes = {};
let currentPath = null;

/**
 * Register a route
 * @param {string} path Route path (e.g., '/', '/login')
 * @param {Function} handler Function to call when route is matched. Should return HTML string or a DOM Element.
 * @param {Object} options Route options (e.g. { requiresAuth: true, requiredRole: 'Admin' })
 */
export function addRoute(path, handler, options = {}) {
  routes[path] = { handler, options };
}

/**
 * Navigate to a specific path
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Initialize the router and listen to hash changes
 */
export function initRouter(appState) {
  const container = document.getElementById('main-content');

  async function handleRoute() {
    // Get path from hash, default to '/'
    const hash = window.location.hash.slice(1) || '/';
    
    // Simple exact match (for parameters we can extend this later)
    let matchedRoute = routes[hash];
    
    // Basic dynamic route matching (e.g. /courses/:id)
    let params = {};
    if (!matchedRoute) {
      for (const [routePath, routeObj] of Object.entries(routes)) {
        if (routePath.includes(':')) {
          const routeParts = routePath.split('/');
          const hashParts = hash.split('/');
          
          if (routeParts.length === hashParts.length) {
            let match = true;
            for (let i = 0; i < routeParts.length; i++) {
              if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].slice(1);
                params[paramName] = hashParts[i];
              } else if (routeParts[i] !== hashParts[i]) {
                match = false;
                break;
              }
            }
            if (match) {
              matchedRoute = routeObj;
              break;
            }
          }
        }
      }
    }

    if (!matchedRoute) {
      container.innerHTML = `
        <div class="card text-center mt-8">
          <h2>404 - Not Found</h2>
          <p>The page you are looking for does not exist.</p>
          <button class="btn btn-primary" onclick="window.location.hash='/'">Go Home</button>
        </div>
      `;
      return;
    }

    // Check Auth Guards
    const state = appState.get();
    if (state.isLoadingAuth) {
      container.innerHTML = `<div class="text-center mt-8"><p>Loading...</p></div>`;
      // Wait for auth to finish, then we will re-trigger (handled by app.js subscription)
      return;
    }

    if (matchedRoute.options.requiresAuth && !state.isAuthenticated) {
      appState.showToast('You must log in to view this page.', 'error');
      navigate('/login');
      return;
    }

    if (matchedRoute.options.requiresRole) {
      const roles = Array.isArray(matchedRoute.options.requiresRole) 
        ? matchedRoute.options.requiresRole 
        : [matchedRoute.options.requiresRole];
        
      if (!roles.includes(state.user?.role)) {
        appState.showToast(`This page requires role: ${roles.join(' or ')}`, 'error');
        navigate('/');
        return;
      }
    }

    // Render the view
    currentPath = hash;
    try {
      const viewResult = await matchedRoute.handler(params);
      if (typeof viewResult === 'string') {
        container.innerHTML = viewResult;
      } else if (viewResult instanceof HTMLElement) {
        container.innerHTML = '';
        container.appendChild(viewResult);
      }
    } catch (err) {
      console.error("View rendering error:", err);
      container.innerHTML = `
        <div class="card text-center mt-8">
          <h2>Error</h2>
          <p>Failed to load view. Check console for details.</p>
        </div>
      `;
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', handleRoute);
  
  // Re-run route handling when auth state changes (if we were waiting)
  appState.subscribe(() => {
    handleRoute();
  });

  // Initial call
  handleRoute();
}
