export type JobRequest = {
  title: string;
  description: string;
  companyId: string;
  endDate: string;
  quizEnabled?: boolean;
  experienceLevel?: string;
};

export type Job = JobRequest & {
  id: string;
  companyName: string;
  requiredSkills?: string;
  sourceUrl?: string;
  location?: string;
  /** Date the job was originally posted on its source (e.g. LinkedIn). */
  postedDate?: string | null;
  /** Date the job row was first inserted into our DB. */
  createdDate?: string | null;
};
