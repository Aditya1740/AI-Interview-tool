import api from './axios';

export const applyToJob = (formData) =>
  api.post('/api/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getMyApplications = () => api.get('/api/applications/my');
// `params` optional: { minScore, q, sortBy }
export const getJobApplications = (jobId, params = {}) =>
  api.get(`/api/applications/job/${jobId}`, { params });
export const getApplication = (id) => api.get(`/api/applications/${id}`);
