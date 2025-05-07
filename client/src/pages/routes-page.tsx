import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Plus, 
  Minus, 
  Navigation, 
  MapPin,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BusLine } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all bus lines
  const { data: busLines, isLoading } = useQuery<BusLine[]>({
    queryKey: ["/api/bus-lines"],
  });
  
  // Filter bus lines based on search query
  const filteredBusLines = busLines
    ? busLines.filter((busLine) => 
        busLine.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        busLine.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        busLine.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Ver Rotas" />

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
          <Input 
            className="pl-10 pr-4" 
            placeholder="Para onde deseja ir?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Map View (Would be replaced with actual map component) */}
      <div className="relative flex-1">
        <div className="w-full h-64 bg-neutral-200 relative overflow-hidden">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100" fill="#e5e7eb" />
            <line x1="10" y1="10" x2="90" y2="10" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="20" x2="90" y2="20" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="30" x2="90" y2="30" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="40" x2="90" y2="40" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="60" x2="90" y2="60" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="70" x2="90" y2="70" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="80" x2="90" y2="80" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="90" x2="90" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="10" y1="10" x2="10" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="20" y1="10" x2="20" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="30" y1="10" x2="30" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="40" y1="10" x2="40" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="60" y1="10" x2="60" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="70" y1="10" x2="70" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="80" y1="10" x2="80" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="90" y1="10" x2="90" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
            <path d="M20,30 Q30,50 50,50 T80,70" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <circle cx="20" cy="30" r="2" fill="#ef4444" />
            <circle cx="80" cy="70" r="2" fill="#ef4444" />
          </svg>
          <div className="absolute left-4 top-4">
            <div className="bg-white p-2 rounded-md shadow-md text-sm">
              Este mapa seria substituído por um mapa interativo de verdade usando Google Maps ou Mapbox
            </div>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="absolute right-4 bottom-4 flex flex-col space-y-2">
          <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Minus className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Navigation className="h-5 w-5" />
          </button>
        </div>
        
        {/* Route Panel (pull-up) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg p-4">
          <div className="w-12 h-1 bg-neutral-300/50 rounded-full mx-auto mb-4"></div>
          
          <h3 className="text-lg font-medium mb-3">Rotas Sugeridas</h3>
          
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-neutral-500">
                Carregando rotas...
              </div>
            ) : filteredBusLines.length > 0 ? (
              filteredBusLines.map((busLine, index) => (
                <div key={index} className="border border-neutral-100 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded-md">
                        {busLine.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium">
                        {busLine.departureTime.split(':')[0] < busLine.arrivalTime.split(':')[0] 
                          ? parseInt(busLine.arrivalTime.split(':')[0]) - parseInt(busLine.departureTime.split(':')[0]) 
                          : (parseInt(busLine.arrivalTime.split(':')[0]) + 24) - parseInt(busLine.departureTime.split(':')[0])} min
                      </div>
                      <div className="text-sm text-neutral-500">
                        {(Math.floor(Math.random() * 5) + 3).toFixed(1)} km
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="relative mr-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="w-0.5 h-10 bg-neutral-300/50 absolute left-1.5 top-3"></div>
                      <div className="w-3 h-3 bg-orange-500 rounded-full absolute bottom-0"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        <p className="font-medium">{busLine.origin}</p>
                      </div>
                      <p className="text-sm text-neutral-500 mb-5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Partida: {busLine.departureTime}
                      </p>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-orange-500" />
                        <p className="font-medium">{busLine.destination}</p>
                      </div>
                      <p className="text-sm text-neutral-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Chegada: {busLine.arrivalTime}
                      </p>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    Ver Detalhes
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-neutral-500">
                Nenhuma rota encontrada para "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
