import { useMemo, useState } from "react";
import { EventSlot } from "@lib/constants";
import { DateParser } from "@lib/utils";
import { getSlotQrAction, isSlotFull } from "@lib/slotTime";
import type { QrFlowState } from "@lib/resolveQrEventAction";

function slotStatusLabel(slot: EventSlot, now: Date): string {
  const action = getSlotQrAction(slot, now);
  if (action === "ended") return "Ended";
  if (action === "checkin") return "Check in open";
  if (isSlotFull(slot)) return "Full";
  return "RSVP open";
}

export default function QrSlotPickerModal({
  open,
  eventTitle,
  slots,
  flowState: _flowState,
  initialSlotId,
  onConfirm,
  onClose,
}: {
  open: boolean;
  eventTitle: string;
  slots: EventSlot[];
  flowState: QrFlowState | null;
  initialSlotId?: string;
  onConfirm: (slotId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId ?? "");
  const [submitting, setSubmitting] = useState(false);

  const now = useMemo(() => new Date(), [open]);

  const activeSlotId = selectedSlotId || initialSlotId || slots[0]?.id || "";
  const activeSlot = slots.find((slot) => slot.id === activeSlotId);
  const activeAction = activeSlot ? getSlotQrAction(activeSlot, now) : "ended";

  if (!open) return null;

  const submitLabel = activeAction === "checkin" ? "Check in" : "RSVP";

  const handleSubmit = async () => {
    if (!activeSlotId) return;
    setSubmitting(true);
    try {
      await onConfirm(activeSlotId);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    !activeSlotId ||
    submitting ||
    activeAction === "ended" ||
    (activeSlot != null && isSlotFull(activeSlot) && activeSlot.id !== initialSlotId);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="font-DM text-xl font-bold text-navy">Choose a time slot</h2>
        <p className="mt-1 text-sm text-gray-600">{eventTitle}</p>

        <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {slots.map((slot) => {
            const full = isSlotFull(slot);
            const isSelected = slot.id === activeSlotId;
            const isCurrentRsvp = slot.id === initialSlotId;
            const action = getSlotQrAction(slot, now);
            const disabled = action === "ended" || (full && !isCurrentRsvp);

            return (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${
                  isSelected ? "border-blue bg-blue/10" : "border-gray-200"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="qr-slot"
                  className="mt-1"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => setSelectedSlotId(slot.id)}
                />
                <span>
                  <span className="block font-medium">
                    {DateParser(slot.starts_at)} – {DateParser(slot.ends_at)}
                  </span>
                  <span className="text-xs text-gray-600">
                    {slotStatusLabel(slot, now)}
                    {slot.capacity != null
                      ? ` · ${slot.rsvp_count}/${slot.capacity} spots`
                      : ` · ${slot.rsvp_count} RSVPs`}
                    {isCurrentRsvp ? " · Your slot" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={handleSubmit}
            className="rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Please wait…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
