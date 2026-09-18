"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { announcements } from "@/data/mock";

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Announcements"
        description="Broadcast programme-wide or pin class updates for every stream."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-[20px] p-4 sm:p-5">
          <h2 className="font-heading text-[14px] font-semibold">Compose</h2>
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Headline"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details students need…"
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (title.trim() && body.trim()) setPosted(true);
                }}
              >
                Publish
              </Button>
              <Button type="button" variant="outline" onClick={() => setPosted(false)}>
                Save draft
              </Button>
            </div>
            {posted ? (
              <p className="text-[12px] font-medium text-success">Announcement queued.</p>
            ) : null}
          </div>
        </div>

        <StaffSection title="Live feed" description="What students currently see">
          <div className="max-h-[420px] space-y-2.5 overflow-y-auto scrollbar-thin">
            {announcements.slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-xl border border-border/70 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold">{a.title}</p>
                  {a.pinned ? <Badge tone="primary">Pinned</Badge> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
