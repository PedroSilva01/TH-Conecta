import { Check, Save, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface SuccessScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketData: {
    busLine: string;
    origin: string;
    destination: string;
    departureTime: string;
    date: string;
    passengers: { adults: number; children: number };
    price: number;
    qrCode: string;
  };
  onClose: () => void;
}

export function SuccessScreen({ 
  open, 
  onOpenChange, 
  ticketData,
  onClose 
}: SuccessScreenProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-medium text-center mb-2">Passagem Comprada!</h3>
          <p className="text-center text-neutral-500 mb-8">Sua compra foi realizada com sucesso.</p>
          
          <div className="w-full bg-neutral-100 rounded-xl p-6 mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm text-neutral-500">Linha</p>
                <p className="font-medium">{ticketData.busLine} - {ticketData.origin} → {ticketData.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500">Data</p>
                <p className="font-medium">{ticketData.date}</p>
              </div>
            </div>
            
            <div className="flex justify-between mb-6">
              <div>
                <p className="text-sm text-neutral-500">Horário</p>
                <p className="font-medium">{ticketData.departureTime}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500">Passageiros</p>
                <p className="font-medium">
                  {ticketData.passengers.adults} Adulto{ticketData.passengers.adults !== 1 && 's'}
                  {ticketData.passengers.children > 0 && `, ${ticketData.passengers.children} Criança${ticketData.passengers.children !== 1 && 's'}`}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 flex justify-center items-center">
              {/* QR Code representation (real implementation would use an actual QR code library) */}
              <svg
                className="h-32 w-32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="10" y="10" width="20" height="20" fill="black" />
                <rect x="30" y="10" width="20" height="20" fill="black" />
                <rect x="50" y="10" width="20" height="20" fill="black" />
                <rect x="10" y="30" width="20" height="20" fill="black" />
                <rect x="50" y="30" width="20" height="20" fill="black" />
                <rect x="70" y="30" width="20" height="20" fill="black" />
                <rect x="10" y="50" width="20" height="20" fill="black" />
                <rect x="30" y="50" width="20" height="20" fill="black" />
                <rect x="50" y="50" width="20" height="20" fill="black" />
                <rect x="10" y="70" width="20" height="20" fill="black" />
                <rect x="50" y="70" width="20" height="20" fill="black" />
                <rect x="70" y="70" width="20" height="20" fill="black" />
              </svg>
            </div>
          </div>
          
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>Salvar</span>
            </Button>
            <Button 
              onClick={onClose} 
              className="flex-1 flex items-center justify-center gap-2"
            >
              <span>Concluir</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
