// for recently attended events feature

import React, { useState, useEffect } from "react";
import EventCard from "./EventCard";
// import EventDetails from './EventDetails';
import { AttendedEvent } from "../lib/interfaces/AttendedEvent";
import { fetchAttendedEvents } from "../../services/user";
import { useNavigate } from "react-router";

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
    return <p>Loading attended events...</p>;
  }
  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  return (
    <div className="min-w-0 w-full">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>

      {attendedEvents.length === 0 ? (
        <p>It looks like you haven't attended any events yet!</p>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-5">
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
