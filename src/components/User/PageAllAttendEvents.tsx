import React, { useState, useEffect, useContext } from "react";
import { CalendarCheck, Loader2, LogIn, Search } from "lucide-react";
import EventCard from "@components/ui/EventCard";
import { AttendedEvent } from "../lib/interfaces/AttendedEvent";
import { fetchAttendedEvents } from "../../services/user";
import UserContext from "@lib/UserContext";
import { useNavigate } from "react-router";
import PageHeader from "@components/shell/PageHeader";
import EmptyState from "@components/shell/EmptyState";

const PageAllAttendEvents: React.FC = () => {
  console.log("PageAllAttendEvents Component Loaded.");
  const { User } = useContext(UserContext);
  console.log("User Context Retrieved:", User);
  const navigate = useNavigate();

  const [allEvents, setAllEvents] = useState<AttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

        // only filter for past events
        // sort by date -- newest first
        const now = new Date();
        const pastEvents = (events || []).filter((event) => {
          const eventEndDate = new Date(event.date.split(" - ")[1] || event.date.split(" - ")[0]);
          return eventEndDate < now;
        });

        const sortedEvents = pastEvents.sort(
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

  // handler - navigate to bulletin page
  const handleViewDetails = (event: AttendedEvent) => {
    navigate(`/bulletin/${event.id}`);
  };

  // Filter events based on search query
  const filteredEvents = allEvents.filter((event) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const searchableText = [event.title, event.location, event.category, event.description || ""]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  // loading + error states
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
  if (!User && loading) return <p>Checking user session...</p>;
  if (!User || !User.id)
    return (
      <EmptyState
        icon={<LogIn className="h-6 w-6" />}
        title="Please log in to view history."
        description="Sign in with your UCSD Google account to see the events you've attended."
      />
    );

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Attendance History"
        subtitle="Every event you've checked in to, newest first."
        actions={
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/10">
            {allEvents.length} {allEvents.length === 1 ? "event" : "events"} attended
          </span>
        }
      />

      {/* Search Bar */}
      {allEvents.length > 0 && (
        <div className="mb-6">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search events by title, location, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-ink-secondary">
              Showing {filteredEvents.length} of {allEvents.length} events
            </p>
          )}
        </div>
      )}

      {allEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" />}
          title="No past event history found."
          description="Events you check in to will show up here once you've attended one."
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={`No events match your search "${searchQuery}"`}
          description="Try a different title, location, or category."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PageAllAttendEvents;
