"use client";

import { Card } from "@/app/components/ui/card";
import { useChatRooms } from "@/app/hooks/useChat";
import { useAuthStore } from "@/app/stores/authStore";
import { Room, User } from "@/app/types";
import { Loader2, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import ChatList from "./components/chat-list";
import ChatWindow from "./components/chat-window";

export default function MessagesPage() {
  const auth = useAuthStore((s) => s.user);
  const { data: rooms, isLoading } = useChatRooms(auth?.id || "");
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activePeer, setActivePeer] = useState<User | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSelect = (room: Room, peer: User | undefined) => {
    setActiveRoom(room);
    setActivePeer(peer);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen pt-20 px-8 lg:px-24 pb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-4">Messages</h1>
      <Card className="flex-1 overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] h-full">
          <aside className="border-r border-border flex flex-col">
            <div className="px-3 py-3 border-b border-border">
              <div className="text-[11px] uppercase tracking-wide text-primary font-bold">
                Conversations
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {isLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && rooms && (
                <>
                  <SafetyBanner hasRooms={rooms.length > 0} />
                  <ChatList
                    rooms={rooms}
                    currentUserId={auth.id}
                    activeRoomId={activeRoom?.id ?? null}
                    onSelect={handleSelect}
                  />
                </>
              )}
            </div>
          </aside>
          <ChatWindow room={activeRoom} peer={activePeer} currentUserId={auth.id} />
        </div>
      </Card>
    </div>
  );
}

function SafetyBanner({ hasRooms }: { hasRooms: boolean }) {
  if (!hasRooms) return null;
  return (
    <div className="mb-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2">
      <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
      <div className="text-[11px] text-red-700 dark:text-red-300">
        Watch for unverified contacts. KariyerLink flags suspicious profiles automatically.
      </div>
    </div>
  );
}
