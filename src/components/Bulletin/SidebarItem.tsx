import { Event, Member } from "@lib/constants";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, MapPin, MessagesSquare } from "lucide-react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { parseEventTime } from "@lib/eventListOrder";
import { isSlotFull } from "@lib/slotTime";
import { cn } from "@components/lib/utils";
import OrgAvatar from "@components/shell/OrgAvatar";

const ORG_AVATAR_BASE =
  "https://mxbwjmjpevvyejnugisy.supabase.co/storage/v1/object/public/profile.images";

function formatCardDate(startDate: string | undefined | null): string {
  if (!startDate) return "";
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return "";
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(d);
  return `${date} · ${time}`;
}

type EventStatus = { label: string; className: string } | null;

function eventStatus(
  event: Event,
  rsvpByEvent: Record<string, string> | null,
  attendedByEvent: Record<string, string> | null,
): EventStatus {
  const id = String(event.id);
  if (attendedByEvent?.[id]) {
    return { label: "Attended", className: "bg-emerald-600 text-white" };
  }
  if (rsvpByEvent?.[id]) {
    return { label: "RSVP'd", className: "bg-brand-600 text-white" };
  }
  const endTime = parseEventTime(event.end_date) ?? parseEventTime(event.start_date);
  if (endTime !== null && endTime < Date.now()) {
    return { label: "Past", className: "bg-white/90 text-ink-secondary" };
  }
  const slots = event.slots ?? [];
  const full =
    slots.length > 0
      ? slots.every(isSlotFull)
      : event.attendance_cap != null && event.attendance >= event.attendance_cap;
  if (full) {
    return { label: "Full", className: "bg-amber-500 text-white" };
  }
  return null;
}

export function SidebarClub({
  daton,
  setSelection,
  selection,
  featured = false,
}: {
  daton: Event;
  setSelection: (selection: string) => void;
  selection: string;
  featured?: boolean;
}) {
  const [imageURL, setImageURL] = useState("");
  const [posterBroken, setPosterBroken] = useState(false);
  const navigate = useNavigate();
  const { rsvpByEvent, attendedByEvent } = useContext(BulletinContext);
  const isSelected = selection === String(daton.id);
  const isForum = daton.type === "forum";
  const status = eventStatus(daton, rsvpByEvent, attendedByEvent);
  const dateLine = isForum ? "" : formatCardDate(daton.start_date);
  const visibleTags = (daton.tags ?? []).filter(Boolean).slice(0, 3);

  useEffect(() => {
    setImageURL(`${ORG_AVATAR_BASE}/${daton.orgs?.name}/${daton.orgs?.pfp_str}`);
  }, []);

  const goToEvent = () => {
    const id = String(daton.id);
    if (isSelected) {
      navigate("/bulletin/-1");
      setSelection("-1");
    } else {
      navigate(`/bulletin/${daton.id}`);
      setSelection(id);
    }
  };

  const poster = (
    <>
      {daton.poster && !posterBroken ? (
        <img
          src={daton.poster}
          alt=""
          loading="lazy"
          onError={() => setPosterBroken(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      ) : daton.type === "internal" ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white">
            {daton.orgs?.name?.charAt(0) ?? "T"}
          </span>
        </div>
      ) : (
        <div className="h-full w-full animate-pulse bg-brand-100" />
      )}
      {status && (
        <span
          className={cn(
            "absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
            status.className,
          )}
        >
          {status.label}
        </span>
      )}
    </>
  );

  if (featured) {
    return (
      <button
        key={daton.id}
        type="button"
        onClick={goToEvent}
        className={cn(
          "card-shadow group grid w-full cursor-pointer overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 hover:-translate-y-0.5 card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
          isSelected ? "border-brand-500 ring-2 ring-brand-500/40" : "border-line",
        )}
      >
        {!isForum && <div className="relative aspect-video w-full overflow-hidden sm:aspect-auto sm:h-full sm:min-h-[240px]">{poster}</div>}
        <div className="flex min-w-0 flex-col justify-center gap-2 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <OrgAvatar
              name={daton.orgs?.name}
              src={daton.orgs?.pfp_str ? imageURL : null}
              className="h-7 w-7"
            />
            <span className="truncate text-sm font-medium text-ink-secondary">
              {daton.orgs ? daton.orgs.name : "unknown"}
            </span>
            {isForum && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                <MessagesSquare className="h-3 w-3" /> Forum
              </span>
            )}
          </div>
          <span className="line-clamp-2 text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
            {daton.title}
          </span>
          {dateLine && (
            <span className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <CalendarDays className="h-4 w-4 shrink-0 text-brand-500" />
              {dateLine}
            </span>
          )}
          {!isForum && daton.location_str && (
            <span className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="truncate">{daton.location_str}</span>
            </span>
          )}
          {visibleTags.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                >
                  {tag}
                </span>
              ))}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      key={daton.id}
      type="button"
      onClick={goToEvent}
      className={cn(
        "card-shadow group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 hover:-translate-y-0.5 card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        isSelected ? "border-brand-500 ring-2 ring-brand-500/40" : "border-line",
      )}
    >
      {!isForum && (
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-brand-50">
          {poster}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <OrgAvatar
            name={daton.orgs?.name}
            src={daton.orgs?.pfp_str ? imageURL : null}
            className="h-6 w-6"
            initialClassName="text-xs"
          />
          <span className="truncate text-[13px] font-medium text-ink-secondary">
            {daton.orgs ? daton.orgs.name : "unknown"}
          </span>
          {isForum && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              <MessagesSquare className="h-3 w-3" /> Forum
            </span>
          )}
          {isForum && status && (
            <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", status.className)}>
              {status.label}
            </span>
          )}
        </div>
        <span className="line-clamp-2 text-[17px] font-bold leading-snug tracking-tight text-ink">
          {daton.title}
        </span>
        {dateLine && (
          <span className="flex items-center gap-1.5 text-[13px] text-ink-secondary">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brand-500" />
            {dateLine}
          </span>
        )}
        {!isForum && daton.location_str && (
          <span className="flex items-center gap-1.5 text-[13px] text-ink-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
            <span className="truncate">{daton.location_str}</span>
          </span>
        )}
        {visibleTags.length > 0 && (
          <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </div>
    </button>
  );
}

export function SidebarCompany({
  daton,
  setSelection,
  selection,
}: {
  daton: Member;
  setSelection: (selection: string) => void;
  selection: string;
}) {
  const navigate = useNavigate();
  const isSelected = selection === daton.email;
  const fullName =
    daton.first_name && daton.last_name
      ? `${daton.first_name} ${daton.last_name}`
      : "Unknown";
  const initials = fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      key={daton.email}
      type="button"
      className={cn(
        "card-shadow flex w-full cursor-pointer flex-col gap-3 rounded-2xl border bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        isSelected ? "border-brand-500 ring-2 ring-brand-500/40" : "border-line",
      )}
      onClick={() => {
        if (isSelected) {
          navigate("/bulletin/-1");
          setSelection("-1");
        } else {
          navigate(`/bulletin/${daton.email}`);
          setSelection(daton.email);
        }
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
          {initials || "?"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[16px] font-bold leading-snug text-ink">
            {fullName}
          </span>
          <span className="block truncate text-[13px] text-ink-secondary">
            {daton.major} | {daton.expected_grad}
          </span>
        </span>
      </div>
      <span className="block truncate text-[13px] font-medium text-ink-secondary">
        {daton.email}
      </span>
    </button>
  );
}
