import api from './axios';

export const getJobs = () => api.get('/api/jobs');
export const getJob = (id) => api.get(`/api/jobs/${id}`);
export const createJob = (data) => api.post('/api/jobs', data);
export const updateJob = (id, data) => api.put(`/api/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/api/jobs/${id}`);
