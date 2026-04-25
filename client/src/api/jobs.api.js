import api from './axios';

// `params` is an optional object: { q, location, jobType, minSalary, minExperience, sortBy }
export const getJobs = (params = {}) => api.get('/api/jobs', { params });
export const getJob = (id) => api.get(`/api/jobs/${id}`);
export const createJob = (data) => api.post('/api/jobs', data);
export const updateJob = (id, data) => api.put(`/api/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/api/jobs/${id}`);
