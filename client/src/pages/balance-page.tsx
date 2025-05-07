import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Wallet, 
  Star, 
  Plus, 
  X,
  QrCode,
  CheckCircle,
  Clock,
  CalendarDays,
  Tag,
  Bus,
  Ticket,
  AlertCircle,
  BadgePercent,
  ChevronRight
} from "lucide-react";
import { Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function BalancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(50);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("pix");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [buyTicketModalOpen, setBuyTicketModalOpen] = useState(false);
  const [ticketType, setTicketType] = useState<string>("regular");
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string>("");
  const [hasDiscountedRate, setHasDiscountedRate] = useState<boolean>(false);
  const [busBusLineModalOpen, setBusBusLineModalOpen] = useState(false);
  
  useEffect(() => {
    // Check current time to determine time slot and fare type
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    // Time slots in minutes from midnight
    const timeSlots = [
      { name: 'Manhã pico', start: 6 * 60, end: 8 * 60, discounted: false },
      { name: 'Intervalo almoço', start: 8 * 60, end: 11.5 * 60, discounted: true },
      { name: 'Almoço pico', start: 11.5 * 60, end: 14 * 60, discounted: false },
      { name: 'Pós-almoço ocioso', start: 14 * 60, end: 17.5 * 60, discounted: true },
      { name: 'Tarde pico', start: 17.5 * 60, end: 19 * 60, discounted: false },
      { name: 'Fora de pico geral', start: 19 * 60, end: 24 * 60, discounted: true },
      { name: 'Fora de pico geral', start: 0, end: 6 * 60, discounted: true },
    ];

    const currentSlot = timeSlots.find(
      slot => currentTime >= slot.start && currentTime < slot.end
    );

    if (currentSlot) {
      setCurrentTimeSlot(currentSlot.name);
      setHasDiscountedRate(currentSlot.discounted);
    } else {
      setCurrentTimeSlot("Horário padrão");
      setHasDiscountedRate(false);
    }
  }, []);
  
  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  // Filter transactions based on active tab
  const filteredTransactions = transactions
    ? activeTab === "all" 
      ? transactions 
      : activeTab === "incoming" 
        ? transactions.filter(t => Number(t.amount) > 0)
        : transactions.filter(t => Number(t.amount) < 0)
    : [];
  
  // Sort transactions by date (most recent first)
  const sortedTransactions = [...(filteredTransactions || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Recharge balance mutation
  const rechargeMutation = useMutation({
    mutationFn: async (data: { amount: number, paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/transactions/recharge", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setRechargeModalOpen(false);
      setSuccessDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Erro na recarga",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle recharge confirmation
  const handleRechargeConfirm = () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para recarga.",
        variant: "destructive"
      });
      return;
    }
    
    rechargeMutation.mutate({
      amount: rechargeAmount,
      paymentMethod: selectedPaymentMethod
    });
  };
  
  // Predefined recharge amounts
  const predefinedAmounts = [10, 20, 50, 100];
  
  // Format transaction date
  const formatTransactionDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get icon for transaction
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-5 w-5 text-primary" />;
      case 'recharge':
        return <Wallet className="h-5 w-5 text-orange-500" />;
      case 'points_conversion':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  // Buy ticket mutation
  const buyTicketMutation = useMutation({
    mutationFn: async (data: { 
      quantity: number, 
      type: string, 
      paymentMethod: string,
      isDiscounted: boolean
    }) => {
      const res = await apiRequest("POST", "/api/transactions/buy-ticket", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setBuyTicketModalOpen(false);
      setSuccessDialogOpen(true);
      toast({
        title: "Vale Transporte adquirido",
        description: "A compra foi realizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na compra",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleBuyTicket = () => {
    const basePrice = 4.50; // Base ticket price
    const discountRate = hasDiscountedRate ? 0.2 : 0; // 20% discount in off-peak hours
    
    buyTicketMutation.mutate({
      quantity: ticketQuantity,
      type: ticketType,
      paymentMethod: selectedPaymentMethod,
      isDiscounted: hasDiscountedRate
    });
  };

  // Calculate ticket price based on time slot and type
  const calculateTicketPrice = () => {
    const basePrice = 4.50; // Base ticket price
    const discountRate = hasDiscountedRate ? 0.2 : 0; // 20% discount in off-peak hours
    
    // Different price for different ticket types
    let price = basePrice;
    if (ticketType === "student") {
      price = basePrice * 0.5; // 50% discount for students
    } else if (ticketType === "senior") {
      price = 0; // Free for seniors
    }
    
    // Apply time-based discount if applicable
    if (hasDiscountedRate && ticketType === "regular") {
      price = price * (1 - discountRate);
    }
    
    return price * ticketQuantity;
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PageHeader title="Minha Carteira" />

      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-neutral-500 mb-1">Saldo Disponível</p>
            <h3 className="text-3xl font-medium">{formatCurrency(Number(user?.balance))}</h3>
          </div>
          
          <Button 
            onClick={() => setRechargeModalOpen(true)} 
            className="w-full mb-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Saldo
          </Button>
          
          <Button 
            onClick={() => setBuyTicketModalOpen(true)} 
            variant="outline"
            className="w-full"
          >
            <Ticket className="h-4 w-4 mr-2" />
            Comprar Vale Transporte
          </Button>
        </div>
      </div>

      {/* Fare Info Card */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Tarifa Atual</CardTitle>
              <Clock className="h-5 w-5 text-neutral-500" />
            </div>
            <CardDescription>
              Horário atual: {currentTimeSlot}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">
                  {formatCurrency(hasDiscountedRate ? 3.60 : 4.50)}
                </p>
                {hasDiscountedRate && (
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-neutral-500 line-through mr-2">
                      {formatCurrency(4.50)}
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                      <BadgePercent className="h-3 w-3 mr-1" />
                      20% de desconto
                    </Badge>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setBusBusLineModalOpen(true)}>
                Ver Linhas
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-neutral-500">
              {hasDiscountedRate 
                ? "Aproveite! Tarifas reduzidas neste horário." 
                : "Tarifa cheia durante este horário de pico."}
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Transactions History */}
      <div className="flex-1 px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Histórico de Transações</h3>
          <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
            <TabsList className="border border-neutral-100 rounded-lg h-auto p-0">
              <TabsTrigger value="all" className="rounded-none px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Tudo
              </TabsTrigger>
              <TabsTrigger value="incoming" className="rounded-none px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Entradas
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="rounded-none px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Saídas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-neutral-500">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Carregando transações...</p>
            </div>
          ) : sortedTransactions.length > 0 ? (
            sortedTransactions.map((transaction, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.type === 'recharge' ? 'Recarga de saldo' : transaction.description}</p>
                      <p className="text-sm text-neutral-500">{formatTransactionDate(transaction.date)}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${Number(transaction.amount) > 0 ? 'text-green-600' : ''}`}>
                    {Number(transaction.amount) > 0 ? '+ ' : ''}{formatCurrency(Number(transaction.amount))}
                  </span>
                </div>
                {transaction.paymentMethod && (
                  <div className="pl-16 text-sm text-neutral-500">
                    Via {transaction.paymentMethod === 'pix' ? 'PIX' : 
                         transaction.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                         transaction.paymentMethod === 'wallet' ? 'Saldo' : 
                         transaction.paymentMethod}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-500">
              <p>Nenhuma transação encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recharge Modal */}
      <Dialog open={rechargeModalOpen} onOpenChange={setRechargeModalOpen}>
        <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-medium">Adicionar Saldo</DialogTitle>
              <DialogClose className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            <Label className="text-base font-medium">Valor da Recarga</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 mb-4">
              {predefinedAmounts.map((amount) => (
                <Button 
                  key={amount} 
                  type="button"
                  variant={rechargeAmount === amount ? "default" : "outline"}
                  onClick={() => setRechargeAmount(amount)}
                  className="h-12"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            
            <div className="mb-6">
              <Label htmlFor="custom-amount">Outro valor</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-neutral-500">R$</span>
                <Input 
                  id="custom-amount"
                  type="number" 
                  min="5"
                  className="pl-10"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <Label className="text-base font-medium">Método de Pagamento</Label>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                  selectedPaymentMethod === "pix" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setSelectedPaymentMethod("pix")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">PIX</div>
                  <div className="text-sm text-neutral-500">Pagamento instantâneo</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedPaymentMethod === "pix" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {selectedPaymentMethod === "pix" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                  selectedPaymentMethod === "credit_card" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setSelectedPaymentMethod("credit_card")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Cartão de Crédito</div>
                  <div className="text-sm text-neutral-500">Visa, Mastercard, etc.</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedPaymentMethod === "credit_card" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {selectedPaymentMethod === "credit_card" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleRechargeConfirm} 
              className="w-full"
              disabled={!rechargeAmount || rechargeAmount <= 0 || rechargeMutation.isPending}
            >
              {rechargeMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processando...
                </>
              ) : (
                `Recarregar ${formatCurrency(rechargeAmount)}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-xl mb-2">Operação Realizada!</DialogTitle>
          <p className="text-neutral-600 mb-4">
            Sua operação foi concluída com sucesso.
          </p>
          <Button 
            onClick={() => setSuccessDialogOpen(false)} 
            className="w-full"
          >
            Continuar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Buy Ticket Modal */}
      <Dialog open={buyTicketModalOpen} onOpenChange={setBuyTicketModalOpen}>
        <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-medium">Comprar Vale Transporte</DialogTitle>
              <DialogClose className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            {/* Current Time Slot Info */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-800">Faixa Horária Atual: {currentTimeSlot}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {hasDiscountedRate 
                      ? "Horário com tarifa reduzida (20% de desconto)" 
                      : "Horário de pico (tarifa cheia)"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Ticket Type Selection */}
            <div className="mb-6">
              <Label className="text-base font-medium block mb-2">Tipo do Vale-Transporte</Label>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer mb-2 ${
                  ticketType === "regular" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setTicketType("regular")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Padrão</div>
                  <div className="text-sm text-neutral-500">
                    {hasDiscountedRate 
                      ? `${formatCurrency(3.60)} (com desconto de 20%)` 
                      : formatCurrency(4.50)}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  ticketType === "regular" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {ticketType === "regular" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer mb-2 ${
                  ticketType === "student" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setTicketType("student")}
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <Ticket className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Estudante</div>
                  <div className="text-sm text-neutral-500">{formatCurrency(2.25)} (50% de desconto)</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  ticketType === "student" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {ticketType === "student" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                  ticketType === "senior" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setTicketType("senior")}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Ticket className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Idoso</div>
                  <div className="text-sm text-neutral-500">Gratuito</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  ticketType === "senior" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {ticketType === "senior" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quantity Selection */}
            <div className="mb-6">
              <Label htmlFor="ticket-quantity" className="text-base font-medium block mb-2">Quantidade</Label>
              <div className="flex items-center border rounded-md">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="h-10 px-3 rounded-r-none"
                  onClick={() => ticketQuantity > 1 && setTicketQuantity(ticketQuantity - 1)}
                >
                  -
                </Button>
                <Input 
                  id="ticket-quantity"
                  type="number" 
                  min="1"
                  className="h-10 border-0 text-center"
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(Number(e.target.value))}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="h-10 px-3 rounded-l-none"
                  onClick={() => setTicketQuantity(ticketQuantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="space-y-3 mb-6">
              <Label className="text-base font-medium">Método de Pagamento</Label>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                  selectedPaymentMethod === "wallet" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setSelectedPaymentMethod("wallet")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Saldo na Carteira</div>
                  <div className="text-sm text-neutral-500">Saldo atual: {formatCurrency(Number(user?.balance))}</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedPaymentMethod === "wallet" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {selectedPaymentMethod === "wallet" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                  selectedPaymentMethod === "pix" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setSelectedPaymentMethod("pix")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">PIX</div>
                  <div className="text-sm text-neutral-500">Pagamento instantâneo</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedPaymentMethod === "pix" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {selectedPaymentMethod === "pix" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                  selectedPaymentMethod === "credit_card" ? "border-primary" : "border-neutral-200"
                }`}
                onClick={() => setSelectedPaymentMethod("credit_card")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Cartão de Crédito</div>
                  <div className="text-sm text-neutral-500">Visa, Mastercard, etc.</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedPaymentMethod === "credit_card" ? "border-primary" : "border-neutral-300"
                } flex items-center justify-center`}>
                  {selectedPaymentMethod === "credit_card" && (
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Total and Confirm Button */}
            <div className="bg-neutral-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Preço unitário:</span>
                <span className="font-medium">
                  {ticketType === "senior" 
                    ? "Gratuito" 
                    : hasDiscountedRate && ticketType === "regular"
                      ? `${formatCurrency(3.60)} (c/ desconto)`
                      : ticketType === "student" 
                        ? `${formatCurrency(2.25)} (c/ desconto)`
                        : formatCurrency(4.50)
                  }
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Quantidade:</span>
                <span className="font-medium">{ticketQuantity}</span>
              </div>
              <div className="border-t border-neutral-200 my-2 pt-2"></div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-xl">
                  {formatCurrency(calculateTicketPrice())}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleBuyTicket} 
              className="w-full"
              disabled={buyTicketMutation.isPending}
            >
              {buyTicketMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processando...
                </>
              ) : (
                "Confirmar Compra"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bus Lines Modal */}
      <Dialog open={busBusLineModalOpen} onOpenChange={setBusBusLineModalOpen}>
        <DialogContent className="max-w-md p-0 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-medium">Linhas Disponíveis</DialogTitle>
              <DialogClose className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-800">Horário Atual: {currentTimeSlot}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {hasDiscountedRate 
                      ? "As tarifas mostradas já incluem o desconto de 20% aplicável neste horário" 
                      : "Horário de pico - tarifa cheia aplicada"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Sample bus lines - would be fetched from an API in a real application */}
              {[
                {
                  id: 1,
                  number: "123",
                  name: "Terminal Central → Shopping Norte",
                  price: hasDiscountedRate ? 3.60 : 4.50,
                  occupancy: "Baixa"
                },
                {
                  id: 2,
                  number: "210",
                  name: "Bairro Sul → Centro",
                  price: hasDiscountedRate ? 3.60 : 4.50,
                  occupancy: "Média"
                },
                {
                  id: 3,
                  number: "301",
                  name: "Terminal Oeste → Parque Industrial",
                  price: hasDiscountedRate ? 3.60 : 4.50,
                  occupancy: "Alta"
                },
                {
                  id: 4,
                  number: "402",
                  name: "Circular Centro",
                  price: hasDiscountedRate ? 3.60 : 4.50,
                  occupancy: "Baixa"
                },
                {
                  id: 5,
                  number: "510",
                  name: "Rodoviária → Campus Universitário",
                  price: hasDiscountedRate ? 3.60 : 4.50,
                  occupancy: "Média"
                }
              ].map(line => (
                <div key={line.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-neutral-50 p-3 flex items-center justify-between border-b">
                    <div className="flex items-center">
                      <div className="bg-primary h-8 w-8 rounded-md flex items-center justify-center text-white font-medium mr-3">
                        {line.number}
                      </div>
                      <div className="font-medium">{line.name}</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        line.occupancy === "Baixa" 
                          ? "bg-green-50 text-green-600 border-green-200" 
                          : line.occupancy === "Média"
                            ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                            : "bg-red-50 text-red-600 border-red-200"
                      }
                    >
                      {line.occupancy}
                    </Badge>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-neutral-500">Tarifa atual</div>
                      <div className="font-medium">{formatCurrency(line.price)}</div>
                      {hasDiscountedRate && (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <BadgePercent className="h-3 w-3 mr-1" />
                          20% de desconto aplicado
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setBusBusLineModalOpen(false);
                      setBuyTicketModalOpen(true);
                    }}>
                      Comprar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
