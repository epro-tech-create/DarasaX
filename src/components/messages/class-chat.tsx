"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, MessageCircle, Send, Trash2 } from "lucide-react";
import { useMessageCounts } from "@/components/messages/messages-provider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { useChatTyping } from "@/hooks/use-chat-typing";
import { TypingIndicator } from "@/components/messages/typing-indicator";

type Message = Database["public"]["Tables"]["class_messages"]["Row"];
type RoomState = { room: string; items: Message[]; ready: boolean; error: string };
export function ClassChat({ participant }: { participant: { id: string; className: string | null; home: string } }) {
  const unread = useMessageCounts();
  const [all, setAll] = useState(!participant.className);
  const room = all ? "__all__" : participant.className || "";
  const userId = participant.id;
  const { typingCount, updateTyping, stopTyping } = useChatTyping(room, userId);
  const [state, setState] = useState<RoomState>({ room: "", items: [], ready: false, error: "" });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [limit, setLimit] = useState(60);
  const request = useRef(0);
  const readMarkers = useRef<Record<string, string>>({});
  const busy = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const items = state.room === room ? state.items : [];
  const ready = state.room === room && state.ready;
  const error = state.room === room ? state.error : "";
  const refresh = useCallback(async () => {
    if (!room || !userId) return;
    const generation = ++request.current;
    const client = createClient();
    const { data, error } = await client.from("class_messages").select("*").eq("room_id", room).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
    if (generation !== request.current) return;
    if (error) { setState(previous => ({ room, items: previous.room === room ? previous.items : [], ready: true, error: "Messages could not be loaded. Please try again." })); return; }
    const messages = (data || []).reverse();
    setState({ room, items: messages, ready: true, error: "" });
    const latest = messages.at(-1);
    if (latest && document.visibilityState === "visible" && readMarkers.current[room] !== latest.id) {
      const { error: readError } = await client.from("class_message_reads").upsert({ room_id: room, user_id: userId, read_at: latest.created_at }, { onConflict: "user_id,room_id" });
      if (generation !== request.current) return;
      if (!readError) {
        readMarkers.current[room] = latest.id;
        window.dispatchEvent(new Event("darasax:chat"));
      }
    }
  }, [room, userId, limit]);
  useEffect(() => {
    const load = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh(); const poll = setInterval(load, 30000); window.addEventListener("focus", load);
    return () => { request.current++; clearInterval(poll); window.removeEventListener("focus", load); };
  }, [refresh]);
  const latestId = items.at(-1)?.id;
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [latestId, room]);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy.current || !draft.trim() || !room || !userId) return;
    busy.current = true; setSending(true); setActionError("");
    stopTyping();
    const text = draft.trim(); const sentRoom = room;
    try {
      const { error } = await createClient().from("class_messages").insert({ room_id: sentRoom, author_id: userId, body: text });
      if (error) { setActionError(error.message); return; }
      setDraft(""); await refresh(); window.dispatchEvent(new Event("darasax:chat"));
    } catch { setActionError("Message could not be sent. Please try again."); }
    finally { busy.current = false; setSending(false); }
  }
  async function remove(message: Message) {
    if (deleting || message.author_id !== userId) return;
    setDeleting(message.id); setActionError("");
    try {
      const { error, data } = await createClient().from("class_messages").delete().eq("id", message.id).eq("author_id", userId).select("id");
      if (error || !data?.length) { setActionError("Message could not be removed. Please refresh and try again."); return; }
      await refresh(); window.dispatchEvent(new Event("darasax:chat"));
    } catch { setActionError("Message could not be removed. Please try again."); }
    finally { setDeleting(null); }
  }
  return <div className="space-y-5"><Link href={participant.home} className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-primary"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link>
    <section className="surface overflow-hidden rounded-[20px]"><div className={`grid ${participant.className ? "grid-cols-2" : "grid-cols-1"} border-b border-border`} role="tablist" aria-label="Chat rooms">{[{ all: false, id: participant.className || "", name: "My Class" }, { all: true, id: "__all__", name: "All Classes" }].filter(r => r.all || Boolean(participant.className)).map(r => <button role="tab" key={r.name} aria-selected={all === r.all} disabled={sending} onClick={() => { setAll(r.all); setDraft(""); setActionError(""); setLimit(60); }} className={`focus-ring flex min-h-12 items-center justify-center gap-2 px-3 py-3 text-sm font-medium ${all === r.all ? "border-b-2 border-primary bg-primary/5 text-primary" : "text-muted-foreground"}`}>{r.name}{(unread?.counts[r.id] || 0) > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{unread?.counts[r.id]}</span>}</button>)}</div>
      <div className="border-b border-border px-4 py-3 sm:px-5"><h2 className="font-heading text-sm font-semibold">{all ? "All Classes" : participant.className}</h2><p className="mt-1 text-xs text-muted-foreground">Official updates stay in Announcements. Keep conversations respectful.</p></div>
      {error && <p role="alert" className="px-4 py-3 text-sm text-danger">{error}<button className="ml-3 underline" onClick={() => void refresh()}>Retry</button></p>}
      <div role="log" aria-label="Conversation" aria-live="polite" className="h-[48dvh] min-h-64 space-y-4 overflow-y-auto bg-background/40 p-4 sm:p-5">{!ready ? <p role="status" className="text-sm text-muted-foreground">Loading messages…</p> : !items.length && !error ? <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground"><MessageCircle className="mb-3 h-8 w-8 text-primary" /><p className="text-sm font-medium">Start the conversation</p><p className="mt-1 text-xs">No messages yet. Say hello to your classmates.</p></div> : <>{items.length === limit && limit < 600 && <button className="block w-full text-center text-xs text-primary" onClick={() => setLimit(value => value + 60)}>Load earlier messages</button>}{items.map(m => <div key={m.id} className={`flex ${m.author_id === userId ? "justify-end" : "justify-start"}`}><article className={`max-w-[88%] rounded-2xl px-3.5 py-3 sm:max-w-[75%] ${m.author_id === userId ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-border bg-card"}`}><div className="flex flex-wrap items-center gap-3 text-[11px]"><span className="font-semibold">{m.author_id === userId ? "You" : m.author_name}</span><time dateTime={m.created_at} className="opacity-70">{new Date(m.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dar_es_Salaam" })}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.body}</p>{m.author_id === userId && <button disabled={!!deleting} onClick={() => void remove(m)} aria-label="Delete your message" className="focus-ring mt-2 inline-flex items-center gap-1 text-[11px] opacity-80 hover:opacity-100"><Trash2 className="h-3 w-3" />{deleting === m.id ? "Deleting…" : "Delete"}</button>}</article></div>)}</>}<div ref={end} /></div>
      <TypingIndicator count={typingCount} />
      <form onSubmit={send} className="border-t border-border p-3 sm:p-4">{actionError && <p role="alert" className="mb-3 text-sm text-danger">{actionError}</p>}<div className="flex items-end gap-2"><textarea aria-label="Write a message" placeholder={`Message ${all ? "all classes" : "your class"}…`} rows={2} maxLength={2000} disabled={sending || !room} value={draft} onBlur={stopTyping} onChange={e => { setDraft(e.target.value); updateTyping(e.target.value); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} className="focus-ring min-w-0 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><Button aria-label="Send message" disabled={sending || !draft.trim() || !ready || !!error}><Send className="h-4 w-4" /><span className="hidden sm:inline">{sending ? "Sending…" : "Send"}</span></Button></div></form>
    </section>
  </div>;
}
