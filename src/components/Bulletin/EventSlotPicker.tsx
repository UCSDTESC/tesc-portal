import { useContext, useMemo, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { EventSlot } from "@lib/constants";
import { DateParser } from "@lib/utils";

function isSlotFull(slot: EventSlot) {
  if (slot.capacity == null) return false;
  return slot.rsvp_count >= slot.capacity;
}

export default function EventSlotPicker({
  eventId,
  slots,
  className = "",
}: {
  eventId: string;
  slots: EventSlot[];
  className?: string;
}) {
  const { rsvpByEvent, attendedByEvent, handleRSVP, handleAttendance } = useContext(BulletinContext);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const userRsvpSlotId = rsvpByEvent?.[eventId] ?? "";
  const userAttendedSlotId = attendedByEvent?.[eventId] ?? "";
  const activeSlotId = selectedSlotId || userRsvpSlotId || slots[0]?.id || "";

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.id === activeSlotId) ?? slots[0],
    [slots, activeSlotId],
  );

  if (!rsvpByEvent || !attendedByEvent || !slots.length || !activeSlot) return null;

  if (userAttendedSlotId) return null;

  const now = new Date();
  const slotStart = new Date(activeSlot.starts_at.replace("+00:00", ""));
  const eventStart = new Date(
    (slots[0]?.starts_at ?? activeSlot.starts_at).replace("+00:00", ""),
  );
  const eventEnd = new Date(
    (slots[slots.length - 1]?.ends_at ?? activeSlot.ends_at).replace("+00:00", ""),
  );
  const attendSlot =
    slots.find((slot) => slot.id === userRsvpSlotId) ??
    slots.find((slot) => {
      const start = new Date(slot.starts_at.replace("+00:00", ""));
      const end = new Date(slot.ends_at.replace("+00:00", ""));
      return now >= start && now <= end;
    }) ??
    activeSlot;
  const attendSlotEnd = new Date(attendSlot.ends_at.replace("+00:00", ""));

  const buttonClassName = `border border-blue px-4 py-2 rounded-lg cursor-pointer w-fit h-fit my-2 ${className}`;

  if (now <= eventStart || now <= slotStart) {
    const hasRsvp = Boolean(userRsvpSlotId);

    return (
      <div className="absolute bottom-0 right-[5%] w-[min(100%,320px)] rounded-lg border border-blue/30 bg-white/95 p-3 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-navy">Choose a time slot</p>
        <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
          {slots.map((slot) => {
            const full = isSlotFull(slot);
            const isSelected = slot.id === activeSlotId;
            const isCurrentRsvp = slot.id === userRsvpSlotId;
            return (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${
                  isSelected ? "border-blue bg-blue/10" : "border-gray-200"
                } ${full && !isCurrentRsvp ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name={`slot-${eventId}`}
                  className="mt-1"
                  checked={isSelected}
                  disabled={full && !isCurrentRsvp}
                  onChange={() => setSelectedSlotId(slot.id)}
                />
                <span>
                  <span className="block font-medium">
                    {DateParser(slot.starts_at)} – {DateParser(slot.ends_at)}
                  </span>
                  <span className="text-xs text-gray-600">
                    {full
                      ? "Full"
                      : slot.capacity != null
                        ? `${slot.rsvp_count}/${slot.capacity} spots`
                        : `${slot.rsvp_count} RSVPs`}
                    {isCurrentRsvp ? " · Your slot" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          {hasRsvp ? (
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
          )}
        </div>
      </div>
    );
  }

  if (now <= eventEnd && now >= new Date(attendSlot.starts_at.replace("+00:00", "")) && now <= attendSlotEnd) {
    const attendSlotId = userRsvpSlotId || attendSlot.id;
    return (
      <button
        type="button"
        className={buttonClassName}
        onClick={() => handleAttendance(eventId, attendSlotId)}
      >
        Attend
      </button>
    );
  }

  return null;
}
