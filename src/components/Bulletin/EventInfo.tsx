import { useContext, useEffect, useState } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import EventSlotPicker from "./EventSlotPicker";
import Editor from "./Editor";
import { formatGoogleCalendarEvent } from "@lib/googleCalendar";
import { formatGoogleMapsLocation } from "@lib/utils";
import googleCalendar from "/Google_Calendar_icon_(2020).svg";
import UserContext from "@lib/UserContext";
import { WelcomePage } from "./WelcomePage";
import { motion } from "motion/react";
import { container, item } from "@lib/constants";
import type { Event } from "@lib/constants";
import { EditOutlined } from "@ant-design/icons";
import { fetchEventContent } from "@services/event";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  MessagesSquare,
  UtensilsCrossed,
} from "lucide-react";
import OrgAvatar from "@components/shell/OrgAvatar";

const EVENT_TZ = "America/Los_Angeles";

function formatEventRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: EVENT_TZ,
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TZ,
  });
  const startDay = dayFmt.format(start);
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return `${startDay} · ${timeFmt.format(start)}`;
  }
  if (dayFmt.format(end) === startDay) {
    return `${startDay} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  }
  return `${startDay}, ${timeFmt.format(start)} – ${dayFmt.format(end)}, ${timeFmt.format(end)}`;
}

export default function EventInfo({
  selection = "-1",
  event: eventProp,
  preview = false,
}: {
  selection?: string;
  event?: Event;
  preview?: boolean;
}) {
  const { data, openEditModal, qrBanner } = useContext(BulletinContext);
  const { User } = useContext(UserContext);
  const [imageUrl, setImageUrl] = useState("");
  const [posterBroken, setPosterBroken] = useState(false);
  const [eventContent, setEventContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const daton = eventProp ?? data?.find((event) => event.id.toString() === selection);

  useEffect(() => {
    if (preview) return;
    document.title = `${daton ? daton.title.toString() + " | TESC Portal" : "Welcome | TESC Portal"}`;
  }, [daton, preview]);

  useEffect(() => {
    setPosterBroken(false);
  }, [daton?.poster]);

  useEffect(() => {
    if (User?.role === "company") return;
    if (!daton?.orgs?.pfp_str) {
      setImageUrl("");
      return;
    }
    setImageUrl(
      `https://mxbwjmjpevvyejnugisy.supabase.co/storage/v1/object/public/profile.images/${daton.orgs.name}/${daton.orgs.pfp_str}`,
    );
  }, [daton, User?.role]);

  useEffect(() => {
    if (eventProp) {
      setEventContent(eventProp.content ?? "");
      setLoadingContent(false);
      return;
    }

    if (selection === "-1") {
      setEventContent("");
      return;
    }

    const selected = data?.find((event) => event.id.toString() === selection);
    if (selected?.content != null) {
      setEventContent(selected.content);
      return;
    }

    let cancelled = false;
    const loadContent = async () => {
      setLoadingContent(true);
      const { content, error } = await fetchEventContent(selection);
      if (!cancelled) {
        if (error) console.error(error.message);
        setEventContent(content);
        setLoadingContent(false);
      }
    };
    loadContent();

    return () => {
      cancelled = true;
    };
  }, [selection, data, eventProp]);

  if (!preview && selection === "-1") {
    return <WelcomePage />;
  }

  if (!daton) return null;

  const showMeta = daton.type !== "forum";
  const dateRange = formatEventRange(daton.start_date, daton.end_date);

  return (
    <motion.div
      key={preview ? "preview" : daton.id}
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {qrBanner && !preview && (
        <motion.div
          variants={item}
          className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-medium ${
            qrBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : qrBanner.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-brand-100 bg-brand-50 text-navy-900"
          }`}
        >
          {qrBanner.message}
        </motion.div>
      )}

      <motion.div variants={item} className="flex items-start gap-4">
        <OrgAvatar
          name={daton.orgs?.name}
          src={imageUrl || null}
          className="h-16 w-16"
          initialClassName="text-2xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-600">
            {daton.orgs?.name ? daton.orgs.name : "Unknown"}
          </p>
          <div className="mt-0.5 flex items-start gap-3">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              {daton.title}
            </h1>
            {!preview && daton.type === "internal" && openEditModal && (
              <button
                type="button"
                onClick={() => openEditModal(daton)}
                className="shrink-0 rounded-xl border border-line bg-white p-2 text-ink-secondary shadow-sm transition-colors hover:bg-surface hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Edit event"
              >
                <EditOutlined />
              </button>
            )}
          </div>
          {daton.type === "forum" && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              <MessagesSquare className="h-3 w-3" />
              Forum
            </span>
          )}
        </div>
      </motion.div>

      {/* Forum posts have no poster: showing the empty placeholder here left a
          large blank blue box in the detail view and the form preview. */}
      {daton.type !== "internal" && daton.type !== "forum" && (
        <motion.div variants={item}>
          {daton.poster && !posterBroken ? (
            <img
              src={daton.poster}
              alt=""
              onError={() => setPosterBroken(true)}
              className="card-shadow aspect-video w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="aspect-video w-full animate-pulse rounded-2xl bg-brand-100" />
          )}
        </motion.div>
      )}

      {daton.slots &&
        daton.slots.length > 0 &&
        (daton.track_attendance ||
          daton.rsvp_required ||
          daton.type === "internal" ||
          (daton.questions?.length ?? 0) > 0) && (
          <motion.div variants={item}>
            <EventSlotPicker
              eventId={String(daton.id)}
              slots={daton.slots}
              questions={daton.questions}
              className=""
              preview={preview}
              rsvpRequired={Boolean(daton.rsvp_required)}
            />
          </motion.div>
        )}

      <motion.div
        variants={item}
        className={
          showMeta ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" : "min-w-0"
        }
      >
        <div className="order-2 min-w-0 lg:order-1">
          <Editor content={loadingContent ? "Loading..." : eventContent} />
        </div>

        {showMeta && (
          <aside className="order-1 lg:order-2">
            <div className="card-shadow space-y-5 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-24">
              {dateRange && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Date &amp; time
                  </p>
                  <p className="mt-1.5 flex items-start gap-2 text-sm font-medium leading-snug text-ink">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {dateRange}
                  </p>
                </div>
              )}
              {daton.location_str && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Location
                  </p>
                  <p className="mt-1.5 flex items-start gap-2 text-sm font-medium leading-snug text-ink">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {daton.location_str}
                  </p>
                  <a
                    href={formatGoogleMapsLocation(daton.location_str)}
                    className="mt-1.5 inline-flex items-center gap-1 pl-6 text-sm font-medium text-brand-600 hover:underline"
                  >
                    Directions to event
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
              {daton.food_provided?.trim() && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Food
                  </p>
                  <p className="mt-1.5 flex items-start gap-2 text-sm leading-snug text-ink-secondary">
                    <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>
                      <span className="font-semibold text-ink">Food provided: </span>
                      {daton.food_provided}
                    </span>
                  </p>
                </div>
              )}
              <a
                href={formatGoogleCalendarEvent(
                  daton.title,
                  daton.location_str,
                  daton.start_date,
                  daton.end_date,
                )}
                className="flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <img src={googleCalendar} alt="" className="h-4 w-4" />
                Add to Google Calendar
              </a>
              {daton.tags.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Tags
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {daton.tags.filter(Boolean).map((tag) => {
                      return (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </motion.div>
    </motion.div>
  );
}
