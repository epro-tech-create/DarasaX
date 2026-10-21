import { NextRequest, NextResponse } from "next/server";
import { getSharedMaterial, shareClient, requireSharedViewer } from "@/lib/material-sharing";
import { readUrl } from "@/lib/r2";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  await requireSharedViewer(`/share/${token}/file${request.nextUrl.searchParams.get("download") === "1" ? "?download=1" : ""}`);
  const item = await getSharedMaterial(token);
  if (!item)
    return new NextResponse("This shared file is unavailable.", {
      status: 404,
    });
  if (item.file_path.startsWith("r2:")) {
    try {
      // getSharedMaterial validates the signed-in viewer, class scope, token and publication state.
      const key = item.file_path.slice(3);
      if (key.split("/")[1] !== item.id) throw new Error("Invalid file location");
      const url = await readUrl(key, item.file_name || item.title,
        request.nextUrl.searchParams.get("download") === "1");
      const response = NextResponse.redirect(url);
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    } catch {
      return new NextResponse("File storage is temporarily unavailable.", { status: 503 });
    }
  }
  const { data, error } = await (await shareClient())
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
