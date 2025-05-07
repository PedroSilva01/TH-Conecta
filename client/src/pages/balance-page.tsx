import { useState } from "react";
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
  CheckCircle
} from "lucide-react";
import { Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function BalancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(50);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("pix");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
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
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
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
  
  return (
    <div className="min-h-screen flex flex-col pb-6">
      <PageHeader title="Meu Saldo e Histórico" />

      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-neutral-500 mb-1">Saldo Disponível</p>
            <h3 className="text-3xl font-medium">{formatCurrency(Number(user?.balance))}</h3>
          </div>
          
          <Button 
            onClick={() => setRechargeModalOpen(true)} 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Saldo
          </Button>
        </div>
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
          <DialogTitle className="text-xl mb-2">Recarga Realizada!</DialogTitle>
          <p className="text-neutral-600 mb-4">
            Seu saldo foi recarregado com {formatCurrency(rechargeAmount)} com sucesso.
          </p>
          <Button 
            onClick={() => setSuccessDialogOpen(false)} 
            className="w-full"
          >
            Continuar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
