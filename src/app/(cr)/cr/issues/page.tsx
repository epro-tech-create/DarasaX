"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { useIssuesStore } from "@/lib/issues-store";
import { useStaffSession } from "@/lib/staff-auth";
import { Flag } from "lucide-react";

export default function ClassRepIssuesPage() {
  const { session } = useStaffSession();
  const { forStream, addIssue, setStatus } = useIssuesStore();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const items = forStream(streamId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openCount = items.filter((i) => i.status !== "resolved").length;

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  );

  async function onSetStatus(id: string, status: "open" | "resolved") {
    setError("");
    try {
      await setStatus(id, status);
    } catch {
      setError("Could not update the issue. Try again.");
    }
  }

  async function onAddIssue() {
    if (!title.trim() || !description.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await addIssue({
        title: title.trim(),
        description: description.trim(),
        category: "other",
        severity: "medium",
        streamId,
        reportedBy: session?.name ?? "Class Rep",
        assignee: session?.name,
      });
      setTitle("");
      setDescription("");
    } catch {
      setError("Could not submit the issue. Try again.");
    } finally {
      setSaving(false);
    }
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
        hint={streamId}
        icon={Flag}
        tone="warning"
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface rounded-[20px] p-4">
          <h2 className="font-heading text-[14px] font-semibold">Log new issue</h2>
          <div className="mt-3 space-y-3">
            {error ? <p className="text-[12px] font-medium text-danger">{error}</p> : null}
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
            <Button type="button" onClick={onAddIssue} disabled={saving}>
              {saving ? "Submitting..." : "Submit issue"}
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
                    <Button size="sm" onClick={() => onSetStatus(issue.id, "resolved")}>
                      Mark resolved
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSetStatus(issue.id, "open")}
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
