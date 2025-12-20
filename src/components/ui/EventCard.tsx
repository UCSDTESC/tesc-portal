import React from 'react';
import { AttendedEvent } from '../lib/interfaces/AttendedEvent'; 

interface EventCardProps {
  event: AttendedEvent;
  onViewDetails: (event: AttendedEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
  const coverImageUrl = event.coverImage || 'transparent'; 
  const pointsColor = event.points > 0 ? '#10B981' : '#F59E0B'; 

  return (
    <div
      style={{
        width: '300px',
        height: '320px',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        flexShrink: 0,
        backgroundColor: '#fff',
        position: 'relative',
      }}
      onClick={() => onViewDetails(event)}
    >
      {/* top section w image + title */}
      <div style={{
        height: '60%', 
        display: 'flex', 
        alignItems: 'flex-end',
        padding: '10px',
        color: 'white',

        background: `linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%), url(${coverImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{event.title}</h3>
      </div>

      {/* bottom section w details/info */}
      <div style={{ 
        backgroundColor: '#F7F7F7',
        height: '40%',
        padding: '10px 15px', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#333',
      }}>
        <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{event.date}</p>
            <p style={{ margin: '3px 0 8px 0', fontSize: '12px', color: '#666' }}>{event.location}</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            backgroundColor: pointsColor,
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '6px', 
            fontSize: '11px',
            fontWeight: '600'
          }}>
            Attended ({event.category})
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
            {event.points} pts
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;