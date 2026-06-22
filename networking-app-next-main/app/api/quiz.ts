import { QuizAnswerItem } from "../types";
import { instance as axios } from "./axiosInstance";

const generateQuizForJob = (jobId: string) =>
  axios.get(`/jobs/quiz/generate/${jobId}`);

const submitQuizResult = (data: {
  jobId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: string;
}) => axios.post("/jobs/quiz/submit", data);

const getQuizResult = (jobId: string, userId: string) =>
  axios.get(`/jobs/quiz/result/${jobId}/${userId}`);

const checkQuizTaken = (jobId: string, userId: string) =>
  axios.get(`/jobs/quiz/check/${jobId}/${userId}`);

const getQuizResultsByJob = (jobId: string) =>
  axios.get(`/jobs/quiz/results/${jobId}`);

export {
  generateQuizForJob,
  submitQuizResult,
  getQuizResult,
  checkQuizTaken,
  getQuizResultsByJob,
};
