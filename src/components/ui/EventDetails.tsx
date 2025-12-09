import React from 'react';
import { AttendedEvent } from '../lib/interfaces/AttendedEvent';

interface EventDetailsProps {
  event: AttendedEvent;
  onClose: () => void;
  onAddFeedback: (eventId: string) => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onAddFeedback }) => {
  if (!event) return null; 

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}
    >
      <div 
        style={{ 
          background: 'white', padding: '20px', width: '600px', 
          maxHeight: '90vh', overflowY: 'auto', borderRadius: '8px', color: 'black'
        }}
      >
        <h2>{event.title}</h2>
        <p>Location: {event.location}</p>
        <p>{event.description}</p>
        
        <button onClick={() => onAddFeedback(event.id)} style={{ marginRight: '10px' }}>
          Add Feedback
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default EventDetails;