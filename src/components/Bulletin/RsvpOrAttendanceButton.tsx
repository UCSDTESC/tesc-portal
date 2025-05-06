import { useContext } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";

export function RsvpOrAttendanceButton({
  start_date,
  end_date,
  selection,
}: {
  start_date: string;
  end_date: string;
  selection: number;
}) {
  const currDate = new Date();
  const start = new Date(start_date);
  const end = new Date(end_date);
  const { RSVP, attendance, handleRSVP, handleAttendance } =
    useContext(BulletinContext);
  const buttonClassName =
    "border px-4 py-2 rounded-lg cursor-pointer w-fit h-fit my-2";
  if (currDate <= start) {
    if (RSVP.includes(selection)) {
      return (
        <button
          className={buttonClassName}
          onClick={() => handleRSVP(selection, true)}
        >
          Remove RSVP
        </button>
      );
    } else {
      return (
        <button
          className={buttonClassName}
          onClick={() => handleRSVP(selection, false)}
        >
          RSVP
        </button>
      );
    }
  } else if (currDate <= end) {
    if (attendance.includes(selection)) {
      return (
        <button
          className={buttonClassName}
          onClick={() => handleAttendance(selection)}
        >
          Remove Attendance
        </button>
      );
    } else {
      return (
        <button
          className={buttonClassName}
          onClick={() => handleAttendance(selection)}
        >
          Mark attendance
        </button>
      );
    }
  } else {
    return <></>;
  }
}
