import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarCheck, Clock, LogIn, MapPin } from "lucide-react";
import UserContext from "@lib/UserContext";
import { fetchRSVPAndAttended } from "@services/user";
import { fetchEventById } from "@services/event";
import type { Event } from "@lib/constants";
import { compareEventsByRecency, parseEventTime } from "@lib/eventListOrder";
import PageHeader from "@components/shell/PageHeader";
import EmptyState from "@components/shell/EmptyState";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function formatRange(event: Event): string {
  const start = parseEventTime(event.start_date);
  const end = parseEventTime(event.end_date);
  if (start === null) return "Date to be announced";
  const startLabel = `${dateFmt.format(new Date(start))} · ${timeFmt.format(new Date(start))}`;
  if (end !== null && end !== start) return `${startLabel} – ${timeFmt.format(new Date(end))}`;
  return startLabel;
}

function MyEventCard({
  event,
  status,
  onOpen,
}: {
  event: Event;
  status: "RSVP'd" | "Attended";
  onOpen: () => void;
}) {
  const isPast = (parseEventTime(event.end_date) ?? parseEventTime(event.start_date) ?? 0) < Date.now();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-shadow group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:card-shadow-hover"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {event.poster ? (
          <img
            src={event.poster}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-navy-800/10">
            <CalendarCheck className="h-10 w-10 text-brand-500/60" />
          </div>
        )}
        <span
          className={
            status === "Attended"
              ? "absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
              : isPast
                ? "absolute left-3 top-3 rounded-full bg-slate-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                : "absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
          }
        >
          {status}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {event.orgs?.name ?? "TESC"}
        </p>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink">{event.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatRange(event)}
        </p>
        {event.location_str && (
          <p className="flex items-center gap-1.5 truncate text-sm text-ink-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {event.location_str}
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * My Events — events the user RSVP'd to, upcoming first then past.
 * Built only from existing services: fetchRSVPAndAttended + fetchEventById.
 */
export default function MyEventsPage() {
  const { User, setShowLoginModal } = useContext(UserContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "My Events | TESC Portal";
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!User?.id || !User?.email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { rsvpByEvent, attendedByEvent, error: fetchError } = await fetchRSVPAndAttended(
          User.email,
        );
        if (fetchError) throw new Error("Could not load your events.");
        const ids = [
          ...Object.keys(rsvpByEvent ?? {}),
          ...Object.keys(attendedByEvent ?? {}),
        ];
        setAttendedIds(new Set(Object.keys(attendedByEvent ?? {})));
        const results = await Promise.all(ids.map((id) => fetchEventById(id)));
        const loaded = results.map((r) => r.event).filter(Boolean) as unknown as Event[];
        setEvents(loaded);
      } catch {
        setError("Could not load your events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [User?.id, User?.email]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up = events
      .filter((e) => (parseEventTime(e.end_date) ?? parseEventTime(e.start_date) ?? 0) >= now)
      .sort((a, b) => compareEventsByRecency(a, b, "current", now));
    const pa = events
      .filter((e) => (parseEventTime(e.end_date) ?? parseEventTime(e.start_date) ?? 0) < now)
      .sort((a, b) => compareEventsByRecency(a, b, "past", now));
    return { upcoming: up, past: pa };
  }, [events]);

  if (!User?.id) {
    return (
      <div>
        <PageHeader title="My Events" subtitle="Events you've registered for." />
        <EmptyState
          icon={<LogIn className="h-6 w-6" />}
          title="Please log in to view your events"
          description="Sign in with your UCSD Google account to see the events you've RSVP'd to."
          actions={
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              Log in
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your registrations"
        title="My Events"
        subtitle="Events you've RSVP'd to — upcoming first, then ones you've already been to."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-line bg-white">
              <div className="aspect-[16/9] bg-slate-200" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="h-4 w-4/5 rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Something went wrong" description={error} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" />}
          title="No events yet"
          description="You haven't RSVP'd to any events. Discover what's happening around campus."
          actions={
            <button
              type="button"
              onClick={() => navigate("/bulletin/-1")}
              className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              Discover events
            </button>
          }
        />
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Upcoming · {upcoming.length}
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((event) => (
                  <MyEventCard
                    key={String(event.id)}
                    event={event}
                    status={attendedIds.has(String(event.id)) ? "Attended" : "RSVP'd"}
                    onOpen={() => navigate(`/bulletin/${event.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Past · {past.length}
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {past.map((event) => (
                  <MyEventCard
                    key={String(event.id)}
                    event={event}
                    status={attendedIds.has(String(event.id)) ? "Attended" : "RSVP'd"}
                    onOpen={() => navigate(`/bulletin/${event.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
