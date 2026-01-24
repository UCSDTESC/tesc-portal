import React from 'react';
import { AttendedEvent } from '../lib/interfaces/AttendedEvent'; 

interface EventCardProps {
  event: AttendedEvent;
  onViewDetails: (event: AttendedEvent) => void;
}

// Format date range from "start_date - end_date" to readable format
const formatEventDate = (dateString: string): string => {
  try {
    const [startDateStr, endDateStr] = dateString.split(' - ');
    if (!startDateStr || !endDateStr) return dateString;
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Format options
    const dateOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    };
    
    const startDateFormatted = startDate.toLocaleDateString('en-US', dateOptions);
    const startTimeFormatted = startDate.toLocaleTimeString('en-US', timeOptions);
    const endTimeFormatted = endDate.toLocaleTimeString('en-US', timeOptions);
    
    // Check if same day
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    if (isSameDay) {
      return `${startDateFormatted}, ${startTimeFormatted} - ${endTimeFormatted}`;
    } else {
      const endDateFormatted = endDate.toLocaleDateString('en-US', dateOptions);
      return `${startDateFormatted}, ${startTimeFormatted} - ${endDateFormatted}, ${endTimeFormatted}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
  const coverImageUrl = event.coverImage || 'transparent'; 
  const pointsColor = event.points > 0 ? '#10B981' : '#F59E0B';
  const formattedDate = formatEventDate(event.date); 

  return (
    <div
      style={{
        width: '100%',
        height: '320px',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={() => onViewDetails(event)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
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
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{formattedDate}</p>
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