import React from "react";
import { CalendarDays, Diamond, MapPin, Tag, X } from "lucide-react";
import { AttendedEvent } from "../lib/interfaces/AttendedEvent";

interface EventDetailsProps {
  event: AttendedEvent;
  onClose: () => void;
  onAddFeedback: (eventId: string) => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onAddFeedback }) => {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className="card-shadow max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* poster */}
        {event.coverImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-brand-50">
            <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">{event.title}</h2>
            {!event.coverImage && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-ink-secondary">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-ink-muted" />
              {event.date}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-ink-muted" />
              {event.location}
            </p>
            <p className="flex items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-ink-muted" />
              {event.category}
            </p>
            <p className="flex items-center gap-2">
              <Diamond className="h-4 w-4 shrink-0 text-ink-muted" />
              {event.points} points earned
            </p>
          </div>

          {event.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
              {event.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAddFeedback(event.id)}
              className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Add Feedback
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
