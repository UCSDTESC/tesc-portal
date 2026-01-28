import React from 'react';
import { AttendedEvent } from '../lib/interfaces/AttendedEvent';

interface EventCardProps {
  event: AttendedEvent;
  onViewDetails: (event: AttendedEvent) => void;
}

const formatEventDate = (dateString: string): string => {
  try {
    const [startDateStr, endDateStr] = dateString.split(' - ');
    if (!startDateStr || !endDateStr) return dateString;
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    const dateOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', day: 'numeric', year: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', minute: '2-digit', hour12: true 
    };
    
    const startDateFormatted = startDate.toLocaleDateString('en-US', dateOptions);
    const startTimeFormatted = startDate.toLocaleTimeString('en-US', timeOptions);
    const endTimeFormatted = endDate.toLocaleTimeString('en-US', timeOptions);
    
    return startDate.toDateString() === endDate.toDateString()
      ? `${startDateFormatted}, ${startTimeFormatted} - ${endTimeFormatted}`
      : `${startDateFormatted}, ${startTimeFormatted} - ${endDate.toLocaleDateString('en-US', dateOptions)}, ${endTimeFormatted}`;
  } catch (error) {
    return dateString;
  }
};

const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
  const formattedDate = formatEventDate(event.date);
  
  // points color
  const badgeColor = event.points > 0 ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div
      onClick={() => onViewDetails(event)}
      className="group relative h-[320px] w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* image + title */}
      <div 
        className="relative flex h-[60%] items-end overflow-hidden bg-cover bg-center p-4"
        style={{
          backgroundImage: `url(${event.coverImage || ''})`,
        }}
      >
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
        <h3 className="relative z-10 text-lg font-bold leading-tight text-white">{event.title}</h3>
      </div>

      {/* event details */}
      <div className="flex h-[40%] flex-col justify-between bg-white p-4 text-gray-800">
        <div>
          <p className="text-sm font-semibold">{formattedDate}</p>
          <p className="mt-1 text-xs font-medium text-gray-600 line-clamp-1">{event.location}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`${badgeColor} rounded-md px-2 py-1 text-[11px] font-semibold text-white`}>
            Attended ({event.category})
          </span>
          <span className="text-sm font-bold text-gray-900">
            {event.points} pts
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;