"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Briefcase,
  Home,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Button } from "../ui/button";
import { TooltipProvider } from "../ui/tooltip";
import DarkModeToggle from "./theme-toggle";
import NavItem, { NavItemType } from "./nav-item";

import { useAuthStore } from "@/app/stores/authStore";
import LangChange from "./lang-change";
import { useTranslation } from "react-i18next";
import { fetcher } from "@/app/api/axiosInstance";
import { Room, User } from "@/app/types";
import useSWR from "swr";
import { parseCvData } from "@/app/lib/user-skills";

const Profile = dynamic(() => import("./profile"), {
  ssr: false,
  loading: () => <Loader2 strokeWidth={3} className="animate-spin" />,
});

type Props = {
  theme: string;
};

export default function Navbar({ theme }: Props) {
  const { t } = useTranslation();
  const auth = useAuthStore((s) => s.user);
  const { data: currentUser } = useSWR<User>(
    auth.id ? `/users/${auth.id}` : null,
    fetcher,
  );
  const { data: rooms } = useSWR<Room[]>(
    auth.id ? `/messages/rooms/user/${auth.id}` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  const hasRooms = (rooms?.length ?? 0) > 0;
  const profileEmpty = useMemo(() => {
    if (!currentUser) return false;
    const hasCv = Boolean(parseCvData(currentUser));
    const hasDesc = Boolean(
      currentUser.description && currentUser.description.length > 10,
    );
    return !hasCv && !hasDesc;
  }, [currentUser]);

  const links = useMemo<NavItemType[]>(() => {
    const base: NavItemType[] = [
      { Icon: Home, title: t("links.home"), href: "/" },
      { Icon: Briefcase, title: t("links.jobs"), href: "/jobs" },
      {
        Icon: Search,
        title: t("links.jobRecommendations"),
        href: "/jobs/recommendations",
      },
      {
        Icon: MessageSquare,
        title: "Messages",
        href: "/messages",
        dot: hasRooms,
      },
    ];
    if (profileEmpty) {
      base.push({
        Icon: Sparkles,
        title: "AI Setup",
        href: "/onboarding",
      });
    }
    return base;
  }, [t, hasRooms, profileEmpty]);

  return (
    <TooltipProvider delayDuration={0}>
      <header
        className="flex flex-row fixed bg-background z-50 shadow-lg top-0 w-full
     h-20 items-center justify-around gap-2 px-20"
      >
        <Button variant={"ghost"} size={"icon"}>
          <Waypoints size={32} strokeWidth={2} absoluteStrokeWidth />
        </Button>
        <div className="flex flex-row items-center justify-center gap-2">
          {links.map((link, i) => (
            <NavItem
              key={i}
              Icon={link.Icon}
              href={link.href}
              title={link.title}
              dot={link.dot}
            />
          ))}
          <Profile />
        </div>
        <div className="flex flex-row gap-2 items-center">
          <DarkModeToggle theme={theme} />
          <LangChange />
        </div>
      </header>
    </TooltipProvider>
  );
}
