"use client";

import { fetcher } from "@/app/api/axiosInstance";
import { Message, Room } from "@/app/types";
import { Client } from "@stomp/stompjs";
import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import useSWR from "swr";

export function useChatRooms(userId: string | undefined) {
  return useSWR<Room[]>(userId ? `/messages/rooms/user/${userId}` : null, fetcher, {
    refreshInterval: 15_000,
  });
}

export function useChatMessages(roomId: string | null | undefined) {
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Message[]>(roomId ? `/messages/${roomId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  const [live, setLive] = useState<Message[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    setLive([]);
    if (!roomId) return;
    const socket = new SockJS("http://localhost:8100/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/messages/${roomId}`, (message) => {
        const parsed: Message = JSON.parse(message.body);
        setLive((prev) => [...prev, parsed]);
      });
    };

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
      clientRef.current = null;
    };
  }, [roomId]);

  const messages = useMemo<Message[]>(() => {
    const base = (history || []).slice().reverse();
    return [...base, ...live];
  }, [history, live]);

  const send = (senderId: string, text: string) => {
    if (!roomId || !clientRef.current?.connected) return false;
    if (!text.trim()) return false;
    clientRef.current.publish({
      destination: `/app/message/${roomId}`,
      body: JSON.stringify({ senderId, message: text }),
    });
    return true;
  };

  return { messages, isLoading, mutate, send };
}
