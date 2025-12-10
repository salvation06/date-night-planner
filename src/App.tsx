import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { AppLayout } from "@/components/layout/AppLayout";
import Onboarding from "@/pages/Onboarding";
import PlanDate from "@/pages/PlanDate";
import MyDates from "@/pages/MyDates";
import Profile from "@/pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isOnboarded } = useAppStore();

  if (!isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/plan" replace />} />
        <Route path="/plan" element={<PlanDate />} />
        <Route path="/dates" element={<MyDates />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/onboarding" element={<Navigate to="/plan" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
