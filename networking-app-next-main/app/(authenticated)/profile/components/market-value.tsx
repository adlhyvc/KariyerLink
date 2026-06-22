"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import { User } from "@/app/types";
import axios from "axios";
import { Loader2, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

type Props = { user?: User };

type MarketValue = {
  estimate: number;
  currency: string;
  deltaVsMarketPct: number;
  distribution: Record<"junior" | "mid" | "you" | "senior" | "lead", number>;
  location: string;
};

function fmtTRY(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value);
}

const ORDER: ["junior", "mid", "you", "senior", "lead"] = [
  "junior",
  "mid",
  "you",
  "senior",
  "lead",
];

const LABEL: Record<(typeof ORDER)[number], string> = {
  junior: "Jr",
  mid: "Mid",
  you: "You",
  senior: "Sr",
  lead: "Lead",
};

export default function MarketValue({ user }: Props) {
  const [data, setData] = useState<MarketValue | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    axios
      .post("http://localhost:3030/profile/market-value/", {
        description: user.description || "",
        cvData: user.cvData || null,
      })
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const maxValue = data
    ? Math.max(...ORDER.map((k) => data.distribution[k]))
    : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" />
          Your Market Value
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading && (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Estimating...
          </div>
        )}
        {!loading && data && (
          <>
            <div className="text-center pb-3">
              <div className="text-[11px] text-muted-foreground">Estimated monthly gross</div>
              <div className="text-2xl font-bold text-foreground">
                ₺{fmtTRY(data.estimate)}
              </div>
              {data.deltaVsMarketPct !== 0 && (
                <div
                  className={cn(
                    "text-[11px] inline-flex items-center gap-1 font-medium",
                    data.deltaVsMarketPct > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  <TrendingUp className="h-3 w-3" />
                  {data.deltaVsMarketPct > 0 ? "+" : ""}
                  {data.deltaVsMarketPct}% vs market average
                </div>
              )}
            </div>

            <div className="flex items-end gap-2 h-16">
              {ORDER.map((k) => {
                const v = data.distribution[k];
                const h = Math.max(10, Math.round((v / maxValue) * 100));
                const isYou = k === "you";
                return (
                  <div key={k} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full rounded-sm",
                        isYou ? "bg-primary" : "bg-primary/20",
                      )}
                      style={{ height: `${h}%` }}
                    />
                    <span
                      className={cn(
                        "text-[10px]",
                        isYou ? "text-primary font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {LABEL[k]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-center text-muted-foreground mt-3">
              {data.location} · last 90 days
            </div>
          </>
        )}
        {!loading && !data && (
          <p className="text-xs text-muted-foreground py-2">
            Upload your CV for a salary estimate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
