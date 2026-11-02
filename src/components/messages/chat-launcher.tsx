"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useMessageCounts } from "@/components/messages/messages-provider";

export function ChatLauncher({ href = "/messages", onOpen }: { href?: string; onOpen?: () => void }) {
  const messages = useMessageCounts();
  const unread = Object.values(messages?.counts || {}).reduce((total, count) => total + count, 0);
  return <Link href={href} onClick={onOpen ? e => { e.preventDefault(); onOpen(); } : undefined} aria-label={`Open messages${unread ? `, ${unread} unread` : ""}`} className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:bottom-7">
    <MessageCircle size={25} />
    {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full border-2 border-background bg-red-500 px-1.5 text-xs font-bold">{unread > 99 ? "99+" : unread}</span>}
  </Link>;
}
