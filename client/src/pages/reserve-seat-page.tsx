import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { SeatMap } from "@/components/seats/seat-map";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BusLine, insertSeatReservationSchema } from "@shared/schema";
import { Calendar, CalendarClock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function ReserveSeatPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [selectedBusLine, setSelectedBusLine] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("Hoje, 21 Out");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  
  // Get bus lines
  const { data: busLines, isLoading: isLoadingBusLines } = useQuery<BusLine[]>({
    queryKey: ["/api/bus-lines"],
  });
  
  // Get selected bus line details
  const selectedBusLineDetails = busLines?.find(line => line.name === selectedBusLine);
  
  // Reserve seat mutation
  const reserveSeatMutation = useMutation({
    mutationFn: async (reservationData: z.infer<typeof insertSeatReservationSchema>) => {
      const res = await apiRequest("POST", "/api/seat-reservations", reservationData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seat-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Assento reservado com sucesso!",
        description: `Você reservou o assento ${selectedSeat} na ${selectedBusLine}.`
      });
      
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Erro ao reservar assento",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleConfirmReservation = () => {
    if (!selectedBusLine || !selectedSeat || !user) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione a linha, data, horário e um assento.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a Date object for the reservation
    const today = new Date();
    const reservationDate = new Date(today);
    
    // Parse the time string (e.g., "11:30")
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      reservationDate.setHours(hours, minutes, 0, 0);
    }
    
    // Price for seat reservation (could come from the API in a real app)
    const reservationPrice = 2.00;
    
    // Create reservation
    reserveSeatMutation.mutate({
      userId: user.id,
      busLine: selectedBusLine,
      departureTime: reservationDate,
      seatNumber: selectedSeat,
      price: reservationPrice,
      status: "active"
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Reservar Assento" />

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {/* Line Selection */}
          <div className="mb-4">
            <label className="block text-sm text-neutral-500 mb-1">Linha de ônibus</label>
            <div className="relative">
              <Select 
                value={selectedBusLine} 
                onValueChange={setSelectedBusLine}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma linha" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingBusLines ? (
                    <SelectItem value="loading" disabled>Carregando linhas...</SelectItem>
                  ) : (
                    busLines?.map((line, index) => (
                      <SelectItem key={index} value={line.name}>
                        {line.name} - {line.origin} → {line.destination}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Date Selection */}
          <div className="mb-4">
            <label className="block text-sm text-neutral-500 mb-1">Data</label>
            <div className="relative">
              <Input 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                placeholder="Selecione a data" 
              />
              <Calendar className="absolute right-3 top-3 h-5 w-5 text-neutral-500" />
            </div>
          </div>
          
          {/* Time Selection */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Horário</label>
            <div className="relative">
              <Select 
                value={selectedTime} 
                onValueChange={setSelectedTime}
                disabled={!selectedBusLine}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {!selectedBusLine ? (
                    <SelectItem value="select-line" disabled>Selecione uma linha primeiro</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="11:30">11:30</SelectItem>
                      <SelectItem value="12:30">12:30</SelectItem>
                      <SelectItem value="13:30">13:30</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <CalendarClock className="absolute right-10 top-3 h-5 w-5 text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Seat Map */}
        <h3 className="text-lg font-medium mb-3">Selecione seu assento</h3>
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary rounded-md mr-2"></div>
              <span className="text-sm">Selecionado</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-neutral-100 border border-neutral-400 rounded-md mr-2"></div>
              <span className="text-sm">Disponível</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-neutral-500 rounded-md mr-2"></div>
              <span className="text-sm">Ocupado</span>
            </div>
          </div>
          
          {selectedBusLine && selectedTime ? (
            <SeatMap
              busLine={selectedBusLine}
              departureTime={new Date()}
              onSeatSelect={setSelectedSeat}
              selectedSeat={selectedSeat}
            />
          ) : (
            <div className="py-10 text-center text-neutral-500">
              Por favor, selecione uma linha e horário para visualizar os assentos disponíveis.
            </div>
          )}
          
          <div className="border-t border-neutral-100 pt-4 mt-6">
            <div className="flex justify-between mb-4">
              <div>
                <span className="text-sm text-neutral-500">Assento selecionado</span>
                <p className="font-medium">{selectedSeat || "-"}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-neutral-500">Preço</span>
                <p className="font-medium">{formatCurrency(2.00)}</p>
              </div>
            </div>
            
            <Button 
              onClick={handleConfirmReservation}
              disabled={!selectedBusLine || !selectedTime || !selectedSeat || reserveSeatMutation.isPending}
              className="w-full"
            >
              {reserveSeatMutation.isPending ? "Processando..." : "Confirmar Reserva"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
