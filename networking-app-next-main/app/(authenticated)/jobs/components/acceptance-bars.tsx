"use client";

import SkillTrack from "@/app/components/match/SkillTrack";

export type AcceptanceData = {
  technicalFit: number;
  experienceFit: number;
  cultureFit: number;
  overall: number;
};

type Props = {
  data: AcceptanceData;
};

export default function AcceptanceBars({ data }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Acceptance probability
      </div>
      <SkillTrack label="Technical fit" value={data.technicalFit} />
      <SkillTrack label="Experience fit" value={data.experienceFit} />
      <SkillTrack label="Culture fit" value={data.cultureFit} />
      <div className="pt-2">
        <SkillTrack
          label={<span className="font-semibold">Overall acceptance</span>}
          value={data.overall}
          tone="success"
          hint={<span className="font-semibold">{data.overall}%</span>}
        />
      </div>
    </div>
  );
}
