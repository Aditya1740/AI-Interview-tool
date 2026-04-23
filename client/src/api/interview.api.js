import api from './axios';

export const startInterview = (applicationId) =>
  api.post(`/api/interview/start/${applicationId}`);

export const getInterview = (applicationId) =>
  api.get(`/api/interview/${applicationId}`);

export const submitAnswer = (applicationId, answerData) =>
  api.post(`/api/interview/answer/${applicationId}`, answerData);
