import { api } from '../api.js';
import { appState } from '../state.js';
import { navigate } from '../router.js';

export function LoginView() {
  const div = document.createElement('div');
  div.className = 'card mt-8';
  div.style.maxWidth = '400px';
  div.style.margin = '2rem auto';

  div.innerHTML = `
    <h2 class="text-center">Login</h2>
    <form id="login-form">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" id="email" class="form-input" required placeholder="student@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="password" class="form-input" required placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Log In</button>
      <div class="text-center mt-4">
        <a href="#/register">Don't have an account? Register</a>
      </div>
    </form>
  `;

  const form = div.querySelector('#login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await api.post('/auth/login', { email, password });
      appState.showToast('Logged in successfully');
      await appState.verifySession();
      navigate('/');
    } catch (err) {
      appState.showToast(err.message, 'error');
    }
  });

  return div;
}

export function RegisterView() {
  const div = document.createElement('div');
  div.className = 'card mt-8';
  div.style.maxWidth = '400px';
  div.style.margin = '2rem auto';

  div.innerHTML = `
    <h2 class="text-center">Register</h2>
    <form id="register-form">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" id="name" class="form-input" required placeholder="John Doe">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" id="email" class="form-input" required placeholder="student@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="password" class="form-input" required placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Sign Up</button>
      <div class="text-center mt-4">
        <a href="#/login">Already have an account? Log In</a>
      </div>
    </form>
  `;

  const form = div.querySelector('#register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await api.post('/auth/register', { name, email, password });
      appState.showToast('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      appState.showToast(err.message, 'error');
    }
  });

  return div;
}
