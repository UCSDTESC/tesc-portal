// TODO: FIX
// this is for the all-attended-events page when yo uwant to look at every event
// you attended -- through the recently attended events bar
// but it doesn't work right now sorry

import React, { useState, useEffect, useContext } from "react";
import EventCard from './EventCard'; 
import EventDetails from './EventDetails';
import { AttendedEvent } from '../lib/interfaces/AttendedEvent';
import { fetchAttendedEvents } from '../../services/user';
import UserContext from "@lib/UserContext"; 

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
                
                const sortedEvents = (events || []).sort((a, b) => 
                    new Date(b.date.split(' - ')[0]).getTime() - new Date(a.date.split(' - ')[0]).getTime()
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

    if (loading) return <p>Loading event history...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!User || !User.id) return <h1>Please log in to view history.</h1>;
    
    //page structure
    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>Full Attended Event History</h1>
            
            {allEvents.length === 0 ? (
                <p>No event history found.</p>
            ) : (
                // grid layout
                <div 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '20px', 
                    }}
                >
                    {allEvents.map((event) => (
                        <EventCard 
                            key={event.id} 
                            event={event} 
                            onViewDetails={handleViewDetails} 
                        />
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