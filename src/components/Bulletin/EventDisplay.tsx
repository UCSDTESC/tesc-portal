import { useContext, useEffect, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { RsvpOrAttendanceButton } from "./RsvpOrAttendanceButton";
import Editor from "./Editor";
import {
  DateParser,
  formatGoogleCalendarEvent,
  formatGoogleMapsLocation,
} from "@lib/utils";
import googleCalendar from "/Google_Calendar_icon_(2020).svg";
import supabase from "@server/supabase";
export default function EventDisplay({ selection }: { selection: number }) {
  const { data } = useContext(BulletinContext);
  const [imageUrl, setImageUrl] = useState("");

  // TODO: Code clean-up
  useEffect(() => {
    const filtered = data?.filter((daton) => daton.id === selection);
    if (
      !filtered ||
      filtered.length === 0 ||
      !filtered[0].Users ||
      !filtered[0].Users?.pfp_str
    ) {
      setImageUrl("");
      return;
    }
    console.log(filtered[0].Users?.pfp_str);
    const { data: URL } = supabase.storage
      .from("profile.images")
      .getPublicUrl(
        `${filtered[0].org_emails?.org_name}/${filtered[0].Users?.pfp_str}`
      );
    if (URL) {
      setImageUrl(URL.publicUrl);
    } else {
      setImageUrl("");
    }
  }, [data, selection]);

  return (
    <>
      {data?.map((daton) => {
        if (daton.id === selection)
          return (
            <span className="w-full grid grid-cols-[70px_1fr] grid-rows-[70px_1fr] gap-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full rounded-full object-cover aspect-square"
                />
              ) : (
                <img
                  src="https://placehold.co/600x600"
                  alt=""
                  className="h-full rounded-full object-cover aspect-square"
                />
              )}
              <div className="flex flex-col h-full justify-center relative">
                <h1 className="font-bold text-4xl">{daton.title}</h1>
                <RsvpOrAttendanceButton
                  {...{
                    start_date: daton.start_date,
                    end_date: daton.end_date,
                    selection,
                  }}
                  className="absolute bottom-0 right-[5%] bg-navy/20 hover:bg-navy/10"
                />
                <p>
                  {daton.org_emails?.org_name
                    ? daton.org_emails.org_name
                    : "Unknown"}
                </p>
              </div>
              <div className="col-start-2 w-[95%]">
                {daton.poster ? (
                  <img
                    src={daton.poster}
                    alt=""
                    className="w-full rounded-lg aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full bg-blue/15 animate-pulse aspect-video rounded-lg"></div>
                )}
                <div className="grid grid-cols-[2fr_1fr] mt-10">
                  <span className="w-full">
                    <h1 className=" font-semibold ">
                      {DateParser(daton.start_date)} <br />
                      {daton.location_str}
                    </h1>
                    <Editor content={daton.content} />
                  </span>
                  <div className="w-full flex flex-col gap-2 ">
                    <a
                      href={formatGoogleCalendarEvent(
                        daton.title,
                        daton.location_str,
                        daton.start_date,
                        daton.end_date
                      )}
                      className="flex items-center gap-2 bg-blue/20 justify-center px-2 rounded-2xl text-gray-700 hover:bg-blue/40"
                    >
                      <img src={googleCalendar} alt="" className="h-[15px]" />
                      Add to Google Calendar
                    </a>
                    <a
                      href={formatGoogleMapsLocation(daton.location_str)}
                      className="flex items-center gap-2 bg-blue/20 justify-center px-2 rounded-2xl text-gray-700 hover:bg-blue/40"
                    >
                      📍Directions to Event
                    </a>
                    <div className="flex gap-2">
                      {daton.tags.map((tag) => {
                        return (
                          <div className="bg-navy/40 px-2 rounded-2xl font-semibold">
                            {tag}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </span>
          );
      })}
    </>
  );
}
