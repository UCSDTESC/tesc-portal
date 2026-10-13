import { useEffect, useMemo, useState } from "react";
import { EventQuestion, EventSlot } from "@lib/constants";
import { DateParser } from "@lib/utils";
import { getSlotQrAction, isSlotFull, isSlotRsvpLocked, seatsTaken } from "@lib/slotTime";
import type { QrFlowState } from "@lib/resolveQrEventAction";
import {
  type EventQuestionAnswers,
  hasUnansweredRequired,
} from "@lib/eventQuestions";
import { fetchMyEventQuestionAnswers } from "@services/eventQuestions";
import { RegistrationQuestionFields } from "./RegistrationQuestionsModal";

function slotStatusLabel(slot: EventSlot, now: Date): string {
  const action = getSlotQrAction(slot, now);
  if (action === "ended") return "Ended";
  if (action === "checkin") return "Check in open";
  if (isSlotFull(slot)) return "Full";
  return "RSVP open";
}

export default function QrSlotPickerModal({
  open,
  eventId,
  eventTitle,
  slots,
  questions = [],
  userId,
  flowState: _flowState,
  initialSlotId,
  rsvpRequired = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  eventId: string;
  eventTitle: string;
  slots: EventSlot[];
  questions?: EventQuestion[];
  userId?: string;
  flowState: QrFlowState | null;
  initialSlotId?: string;
  rsvpRequired?: boolean;
  onConfirm: (slotId: string, answers?: EventQuestionAnswers) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"slot" | "questions">("slot");
  const [answers, setAnswers] = useState<EventQuestionAnswers>({});

  const now = useMemo(() => new Date(), [open]);

  useEffect(() => {
    if (open) {
      setStep("slot");
      setSelectedSlotId(initialSlotId ?? "");
      setAnswers({});
    }
  }, [open, initialSlotId]);

  const ownSlot = slots.find((slot) => slot.id === initialSlotId);
  const ownLocked = Boolean(rsvpRequired && ownSlot && isSlotRsvpLocked(ownSlot, now));
  const visibleSlots = slots.filter((slot) => {
    if (!rsvpRequired || !isSlotRsvpLocked(slot, now)) return true;
    return slot.id === initialSlotId;
  });
  const checkInOnly = ownLocked && ownSlot != null && getSlotQrAction(ownSlot, now) === "checkin";
  const registeredOnly = ownLocked && !checkInOnly;

  const activeSlotId = selectedSlotId || initialSlotId || visibleSlots[0]?.id || "";
  const activeSlot = slots.find((slot) => slot.id === activeSlotId);
  const activeAction = activeSlot ? getSlotQrAction(activeSlot, now) : "ended";

  if (!open) return null;

  const submitLabel = activeAction === "checkin" ? "Check in" : "RSVP";

  const handleSubmit = async () => {
    if (!activeSlotId) return;
    setSubmitting(true);
    try {
      const isSwitch = Boolean(initialSlotId) && activeAction === "register";
      const shouldAsk =
        questions.length > 0 &&
        Boolean(userId) &&
        !isSwitch &&
        (activeAction === "register" || activeAction === "checkin");

      if (shouldAsk && step === "slot") {
        const loaded =
          userId && eventId
            ? (await fetchMyEventQuestionAnswers(eventId, userId)).answers
            : {};
        if (hasUnansweredRequired(questions, loaded)) {
          setAnswers(loaded);
          setStep("questions");
          return;
        }
        await onConfirm(activeSlotId, loaded);
        return;
      }

      if (step === "questions" && hasUnansweredRequired(questions, answers)) return;
      await onConfirm(activeSlotId, answers);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    (step === "slot" &&
      (!activeSlotId ||
        activeAction === "ended" ||
        (activeSlot != null && isSlotFull(activeSlot) && activeSlot.id !== initialSlotId))) ||
    (step === "questions" && hasUnansweredRequired(questions, answers));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="font-DM text-xl font-bold text-navy">
          {step === "questions"
            ? "Registration questions"
            : registeredOnly
              ? "You're registered"
              : "Choose a time slot"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{eventTitle}</p>

        {step === "slot" && registeredOnly && ownSlot ? (
          <p className="mt-4 text-sm text-gray-700">
            You're registered for {DateParser(ownSlot.starts_at)} – {DateParser(ownSlot.ends_at)}.
            This time can't be changed today. Check-in opens closer to the start.
          </p>
        ) : step === "slot" && rsvpRequired && !initialSlotId && visibleSlots.length === 0 ? (
          <p className="mt-4 text-sm text-gray-700">
            RSVP was required before today, so check-in isn't available.
          </p>
        ) : step === "slot" ? (
          <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
            {visibleSlots.map((slot) => {
              const full = isSlotFull(slot);
              const isSelected = slot.id === activeSlotId;
              const isCurrentRsvp = slot.id === initialSlotId;
              const action = getSlotQrAction(slot, now);
              const lockedToday = rsvpRequired && isSlotRsvpLocked(slot, now) && !isCurrentRsvp;
              const disabled = action === "ended" || lockedToday || (full && !isCurrentRsvp);

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
                        ? ` · ${seatsTaken(slot)}/${slot.capacity} spots`
                        : ` · ${seatsTaken(slot)} RSVPs`}
                      {isCurrentRsvp ? " · Your slot" : ""}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <RegistrationQuestionFields questions={questions} answers={answers} onChange={setAnswers} />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={step === "questions" ? () => setStep("slot") : onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            {step === "questions" ? "Back" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={submitDisabled || registeredOnly || visibleSlots.length === 0}
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
