import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/shared/page-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { ProfileMenuItem } from "@/components/profile/profile-menu-item";
import { 
  User,
  Wallet,
  ShieldCheck,
  Bell,
  HelpCircle,
  Edit,
  LogOut
} from "lucide-react";
import { getInitials, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate("/auth")
    });
  };
  
  // Menu items with their respective icons and navigation
  const menuItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Informações Pessoais",
      onClick: () => toast({ 
        title: "Funcionalidade em desenvolvimento", 
        description: "Esta seção será implementada em breve." 
      })
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      label: "Meu Saldo e Histórico",
      value: user ? formatCurrency(Number(user.balance)) : "-",
      onClick: () => navigate("/balance")
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: "Segurança",
      onClick: () => toast({ 
        title: "Funcionalidade em desenvolvimento", 
        description: "Esta seção será implementada em breve." 
      })
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Notificações",
      onClick: () => toast({ 
        title: "Funcionalidade em desenvolvimento", 
        description: "Esta seção será implementada em breve." 
      })
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: "Ajuda e Suporte",
      onClick: () => toast({ 
        title: "Funcionalidade em desenvolvimento", 
        description: "Esta seção será implementada em breve." 
      })
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Screen Header */}
      <PageHeader 
        title="Meu Perfil" 
        rightElement={
          <button className="text-white" onClick={() => toast({ title: "Funcionalidade em desenvolvimento" })}>
            <Edit className="h-5 w-5" />
          </button>
        }
      />

      {/* User Info */}
      <div className="bg-white border-b border-neutral-100">
        <div className="flex items-center p-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4">
            <span className="text-primary text-xl font-bold">{getInitials(user?.name || '')}</span>
          </div>
          <div>
            <h3 className="font-medium text-lg">{user?.name}</h3>
            <p className="text-neutral-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Options */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <ProfileMenuItem 
              key={index}
              icon={item.icon}
              label={item.label}
              value={item.value}
              onClick={item.onClick}
            />
          ))}
        </div>
        
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
