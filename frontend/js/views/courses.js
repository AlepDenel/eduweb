import { api } from '../api.js';

export async function CoursesView() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="flex justify-between items-center mb-8">
      <h2>All Courses</h2>
    </div>
    <div id="courses-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
      <p>Loading courses...</p>
    </div>
  `;

  try {
    const data = await api.get('/courses');
    const { courses } = data;

    const listDiv = div.querySelector('#courses-list');
    
    if (!courses || courses.length === 0) {
      listDiv.innerHTML = '<p>No courses available at the moment.</p>';
      listDiv.style.display = 'block';
    } else {
      listDiv.innerHTML = courses.map(c => `
        <div class="card">
          <h3>${c.title}</h3>
          <p>${c.description}</p>
          <div class="mt-4">
            <a href="#/courses/${c.id}" class="btn btn-primary">Go to Course</a>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    div.querySelector('#courses-list').innerHTML = `
      <p style="color: var(--color-error)">Failed to load courses: ${err.message}</p>
    `;
  }

  return div;
}
