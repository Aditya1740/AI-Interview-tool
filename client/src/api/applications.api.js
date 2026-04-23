import api from './axios';

export const applyToJob = (formData) =>
  api.post('/api/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getMyApplications = () => api.get('/api/applications/my');
export const getJobApplications = (jobId) => api.get(`/api/applications/job/${jobId}`);
export const getApplication = (id) => api.get(`/api/applications/${id}`);
