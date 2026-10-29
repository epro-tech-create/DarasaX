export function AnnouncementBody({ body }: { body: string }) {
  const paragraphs = body.replace(/\r\n?/g, "\n").trim().split(/\n[\t ]*\n+/).map(text => text.trim()).filter(Boolean);
  return <div className="mt-2 space-y-2 text-sm leading-5 text-muted-foreground">
    {paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line break-words">{paragraph}</p>)}
  </div>;
}
