import { Home, Map, Star, User } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNav() {
  const [location, navigate] = useLocation();
  
  // Determine which tab is active
  const activeTab = (() => {
    if (location === "/") return "home";
    if (location === "/routes") return "routes";
    if (location === "/rewards") return "rewards";
    if (location === "/profile") return "profile";
    return null;
  })();
  
  const handleTabClick = (tab: string) => {
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "routes":
        navigate("/routes");
        break;
      case "rewards":
        navigate("/rewards");
        break;
      case "profile":
        navigate("/profile");
        break;
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 shadow-lg z-10">
      <div className="relative h-1">
        <div 
          className="bottom-nav-indicator absolute h-1 bg-primary rounded-b transition-transform duration-300"
          style={{ 
            width: '25%', 
            transform: `translateX(${
              activeTab === "home" ? 0 : 
              activeTab === "routes" ? 100 : 
              activeTab === "rewards" ? 200 : 
              activeTab === "profile" ? 300 : 0
            }%)`
          }}
        />
      </div>
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => handleTabClick("home")} 
          className={`flex flex-col items-center justify-center w-1/4 ${activeTab === "home" ? "text-primary" : "text-neutral-500"}`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Início</span>
        </button>
        <button 
          onClick={() => handleTabClick("routes")} 
          className={`flex flex-col items-center justify-center w-1/4 ${activeTab === "routes" ? "text-primary" : "text-neutral-500"}`}
        >
          <Map className="h-5 w-5" />
          <span className="text-xs mt-1">Mapa</span>
        </button>
        <button 
          onClick={() => handleTabClick("rewards")} 
          className={`flex flex-col items-center justify-center w-1/4 ${activeTab === "rewards" ? "text-primary" : "text-neutral-500"}`}
        >
          <Star className="h-5 w-5" />
          <span className="text-xs mt-1">Recompensas</span>
        </button>
        <button 
          onClick={() => handleTabClick("profile")} 
          className={`flex flex-col items-center justify-center w-1/4 ${activeTab === "profile" ? "text-primary" : "text-neutral-500"}`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </div>
  );
}
