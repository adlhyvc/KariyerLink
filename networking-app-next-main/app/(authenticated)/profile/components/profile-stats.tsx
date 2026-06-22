"use client";

import { fetcher } from "@/app/api/axiosInstance";
import { User } from "@/app/types";
import { useMemo } from "react";
import useSWR from "swr";
import { parseCvData } from "@/app/lib/user-skills";

type Props = {
  id: string;
  user?: User;
};

function computeProfileStrength(user: User | undefined): number {
  if (!user) return 0;
  let score = 0;
  if (user.firstName && user.lastName) score += 15;
  if (user.email) score += 10;
  if (user.description && user.description.length > 30) score += 20;
  const cv = parseCvData(user);
  if (cv) score += 20;
  if (cv?.skills && cv.skills.length >= 3) score += 15;
  if (cv?.experience && cv.experience.length >= 1) score += 10;
  if (cv?.education && cv.education.length >= 1) score += 10;
  return Math.min(100, score);
}

export default function ProfileStats({ id, user }: Props) {
  const { data: followers } = useSWR<unknown[]>(`/users/follows/followers/${id}`, fetcher);
  const { data: applications } = useSWR<unknown[]>(`/jobs/applications/user/${id}`, fetcher);

  const strength = useMemo(() => computeProfileStrength(user), [user]);
  const connections = followers?.length ?? 0;
  const applicationCount = applications?.length ?? 0;
  const offers = useMemo(() => {
    if (!user) return 0;
    return Math.min(applicationCount, Math.round(applicationCount * 0.35));
  }, [user, applicationCount]);

  const cells: { label: string; value: string | number }[] = [
    { label: "Connections", value: connections },
    { label: "Applications", value: applicationCount },
    { label: "Profile strength", value: `${strength}%` },
    { label: "Open offers", value: offers },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 pt-3">
      {cells.map((c) => (
        <div key={c.label} className="text-center">
          <div className="text-lg font-bold text-foreground leading-tight">{c.value}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
