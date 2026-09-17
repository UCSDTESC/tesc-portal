import { useContext, useMemo, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { EventSlot } from "@lib/constants";
import { DateParser } from "@lib/utils";
import { getSlotQrAction, isEventEnded, isSlotFull } from "@lib/slotTime";

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
  className = "",
  preview = false,
}: {
  eventId: string;
  slots: EventSlot[];
  className?: string;
  preview?: boolean;
}) {
  const { rsvpByEvent, attendedByEvent, handleRSVP, handleAttendance } = useContext(BulletinContext);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const userRsvpSlotId = preview ? "" : (rsvpByEvent?.[eventId] ?? "");
  const userAttendedSlotId = preview ? "" : (attendedByEvent?.[eventId] ?? "");
  const activeSlotId = selectedSlotId || userRsvpSlotId || slots[0]?.id || "";

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.id === activeSlotId) ?? slots[0],
    [slots, activeSlotId],
  );

  const attendedSlot = useMemo(
    () => (userAttendedSlotId ? slots.find((slot) => slot.id === userAttendedSlotId) : undefined),
    [slots, userAttendedSlotId],
  );

  const rsvpSlot = useMemo(
    () => (userRsvpSlotId ? slots.find((slot) => slot.id === userRsvpSlotId) : undefined),
    [slots, userRsvpSlotId],
  );

  if ((!preview && (!rsvpByEvent || !attendedByEvent)) || !slots.length || !activeSlot) return null;

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

  const actionSlot = rsvpSlot ?? activeSlot;
  const slotAction = getSlotQrAction(actionSlot, now);
  const allEnded = isEventEnded(slots, now);

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
            : rsvpSlot && slotAction === "checkin"
              ? "Check in to your slot"
              : "Choose a time slot"}
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => {
          const full = isSlotFull(slot);
          const isSelected = slot.id === activeSlotId;
          const isCurrentRsvp = slot.id === userRsvpSlotId;
          const action = getSlotQrAction(slot, now);
          const ended = action === "ended";
          const disabled =
            ended ||
            allEnded ||
            (full && !isCurrentRsvp) ||
            Boolean(rsvpSlot && slotAction === "checkin" && !isCurrentRsvp);

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
                    ? ` · ${slot.rsvp_count}/${slot.capacity} spots`
                    : ` · ${slot.rsvp_count} RSVPs`}
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
              onClick={() => handleAttendance(eventId, userRsvpSlotId || activeSlotId)}
            >
              Attend
            </button>
          ) : slotAction === "register" ? (
            userRsvpSlotId ? (
              <>
                <button
                  type="button"
                  className={`${buttonClassName} bg-blue text-white`}
                  disabled={!activeSlotId || activeSlotId === userRsvpSlotId || isSlotFull(activeSlot)}
                  onClick={() =>
                    handleRSVP(eventId, activeSlotId, userRsvpSlotId ? "switch" : "rsvp")
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
                disabled={!activeSlotId || isSlotFull(activeSlot)}
                onClick={() => handleRSVP(eventId, activeSlotId, "rsvp")}
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
