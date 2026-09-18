"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { classRepUser, getIssuesForStream } from "@/data/staff-mock";
import { Flag } from "lucide-react";
import type { IssueStatus } from "@/types";

export default function ClassRepIssuesPage() {
  const initial = getIssuesForStream(classRepUser.streamId);
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const openCount = items.filter((i) => i.status !== "resolved").length;

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  );

  function setStatus(id: string, status: IssueStatus) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i)),
    );
  }

  function addIssue() {
    if (!title.trim() || !description.trim()) return;
    setItems((prev) => [
      {
        id: `iss-local-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category: "other",
        severity: "medium",
        status: "open",
        streamId: classRepUser.streamId,
        reportedBy: classRepUser.name,
        assignee: classRepUser.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTitle("");
    setDescription("");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Issues desk"
        description="Log missing materials, clashes, and class blockers for admin follow-up."
      />

      <StaffStatCard
        label="Open for your stream"
        value={String(openCount)}
        hint={classRepUser.streamId}
        icon={Flag}
        tone="warning"
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface rounded-[20px] p-4">
          <h2 className="font-heading text-[14px] font-semibold">Log new issue</h2>
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short title"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What happened / what is needed?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="button" onClick={addIssue}>
              Submit issue
            </Button>
          </div>
        </div>

        <StaffSection title="Stream queue" description={`${sorted.length} total`}>
          <div className="max-h-[520px] space-y-2.5 overflow-y-auto scrollbar-thin">
            {sorted.map((issue) => (
              <div key={issue.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold">{issue.title}</p>
                  <Badge tone={issue.status === "resolved" ? "success" : "primary"}>
                    {issue.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{issue.description}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {issue.status !== "resolved" ? (
                    <Button size="sm" onClick={() => setStatus(issue.id, "resolved")}>
                      Mark resolved
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(issue.id, "open")}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
