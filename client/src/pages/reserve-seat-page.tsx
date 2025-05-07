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
import { Button } from "@/components/ui/button";
import { BusLine, Ticket, insertSeatReservationSchema } from "@shared/schema";
import { CalendarClock, Info, Ticket as TicketIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReserveSeatPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [selectedBusLine, setSelectedBusLine] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [openDatePicker, setOpenDatePicker] = useState(false);
  
  // Get user tickets
  const { data: userTickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });
  
  // Get bus lines (only from purchased tickets)
  const { data: busLines, isLoading: isLoadingBusLines } = useQuery<BusLine[]>({
    queryKey: ["/api/bus-lines"],
  });
  
  // Filter bus lines to only show those the user has tickets for
  const purchasedBusLines = busLines?.filter(busLine => 
    userTickets?.some(ticket => ticket.busLine === busLine.name)
  );
  
  // Get selected bus line details
  const selectedBusLineDetails = busLines?.find(line => line.name === selectedBusLine);
  
  // Check if the time is off-peak for discount
  const isOffPeakTime = (time: string): boolean => {
    const hour = parseInt(time.split(':')[0]);
    // Off-peak hours are before 7am, between 10am-4pm, and after 8pm
    return (hour < 7) || (hour >= 10 && hour < 16) || (hour >= 20);
  };
  
  // Format date display
  const formattedSelectedDate = selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR }) : "";
  
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
  
  // Calculate price based on user category and time
  const calculatePrice = (): number => {
    // Base price
    let price = 2.00;
    
    // Apply discount for off-peak times (20% off)
    if (selectedTime && isOffPeakTime(selectedTime)) {
      price = price * 0.8;
    }
    
    // For a real app, check user category (student, child) from API
    // Could be determined by checking user.type or verification status
    
    return price;
  };
  
  const reservationPrice = calculatePrice();
  
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
    const reservationDate = new Date(selectedDate);
    
    // Parse the time string (e.g., "11:30")
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      reservationDate.setHours(hours, minutes, 0, 0);
    }
    
    // Create reservation
    reserveSeatMutation.mutate({
      userId: user.id,
      busLine: selectedBusLine,
      departureTime: reservationDate,
      seatNumber: selectedSeat,
      price: String(reservationPrice.toFixed(2)), // Convert to string to match schema
      status: "active"
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Reservar Assento" />

      {/* Main Content */}
      <div className="flex-1 p-4">
        {!isLoadingTickets && (!userTickets || userTickets.length === 0) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start">
            <TicketIcon className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-800">Sem passagens disponíveis</h3>
              <p className="text-sm text-orange-700 mt-1">
                Você precisa comprar uma passagem antes de reservar um assento. 
                Retorne para a página principal e selecione "Comprar Passagem".
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-white hover:bg-orange-100 text-orange-700 border-orange-200"
                onClick={() => navigate("/buy-ticket")}
              >
                Ir para Comprar Passagem
              </Button>
            </div>
          </div>
        )}
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
                  {isLoadingBusLines || isLoadingTickets ? (
                    <SelectItem value="loading" disabled>Carregando linhas...</SelectItem>
                  ) : purchasedBusLines && purchasedBusLines.length > 0 ? (
                    purchasedBusLines.map((line, index) => (
                      <SelectItem key={index} value={line.name}>
                        {line.name} - {line.origin} → {line.destination}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-tickets" disabled>
                      Você não possui passagens. Compre uma passagem primeiro.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Date Selection */}
          <div className="mb-4">
            <label className="block text-sm text-neutral-500 mb-1">Data</label>
            <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {formattedSelectedDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date || new Date());
                    setOpenDatePicker(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time Selection */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Horário 
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline-block ml-1 h-4 w-4 text-neutral-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">
                      Desconto de 20% em horários fora de pico: antes das 7h, entre 10h e 16h, e após 20h.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
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
                      <SelectItem value="06:30" className="flex items-center justify-between">
                        <span>06:30</span>
                        <span className="text-green-600 text-xs">Desconto de 20%</span>
                      </SelectItem>
                      <SelectItem value="07:30">07:30</SelectItem>
                      <SelectItem value="08:30">08:30</SelectItem>
                      <SelectItem value="11:30" className="flex items-center justify-between">
                        <span>11:30</span>
                        <span className="text-green-600 text-xs">Desconto de 20%</span>
                      </SelectItem>
                      <SelectItem value="12:30" className="flex items-center justify-between">
                        <span>12:30</span>
                        <span className="text-green-600 text-xs">Desconto de 20%</span>
                      </SelectItem>
                      <SelectItem value="17:30">17:30</SelectItem>
                      <SelectItem value="21:30" className="flex items-center justify-between">
                        <span>21:30</span>
                        <span className="text-green-600 text-xs">Desconto de 20%</span>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
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
                {selectedTime && isOffPeakTime(selectedTime) ? (
                  <div>
                    <p className="text-xs line-through text-neutral-500">{formatCurrency(2.00)}</p>
                    <p className="font-medium text-green-600">{formatCurrency(reservationPrice)} <span className="text-xs">(-20%)</span></p>
                  </div>
                ) : (
                  <p className="font-medium">{formatCurrency(reservationPrice)}</p>
                )}
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
