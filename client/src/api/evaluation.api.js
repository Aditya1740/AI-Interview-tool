import api from './axios';

export const generateEvaluation = (applicationId) =>
  api.post(`/api/evaluation/generate/${applicationId}`);

export const getEvaluation = (applicationId) =>
  api.get(`/api/evaluation/${applicationId}`);
