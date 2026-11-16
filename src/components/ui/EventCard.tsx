import React from "react";
import { CalendarDays, Check, Diamond, MapPin } from "lucide-react";
import { AttendedEvent } from "../lib/interfaces/AttendedEvent";

interface EventCardProps {
  event: AttendedEvent;
  onViewDetails: (event: AttendedEvent) => void;
}

const formatEventDate = (dateString: string): string => {
  try {
    const [startDateStr, endDateStr] = dateString.split(" - ");
    if (!startDateStr || !endDateStr) return dateString;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const startDateFormatted = startDate.toLocaleDateString("en-US", dateOptions);
    const startTimeFormatted = startDate.toLocaleTimeString("en-US", timeOptions);
    const endTimeFormatted = endDate.toLocaleTimeString("en-US", timeOptions);

    return startDate.toDateString() === endDate.toDateString()
      ? `${startDateFormatted}, ${startTimeFormatted} - ${endTimeFormatted}`
      : `${startDateFormatted}, ${startTimeFormatted} - ${endDate.toLocaleDateString("en-US", dateOptions)}, ${endTimeFormatted}`;
  } catch (error) {
    return dateString;
  }
};

const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
  const formattedDate = formatEventDate(event.date);

  // points color
  const pointsBadge =
    event.points > 0
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : "bg-amber-50 text-amber-700 ring-amber-600/20";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(event);
        }
      }}
      className="card-shadow group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {/* poster */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-gradient-to-br from-navy-800 via-navy-900 to-brand-700 p-4">
            <span className="line-clamp-2 text-base font-semibold leading-snug text-white">
              {event.title}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-navy-900 shadow-sm">
          {event.category}
        </span>
      </div>

      {/* event details */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
          {event.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <CalendarDays className="h-4 w-4 shrink-0 text-ink-muted" />
          <span className="min-w-0 truncate">{formattedDate}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <MapPin className="h-4 w-4 shrink-0 text-ink-muted" />
          <span className="min-w-0 truncate">{event.location}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/10">
            <Check className="h-3 w-3" />
            Attended
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${pointsBadge}`}
          >
            <Diamond className="h-3 w-3" />
            {event.points} pts
          </span>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
