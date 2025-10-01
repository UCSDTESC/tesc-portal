import { useContext } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";

export function RsvpOrAttendanceButton({
  start_date,
  end_date,
  selection,
  className
}: {
  start_date: string;
  end_date: string;
  selection: number;
  className?: string;
}) {
  const currDate = new Date();
  const start = new Date(start_date.replace("+00:00", ""));
  const end = new Date(end_date.replace("+00:00", ""));
  const { RSVP, attendance, handleRSVP, handleAttendance } = useContext(BulletinContext);
  const buttonClassName = `border border-blue px-4 py-2 rounded-lg cursor-pointer w-fit h-fit my-2 ${className} `;
  if (attendance.includes(selection)) return;
  if (currDate <= start) {
    if (RSVP.includes(selection)) {
      return (
        <button
          className={`${buttonClassName} bg-blue`}
          onClick={() => handleRSVP(selection, true)}
        >
          Remove RSVP
        </button>
      );
    } else {
      return (
        <button className={buttonClassName} onClick={() => handleRSVP(selection, false)}>
          RSVP
        </button>
      );
    }
  } else if (currDate <= end) {
    return (
      <button className={`${buttonClassName}`} onClick={() => handleAttendance(selection)}>
        Attend
      </button>
    );
  } else {
    return <></>;
  }
}
