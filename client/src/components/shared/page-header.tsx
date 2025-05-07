import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function PageHeader({ title, onBack, rightElement }: PageHeaderProps) {
  const [, navigate] = useLocation();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };
  
  return (
    <div className="bg-primary p-6 pt-12 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={handleBack} className="mr-4 text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="text-white font-medium text-lg">{title}</h2>
      </div>
      {rightElement}
    </div>
  );
}
