"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { announcements } from "@/data/mock";
import { classRepUser } from "@/data/staff-mock";

export default function ClassRepAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class announcements"
        description={`Posts target ${classRepUser.streamId} only — not the whole programme.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-[20px] p-4 sm:p-5">
          <h2 className="font-heading text-[14px] font-semibold">Write to class</h2>
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab moved to Lab 05"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="What should classmates know?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="button"
              onClick={() => {
                if (title.trim() && body.trim()) setSent(true);
              }}
            >
              Post to stream
            </Button>
            {sent ? (
              <p className="text-[12px] font-medium text-success">Sent to class feed.</p>
            ) : null}
          </div>
        </div>

        <StaffSection title="Recent programme posts" description="For context">
          <div className="max-h-[360px] space-y-2 overflow-y-auto scrollbar-thin">
            {announcements
              .filter((a) => a.category === "class" || a.category === "general")
              .slice(0, 5)
              .map((a) => (
                <div key={a.id} className="rounded-xl border border-border/70 px-3 py-2.5">
                  <p className="text-[12px] font-semibold">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{a.body}</p>
                </div>
              ))}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
