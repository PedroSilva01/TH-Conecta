import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface ProfileMenuItemProps {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}

export function ProfileMenuItem({ 
  icon, 
  label, 
  value, 
  onClick 
}: ProfileMenuItemProps) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center justify-between p-4 border-b border-neutral-100 w-full text-left hover:bg-neutral-50 transition"
    >
      <div className="flex items-center">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <div className="flex items-center">
        {value && <span className="mr-2 text-sm font-medium">{value}</span>}
        <ChevronRight className="h-5 w-5 text-neutral-400" />
      </div>
    </button>
  );
}
