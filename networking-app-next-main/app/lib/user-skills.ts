import { User } from "@/app/types";

export type ParsedCv = {
  name?: string;
  contact?: { email?: string; phone?: string; linkedin?: string; github?: string };
  skills?: string[];
  education?: { degree?: string; period?: string; description?: string }[];
  experience?: {
    title_or_company?: string;
    period?: string;
    details?: string;
    description?: string;
  }[];
  sections?: Record<string, string>;
  parsed_at?: string;
};

export function parseCvData(user?: User | null): ParsedCv | null {
  if (!user?.cvData) return null;
  try {
    return JSON.parse(user.cvData) as ParsedCv;
  } catch {
    return null;
  }
}

export function getUserSkillSet(user?: User | null): Set<string> {
  const result = new Set<string>();
  const cv = parseCvData(user);
  if (cv?.skills) {
    for (const s of cv.skills) {
      const normalized = s.trim().toLowerCase();
      if (normalized) result.add(normalized);
    }
  }
  if (user?.description) {
    for (const part of user.description.split(/[,;|]/)) {
      const normalized = part.trim().toLowerCase();
      if (normalized) result.add(normalized);
    }
  }
  return result;
}

export function buildUserDescription(user?: User | null): string {
  if (!user) return "";
  const cv = parseCvData(user);
  let parts: string[] = [];
  if (cv?.skills && cv.skills.length > 0) {
    parts.push(cv.skills.join(", "));
  }
  if (cv?.experience) {
    for (const exp of cv.experience) {
      if (exp.title_or_company) parts.push(exp.title_or_company);
    }
  }
  if (cv?.education) {
    for (const edu of cv.education) {
      if (edu.degree) parts.push(edu.degree);
    }
  }
  if (user.description) parts.push(user.description);
  return parts.join(" \u2022 ");
}
