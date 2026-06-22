import { addJob } from "@/app/api/job";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { JobRequest } from "@/app/types";
import { ClipboardCheck, Pencil } from "lucide-react";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

type Props = {
  companyId: string;
};

export function ShareJob({ companyId }: Props) {
  const [form, setForm] = useState<JobRequest>({
    companyId: companyId,
    description: "",
    title: "",
    endDate: "",
    quizEnabled: false,
    experienceLevel: "",
  });

  const { t } = useTranslation();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm({ ...form, [target.name]: target.checked });
    } else {
      setForm({ ...form, [target.name]: target.value });
    }
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    try {
      const res = await addJob(form);
      toast.success(res?.data);
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Pencil strokeWidth={3} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("companyPage.shareJob")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          <Input onChange={handleChange} name="title" id="title" placeholder={t("name")} type="text" />
          <Textarea onChange={handleChange} name="description" placeholder={t("description")} id="description" />
          <div className="flex flex-col items-start gap-2">
            <Label>{t("endDate")}</Label>
            <Input
              onChange={handleChange}
              name="endDate"
              id="endDate"
              type="datetime-local"
              placeholder={t("endDate")}
            />
          </div>

          {/* Quiz Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <input
              type="checkbox"
              id="quizEnabled"
              name="quizEnabled"
              checked={form.quizEnabled || false}
              onChange={handleChange}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <div className="flex flex-col">
              <Label htmlFor="quizEnabled" className="cursor-pointer font-medium flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4" />
                Enable Skills Quiz for Applicants
              </Label>
              <span className="text-xs text-muted-foreground">
                Candidates will take a short quiz based on the required skills before applying
              </span>
            </div>
          </div>

          {form.quizEnabled && (
            <div className="flex flex-col gap-2">
              <Label>Experience Level</Label>
              <select
                name="experienceLevel"
                value={form.experienceLevel || ""}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Auto-detect from description</option>
                <option value="low">Junior / Entry Level</option>
                <option value="high">Senior / Experienced</option>
              </select>
              <span className="text-xs text-muted-foreground">
                If set to auto-detect, the quiz difficulty will be determined from the job description
              </span>
            </div>
          )}

          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
