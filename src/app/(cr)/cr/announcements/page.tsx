"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";

export default function ClassRepAnnouncementsPage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const { items, publishNotice } = useMaterialsStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const live = items.filter(
    (item) =>
      item.kind === "announcement" &&
      item.status === "published" &&
      (!item.streamId || item.streamId === streamId),
  );

  async function publish() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await publishNotice({
        title,
        body,
        uploadedBy: session?.name ?? "Class Rep",
        role: "class_rep",
        streamId,
      });
      setTitle("");
      setBody("");
      setMessage(`Published for ${streamId}. Students in that stream can see it.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish. Run the latest Supabase migration, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Class announcements")}
        description={translateUI(`Posts target ${streamId} only — not the whole programme.`)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-[20px] p-4 sm:p-5">
          <h2 className="font-heading text-[14px] font-semibold">{translateUI("Write to class")}</h2>
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={translateUI("e.g. Lab moved to Lab 05")}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder={translateUI("What should classmates know?")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="button" disabled={busy} onClick={() => void publish()}>
              {translateUI(busy ? "Publishing…" : "Post to stream")}
            </Button>
            {message ? (
              <p className="text-[12px] font-medium text-success">{translateUI(message)}</p>
            ) : null}
            {error ? (
              <p className="text-[12px] font-medium text-danger">{translateUI(error)}</p>
            ) : null}
          </div>
        </div>

        <StaffSection title={translateUI("Posted for this class")} description={translateUI("Live student feed")}>
          <div className="max-h-[360px] space-y-2 overflow-y-auto scrollbar-thin">
            {live.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted-foreground">
                {translateUI("Nothing posted for this stream yet.")}</p>
            ) : (
              live.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/70 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-semibold">{item.title}</p>
                    <Badge>{item.uploadedBy}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
