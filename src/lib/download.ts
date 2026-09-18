import type { PastPaper, Resource } from "@/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function getResourceDownloadContent(resource: Resource): string {
  if (resource.content?.trim()) return resource.content.trim();

  return [
    `# ${resource.title}`,
    "",
    `Type: ${resource.type}`,
    `Uploaded by: ${resource.uploader}`,
    `Size: ${resource.size}`,
    `Uploaded at: ${resource.uploadedAt}`,
    "",
    "---",
    "",
    "Study notes for this resource.",
    "Open DarasaX to review the related topic, ask DarasaX for explanations, or continue with the next lecture.",
    "",
    "## Key reminders",
    "- Skim the headings first, then dive into examples.",
    "- Write 3–5 recall questions before your next class.",
    "- Link this material to your assignment deadlines in the planner.",
  ].join("\n");
}

export function downloadResource(resource: Resource) {
  if (typeof window === "undefined") return;

  if (resource.url) {
    const anchor = document.createElement("a");
    anchor.href = resource.url;
    anchor.download = "";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  }

  const content = getResourceDownloadContent(resource);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const filename = `${slugify(resource.title) || resource.id}.md`;

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function downloadFile(url: string, filename: string) {
  if (typeof window === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadPastPaper(paper: PastPaper) {
  downloadFile(paper.fileUrl, `${slugify(paper.title) || paper.id}.pdf`);
}

export function viewPastPaper(paper: PastPaper) {
  if (typeof window === "undefined") return;
  window.open(paper.fileUrl, "_blank", "noopener,noreferrer");
}
