import { api } from '../api.js';

export async function ModuleDetailView(params) {
  const { id } = params;
  const div = document.createElement('div');
  div.innerHTML = `<p>Loading module details...</p>`;

  try {
    const [moduleData, resourcesData, quizzesData] = await Promise.all([
      api.get(`/modules/${id}`),
      api.get(`/modules/${id}/resources`),
      api.get(`/modules/${id}/quizzes`)
    ]);

    const { module } = moduleData;
    const resources = resourcesData.resources || [];
    const quizzes = quizzesData.quizzes || [];

    const resourcesHtml = resources.length === 0 
      ? '<p>No resources in this module.</p>'
      : resources.map(r => `
          <div class="card mb-4 flex justify-between items-center">
            <div>
              <h4>${r.title}</h4>
              <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; background: var(--color-background); border-radius: var(--radius-md);">${r.resource_type}</span>
            </div>
            <a href="#/resources/${r.id}" class="btn btn-primary">View Resource</a>
          </div>
        `).join('');

    const quizzesHtml = quizzes.length === 0
      ? '<p>No quizzes in this module.</p>'
      : quizzes.map(q => `
          <div class="card mb-4 flex justify-between items-center">
            <div>
              <h4>${q.title}</h4>
              <p style="font-size: 0.875rem;">${q.time_limit_minutes ? q.time_limit_minutes + ' mins limit' : 'No time limit'}</p>
            </div>
            <a href="#/quizzes/${q.id}" class="btn btn-secondary">Take Quiz</a>
          </div>
        `).join('');

    div.innerHTML = `
      <div class="mb-8">
        <a href="#/courses/${module.course_id}" class="btn btn-outline mb-4">← Back to Course</a>
        <h1>${module.title}</h1>
        <p>${module.description}</p>
      </div>
      
      <div class="mb-8">
        <h2>Resources</h2>
        ${resourcesHtml}
      </div>

      <div class="mb-8">
        <h2>Quizzes</h2>
        ${quizzesHtml}
      </div>
    `;

  } catch (err) {
    div.innerHTML = `
      <div class="card">
        <button onclick="window.history.back()" class="btn btn-outline mb-4">← Back</button>
        <p style="color: var(--color-error)">Failed to load module details: ${err.message}</p>
      </div>
    `;
  }

  return div;
}
