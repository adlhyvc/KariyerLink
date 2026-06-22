"use client";

import AiBox from "@/app/components/match/AiBox";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";
import { formatRelativeTime } from "@/app/lib/relative-time";
import { useChatMessages } from "@/app/hooks/useChat";
import { Room, User } from "@/app/types";
import axios from "axios";
import {
  CheckCheck,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  room: Room | null;
  peer: User | undefined;
  currentUserId: string;
};

export default function ChatWindow({ room, peer, currentUserId }: Props) {
  const { messages, isLoading, send } = useChatMessages(room?.id);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (!room) return;
    const last = messages.slice(-3).map((m) => m.message);
    if (last.length === 0) {
      setSuggestions([]);
      return;
    }
    axios
      .post("http://localhost:3030/chat/suggest-replies/", { lastMessages: last })
      .then((res) => {
        setSuggestions(res.data?.suggestions ?? []);
      })
      .catch(() => setSuggestions([]));
  }, [room, messages.length]);

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mb-3 text-primary/30" />
        <h3 className="text-lg font-semibold text-foreground">Select a conversation</h3>
        <p className="text-sm max-w-sm mt-1">
          Pick a contact on the left to read and reply to messages.
        </p>
      </div>
    );
  }

  const handleSend = () => {
    if (send(currentUserId, draft)) setDraft("");
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm uppercase">
            {(peer?.firstName?.charAt(0) || "") + (peer?.lastName?.charAt(0) || "")}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <ShieldCheck className="h-2 w-2 text-white" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {peer ? `${peer.firstName ?? ""} ${peer.lastName ?? ""}`.trim() : "Conversation"}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Verified profile
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-background">
        {isLoading && (
          <div className="flex justify-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.senderId === currentUserId;
          return (
            <div
              key={m.id || `${i}-${m.senderId}-${m.createdAt ?? ""}`}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div className={cn("max-w-[70%]", isMe ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                  )}
                >
                  {m.message}
                </div>
                <div
                  className={cn(
                    "text-[10px] mt-1 flex items-center gap-1",
                    isMe ? "justify-end text-muted-foreground" : "justify-start text-muted-foreground",
                  )}
                >
                  {m.createdAt && <span>{formatRelativeTime(m.createdAt)}</span>}
                  {isMe && <CheckCheck className="h-3 w-3 text-primary" />}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-xs text-muted-foreground py-8">
            Send the first message to start this conversation.
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="border-t border-border px-3 py-2 flex items-center gap-2 overflow-x-auto bg-card">
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 shrink-0">
            <Sparkles className="h-3 w-3" />
            AI suggestions
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setDraft(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-primary/5 border border-primary/15 text-primary hover:bg-primary/10 whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border px-3 py-2 flex items-center gap-2 bg-card">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message..."
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ChatTrustHint({ peer }: { peer: User | undefined }) {
  if (!peer) return null;
  return (
    <AiBox compact>
      AI screens this contact against signs of a fake recruiter profile (no CV, no description,
      empty network).
    </AiBox>
  );
}
