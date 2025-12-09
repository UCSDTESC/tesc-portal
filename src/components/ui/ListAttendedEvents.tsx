// for recently attended events feature

import React, { useState, useEffect } from 'react';
import EventCard from './EventCard'; 
import EventDetails from './EventDetails';
import { AttendedEvent } from '../lib/interfaces/AttendedEvent';
import { fetchAttendedEvents } from '../../services/user';

// id of currently logged-in user
interface ListAttendedEventsProps {
  userId: string;
}

const ListAttendedEvents: React.FC<ListAttendedEventsProps> = ({ userId }) => {
  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AttendedEvent | null>(null);

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
        const sortedEvents = (events || []).sort((a, b) => 
            new Date(b.date.split(' - ')[0]).getTime() - new Date(a.date.split(' - ')[0]).getTime()
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


  const handleViewDetails = (event: AttendedEvent) => {
    setSelectedEvent(event);
  };
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };
  const handleAddFeedback = (eventId: string) => {
    console.log("Navigating to feedback form for event ID: ", eventId);
    handleCloseModal(); 
  };
  
  // loading + error states
  if (loading) {
      return <p>Loading attended events...</p>;
  }
  if (error) {
      return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        Recently Attended Events
        <a 
            href="/profile/all-attended-events" 
            style={{ fontSize: '14px', color: '#888', textDecoration: 'none' }}
        >
            See all events &gt;
        </a>
      </h2>

      {attendedEvents.length === 0 ? (
        <p>It looks like you haven't attended any events yet!</p>
      ) : (
        <div 
        style={{ 
          display: 'flex', 
          gap: '20px', 
          overflowX: 'scroll',
          paddingBottom: '20px',
          scrollbarWidth: 'thin'
        }}
        >
          {/* render list of event cards */}
          {attendedEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onViewDetails={handleViewDetails} 
            />
          ))}
        </div>
      )}

      {/* render event details */}
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

export default ListAttendedEvents;