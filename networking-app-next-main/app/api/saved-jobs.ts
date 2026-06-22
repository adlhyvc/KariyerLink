import { instance as axios } from "./axiosInstance";

export const saveJob = (userId: string, jobId: string) =>
  axios.post("/jobs/saved", { userId, jobId });

export const unsaveJob = (userId: string, jobId: string) =>
  axios.delete(`/jobs/saved/${userId}/${jobId}`);
