import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const FINISH_DELAY_MS = 3000;

export default function AsAttendanceFormModal({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const [showFinish, setShowFinish] = useState(false);

  useEffect(() => {
    setShowFinish(false);
    const timeout = window.setTimeout(() => setShowFinish(true), FINISH_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [src]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative z-10 flex h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white p-4 shadow-xl">
        <h2 className="font-DM shrink-0 text-2xl font-bold text-navy">AS attendance form</h2>
        <p className="mt-1 shrink-0 text-sm text-gray-600">
          Please complete this form to finish check-in.
        </p>
        <iframe
          src={src}
          title="AS attendance form"
          className="mt-3 min-h-[70vh] w-full flex-1 rounded-lg border border-gray-200"
        />
        <div className="mt-3 flex min-h-11 shrink-0 flex-wrap items-center justify-end gap-2">
          {showFinish && (
            <>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy"
              >
                Open in new tab
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-blue px-5 py-2 text-sm font-semibold text-white"
              >
                Finish
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
