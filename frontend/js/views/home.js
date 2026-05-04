import { api } from '../api.js';

export async function HomeView() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="text-center mt-8 mb-8">
      <h1>Welcome to EduTech</h1>
      <p>Discover top-tier courses and expand your knowledge.</p>
    </div>
    
    <div id="home-content">
      <div class="text-center"><p>Loading content...</p></div>
    </div>
  `;

  // Fetch homepage data
  try {
    const data = await api.get('/homepage');
    const { homepage } = data;
    
    let coursesHtml = homepage.featured_courses.map(c => `
      <div class="card">
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <a href="#/courses/${c.id}" class="btn btn-primary mt-4">View Course</a>
      </div>
    `).join('');

    if (!coursesHtml) {
      coursesHtml = '<p>No featured courses available at the moment.</p>';
    }

    const contentDiv = div.querySelector('#home-content');
    contentDiv.innerHTML = `
      <h2 class="mb-4">Featured Courses</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        ${coursesHtml}
      </div>
    `;

  } catch (err) {
    div.querySelector('#home-content').innerHTML = `
      <div class="card">
        <p style="color: var(--color-error)">Failed to load homepage content. Please try again later.</p>
      </div>
    `;
  }

  return div;
}
