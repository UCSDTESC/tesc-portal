import { useContext } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";

/** @deprecated Use EventSlotPicker for slot-based RSVP. */
export function RsvpOrAttendanceButton({
  start_date,
  end_date,
  selection,
  className,
}: {
  start_date: string;
  end_date: string;
  selection: string;
  className?: string;
}) {
  const { rsvpByEvent, attendedByEvent, handleRSVP, handleAttendance } = useContext(BulletinContext);
  const buttonClassName = `border border-blue px-4 py-2 rounded-lg cursor-pointer w-fit h-fit my-2 ${className} `;
  if (!rsvpByEvent || !attendedByEvent) return null;
  if (attendedByEvent[selection]) return null;

  const currDate = new Date();
  const start = new Date(start_date.replace("+00:00", ""));
  const end = new Date(end_date.replace("+00:00", ""));

  if (currDate <= start) {
    if (rsvpByEvent[selection]) {
      return (
        <button
          className={`${buttonClassName} bg-blue`}
          onClick={() => handleRSVP(selection, rsvpByEvent[selection], "cancel")}
        >
          Remove RSVP
        </button>
      );
    }
    return (
      <button
        className={buttonClassName}
        onClick={() => handleRSVP(selection, selection, "rsvp")}
      >
        RSVP
      </button>
    );
  }

  if (currDate <= end) {
    return (
      <button
        className={buttonClassName}
        onClick={() => handleAttendance(selection, rsvpByEvent[selection])}
      >
        Attend
      </button>
    );
  }

  return null;
}
