import { useContext, useEffect, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { RsvpOrAttendanceButton } from "./RsvpOrAttendanceButton";
import Editor from "./Editor";
import { formatGoogleCalendarEvent, formatGoogleMapsLocation } from "@lib/utils";
import supabase from "@server/supabase";
export default function EventDisplay({ selection }: { selection: number }) {
  const { data } = useContext(BulletinContext);
  const [imageUrl, setImageUrl] = useState("");

  // TODO: Code clean-up
  useEffect(() => {
    const filtered = data?.filter((daton) => daton.id === selection);
    if (!filtered || filtered.length === 0) return;
    console.log(filtered[0].Users?.pfp_str);
    const { data: URL } = supabase.storage
      .from("profile.images")
      .getPublicUrl(`${filtered[0].org_emails?.org_name}/${filtered[0].Users?.pfp_str}`);
    if (URL) {
      setImageUrl(URL.publicUrl);
      console.log(URL.publicUrl);
    }
    if (URL) setImageUrl(URL.publicUrl);
  }, [data, selection]);

  return (
    <>
      {data?.map((daton) => {
        if (daton.id === selection)
          return (
            <span className="w-full flex flex-col">
              <h1 className="font-bold text-[30px]">
                {daton.title} &nbsp; {new Date(daton.created_at).toUTCString()}
              </h1>
              <h1>
                {daton.org_emails?.org_name}{" "}
                <img src={imageUrl} alt="" className="w-20 h-20 aspect-square rounded-full" />
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
