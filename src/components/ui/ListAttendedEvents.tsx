// for recently attended events feature

import React, { useState, useEffect } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import EventCard from "./EventCard";
// import EventDetails from './EventDetails';
import { AttendedEvent } from "../lib/interfaces/AttendedEvent";
import { fetchAttendedEvents } from "../../services/user";
import { useNavigate } from "react-router";
import EmptyState from "@components/shell/EmptyState";

// id of currently logged-in user
interface ListAttendedEventsProps {
  userId: string;
  title?: string;
}

const ListAttendedEvents: React.FC<ListAttendedEventsProps> = ({
  userId,
  title = "Recently Attended Events",
}) => {
  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // const [selectedEvent, setSelectedEvent] = useState<AttendedEvent | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { events, error: fetchError } = await fetchAttendedEvents(userId);

        if (fetchError) {
          throw new Error("Failed to fetch events from database.");
        }

        // newest to oldest
        const sortedEvents = (events || []).sort(
          (a, b) =>
            new Date(b.date.split(" - ")[0]).getTime() - new Date(a.date.split(" - ")[0]).getTime()
        );

        setAttendedEvents(sortedEvents);
      } catch (err) {
        console.error("Error loading attended events:", err);
        setError("Could not load attended events.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [userId]);

  // const handleViewDetails = (event: AttendedEvent) => {
  //   setSelectedEvent(event);
  // };
  // const handleCloseModal = () => {
  //   setSelectedEvent(null);
  // };
  // const handleAddFeedback = (eventId: string) => {
  //   console.log("Navigating to feedback form for event ID: ", eventId);
  //   handleCloseModal();
  // };

  // loading + error states
  if (loading) {
    return (
      <div className="min-w-0 w-full">
        <p className="flex items-center gap-2 text-sm text-ink-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading attended events...
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-w-0 w-full">
        <EmptyState
          title="Error: Could not load attended events."
          description="Something went wrong while loading your attended events. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        {attendedEvents.length > 0 && (
          <span className="shrink-0 text-sm font-medium text-ink-muted">
            {attendedEvents.length} {attendedEvents.length === 1 ? "event" : "events"}
          </span>
        )}
      </div>

      {attendedEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" />}
          title="It looks like you haven't attended any events yet!"
          description="Events you check in to will show up here."
        />
      ) : (
        <div className="scrollbar-thin -mx-1 flex flex-col gap-4 px-1 pb-5 md:flex-row md:overflow-x-auto">
          {attendedEvents.map((event) => (
            <div key={event.id} className="w-full min-w-0 md:w-[280px] md:shrink-0">
              <EventCard event={event} onViewDetails={() => navigate(`/bulletin/${event.id}`)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListAttendedEvents;
