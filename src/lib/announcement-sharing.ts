type ShareAnnouncement = { title: string; body?: string };

export function announcementShareText(announcement: ShareAnnouncement) {
  return [announcement.title.trim(), announcement.body?.trim()].filter(Boolean).join("\n\n");
}
