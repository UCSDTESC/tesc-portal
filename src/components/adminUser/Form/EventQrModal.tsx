import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildEventQrUrl } from "@lib/eventLinks";
import DisplayToast from "@lib/hooks/useToast";
import { Copy, Download, QrCode, X } from "lucide-react";

export default function EventQrModal({
  eventId,
  eventTitle,
  attendanceToken,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  attendanceToken: string;
  onClose: () => void;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const url = buildEventQrUrl(eventId, attendanceToken);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      DisplayToast("Link copied to clipboard", "success");
    } catch {
      DisplayToast("Could not copy link", "error");
    }
  };

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobUrl);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `event-${eventId}-qr.png`;
      link.click();
    };
    img.src = blobUrl;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} aria-hidden="true" />
      <div className="card-shadow relative z-10 w-full max-w-md rounded-2xl border border-line bg-white p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-secondary transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <QrCode className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-ink">Event QR Code</h2>
            <p className="truncate text-sm text-ink-secondary">{eventTitle}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          Attendees scan this code to pick a time slot and register or check in.
        </p>

        <div
          ref={qrRef}
          className="mt-4 flex justify-center rounded-2xl border border-line bg-white p-4"
        >
          <QRCodeSVG value={url} size={220} level="M" includeMargin />
        </div>

        <p className="mt-3 break-all rounded-xl bg-surface p-3 text-xs text-ink-secondary">
          {url}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>
          <button
            type="button"
            onClick={downloadQr}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full cursor-pointer rounded-xl bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}
