import type { NotificationType } from "@/types";

/** Separate legacy timetable metadata without splitting punctuation in the author's message. */
export function NotificationBody({ body, type }: { body: string; type: NotificationType }) {
  const parts = type === "timetable" ? body.split(" · ") : [];
  if (parts.length < 3) {
    return <span className="mt-2 block whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{body}</span>;
  }

  const [moduleName, date, status, ...message] = parts;
  return (
    <span className="mt-2 block space-y-3 break-words text-sm leading-6">
      <span className="block space-y-1 rounded-lg bg-muted/50 px-3 py-2">
        <span className="block font-medium text-foreground">{moduleName}</span>
        <span className="block text-xs text-muted-foreground">{date}</span>
        <span className="block text-muted-foreground">{status}</span>
      </span>
      {message.length > 0 && <span className="block whitespace-pre-wrap leading-7 text-muted-foreground">{message.join(" · ")}</span>}
    </span>
  );
}
