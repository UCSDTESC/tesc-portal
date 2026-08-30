import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildEventQrUrl } from "@lib/eventLinks";
import DisplayToast from "@lib/hooks/useToast";

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="font-DM text-2xl font-bold text-navy">Event QR Code</h2>
        <p className="mt-1 text-sm text-gray-600">{eventTitle}</p>
        <p className="mt-2 text-xs text-gray-500">
          Attendees scan this code to pick a time slot and register or check in.
        </p>

        <div ref={qrRef} className="mt-4 flex justify-center rounded-lg border border-gray-200 bg-white p-4">
          <QRCodeSVG value={url} size={220} level="M" includeMargin />
        </div>

        <p className="mt-3 break-all rounded-md bg-gray-100 p-2 text-xs text-gray-700">{url}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-lg border border-navy px-3 py-2 text-sm font-semibold text-navy"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={downloadQr}
            className="flex-1 rounded-lg border border-navy px-3 py-2 text-sm font-semibold text-navy"
          >
            Download QR
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-blue py-2 text-sm font-semibold text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
