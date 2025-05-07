import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MinusCircle, 
  PlusCircle, 
  Wifi, 
  Users, 
  Accessibility 
} from "lucide-react";
import { BusLine, insertTicketSchema } from "@shared/schema";
import { PaymentModal } from "@/components/tickets/payment-modal";
import { SuccessScreen } from "@/components/tickets/success-screen";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export default function BuyTicketPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [origin, setOrigin] = useState("Terminal Central");
  const [destination, setDestination] = useState("Shopping Norte");
  const [date, setDate] = useState("Hoje, 21 Out");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  
  // Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedBusLine, setSelectedBusLine] = useState<BusLine | null>(null);
  
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");
  const [ticketData, setTicketData] = useState<any>(null);
  
  // Fetch bus lines
  const { data: busLines, isLoading } = useQuery<BusLine[]>({
    queryKey: [`/api/bus-lines?origin=${origin}&destination=${destination}`],
  });
  
  // Purchase ticket mutation
  const purchaseTicketMutation = useMutation({
    mutationFn: async (ticketData: z.infer<typeof insertTicketSchema>) => {
      const res = await apiRequest("POST", "/api/tickets", {
        ...ticketData,
        paymentMethod: selectedPaymentMethod
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setTicketData({
        ...data,
        date,
        passengers: { adults, children }
      });
      
      setPaymentModalOpen(false);
      setSuccessModalOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Erro na compra",
        description: error.message,
        variant: "destructive"
      });
      setPaymentModalOpen(false);
    }
  });
  
  // Handle payment confirmation
  const handleConfirmPayment = (paymentMethod: string) => {
    if (!selectedBusLine) return;
    
    setSelectedPaymentMethod(paymentMethod);
    
    // Check if user has enough balance when using wallet
    if (paymentMethod === "wallet" && user) {
      const total = Number(selectedBusLine.price) * adults + (Number(selectedBusLine.price) * 0.5 * children);
      if (Number(user.balance) < total) {
        toast({
          title: "Saldo insuficiente",
          description: "Você não tem saldo suficiente para esta compra. Por favor, recarregue seu saldo ou escolha outro método de pagamento.",
          variant: "destructive"
        });
        return;
      }
    }
    
    const serviceFeeFactor = 0.1; // 10% service fee
    const subtotal = Number(selectedBusLine.price) * adults + (Number(selectedBusLine.price) * 0.5 * children);
    const serviceFee = subtotal * serviceFeeFactor;
    const total = subtotal + serviceFee;
    
    const passengers = { adults, children };
    
    // Create ticket
    purchaseTicketMutation.mutate({
      userId: user!.id,
      origin,
      destination,
      busLine: selectedBusLine.name,
      departureTime: new Date(),
      arrivalTime: new Date(new Date().getTime() + 30 * 60000), // 30 minutes later
      price: total,
      passengers,
      qrCode: "",
      status: "active"
    });
  };
  
  const handleSelectBusLine = (busLine: BusLine) => {
    setSelectedBusLine(busLine);
    setPaymentModalOpen(true);
  };
  
  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    navigate("/");
  };
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Comprar Passagem" />

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {/* Origin and Destination */}
          <div className="mb-6 relative">
            <div className="absolute left-5 top-0 bottom-0 flex flex-col items-center">
              <div className="w-4 h-4 bg-primary rounded-full z-10 shadow-[0_0_0_4px_rgba(25,118,210,0.2)]"></div>
              <div className="w-0.5 h-full bg-primary/20 -mt-2"></div>
              <div className="w-4 h-4 bg-orange-500 rounded-full z-10 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]"></div>
            </div>
            
            <div className="pl-12 mb-6">
              <label className="block text-sm text-neutral-500 mb-1">Origem</label>
              <Input 
                value={origin} 
                onChange={(e) => setOrigin(e.target.value)} 
                placeholder="Sua localização atual" 
              />
            </div>
            
            <div className="pl-12">
              <label className="block text-sm text-neutral-500 mb-1">Destino</label>
              <Input 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                placeholder="Para onde deseja ir?" 
              />
            </div>
          </div>
          
          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm text-neutral-500 mb-1">Data da viagem</label>
            <div className="relative">
              <Input 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                placeholder="Selecione a data" 
              />
              <Calendar className="absolute right-3 top-3 h-5 w-5 text-neutral-500" />
            </div>
          </div>
          
          {/* Number of Passengers */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Passageiros</label>
            <div className="flex">
              <div className="flex-1 mr-2">
                <label className="block text-sm mb-1">Adultos</label>
                <div className="flex border border-neutral-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="p-3 bg-neutral-100 text-neutral-700"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                  <div className="flex-1 p-3 text-center border-l border-r border-neutral-100">
                    {adults}
                  </div>
                  <button 
                    onClick={() => setAdults(adults + 1)}
                    className="p-3 bg-neutral-100 text-neutral-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1">Crianças</label>
                <div className="flex border border-neutral-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="p-3 bg-neutral-100 text-neutral-700"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                  <div className="flex-1 p-3 text-center border-l border-r border-neutral-100">
                    {children}
                  </div>
                  <button 
                    onClick={() => setChildren(children + 1)}
                    className="p-3 bg-neutral-100 text-neutral-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Routes */}
        <h3 className="text-lg font-medium mb-3">Linhas Disponíveis</h3>
        
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-neutral-500">
            Carregando linhas disponíveis...
          </div>
        ) : busLines && busLines.length > 0 ? (
          busLines.map((busLine, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded-md">
                    {busLine.name}
                  </span>
                  <h4 className="font-medium mt-2">{busLine.origin} → {busLine.destination}</h4>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium">{formatCurrency(Number(busLine.price))}</div>
                  <div className="text-sm text-neutral-500">
                    {busLine.departureTime.split(':')[0] < busLine.arrivalTime.split(':')[0] 
                      ? parseInt(busLine.arrivalTime.split(':')[0]) - parseInt(busLine.departureTime.split(':')[0]) 
                      : (parseInt(busLine.arrivalTime.split(':')[0]) + 24) - parseInt(busLine.departureTime.split(':')[0])} min
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-neutral-500 mb-4">
                <span>Partida: {busLine.departureTime}</span>
                <span>Chegada: {busLine.arrivalTime}</span>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <Users className={`h-4 w-4 mr-1 ${busLine.lowOccupancy ? 'text-green-500' : 'text-yellow-500'}`} />
                  <span className="text-sm">{busLine.lowOccupancy ? 'Baixa' : 'Média'} ocupação</span>
                </div>
                {busLine.hasWifi && (
                  <div className="flex items-center">
                    <Wifi className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="text-sm">Wi-Fi</span>
                  </div>
                )}
                {busLine.isAccessible && (
                  <div className="flex items-center">
                    <Accessibility className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="text-sm">Acessível</span>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => handleSelectBusLine(busLine)} 
                className="w-full"
              >
                Selecionar
              </Button>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-neutral-500">
            Nenhuma linha disponível para esta rota e data.
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedBusLine && (
        <PaymentModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          subtotal={Number(selectedBusLine.price) * adults + (Number(selectedBusLine.price) * 0.5 * children)}
          serviceFee={Number(selectedBusLine.price) * adults * 0.1} // 10% service fee
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* Success Screen */}
      {ticketData && (
        <SuccessScreen 
          open={successModalOpen}
          onOpenChange={setSuccessModalOpen}
          ticketData={ticketData}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
}
