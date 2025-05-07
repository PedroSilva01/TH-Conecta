import { CalendarIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CulturalEvent } from "@shared/schema";
import { truncateText } from "@/lib/utils";

interface EventCardProps {
  event: CulturalEvent;
  onDetailsClick: (eventId: number) => void;
}

export function EventCard({ event, onDetailsClick }: EventCardProps) {
  // Display placeholder image if none provided
  const imageUrl = event.imageUrl || 
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Cpath d='M30,30 L70,70 M30,70 L70,30' stroke='%23cbd5e1' stroke-width='5'/%3E%3C/svg%3E";
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
      <div 
        className="w-full h-40 bg-cover bg-center" 
        style={{ backgroundImage: `url(${imageUrl})` }} 
      />
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{event.title}</h3>
          <span className="inline-block bg-secondary/10 text-secondary text-sm font-medium px-2 py-1 rounded-md">
            {event.category}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-neutral-500 mb-3">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{event.date}, {event.time}</span>
          <MapPin className="h-4 w-4 mr-1 ml-4" />
          <span>{event.location}</span>
        </div>
        
        <p className="text-neutral-500 text-sm mb-4">
          {truncateText(event.description, 100)}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {event.discount ? (
              <>
                <svg className="h-4 w-4 text-secondary mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.5 4.27c.35-.22.8-.19 1.1.08l8.5 7.5c.4.35.4.96 0 1.3l-8.5 7.5c-.3.27-.75.3-1.1.08-.35-.22-.56-.63-.56-1.08V5.35c0-.45.21-.86.56-1.08z" />
                </svg>
                <span className="text-secondary font-medium">{event.discount}</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-secondary mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <span className="text-secondary font-medium">{event.price}</span>
              </>
            )}
          </div>
          <Button 
            onClick={() => onDetailsClick(event.id)} 
            size="sm" 
            className="shadow-sm"
          >
            Mais Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
}
