import { api } from '../api.js';

export async function CourseDetailView(params) {
  const { id } = params;
  const div = document.createElement('div');
  div.innerHTML = `<p>Loading course details...</p>`;

  try {
    // Fetch course details and progress summary in parallel
    const [courseData, progressData] = await Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/progress-summary`)
    ]);

    const { course } = courseData;
    const summary = progressData; // Assuming progressData directly matches fields

    let modulesHtml = '';
    if (!summary.modules || summary.modules.length === 0) {
      modulesHtml = '<p>No modules available for this course yet.</p>';
    } else {
      modulesHtml = summary.modules.map(m => `
        <div class="card mb-4">
          <div class="flex justify-between items-center">
            <h3>${m.title || `Module ${m.id}`}</h3>
            <a href="#/modules/${m.module_id || m.id}" class="btn btn-outline">View Module</a>
          </div>
          <p>Completed: ${m.completed_resources} / ${m.total_resources} resources</p>
        </div>
      `).join('');
    }

    div.innerHTML = `
      <div class="mb-8">
        <a href="#/courses" class="btn btn-outline mb-4">← Back to Courses</a>
        <h1>${course.title}</h1>
        <p>${course.description}</p>
        
        <div class="card mt-4" style="background-color: var(--color-primary); color: white;">
          <h3>Your Progress</h3>
          <p>${summary.progress_percentage}% Completed (${summary.completed_resources}/${summary.total_resources} resources)</p>
          ${summary.is_completed ? `<p style="color: var(--color-success); font-weight: bold;">Course Completed!</p>` : ''}
        </div>
      </div>
      
      <div>
        <h2>Modules</h2>
        ${modulesHtml}
      </div>
    `;

  } catch (err) {
    div.innerHTML = `
      <div class="card">
        <a href="#/courses" class="btn btn-outline mb-4">← Back to Courses</a>
        <p style="color: var(--color-error)">Failed to load course details: ${err.message}</p>
      </div>
    `;
  }

  return div;
}
