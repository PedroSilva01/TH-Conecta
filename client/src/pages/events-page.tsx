import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { EventCard } from "@/components/events/event-card";
import { CulturalEvent } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPin, Clock, X } from "lucide-react";

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  
  // Fetch cultural events
  const { data: events, isLoading } = useQuery<CulturalEvent[]>({
    queryKey: ["/api/cultural-events"],
  });
  
  // Filter events by category
  const filteredEvents = events 
    ? activeCategory === "all" 
      ? events 
      : events.filter(event => event.category.toLowerCase() === activeCategory.toLowerCase())
    : [];
  
  const categories = [
    { id: "all", name: "Todos" },
    { id: "música", name: "Música" },
    { id: "teatro", name: "Teatro" },
    { id: "dança", name: "Dança" },
    { id: "exposição", name: "Exposição" }
  ];
  
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };
  
  const handleEventDetailsClick = (eventId: number) => {
    const event = events?.find(event => event.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setEventDetailsOpen(true);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Eventos Culturais" />

      {/* Filter Tabs */}
      <div className="bg-white border-b border-neutral-100">
        <div className="p-1 flex overflow-x-auto hide-scrollbar">
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`min-w-max font-medium rounded-full px-4 py-2 mr-2 ${
                activeCategory === category.id 
                  ? "bg-primary text-white" 
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-neutral-500">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Carregando eventos culturais...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onDetailsClick={handleEventDetailsClick} 
            />
          ))
        ) : (
          <div className="py-8 text-center text-neutral-500">
            <p>Nenhum evento encontrado para esta categoria.</p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
          <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-0">
              <div 
                className="w-full h-48 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${selectedEvent.imageUrl || ''})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                  <DialogTitle className="text-white text-xl mb-1">{selectedEvent.title}</DialogTitle>
                  <span className="inline-block bg-secondary/80 text-white text-sm font-medium px-2 py-1 rounded-md w-fit">
                    {selectedEvent.category}
                  </span>
                </div>
                <button 
                  onClick={() => setEventDetailsOpen(false)} 
                  className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>
            
            <div className="p-4">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center text-neutral-700">
                  <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                  <span>{selectedEvent.date}, {selectedEvent.time}</span>
                </div>
                <div className="flex items-center text-neutral-700">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center text-neutral-700">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  <span>Duração: aproximadamente 2 horas</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Descrição</h3>
                <p className="text-neutral-600 text-sm">{selectedEvent.description}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Preço</h3>
                <div className="flex items-center bg-neutral-100 p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{selectedEvent.price}</p>
                    {selectedEvent.discount && (
                      <p className="text-sm text-green-600">{selectedEvent.discount}</p>
                    )}
                  </div>
                  {selectedEvent.discount && (
                    <Button>Obter Desconto</Button>
                  )}
                </div>
              </div>
              
              <Button className="w-full">Comprar Ingresso</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
