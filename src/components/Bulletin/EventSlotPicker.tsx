import { useContext, useMemo, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import UserContext from "@lib/UserContext";
import { EventQuestion, EventSlot } from "@lib/constants";
import { DateParser } from "@lib/utils";
import { getSlotQrAction, isEventEnded, isSlotFull, isSlotRsvpLocked, seatsTaken } from "@lib/slotTime";
import { hasUnansweredRequired } from "@lib/eventQuestions";
import { fetchMyEventQuestionAnswers } from "@services/eventQuestions";

function slotStatusLabel(
  slot: EventSlot,
  now: Date,
  options: { isCurrentRsvp: boolean; isAttended: boolean },
): string {
  if (options.isAttended) return "Checked in";
  if (options.isCurrentRsvp) {
    const action = getSlotQrAction(slot, now);
    if (action === "checkin") return "Your slot · Check in open";
    if (action === "register") return "Your slot · Registered";
    return "Your slot";
  }
  const action = getSlotQrAction(slot, now);
  if (action === "ended") return "Ended";
  if (action === "checkin") return "Check in open";
  if (isSlotFull(slot)) return "Full";
  return "RSVP open";
}

function SlotStatusCard({
  slot,
  message,
  tone,
}: {
  slot: EventSlot;
  message: string;
  tone: "registered" | "attended";
}) {
  return (
    <div
      className={`w-full rounded-lg border p-4 shadow-sm ${
        tone === "attended"
          ? "border-green-300 bg-green-50"
          : "border-blue/30 bg-blue/5"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          tone === "attended" ? "text-green-800" : "text-navy"
        }`}
      >
        {message}
      </p>
      <p className="mt-1 text-sm text-gray-700">
        {DateParser(slot.starts_at)} – {DateParser(slot.ends_at)}
      </p>
    </div>
  );
}

export default function EventSlotPicker({
  eventId,
  slots,
  questions = [],
  className = "",
  preview = false,
  rsvpRequired = false,
}: {
  eventId: string;
  slots: EventSlot[];
  questions?: EventQuestion[];
  className?: string;
  preview?: boolean;
  rsvpRequired?: boolean;
}) {
  const { rsvpByEvent, attendedByEvent, handleRSVP, handleAttendance, promptRegistrationQuestions } =
    useContext(BulletinContext);
  const { User, authReady } = useContext(UserContext);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const loggedOut = authReady && !User?.id;
  const userRsvpSlotId = preview || loggedOut ? "" : (rsvpByEvent?.[eventId] ?? "");
  const userAttendedSlotId = preview || loggedOut ? "" : (attendedByEvent?.[eventId] ?? "");
  const activeSlotId = selectedSlotId || userRsvpSlotId || slots[0]?.id || "";

  const attendedSlot = useMemo(
    () => (userAttendedSlotId ? slots.find((slot) => slot.id === userAttendedSlotId) : undefined),
    [slots, userAttendedSlotId],
  );

  const rsvpSlot = useMemo(
    () => (userRsvpSlotId ? slots.find((slot) => slot.id === userRsvpSlotId) : undefined),
    [slots, userRsvpSlotId],
  );

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.id === activeSlotId) ?? slots[0],
    [slots, activeSlotId],
  );

  const rsvpStatusReady = preview || loggedOut || Boolean(rsvpByEvent && attendedByEvent);
  if (!rsvpStatusReady || !slots.length) return null;

  const now = new Date();
  const buttonClassName = `border border-blue px-4 py-2 rounded-lg cursor-pointer w-fit h-fit ${className}`;

  if (userAttendedSlotId && attendedSlot) {
    return (
      <SlotStatusCard
        slot={attendedSlot}
        message="You're checked in for this event."
        tone="attended"
      />
    );
  }

  if (!activeSlot) return null;

  if (rsvpRequired && !userRsvpSlotId && slots.every((slot) => isSlotRsvpLocked(slot, now))) {
    return null;
  }

  const choosableSlots =
    rsvpRequired && !userRsvpSlotId
      ? slots.filter((slot) => !isSlotRsvpLocked(slot, now))
      : slots;
  const resolvedActiveId =
    choosableSlots.some((slot) => slot.id === activeSlotId)
      ? activeSlotId
      : (choosableSlots[0]?.id ?? "");
  const resolvedActive =
    choosableSlots.find((slot) => slot.id === resolvedActiveId) ?? choosableSlots[0];
  if (!resolvedActive) return null;

  const actionSlot = rsvpSlot ?? resolvedActive;
  const slotAction = getSlotQrAction(actionSlot, now);
  const allEnded = isEventEnded(slots, now);

  const askQuestionsIfNeeded = async (
    submitLabel: string,
    onSubmit: (
      answers: import("@lib/eventQuestions").EventQuestionAnswers,
    ) => Promise<boolean | void> | boolean | void,
  ) => {
    if (!User?.id || !questions.length || !promptRegistrationQuestions) {
      await onSubmit({});
      return;
    }
    const { answers } = await fetchMyEventQuestionAnswers(eventId, User.id);
    if (!hasUnansweredRequired(questions, answers)) {
      await onSubmit(answers);
      return;
    }
    promptRegistrationQuestions({
      questions,
      initialAnswers: answers,
      submitLabel,
      onSubmit: async (nextAnswers) => {
        const ok = await onSubmit(nextAnswers);
        if (ok === false) throw new Error("Could not complete registration");
      },
    });
  };

  if (rsvpRequired && rsvpSlot && isSlotRsvpLocked(rsvpSlot, now)) {
    const canCheckIn = !preview && getSlotQrAction(rsvpSlot, now) === "checkin";
    return (
      <div className="flex w-full flex-col gap-3">
        <SlotStatusCard
          slot={rsvpSlot}
          message="You're registered. This time can't be changed today."
          tone="registered"
        />
        {canCheckIn && (
          <button
            type="button"
            className={buttonClassName}
            onClick={() =>
              askQuestionsIfNeeded("Continue to check in", (answers) =>
                handleAttendance(eventId, rsvpSlot.id, answers, questions),
              )
            }
          >
            Attend
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-lg border p-4 shadow-sm ${
        allEnded ? "border-gray-200 bg-gray-50 opacity-80" : "border-blue/30 bg-white"
      }`}
    >
      <p className={`mb-2 text-sm font-semibold ${allEnded ? "text-gray-500" : "text-navy"}`}>
        {allEnded
          ? "Time slots"
          : rsvpSlot && slotAction === "register"
            ? "Your registration"
            : slotAction === "checkin" && resolvedActiveId === userRsvpSlotId
              ? "Check in to your slot"
              : "Choose a time slot"}
      </p>
      <div className="flex flex-col gap-2">
        {choosableSlots.map((slot) => {
          const full = isSlotFull(slot);
          const isSelected = slot.id === resolvedActiveId;
          const isCurrentRsvp = slot.id === userRsvpSlotId;
          const action = getSlotQrAction(slot, now);
          const ended = action === "ended";
          const lockedToday = rsvpRequired && isSlotRsvpLocked(slot, now);
          const disabled = ended || allEnded || lockedToday || (full && !isCurrentRsvp);

          return (
            <div
              key={slot.id}
              className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                isSelected && !allEnded ? "border-blue bg-blue/10" : "border-gray-200"
              } ${disabled ? "opacity-60" : ""}`}
            >
              {!allEnded && !preview && (
                <input
                  type="radio"
                  name={`slot-${eventId}`}
                  className="mt-1"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => setSelectedSlotId(slot.id)}
                />
              )}
              <span>
                <span className={`block font-medium ${ended || allEnded ? "text-gray-500" : ""}`}>
                  {DateParser(slot.starts_at)} – {DateParser(slot.ends_at)}
                </span>
                <span className="text-xs text-gray-600">
                  {slotStatusLabel(slot, now, {
                    isCurrentRsvp,
                    isAttended: slot.id === userAttendedSlotId,
                  })}
                  {slot.capacity != null
                    ? ` · ${seatsTaken(slot)}/${slot.capacity} spots`
                    : ` · ${seatsTaken(slot)} RSVPs`}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {!preview && !allEnded && (
        <div className="mt-3 flex gap-2">
          {slotAction === "checkin" ? (
            <button
              type="button"
              className={buttonClassName}
              onClick={() =>
                askQuestionsIfNeeded("Continue to check in", (answers) =>
                  handleAttendance(eventId, resolvedActiveId, answers, questions),
                )
              }
            >
              Attend
            </button>
          ) : slotAction === "register" ? (
            userRsvpSlotId ? (
              <>
                <button
                  type="button"
                  className={`${buttonClassName} bg-blue text-white`}
                  disabled={
                    !resolvedActiveId ||
                    resolvedActiveId === userRsvpSlotId ||
                    isSlotFull(resolvedActive) ||
                    (rsvpRequired && isSlotRsvpLocked(resolvedActive, now))
                  }
                  onClick={() =>
                    handleRSVP(eventId, resolvedActiveId, userRsvpSlotId ? "switch" : "rsvp")
                  }
                >
                  Switch slot
                </button>
                <button
                  type="button"
                  className={buttonClassName}
                  onClick={() => handleRSVP(eventId, userRsvpSlotId, "cancel")}
                >
                  Remove RSVP
                </button>
              </>
            ) : (
              <button
                type="button"
                className={buttonClassName}
                disabled={!resolvedActiveId || isSlotFull(resolvedActive)}
                onClick={() =>
                  askQuestionsIfNeeded("RSVP", (answers) =>
                    handleRSVP(eventId, resolvedActiveId, "rsvp", answers, questions),
                  )
                }
              >
                RSVP
              </button>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
