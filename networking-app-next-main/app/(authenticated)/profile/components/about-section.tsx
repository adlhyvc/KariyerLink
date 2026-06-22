"use client";
import { User } from "@/app/types";
import Timeline, { TimelineItem } from "@/app/components/match/Timeline";
import SkillGapTag from "@/app/components/match/SkillGapTag";
import {
  GraduationCap,
  Briefcase,
  Code,
  Mail,
  Phone,
  Github,
  Linkedin,
  Sparkles,
} from "lucide-react";

import { parseCvData } from "@/app/lib/user-skills";

const HOT_MARKET_SKILLS = [
  "python",
  "typescript",
  "react",
  "kubernetes",
  "aws",
  "deep learning",
  "pytorch",
  "mlops",
];

function classifySkills(skills: string[]) {
  const lowercase = new Set(skills.map((s) => s.toLowerCase()));
  const featured: string[] = [];
  const verified: string[] = [];
  const learnNext: string[] = [];

  for (const s of skills) {
    if (HOT_MARKET_SKILLS.includes(s.toLowerCase())) {
      featured.push(s);
    } else {
      verified.push(s);
    }
  }

  for (const hot of HOT_MARKET_SKILLS) {
    if (!lowercase.has(hot)) learnNext.push(hot);
  }

  return { featured, verified, learnNext: learnNext.slice(0, 3) };
}

export default function AboutSection({ user }: { user?: User }) {
  if (!user) return null;

  const cvData = parseCvData(user);

  if (!cvData) {
    return (
      <div className="py-4 flex flex-col gap-4">

        {user.description ? (
          <p className="text-sm leading-relaxed">{user.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No information available.</p>
        )}
      </div>
    );
  }

  const expItems: TimelineItem[] = (cvData.experience || []).map((exp, i) => ({
    key: `exp-${i}`,
    marker: <Briefcase className="h-3.5 w-3.5" />,
    title: exp.title_or_company || exp.description || "Experience",
    meta: exp.period,
    body: exp.details ? <p>{exp.details}</p> : undefined,
  }));

  const eduItems: TimelineItem[] = (cvData.education || []).map((edu, i) => ({
    key: `edu-${i}`,
    marker: <GraduationCap className="h-3.5 w-3.5" />,
    title: edu.degree || edu.description || "Education",
    meta: edu.period,
  }));

  const { featured, verified, learnNext } = classifySkills(cvData.skills || []);

  return (
    <div className="space-y-6 py-4">


      {user.description && (
        <div>
          <p className="text-sm leading-relaxed">{user.description}</p>
        </div>
      )}

      {(cvData.skills?.length ?? 0) > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Code className="h-4 w-4" />
            Skills & validations
          </h3>
          <div className="flex flex-wrap gap-2">
            {featured.map((s) => (
              <SkillGapTag key={`f-${s}`} label={s} state="owned" />
            ))}
            {verified.map((s) => (
              <SkillGapTag key={`v-${s}`} label={s} state="neutral" />
            ))}
            {learnNext.map((s) => (
              <span
                key={`l-${s}`}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-primary/5 text-primary/80 border-dashed border-primary/30"
              >
                <Sparkles className="h-3 w-3" />
                {s} (learn next)
              </span>
            ))}
          </div>
        </div>
      )}

      {expItems.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Briefcase className="h-4 w-4" />
            Experience
          </h3>
          <Timeline items={expItems} />
        </div>
      )}

      {eduItems.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <GraduationCap className="h-4 w-4" />
            Education
          </h3>
          <Timeline items={eduItems} />
        </div>
      )}

      {cvData.contact && Object.keys(cvData.contact).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Contact</h3>
          <div className="space-y-1">
            {cvData.contact.email && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> {cvData.contact.email}
              </p>
            )}
            {cvData.contact.phone && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {cvData.contact.phone}
              </p>
            )}
            {cvData.contact.linkedin && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Linkedin className="h-3 w-3" /> {cvData.contact.linkedin}
              </p>
            )}
            {cvData.contact.github && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Github className="h-3 w-3" /> {cvData.contact.github}
              </p>
            )}
          </div>
        </div>
      )}

      {cvData.parsed_at && (
        <p className="text-xs text-muted-foreground text-right">
          CV uploaded: {new Date(cvData.parsed_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
