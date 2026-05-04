import { api } from '../api.js';
import { appState } from '../state.js';

export async function ResourceView(params) {
  const { id } = params;
  const div = document.createElement('div');
  div.innerHTML = `<p>Loading resource...</p>`;

  try {
    const [resourceData, progressData, savedData] = await Promise.all([
      api.get(`/resources/${id}`),
      api.get(`/resources/${id}/progress`),
      api.get(`/resources/${id}/saved`)
    ]);

    const { resource } = resourceData;
    // backend might return a generic success status with a completed boolean, or a progress record
    const isCompleted = progressData.completed === true || (progressData.progress && progressData.progress.completed);
    const isSaved = savedData.saved === true || (savedData.saved_resource && savedData.saved_resource.id);

    let contentHtml = '';
    if (resource.resource_type === 'text') {
      contentHtml = `<div class="card"><p>${resource.content_text || ''}</p></div>`;
    } else if (resource.resource_type === 'video') {
      // Very simple video handling
      contentHtml = `
        <div class="card text-center">
          <video controls style="max-width: 100%;">
            <source src="${resource.content_url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    } else if (resource.resource_type === 'link') {
      contentHtml = `
        <div class="card text-center">
          <a href="${resource.content_url}" target="_blank" class="btn btn-primary">Open External Link</a>
        </div>
      `;
    } else {
      contentHtml = `<div class="card"><p>Unknown resource type.</p></div>`;
    }

    div.innerHTML = `
      <div class="mb-4 flex justify-between items-center">
        <a href="#/modules/${resource.module_id}" class="btn btn-outline">← Back to Module</a>
        <div>
          <button id="btn-save" class="btn ${isSaved ? 'btn-secondary' : 'btn-outline'}">
            ${isSaved ? 'Saved' : 'Save Resource'}
          </button>
          <button id="btn-complete" class="btn ${isCompleted ? 'btn-success' : 'btn-primary'} ml-2" style="${isCompleted ? 'background-color: var(--color-success); color: white;' : ''}">
            ${isCompleted ? 'Completed ✓' : 'Mark as Complete'}
          </button>
        </div>
      </div>
      
      <h1 class="mb-8">${resource.title}</h1>
      
      ${contentHtml}
    `;

    // Event Listeners for actions
    let currentSaved = isSaved;
    let currentCompleted = isCompleted;

    const btnSave = div.querySelector('#btn-save');
    btnSave.addEventListener('click', async () => {
      try {
        if (currentSaved) {
          await api.delete(`/resources/${id}/save`);
          currentSaved = false;
          btnSave.className = 'btn btn-outline';
          btnSave.innerText = 'Save Resource';
          appState.showToast('Resource removed from saved list');
        } else {
          await api.post(`/resources/${id}/save`);
          currentSaved = true;
          btnSave.className = 'btn btn-secondary';
          btnSave.innerText = 'Saved';
          appState.showToast('Resource saved successfully');
        }
      } catch (err) {
        appState.showToast(err.message, 'error');
      }
    });

    const btnComplete = div.querySelector('#btn-complete');
    btnComplete.addEventListener('click', async () => {
      try {
        if (currentCompleted) {
          await api.post(`/resources/${id}/progress/reset`);
          currentCompleted = false;
          btnComplete.className = 'btn btn-primary ml-2';
          btnComplete.style.backgroundColor = '';
          btnComplete.style.color = '';
          btnComplete.innerText = 'Mark as Complete';
        } else {
          await api.post(`/resources/${id}/progress/complete`);
          currentCompleted = true;
          btnComplete.className = 'btn btn-success ml-2';
          btnComplete.style.backgroundColor = 'var(--color-success)';
          btnComplete.style.color = 'white';
          btnComplete.innerText = 'Completed ✓';
          appState.showToast('Resource marked as complete!');
        }
      } catch (err) {
        appState.showToast(err.message, 'error');
      }
    });

  } catch (err) {
    div.innerHTML = `
      <div class="card">
        <button onclick="window.history.back()" class="btn btn-outline mb-4">← Back</button>
        <p style="color: var(--color-error)">Failed to load resource: ${err.message}</p>
      </div>
    `;
  }

  return div;
}
