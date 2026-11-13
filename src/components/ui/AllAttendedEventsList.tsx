import React, { useState, useEffect, useContext } from "react";
import { CalendarCheck, Loader2, LogIn } from "lucide-react";
import EventCard from "./EventCard";
import EventDetails from "./EventDetails";
import { AttendedEvent } from "../lib/interfaces/AttendedEvent";
import { fetchAttendedEvents } from "../../services/user";
import UserContext from "@lib/UserContext";
import EmptyState from "@components/shell/EmptyState";

const AllAttendedEventsPage: React.FC = () => {
  const { User } = useContext(UserContext);

  const [allEvents, setAllEvents] = useState<AttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AttendedEvent | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      if (!User || !User.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { events, error: fetchError } = await fetchAttendedEvents(User.id);

        if (fetchError) throw new Error("Failed to fetch events.");

        const sortedEvents = (events || []).sort(
          (a, b) =>
            new Date(b.date.split(" - ")[0]).getTime() - new Date(a.date.split(" - ")[0]).getTime(),
        );

        setAllEvents(sortedEvents);
      } catch (err) {
        console.error("Error loading all attended events:", err);
        setError("Could not load full event history.");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [User]);

  // --- Handlers ---
  const handleViewDetails = (event: AttendedEvent) => setSelectedEvent(event);
  const handleCloseModal = () => setSelectedEvent(null);
  const handleAddFeedback = (eventId: string) => {
    console.log("Submitting feedback for Event ID: ", eventId);
    handleCloseModal();
  };

  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-ink-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading event history...
      </p>
    );
  if (error)
    return (
      <EmptyState
        title={`Error: ${error}`}
        description="Something went wrong while loading your event history. Please try again later."
      />
    );
  if (!User || !User.id)
    return (
      <EmptyState
        icon={<LogIn className="h-6 w-6" />}
        title="Please log in to view history."
        description="Sign in with your UCSD Google account to see the events you've attended."
      />
    );

  //page structure
  return (
    <div>
      {allEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" />}
          title="No event history found."
          description="Events you check in to will show up here."
        />
      ) : (
        // grid layout
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {allEvents.map((event) => (
            <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={handleCloseModal}
          onAddFeedback={handleAddFeedback}
        />
      )}
    </div>
  );
};

export default AllAttendedEventsPage;
