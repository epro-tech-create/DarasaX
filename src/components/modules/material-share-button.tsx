"use client";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { createClient } from "@/lib/supabase/client";
export function MaterialShareButton({
  materialId,
  title,
  token,
  compact = false,
}: {
  materialId?: string;
  title: string;
  token?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const qr = useRef<SVGSVGElement>(null);
  const input = useRef<HTMLInputElement>(null);
  async function prepare() {
    setOpen(true);
    setMessage("");
    if (url || busy) return;
    setBusy(true);
    try {
      let shareToken = token;
      if (!shareToken && materialId) {
        const { data, error } = await createClient().rpc(
          "create_material_share",
          { mid: materialId },
        );
        if (error || !data) throw error;
        shareToken = data;
      }
      if (!shareToken) throw Error("Missing share");
      const local =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const origin = local
        ? window.location.origin
        : "https://darasax.eprotechtz.com";
      setUrl(`${origin}/share/${shareToken}`);
    } catch {
      setMessage(
        "This material cannot be shared right now. It must be published and have an attached file.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      input.current?.focus();
      input.current?.select();
      setMessage("Select and copy the link above.");
    }
  }
  async function nativeShare() {
    try {
      if (navigator.share)
        await navigator.share({
          title,
          text: `${title} — shared on DarasaX`,
          url,
        });
      else await copy();
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setMessage("Could not open sharing. Use Copy link instead.");
    }
  }
  function downloadQR() {
    if (!qr.current) return;
    const svg = new XMLSerializer().serializeToString(qr.current);
    const objectUrl = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" }),
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "darasax-share-qr.svg";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
  return (
    <>
      <Button
        size={compact ? "icon" : "sm"}
        type="button"
        variant={compact ? "ghost" : "outline"}
        aria-label={`Share ${title}`}
        onClick={() => void prepare()}
      >
        <Share2 className="h-4 w-4" />
        {!compact && "Share"}
      </Button>
      <StaffModal
        open={open}
        onClose={() => setOpen(false)}
        title="Share material"
        description="Anyone with this link or QR code can view and download this file without signing in."
      >
        <p className="mb-4 text-sm font-medium">{title}</p>
        {busy ? (
          <p
            role="status"
            className="py-8 text-center text-sm text-muted-foreground"
          >
            Creating share link…
          </p>
        ) : url ? (
          <div className="space-y-4">
            <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-3">
              <QRCodeSVG
                ref={qr}
                value={url}
                size={208}
                level="M"
                marginSize={4}
                title={`Scan to open ${title}`}
              />
            </div>
            <label className="block text-xs text-muted-foreground">
              Share link
              <input
                ref={input}
                value={url}
                readOnly
                onFocus={(e) => e.target.select()}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => void copy()}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void nativeShare()}
              >
                <Share2 className="h-4 w-4" />
                Send
              </Button>
              <Button size="sm" variant="outline" onClick={downloadQR}>
                <Download className="h-4 w-4" />
                Save QR
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => void prepare()}>
            Try again
          </Button>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </StaffModal>
    </>
  );
}
