"use client";

import { fetcher } from "@/app/api/axiosInstance";
import { cn } from "@/app/lib/utils";
import { Room, User } from "@/app/types";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import useSWR from "swr";

type Props = {
  rooms: Room[];
  currentUserId: string;
  activeRoomId: string | null;
  onSelect: (room: Room, peer: User | undefined) => void;
};

export default function ChatList({
  rooms,
  currentUserId,
  activeRoomId,
  onSelect,
}: Props) {
  if (rooms.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-4">
        No conversations yet. Start a chat from another user&apos;s profile.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {rooms.map((room) => {
        const peerId =
          room.senderUserId === currentUserId
            ? room.receiverUserId
            : room.senderUserId;
        return (
          <ChatListItem
            key={room.id}
            room={room}
            peerId={peerId}
            isActive={room.id === activeRoomId}
            onSelect={(peer) => onSelect(room, peer)}
          />
        );
      })}
    </div>
  );
}

function initials(user: User | undefined) {
  if (!user) return "?";
  return ((user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "")) || "?";
}

function trustLevel(user: User | undefined): "verified" | "suspicious" | "neutral" {
  if (!user) return "neutral";
  const hasCv = Boolean(user.cvData);
  const hasDescription = Boolean(user.description && user.description.length > 10);
  if (hasCv || (hasDescription && (user.firstName?.length ?? 0) >= 2)) {
    return "verified";
  }
  if (!hasCv && !hasDescription) return "suspicious";
  return "neutral";
}

function ChatListItem({
  room,
  peerId,
  isActive,
  onSelect,
}: {
  room: Room;
  peerId: string;
  isActive: boolean;
  onSelect: (peer: User | undefined) => void;
}) {
  const { data: peer } = useSWR<User>(peerId ? `/users/${peerId}` : null, fetcher);
  const trust = trustLevel(peer);

  return (
    <button
      type="button"
      onClick={() => onSelect(peer)}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md text-left transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-muted",
      )}
    >
      <div className="relative">
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs uppercase">
          {initials(peer)}
        </div>
        {trust === "verified" && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <ShieldCheck className="h-2 w-2 text-white" />
          </span>
        )}
        {trust === "suspicious" && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
            <ShieldAlert className="h-2 w-2 text-white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-semibold truncate",
            trust === "suspicious" && "text-red-600",
          )}
        >
          {peer ? `${peer.firstName ?? ""} ${peer.lastName ?? ""}`.trim() : "Loading..."}
        </div>
        <div
          className={cn(
            "text-[11px] truncate",
            trust === "suspicious" ? "text-red-500" : "text-muted-foreground",
          )}
        >
          {trust === "suspicious"
            ? "Unverified profile"
            : peer?.description?.slice(0, 40) ?? "Active conversation"}
        </div>
      </div>
    </button>
  );
}
