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
    return downloadFile(
      resource.url,
      `${slugify(resource.title) || resource.id}${resource.type === "pdf" ? ".pdf" : ""}`,
    );
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

export async function downloadFile(
  url: string,
  filename: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename || "download";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return true;
  } catch {
    window.alert(
      "Could not download this file. Check your connection or ask the uploader to check the attachment.",
    );
    return false;
  }
}

export function downloadPastPaper(paper: PastPaper) {
  return downloadFile(paper.fileUrl, `${slugify(paper.title) || paper.id}.pdf`);
}

export function viewPastPaper(paper: PastPaper) {
  if (typeof window === "undefined") return;
  window.open(paper.fileUrl, "_blank", "noopener,noreferrer");
}
