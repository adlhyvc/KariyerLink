"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { User } from "@/app/types";
import React from "react";
import dynamic from "next/dynamic";
import { Loader2, FileText, MapPin, Briefcase } from "lucide-react";
import Message from "./message";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import EditProfileDialog from "../[id]/edit-profile-dialog";
import { useAuthStore } from "@/app/stores/authStore";
import ProfileStats from "./profile-stats";
import { parseCvData } from "@/app/lib/user-skills";

const Follow = dynamic(() => import("./follow"), {
  ssr: false,
  loading: () => <Loader2 strokeWidth={3} className="animate-spin" />,
});

type Props = {
  user: User | undefined;
  error: any;
  id: string;
};

function deriveTitle(user: User | undefined): string | null {
  if (!user) return null;
  const cv = parseCvData(user);
  const exp = cv?.experience?.find((e) => e.title_or_company);
  if (exp?.title_or_company) return exp.title_or_company;
  return null;
}

export default function ProfileCard({ user, error, id }: Props) {
  const auth = useAuthStore((state) => state.user);
  const isOwnProfile = auth?.id === id;
  const title = deriveTitle(user);

  if (error) return <>{error?.message}</>;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-row gap-4 items-start">
          <Avatar className="h-14 w-14">
            <AvatarImage src="" alt="user profile" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {(user?.firstName?.charAt(0) || "") + (user?.lastName?.charAt(0) || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold tracking-tight text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
              {title && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {title}
                </span>
              )}
              {user?.email && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Türkiye
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Follow id={id} />
            <Message id={id} name={user?.firstName + " " + user?.lastName} />
            <EditProfileDialog user={user} id={id} />
            {isOwnProfile && (
              <Link href="/profile/cv">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Upload CV
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ProfileStats id={id} user={user} />
      </CardContent>
    </Card>
  );
}
