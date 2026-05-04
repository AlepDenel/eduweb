import { api } from '../api.js';

export async function PortalView() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="mb-8">
      <h1>Student Portal</h1>
      <p>View your progress and saved resources.</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
      <div id="progress-container">
        <h2>Course Progress</h2>
        <p>Loading progress...</p>
      </div>
      
      <div id="saved-container">
        <h2>Saved Resources</h2>
        <p>Loading saved resources...</p>
      </div>
    </div>
  `;

  try {
    const [progressData, savedData] = await Promise.all([
      api.get('/portal/progress/overview'),
      api.get('/saved-resources/me')
    ]);

    // Progress Overview
    const progressList = progressData.courses || progressData.progress_overview || [];
    const progressContainer = div.querySelector('#progress-container');
    
    if (progressList.length === 0) {
      progressContainer.innerHTML += '<div class="card"><p>No progress data yet. Start a course!</p></div>';
    } else {
      const progressHtml = progressList.map(p => `
        <div class="card mb-4">
          <div class="flex justify-between items-center mb-2">
            <h4>${p.course_title}</h4>
            <span style="color: var(--color-primary); font-weight: bold;">${p.progress_percentage}%</span>
          </div>
          <div style="width: 100%; background-color: var(--color-border); height: 8px; border-radius: 4px;">
            <div style="width: ${p.progress_percentage}%; background-color: var(--color-primary); height: 100%; border-radius: 4px;"></div>
          </div>
          <div class="mt-4 flex justify-between items-center">
            <p style="font-size: 0.875rem;">${p.completed_resources} / ${p.total_resources} resources completed</p>
            <a href="#/courses/${p.course_id}" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Resume</a>
          </div>
        </div>
      `).join('');
      // Overwrite the loading text
      progressContainer.innerHTML = `<h2>Course Progress</h2>${progressHtml}`;
    }

    // Saved Resources
    const savedList = savedData.saved_resources || [];
    const savedContainer = div.querySelector('#saved-container');

    if (savedList.length === 0) {
      savedContainer.innerHTML += '<div class="card"><p>You have no saved resources.</p></div>';
    } else {
      const savedHtml = savedList.map(s => `
        <div class="card mb-4 flex justify-between items-center">
          <div>
            <h4>${s.resource_title}</h4>
            <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; background: var(--color-background); border-radius: var(--radius-md);">${s.resource_type}</span>
          </div>
          <a href="#/resources/${s.resource_id}" class="btn btn-primary">View</a>
        </div>
      `).join('');
      // Overwrite the loading text
      savedContainer.innerHTML = `<h2>Saved Resources</h2>${savedHtml}`;
    }

  } catch (err) {
    div.innerHTML = `
      <div class="card">
        <p style="color: var(--color-error)">Failed to load portal data: ${err.message}</p>
      </div>
    `;
  }

  return div;
}
