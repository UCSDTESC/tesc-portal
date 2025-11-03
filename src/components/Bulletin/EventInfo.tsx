import { useContext, useEffect, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { RsvpOrAttendanceButton } from "./RsvpOrAttendanceButton";
import Editor from "./Editor";
import { DateParser, formatGoogleCalendarEvent, formatGoogleMapsLocation } from "@lib/utils";
import googleCalendar from "/Google_Calendar_icon_(2020).svg";
import supabase from "@server/supabase";
import UserContext from "@lib/UserContext";
import { WelcomePage } from "./WecomePage";
import { motion } from "motion/react";
import { container, item } from "@lib/constants";

export default function EventInfo({ selection }: { selection: string }) {
  const { data } = useContext(BulletinContext);
  const { User } = useContext(UserContext);
  const [imageUrl, setImageUrl] = useState("");
  useEffect(() => {
    const name = data?.filter((daton) => daton.id.toString() === selection);
    document.title = `${
      name && name[0] ? name[0].title.toString() + " | TESC Portal" : "Welcome | TESC Portal"
    }`;
  }, [data, selection]);

  useEffect(() => {
    if (User?.role === "company") return;
    const filtered = data?.filter((daton) => daton.id.toString() === selection);
    if (!filtered || filtered.length === 0 || !filtered[0].Users || !filtered[0].Users?.pfp_str) {
      setImageUrl("");
      return;
    }
    const { data: URL } = supabase.storage
      .from("profile.images")
      .getPublicUrl(`${filtered[0].org_emails?.org_name}/${filtered[0].Users?.pfp_str}`);
    if (URL) {
      setImageUrl(URL.publicUrl);
      console.log(URL.publicUrl);
    } else {
      setImageUrl("");
    }
  }, [data, selection, User?.role]);
  return (
    <>
      {selection != "-1" ? (
        data?.map((daton) => {
          if (daton.id.toString() === selection)
            return (
              <motion.span
                className="w-full grid grid-cols-[70px_1fr] grid-rows-[70px_1fr] gap-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {imageUrl ? (
                  <motion.img
                    variants={item}
                    src={imageUrl}
                    alt=""
                    className="h-full rounded-full object-cover aspect-square"
                  />
                ) : (
                  <motion.img
                    variants={item}
                    src="https://placehold.co/600x600"
                    alt=""
                    className="h-full rounded-full object-cover aspect-square"
                  />
                )}
                <motion.div
                  className="flex flex-col h-full justify-center relative"
                  variants={container}
                >
                  <motion.h1 variants={item} className="font-bold text-4xl">
                    {daton.title}
                  </motion.h1>
                  <RsvpOrAttendanceButton
                    {...{
                      start_date: daton.start_date,
                      end_date: daton.end_date,
                      selection
                    }}
                    className="absolute bottom-0 right-[5%] bg-lightBlue hover:opacity-80"
                  />
                  <motion.p className="text-lg text-[#898989]" variants={item}>
                    {daton.org_emails?.org_name ? daton.org_emails.org_name : "Unknown"}
                  </motion.p>
                </motion.div>
                <motion.div className="col-start-2 w-[95%] max-w-[800px] mx-auto" variants={item}>
                  {daton.poster ? (
                    <img src={daton.poster} alt="" className="w-full rounded-lg object-cover" />
                  ) : (
                    <div className="w-full bg-blue/15 animate-pulse aspect-video rounded-lg"></div>
                  )}
                  <div className="flex w-full flex-row mt-10 justify-between flex-wrap-reverse gap-8">
                    <span className="w-fit">
                      <h1 className=" font-semibold ">
                        {DateParser(daton.start_date)} <br />
                        {daton.location_str}
                      </h1>
                      <Editor content={daton.content} />
                    </span>
                    <div className="w-max flex flex-col gap-2 ">
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
                            <div className="bg-lightBlue px-2 rounded-2xl font-semibold">{tag}</div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.span>
            );
        })
      ) : (
        <WelcomePage />
      )}
    </>
  );
}
