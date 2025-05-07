import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Map, 
  RockingChair, 
  Ticket, 
  Wallet, 
  ChevronsRight
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch recent transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryOptions: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  });
  
  // Filter recent transactions (top 3)
  const recentTransactions = transactions
    ? transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
    : [];
  
  // Quick access buttons
  const quickAccessOptions = [
    {
      title: "Comprar Passagem",
      icon: <Ticket className="h-6 w-6 text-primary" />,
      onClick: () => navigate("/buy-ticket"),
    },
    {
      title: "Ver Rotas",
      icon: <Map className="h-6 w-6 text-primary" />,
      onClick: () => navigate("/routes"),
    },
    {
      title: "Reservar Assento",
      icon: <RockingChair className="h-6 w-6 text-primary" />,
      onClick: () => navigate("/reserve-seat"),
    },
    {
      title: "Eventos Culturais",
      icon: <ChevronsRight className="h-6 w-6 text-primary" />,
      onClick: () => navigate("/events"),
    },
  ];
  
  // Transaction icon mapping based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Ticket className="h-5 w-5 text-primary" />;
      case 'recharge':
        return <Wallet className="h-5 w-5 text-accent" />;
      case 'points_conversion':
        return <CreditCard className="h-5 w-5 text-secondary" />;
      default:
        return <CreditCard className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* App Header */}
      <div className="bg-primary p-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/70 text-sm">Olá,</p>
            <h2 className="text-white font-medium text-lg">{user?.name}</h2>
          </div>
          <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
            <Wallet className="text-white mr-1 h-4 w-4" />
            <span className="text-white text-sm">{formatCurrency(Number(user?.balance))}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Promotions Carousel */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="relative">
            <div className="w-full h-32 bg-gradient-to-r from-primary/80 to-primary overflow-hidden">
              <svg className="absolute inset-0 h-full w-full text-white/10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M0,100 Q25,50 50,75 T100,50 V100 Z" fill="currentColor" opacity="0.3" />
              </svg>
              <div className="h-full w-full flex items-center">
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg">50% de desconto em sua próxima viagem!</h3>
                  <p className="text-white/80 text-sm">Válido até 30/11/2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quickAccessOptions.map((option, index) => (
            <button 
              key={index} 
              onClick={option.onClick} 
              className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center justify-center hover:bg-neutral-50 transition"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                {option.icon}
              </div>
              <span className="text-neutral-700 font-medium">{option.title}</span>
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-3">Atividade Recente</h3>
          <div className="bg-white rounded-xl shadow-sm p-4 divide-y divide-neutral-100">
            {isLoadingTransactions ? (
              <div className="py-6 text-center text-neutral-500">Carregando atividades recentes...</div>
            ) : recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <div key={index} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-neutral-500">
                        {new Date(transaction.date).toLocaleDateString()}, 
                        {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium ${Number(transaction.amount) >= 0 ? 'text-green-600' : ''}`}>
                    {Number(transaction.amount) >= 0 ? '+ ' : ''}{formatCurrency(Number(transaction.amount))}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-neutral-500">Nenhuma transação recente encontrada</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
