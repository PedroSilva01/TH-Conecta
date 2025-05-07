import { Button } from "@/components/ui/button";
import { Reward } from "@shared/schema";

interface RewardCardProps {
  reward: Reward;
  onRedeem: (rewardId: number) => void;
  disabled?: boolean;
}

export function RewardCard({ reward, onRedeem, disabled = false }: RewardCardProps) {
  // Map iconName to a Lucide-like SVG
  const getIconSvg = (iconName: string) => {
    switch (iconName) {
      case "confirmation_number":
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v2a3 3 0 1 1 0 6v2c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        );
      case "local_activity":
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5c.7-.7 1.5-1 2.5-1 1 0 1.8.3 2.5 1 .7.7 1.5 1 2.5 1s1.8-.3 2.5-1c.7-.7 1.5-1 2.5-1s1.8.3 2.5 1" />
            <path d="M4 9c.7-.7 1.5-1 2.5-1 1 0 1.8.3 2.5 1 .7.7 1.5 1 2.5 1s1.8-.3 2.5-1c.7-.7 1.5-1 2.5-1s1.8.3 2.5 1" />
            <path d="M4 13c.7-.7 1.5-1 2.5-1 1 0 1.8.3 2.5 1 .7.7 1.5 1 2.5 1s1.8-.3 2.5-1c.7-.7 1.5-1 2.5-1s1.8.3 2.5 1" />
            <path d="M4 17c.7-.7 1.5-1 2.5-1 1 0 1.8.3 2.5 1 .7.7 1.5 1 2.5 1s1.8-.3 2.5-1c.7-.7 1.5-1 2.5-1s1.8.3 2.5 1" />
          </svg>
        );
      case "airline_seat_recline_extra":
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M12 22v-9" />
            <path d="M5 4h14" />
            <path d="M19 9c0 1.2-.5 2.3-1.4 3" />
            <path d="m6 9 6-5v5" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 17.8 5.8 21 7 14.1 2 9.3l7-1L12 2l3 6.3 7 1-5 4.8 1.2 6.9-6.2-3.2Z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="border border-neutral-100 rounded-lg p-4">
      <div className="flex">
        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mr-4 text-secondary">
          {getIconSvg(reward.iconName)}
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-1">{reward.title}</h4>
          <p className="text-sm text-neutral-500 mb-3">{reward.description}</p>
          <div className="flex justify-between items-center">
            <span className="font-medium">{reward.pointsCost} pontos</span>
            <Button 
              onClick={() => onRedeem(reward.id)} 
              size="sm" 
              disabled={disabled}
              className="shadow-sm"
            >
              Resgatar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
