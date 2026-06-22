"use client";

import AiBox from "@/app/components/match/AiBox";
import { User } from "@/app/types";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  user?: User;
};

export default function AiSummary({ user }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!user.description && !user.cvData) return;
    let active = true;
    setLoading(true);
    axios
      .post("http://localhost:3030/profile/summary/", {
        description: user.description || "",
        cvData: user.cvData || null,
      })
      .then((res) => {
        if (!active) return;
        setSummary(res.data?.summary || null);
      })
      .catch(() => {
        if (!active) return;
        setSummary(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;
  if (!user.description && !user.cvData) return null;

  return (
    <AiBox title="AI-generated summary">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing your profile...
        </div>
      )}
      {!loading && summary && <p>{summary}</p>}
      {!loading && !summary && (
        <p className="text-muted-foreground">No AI summary available yet.</p>
      )}
    </AiBox>
  );
}
