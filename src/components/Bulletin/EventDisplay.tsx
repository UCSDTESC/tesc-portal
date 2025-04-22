import { useContext } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { RsvpOrAttendanceButton } from "./RsvpOrAttendanceButton";
import Editor from "./Editor";
import { formatGoogleCalendarEvent, formatGoogleMapsLocation } from "@lib/utils";
export default function EventDisplay({ selection }: { selection: number }) {
  const { data } = useContext(BulletinContext);

  return (
    <>
      {data?.map((daton) => {
        if (daton.id === selection)
          return (
            <span className="w-full flex flex-col">
              <h1 className="font-bold text-[30px]">
                {daton.title} &nbsp; {new Date(daton.created_at).toUTCString()}
              </h1>
              <div>Start Date:&nbsp;{new Date(daton.start_date).toUTCString()}</div>
              <div>End Date: &nbsp;{new Date(daton.end_date).toUTCString()}</div>
              {daton.location_str && (
                <div>
                  location: &nbsp;
                  {daton.location_str} | &nbsp;
                  <a
                    href={formatGoogleMapsLocation(daton.location_str)}
                    className=" hover:underline decoration-auto"
                  >
                    directions
                  </a>
                </div>
              )}
              <a
                href={formatGoogleCalendarEvent(
                  daton.title,
                  daton.location_str,
                  daton.start_date,
                  daton.end_date
                )}
                className="hover:underline decoration-auto"
              >
                Add to Calendar
              </a>
              <RsvpOrAttendanceButton
                {...{
                  start_date: daton.start_date,
                  end_date: daton.end_date,
                  selection
                }}
              />
              <Editor content={daton.content}></Editor>
            </span>
          );
      })}
    </>
  );
}
