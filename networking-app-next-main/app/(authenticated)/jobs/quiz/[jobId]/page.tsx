"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAuthStore } from "@/app/stores/authStore";
import { QuizAnswerItem, QuizData, QuizQuestion, QuizValidationResult } from "@/app/types";
import { submitQuizResult } from "@/app/api/quiz";
import { applyJob } from "@/app/api/job-application";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  Code,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const user = useAuthStore((state) => state.user);

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 min in seconds
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz from AI service via job-service proxy
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.post(
          `http://localhost:3030/quiz/generate-for-job/?job_id=${jobId}`
        );
        setQuiz(res.data);
      } catch (err) {
        toast.error("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [jobId]);

  // Timer countdown
  useEffect(() => {
    if (submitted || loading || !quiz) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, loading, quiz]);

  const handleAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);

    try {
      // Validate with AI service
      const answerList: QuizAnswerItem[] = quiz.questions.map((q) => ({
        id: q.id,
        selected: answers[q.id] ?? -1,
      }));

      const validateRes = await axios.post("http://localhost:3030/quiz/validate/", {
        answers: answerList,
      });
      const validationResult: QuizValidationResult = validateRes.data;
      setResults(validationResult);

      // Save result to job-service
      await submitQuizResult({
        jobId,
        userId: user.id,
        score: validationResult.score,
        totalQuestions: validationResult.total,
        answers: JSON.stringify(validationResult.results),
      });

      // Automatically apply for the job since quiz is completed
      try {
        await applyJob({ jobId, userId: user.id });
        toast.success(`Quiz completed and application submitted! Score: ${validationResult.score}/${validationResult.total}`);
      } catch (err) {
        toast.success(`Quiz completed! Score: ${validationResult.score}/${validationResult.total}`);
      }

      setSubmitted(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("You have already taken this quiz");
        router.push("/jobs");
      } else {
        toast.error("Failed to submit quiz");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-24">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 gap-4 px-4">
        <div className="bg-amber-100 dark:bg-amber-950/40 p-6 rounded-full mb-4">
          <AlertTriangle size={64} className="text-amber-500" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">Mevcut Sınav Bulunamadı</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Bu iş ilanı için gerekli olan teknolojilere ait sınav henüz sisteme eklenmemiş veya hazırlanıyor. Lütfen daha sonra tekrar deneyin.
        </p>
        <Button onClick={() => router.push("/jobs")} className="mt-4 px-8 py-6 rounded-xl font-medium shadow-md">
          İş İlanlarına Dön
        </Button>
      </div>
    );
  }

  // Results screen
  if (submitted && results) {
    return (
      <div className="flex flex-col items-center pt-24 px-4 pb-12 max-w-3xl mx-auto gap-6 animate-in fade-in duration-500">
        {/* Score header */}
        <Card className="w-full">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-3xl font-bold tracking-tight mb-2">Sınav Sonucu</CardTitle>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20">
                <span className="text-4xl font-bold text-primary">
                  {results.score}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 font-medium">
              {results.percentage >= 70
                ? "Tebrikler, harika bir iş çıkardınız!"
                : results.percentage >= 50
                ? "İyi bir denemeydi! Biraz daha pratikle mükemmel olabilirsiniz."
                : "Öğrenmeye devam edin! Bu teknolojilerde kendinizi geliştirebilirsiniz."}
            </p>
          </CardHeader>
        </Card>

        {/* Detailed results */}
        <div className="w-full flex flex-col gap-4 mt-2">
          <h3 className="text-xl font-bold tracking-tight px-1">Soru Detayları</h3>
          {results.results.map((r, i) => {
            const question = quiz.questions.find((q) => q.id === r.id);
            if (!question) return null;
            return (
              <Card key={r.id} className={`w-full overflow-hidden border-l-4 ${r.correct ? "border-l-green-500" : "border-l-red-500"}`}>
                <CardContent className="py-5 px-6">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full ${r.correct ? "bg-green-100 dark:bg-green-950/40 text-green-600" : "bg-red-100 dark:bg-red-950/40 text-red-600"}`}>
                      {r.correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold leading-relaxed text-foreground/90">
                        <span className="text-muted-foreground mr-2">Soru {i + 1}:</span>
                        {question.question}
                      </p>
                      
                      {question.code && (
                        <div className="mt-3 rounded-md overflow-hidden border border-zinc-800">
                          <pre className="bg-zinc-950 text-zinc-100 text-sm p-4 overflow-x-auto font-mono">
                            <code>{question.code}</code>
                          </pre>
                        </div>
                      )}
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/40 border border-muted">
                          <span className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Sizin Cevabınız</span>
                          <span className={`text-sm font-medium ${r.correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {question.options[r.selected] || "Cevaplanmadı"}
                          </span>
                        </div>
                        
                        {!r.correct && r.correct_answer !== null && (
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                            <span className="text-xs font-semibold uppercase text-green-700 dark:text-green-400 block mb-1">Doğru Cevap</span>
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">
                              {question.options[r.correct_answer]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 p-3 bg-muted rounded-md border border-border">
                        <p className="text-sm text-foreground/80">
                          <span className="font-semibold mr-1">Açıklama:</span>
                          {r.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={() => router.push("/jobs")} className="mt-4 px-8">
          İş İlanlarına Dön
        </Button>
      </div>
    );
  }

  // Quiz taking screen
  const question = quiz.questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const isTimeLow = timeLeft < 120;

  return (
    <div className="flex flex-col items-center pt-24 px-4 pb-12 max-w-4xl mx-auto gap-6">
      {/* Header Info */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isTimeLow ? "bg-red-100 text-red-600 dark:bg-red-950/40" : "bg-background shadow-sm"}`}>
            <Clock size={18} className={isTimeLow ? "animate-pulse" : "text-primary"} />
            <span className={`text-lg font-mono font-bold ${isTimeLow ? "" : "text-foreground"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-foreground/80">
            Soru {currentQ + 1} / {quiz.questions.length}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {answeredCount} soru cevaplandı
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <Card className="w-full overflow-hidden flex flex-col">
        <div className="flex-1 min-h-[450px] flex flex-col">
          <CardHeader className="pt-6 pb-2 px-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">
                {question.type.replace("_", " ")}
              </span>
              {quiz.technologies.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {quiz.technologies.join(", ")}
                </span>
              )}
            </div>
            <CardTitle className="text-xl font-semibold leading-relaxed text-foreground">
              {question.question}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex flex-col gap-4 px-6 pb-6 flex-1">
            {/* Code block */}
            {question.code && (
              <div className="relative mt-2 mb-2 rounded-md overflow-hidden border border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-4 py-2 border-b border-border">
                  <Code size={14} />
                  <span>Kod Parçacığı</span>
                </div>
                <pre className="bg-zinc-950 text-zinc-100 text-sm p-4 overflow-x-auto font-mono leading-relaxed">
                  <code>{question.code}</code>
                </pre>
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-2 mt-auto">
              {question.options.map((option, i) => {
                const isSelected = answers[question.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(question.id, i)}
                    className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium mr-3 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={isSelected ? "font-medium text-foreground" : "text-foreground/80"}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Navigation */}
      <div className="w-full flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
        >
          <ArrowLeft size={16} className="mr-2" /> Önceki
        </Button>

        {currentQ === quiz.questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Sınavı Bitir
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQ((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
          >
            Sonraki <ArrowRight size={16} className="ml-2" />
          </Button>
        )}
      </div>

      {/* Question dot navigator */}
      <div className="flex flex-wrap gap-1 justify-center mt-6">
        {quiz.questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = i === currentQ;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isAnswered
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground border border-transparent"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
