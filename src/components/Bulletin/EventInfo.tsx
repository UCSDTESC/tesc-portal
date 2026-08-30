import { useContext, useEffect, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import EventSlotPicker from "./EventSlotPicker";
import Editor from "./Editor";
import { formatGoogleCalendarEvent, formatGoogleMapsLocation } from "@lib/utils";
import googleCalendar from "/Google_Calendar_icon_(2020).svg";
import UserContext from "@lib/UserContext";
import { WelcomePage } from "./WelcomePage";
import { motion } from "motion/react";
import { container, item } from "@lib/constants";
import { EditOutlined } from "@ant-design/icons";

export default function EventInfo({ selection }: { selection: string }) {
  const { data, openEditModal, qrBanner } = useContext(BulletinContext);
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
    if (!filtered || filtered.length === 0 || !filtered[0].orgs || !filtered[0].orgs?.pfp_str) {
      setImageUrl("");
      return;
    }
    setImageUrl(
      `https://mxbwjmjpevvyejnugisy.supabase.co/storage/v1/object/public/profile.images/${filtered[0].orgs?.name}/${filtered[0].orgs?.pfp_str}`,
    );
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
                key={daton.id}
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
                  className="flex flex-col h-full justify-center"
                  variants={container}
                >
                  {qrBanner && (
                    <motion.div
                      variants={item}
                      className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${
                        qrBanner.type === "success"
                          ? "bg-green-100 text-green-800"
                          : qrBanner.type === "error"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue/10 text-navy"
                      }`}
                    >
                      {qrBanner.message}
                    </motion.div>
                  )}
                  <div className="flex items-center gap-3">
                    <motion.h1 variants={item} className="font-bold text-4xl">
                      {daton.title}
                    </motion.h1>
                    {daton.type === "internal" && openEditModal && (
                      <button
                        type="button"
                        onClick={() => openEditModal(daton)}
                        className="p-2 rounded-lg bg-blue/20 hover:bg-blue/40 text-navy transition-colors"
                        title="Edit event"
                      >
                        <EditOutlined />
                      </button>
                    )}
                  </div>
                  <motion.p className="text-lg text-[#898989]" variants={item}>
                    {daton.orgs?.name ? daton.orgs.name : "Unknown"}
                  </motion.p>
                </motion.div>
                <motion.div className="col-start-2 w-[95%] max-w-[800px] mx-auto" variants={item}>
                  {daton.type !== "internal" &&
                    (daton.poster ? (
                      <img src={daton.poster} alt="" className="w-full rounded-lg object-cover" />
                    ) : (
                      <div className="w-full bg-blue/15 animate-pulse aspect-video rounded-lg"></div>
                    ))}
                  {daton.track_attendance && daton.slots && daton.slots.length > 0 && (
                    <div className="mt-6">
                      <EventSlotPicker
                        eventId={selection}
                        slots={daton.slots}
                        className="bg-lightBlue hover:opacity-80"
                      />
                    </div>
                  )}
                  <div className="flex w-full flex-row mt-10 justify-between flex-wrap-reverse gap-8">
                    <span className="w-fit">
                      {daton.type !== "forum" && daton.location_str && (
                        <h1 className="font-semibold mb-4">
                          <span className="block">{daton.location_str}</span>
                        </h1>
                      )}
                      <Editor content={daton.content} />
                    </span>
                    {daton.type !== "forum" && (
                      <div className="w-max flex flex-col gap-2 ">
                        <a
                          href={formatGoogleCalendarEvent(
                            daton.title,
                            daton.location_str,
                            daton.start_date,
                            daton.end_date,
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
                              <div key={tag} className="bg-lightBlue px-2 rounded-2xl font-semibold">
                                {tag}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
