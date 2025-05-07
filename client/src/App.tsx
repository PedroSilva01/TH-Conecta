import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import BuyTicketPage from "@/pages/buy-ticket-page";
import RoutesPage from "@/pages/routes-page";
import ReserveSeatPage from "@/pages/reserve-seat-page";
import EventsPage from "@/pages/events-page";
import RewardsPage from "@/pages/rewards-page";
import ProfilePage from "@/pages/profile-page";
import BalancePage from "@/pages/balance-page";
import StudentVerificationPage from "@/pages/student-verification-page";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/buy-ticket" component={BuyTicketPage} />
      <ProtectedRoute path="/routes" component={RoutesPage} />
      <ProtectedRoute path="/reserve-seat" component={ReserveSeatPage} />
      <ProtectedRoute path="/events" component={EventsPage} />
      <ProtectedRoute path="/rewards" component={RewardsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/balance" component={BalancePage} />
      <ProtectedRoute path="/student-verification" component={StudentVerificationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
