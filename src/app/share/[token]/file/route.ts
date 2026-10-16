import { NextRequest, NextResponse } from "next/server";
import { getSharedMaterial, shareClient } from "@/lib/material-sharing";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const item = await getSharedMaterial(token);
  if (!item)
    return new NextResponse("This shared file is unavailable.", {
      status: 404,
    });
  const { data, error } = await shareClient(token)
    .storage.from("materials")
    .createSignedUrl(
      item.file_path,
      60,
      request.nextUrl.searchParams.get("download") === "1"
        ? { download: item.file_name || item.title }
        : undefined,
    );
  if (error || !data)
    return new NextResponse(
      "This shared file is unavailable. Please try again later.",
      { status: 404 },
    );
  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
