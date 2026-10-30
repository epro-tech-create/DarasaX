type ShareAnnouncement = { id: string; title: string; body?: string; recipient?: string };

export function announcementShareText(announcement: ShareAnnouncement, sourceOrigin: string) {
  const source = new URL(sourceOrigin);
  // Staff portals use separate hosts. Links must open the student portal.
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(source.hostname);
  const origin = local ? `${source.protocol}//${source.hostname}:3005` : "https://darasax.com";
  const url = new URL("/announcements", origin);
  url.searchParams.set("announcement", announcement.id);
  return [announcement.title.trim(), announcement.recipient, announcement.body?.trim(), `DarasaX\n${url.toString()}`].filter(Boolean).join("\n\n");
}
