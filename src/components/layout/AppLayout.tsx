import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heart, Calendar, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const navItems = [
  { to: "/plan", icon: Heart, label: "Plan Date" },
  { to: "/dates", icon: Calendar, label: "My Dates" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    // Sign out and navigate immediately - don't wait for API
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50">
        <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-3">
              {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex flex-col items-center gap-1 px-4 py-2"
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -inset-2 bg-rose/10 rounded-xl"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "relative w-6 h-6 transition-colors",
                        isActive ? "text-rose" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isActive ? "text-rose" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="relative flex flex-col items-center gap-1 px-4 py-2"
            >
              <LogOut className="w-6 h-6 text-muted-foreground hover:text-rose transition-colors" />
              <span className="text-xs font-medium text-muted-foreground">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
