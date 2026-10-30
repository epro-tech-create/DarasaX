"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useClassRegistry } from "@/lib/class-registry";
import type { MaterialUpload, StaffRole } from "@/types";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";
import { MaterialUploadCard } from "@/components/modules/material-upload-card";
import { AnnouncementReactionsProvider } from "@/lib/announcement-reactions";
import { AnnouncementReactions } from "@/components/announcements/announcement-reactions";
import { AnnouncementBody } from "@/components/announcements/announcement-body";
import { AnnouncementShareButton } from "@/components/announcements/announcement-share-button";

export function AnnouncementWorkspace({ role }: { role: StaffRole }) {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const { streams: classStreams, error: classesError } = useClassRegistry();
  const { items, publishNotice, deleteItem } = useMaterialsStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [selectedStream, setStreamId] = useState<string>("all");
  const recipientStreams = role === "lecturer" ? classStreams.filter(stream => session?.streamIds.includes(stream.id)) : classStreams;
  const canTargetAll = role !== "lecturer" || (classStreams.length > 0 && classStreams.every(stream => session?.streamIds.includes(stream.id)));
  const streamId = selectedStream === "all" && canTargetAll ? "all" : recipientStreams.some(stream => stream.id === selectedStream) ? selectedStream : recipientStreams[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [justPublished, setJustPublished] = useState<MaterialUpload | null>(null);

  function recipientLabel(item: MaterialUpload) {
    return item.streamId ? classStreams.find(stream => stream.id === item.streamId)?.label ?? item.streamId : translateUI("All streams");
  }

  const live = items.filter(
    (item) => item.kind === "announcement" && item.status === "published",
  );

  function canDelete(item: MaterialUpload) {
    if (!session) return false;
    if (session.role === "admin") return true;
    const moduleAllowed = session.role !== "lecturer" || !item.moduleId || session.moduleIds.includes(item.moduleId);
    const classAllowed = Boolean(item.streamId && (session.role === "class_rep" ? session.streamId === item.streamId : session.streamIds.includes(item.streamId)));
    return moduleAllowed && (item.uploadedById === session.id || classAllowed);
  }

  async function removeAnnouncement(item: MaterialUpload) {
    if (deletingId || !canDelete(item)) return;
    if (!window.confirm(`${translateUI("Delete announcement from all portals?")}\n\n${item.title}\n\n${translateUI("This removes it from all announcement feeds and in-app notifications, including student and staff portals.")}`)) return;
    setDeletingId(item.id);
    setDeleteError("");
    setDeleteMessage("");
    try {
      await deleteItem(item.id);
      if (justPublished?.id === item.id) setJustPublished(null);
      setDeleteMessage("Announcement deleted from all portals.");
    } catch (failure) {
      setDeleteError(failure instanceof Error ? failure.message : "Could not delete announcement. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function publish() {
    if (busy || !streamId || !title.trim() || !body.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    setJustPublished(null);
    try {
      const published = await publishNotice({
        title,
        body,
        uploadedBy: session?.name ?? "Staff",
        role,
        streamId,
      });
      setTitle("");
      setJustPublished(published);
      setBody("");
      setMessage("Announcement published. Students can see it now.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <label className="mb-4 block text-sm font-medium">{translateUI("Recipient class")}<select disabled={busy} value={streamId} onChange={(event) => setStreamId(event.target.value)} className="focus-ring ml-3 h-11 rounded-xl border border-border bg-background px-3">{canTargetAll && <option value="all">{translateUI("All streams")}</option>}{recipientStreams.map((stream) => <option key={stream.id} value={stream.id}>{translateUI(stream.label)}</option>)}</select>
      </label>
      {classesError && <p role="alert" className="text-sm text-danger">{translateUI(classesError)}</p>}
      <PageHeader
        title={translateUI("Announcements")}
        description={translateUI("Choose the recipient class. Students see the notice on Announcements and in notifications.")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-[20px] p-4 sm:p-5">
          <h2 className="font-heading text-[14px] font-semibold">{translateUI("Compose")}</h2>
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label={translateUI("Headline")}
              placeholder={translateUI("Headline")}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label={translateUI("Details students need…")}
              placeholder={translateUI("Details students need…")}
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="button" disabled={busy || !streamId || !title.trim() || !body.trim()} onClick={() => void publish()}>
              {translateUI(busy ? "Publishing…" : "Publish")}
            </Button>
            {message ? (
              <p className="text-[12px] font-medium text-success">{translateUI(message)}</p>
            ) : null}
            {error ? (
              <p className="text-[12px] font-medium text-danger">{translateUI(error)}</p>
            ) : null}
            {justPublished && <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
              <p className="text-sm font-semibold">{justPublished.title}</p>
              <AnnouncementShareButton key={justPublished.id} title={justPublished.title} body={justPublished.body} showInstructions />
            </div>}
          </div>
        </div>

        <StaffSection title={translateUI("Live feed")} description={translateUI("Published announcements students can open")}>
          {deleteMessage && <p role="status" className="mb-3 text-sm text-success">{translateUI(deleteMessage)}</p>}
          {deleteError && <p role="alert" className="mb-3 text-sm text-danger">{translateUI(deleteError)}</p>}
          <AnnouncementReactionsProvider announcementIds={live.map(item => item.id)}><div className="max-h-[420px] space-y-2.5 overflow-y-auto scrollbar-thin">
            {live.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted-foreground">
                {translateUI("No announcements published yet.")}</p>
            ) : (
              live.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/70 p-3 sm:p-4">
                  <div className="flex flex-col items-start gap-2">
                    <Badge tone="primary" className="max-w-full break-words rounded-lg">{translateUI(recipientLabel(item))}</Badge>
                    <p className="min-w-0 break-words text-[13px] font-semibold leading-5">{item.title}</p>
                  </div>
                  <AnnouncementBody body={item.body || translateUI("Published notice")} />
                  <AnnouncementReactions announcementId={item.id} />
                  <AnnouncementShareButton title={item.title} body={item.body} trailingAction={canDelete(item) ? <Button type="button" size="icon" variant="ghost" className="h-11 w-11 shrink-0 rounded-xl border border-danger/20 text-danger hover:bg-danger/10" aria-label={translateUI(deletingId === item.id ? "Deleting…" : "Delete announcement")} title={translateUI("Delete announcement")} disabled={deletingId !== null} onClick={() => void removeAnnouncement(item)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button> : null} />
                  {item.fileName && <div className="mt-2"><MaterialUploadCard item={item} /></div>}
                </div>
              ))
            )}
          </div></AnnouncementReactionsProvider>
        </StaffSection>
      </div>
    </div>
  );
}


