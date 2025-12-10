import { Navigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";

const Index = () => {
  const { isOnboarded } = useAppStore();
  
  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <Navigate to="/plan" replace />;
};

export default Index;
