export type QuizQuestion = {
  id: string;
  type: "output" | "bug" | "concept" | "fill_blank";
  question: string;
  code: string | null;
  options: string[];
};

export type QuizData = {
  questions: QuizQuestion[];
  count: number;
  technologies: string[];
  level: string;
  time_limit_minutes: number;
  job_id?: string;
  detected_skills?: string[];
  detected_level?: string;
};

export type QuizAnswerItem = {
  id: string;
  selected: number;
};

export type QuizResultItem = {
  id: string;
  correct: boolean;
  selected: number;
  correct_answer: number | null;
  explanation: string;
};

export type QuizValidationResult = {
  score: number;
  total: number;
  percentage: number;
  results: QuizResultItem[];
};

export type QuizResultRecord = {
  id: string;
  userId: string;
  jobId: string;
  score: number;
  totalQuestions: number;
  answers: string;
  completedAt: string;
};

export type FamiliarTech = {
  concepts: string[];
  tools: string[];
  typical_tasks: string[];
  resources: { title: string; url: string }[];
};

export type FamiliarWithData = {
  technologies: Record<string, FamiliarTech>;
  level: string;
  detected_skills?: string[];
  job_id?: string;
};
