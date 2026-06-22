"use client";

import { updateUser } from "@/app/api/auth";
import { defaultFetcher, fetcher } from "@/app/api/axiosInstance";
import AiBox from "@/app/components/match/AiBox";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { useAuthStore } from "@/app/stores/authStore";
import { User } from "@/app/types";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import Chip from "./components/chip";
import LiveSuggestion from "./components/live-suggestion";
import StepProgress from "./components/step-progress";

const STEP_LABELS = ["Basic info", "Skills", "Career goal", "AI summary"];

const CAREER_GOALS = [
  "ML Engineering",
  "Research Scientist",
  "Data Science",
  "Full Stack",
  "DevOps",
  "Frontend",
  "Backend",
  "AI Product Manager",
];

const WORK_MODELS = ["Remote", "Hybrid", "Office"];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  title: string;
  skills: string[];
  careerGoal: string;
  expectedSalary: string;
  workModel: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const auth = useAuthStore((s) => s.user);
  const { data: user } = useSWR<User>(auth.id ? `/users/${auth.id}` : null, fetcher);
  const { data: skillData } = useSWR<{ skills: string[] }>(
    "http://localhost:3030/recommendation/skills/",
    defaultFetcher,
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    city: "",
    title: "",
    skills: [],
    careerGoal: "",
    expectedSalary: "",
    workModel: "",
  });
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    estimate?: number;
    deltaVsMarketPct?: number;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      firstName: user.firstName || prev.firstName,
      lastName: user.lastName || prev.lastName,
      email: user.email || prev.email,
    }));
  }, [user]);

  const availableSkills = skillData?.skills ?? [];

  const toggleSkill = (skill: string) => {
    setForm((prev) => {
      const has = prev.skills.includes(skill);
      return {
        ...prev,
        skills: has ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const buildDescription = (): string => {
    const parts: string[] = [];
    if (form.title) parts.push(form.title);
    if (form.skills.length > 0) parts.push(form.skills.join(", "));
    if (form.careerGoal) parts.push(`targeting ${form.careerGoal}`);
    if (form.workModel) parts.push(`prefers ${form.workModel.toLowerCase()}`);
    if (form.city) parts.push(`based in ${form.city}`);
    return parts.join(" · ");
  };

  const finalize = async () => {
    if (!auth.id) {
      toast.error("Please log in first");
      return;
    }
    setAnalyzing(true);
    try {
      const description = buildDescription();
      await updateUser(
        {
          firstName: form.firstName || user?.firstName || "",
          lastName: form.lastName || user?.lastName || "",
          email: form.email || user?.email || "",
          description,
        },
        auth.id,
      );

      const [summaryRes, marketRes] = await Promise.all([
        axios.post("http://localhost:3030/profile/summary/", {
          description,
          targetRole: form.careerGoal || null,
        }),
        axios.post("http://localhost:3030/profile/market-value/", {
          description,
          location: form.city || "Türkiye",
        }),
      ]);

      setAnalysis({
        summary: summaryRes.data?.summary ?? "",
        estimate: marketRes.data?.estimate,
        deltaVsMarketPct: marketRes.data?.deltaVsMarketPct,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not finalize onboarding");
    } finally {
      setAnalyzing(false);
    }
  };

  const goNext = async () => {
    if (step === 3) {
      setSaving(true);
      await finalize();
      setSaving(false);
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6 max-w-5xl mx-auto pt-24 px-8 lg:px-12 pb-12 w-full">
      <Card>
        <CardContent className="p-6">
          <StepProgress step={step} total={4} labels={STEP_LABELS} />

          {step === 1 && (
            <div className="mt-6 flex flex-col gap-3">
              <h2 className="text-xl font-bold tracking-tight">Welcome to KariyerLink</h2>
              <p className="text-sm text-muted-foreground">
                Let&apos;s collect the basics so the AI can match you to the right roles.
              </p>
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="City (e.g. Istanbul, Erzurum)"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                placeholder="Current title (e.g. ML Engineer)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight">Pick your skills</h2>
              <p className="text-sm text-muted-foreground">
                Tell the AI what you&apos;re strong at. Pick as many as apply.
              </p>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                {availableSkills.length === 0 && (
                  <p className="text-xs text-muted-foreground">Loading skill list...</p>
                )}
                {availableSkills.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={form.skills.includes(s)}
                    onToggle={() => toggleSkill(s)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight">Your career goal</h2>
              <p className="text-sm text-muted-foreground">
                We use this to find the best matches and surface relevant skill gaps.
              </p>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Target track</div>
                <div className="flex flex-wrap gap-2">
                  {CAREER_GOALS.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      selected={form.careerGoal === g}
                      onToggle={() =>
                        setForm({ ...form, careerGoal: form.careerGoal === g ? "" : g })
                      }
                    />
                  ))}
                </div>
              </div>
              <Input
                placeholder="Expected monthly salary (e.g. 80000)"
                value={form.expectedSalary}
                onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
              />
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Preferred work model
                </div>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODELS.map((w) => (
                    <Chip
                      key={w}
                      label={w}
                      selected={form.workModel === w}
                      onToggle={() =>
                        setForm({ ...form, workModel: form.workModel === w ? "" : w })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight">Your AI profile</h2>
              {analyzing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating your analysis...
                </div>
              ) : (
                analysis && (
                  <AiBox title="AI analysis ready">
                    <div className="flex flex-col gap-2">
                      <p>{analysis.summary}</p>
                      {analysis.estimate && (
                        <p className="text-foreground">
                          Estimated monthly gross: <strong>₺{analysis.estimate.toLocaleString("tr-TR")}</strong>
                          {analysis.deltaVsMarketPct !== undefined && (
                            <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              ({analysis.deltaVsMarketPct >= 0 ? "+" : ""}
                              {analysis.deltaVsMarketPct}% vs market)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </AiBox>
                )
              )}
              <div className="rounded-lg border bg-card p-4 flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  Your profile has been saved. You can update it any time from your profile
                  page.
                </div>
              </div>
              <Button onClick={() => router.push("/")}>Go to dashboard</Button>
            </div>
          )}

          {step < 4 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={step === 1 || saving}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <Button onClick={goNext} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === 3 ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Analyze with AI
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="hidden lg:block">
        <LiveSuggestion
          step={step}
          skills={form.skills}
          careerGoal={form.careerGoal}
          title={form.title}
        />
      </div>
    </div>
  );
}
