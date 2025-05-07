import { useState } from "react";
import { X, CreditCard, Wallet, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  serviceFee: number;
  onConfirmPayment: (paymentMethod: string) => void;
  hasAirConditioning?: boolean;
}

export function PaymentModal({ 
  open, 
  onOpenChange, 
  subtotal, 
  serviceFee, 
  onConfirmPayment,
  hasAirConditioning
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("wallet");
  const { user } = useAuth();
  
  const total = subtotal + serviceFee;
  
  const handleConfirmPayment = () => {
    onConfirmPayment(selectedPaymentMethod);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-medium">Método de Pagamento</DialogTitle>
            <DialogClose className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="px-6 space-y-4 mb-6">
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
              <div className="font-medium">Saldo Xteste</div>
              <div className="text-sm text-neutral-500">{formatCurrency(Number(user?.balance))} disponível</div>
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
        
        <div className="border-t border-neutral-100 p-6">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {!hasAirConditioning && (
            <div className="flex justify-between mb-2 text-green-700">
              <span>Desconto sem ar-condicionado</span>
              <span>-5%</span>
            </div>
          )}
          <div className="flex justify-between mb-2">
            <span>Taxa de serviço</span>
            <span>{formatCurrency(serviceFee)}</span>
          </div>
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          
          <Button 
            onClick={handleConfirmPayment} 
            className="w-full mt-6"
          >
            Confirmar Pagamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
