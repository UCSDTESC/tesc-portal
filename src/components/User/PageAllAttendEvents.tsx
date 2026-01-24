// TODO: FIX
// this is for the all-attended-events page when yo uwant to look at every event
// you attended -- through the recently attended events bar
// but it doesn't work right now sorry

import React, { useState, useEffect, useContext } from "react";
import EventCard from '@components/ui/EventCard'; 
import { AttendedEvent } from '../lib/interfaces/AttendedEvent';
import { fetchAttendedEvents } from '../../services/user';
import UserContext from "@lib/UserContext";
import { useNavigate } from "react-router"; 

const PageAllAttendEvents: React.FC = () => {
    console.log("PageAllAttendEvents Component Loaded.");
    const { User } = useContext(UserContext); 
    console.log("User Context Retrieved:", User);
    const navigate = useNavigate();

    const [allEvents, setAllEvents] = useState<AttendedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                
                // Filter to only past events and sort by date (newest first)
                const now = new Date();
                const pastEvents = (events || []).filter(event => {
                    const eventEndDate = new Date(event.date.split(' - ')[1] || event.date.split(' - ')[0]);
                    return eventEndDate < now;
                });
                
                const sortedEvents = pastEvents.sort((a, b) => 
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
    
    // handler - navigate to bulletin page
    const handleViewDetails = (event: AttendedEvent) => {
        navigate(`/bulletin/${event.id}`);
    };

    // loading + error states
    if (loading) return <p>Loading event history...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!User && loading) return <p>Checking user session...</p>;
    if (!User || !User.id) return <h1>Please log in to view history.</h1>;

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>Full Attended Event History</h1>
            
            {allEvents.length === 0 ? (
                <p>No past event history found.</p>
            ) : (
                <div 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '24px',
                        width: '100%',
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
        </div>
    );
};

export default PageAllAttendEvents;