import { api } from './api.js';

// Global application state
const state = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  listeners: []
};

export const appState = {
  // Subscribe to state changes
  subscribe(listener) {
    state.listeners.push(listener);
    // return unsubscribe function
    return () => {
      state.listeners = state.listeners.filter(l => l !== listener);
    };
  },

  // Notify listeners
  notify() {
    state.listeners.forEach(listener => listener({ ...state }));
  },

  // Get current state
  get() {
    return { ...state };
  },

  // Set user state
  setUser(user, isAuthenticated) {
    state.user = user;
    state.isAuthenticated = isAuthenticated;
    state.isLoadingAuth = false;
    this.notify();
  },

  // Verify auth session
  async verifySession() {
    state.isLoadingAuth = true;
    this.notify();
    try {
      const data = await api.get('/auth/me');
      if (data.authenticated) {
        this.setUser(data.user, true);
      } else {
        this.setUser(null, false);
      }
    } catch (err) {
      this.setUser(null, false);
    }
  },

  // Toast notification system
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300); // Wait for animation
    }, 3000);
  }
};
