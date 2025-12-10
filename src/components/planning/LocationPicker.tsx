import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  className?: string;
}

export default function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [manualInput, setManualInput] = useState(value);
  
  const {
    address,
    isLoading,
    error,
    getCurrentLocation,
    isSupported,
  } = useGeolocation();

  useEffect(() => {
    if (address) {
      onChange(address);
    }
  }, [address, onChange]);

  const handleAutoLocate = async () => {
    await getCurrentLocation();
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onChange(manualInput.trim());
      setIsEditing(false);
    }
  };

  const hasLocation = !!value;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current Location Display */}
      <AnimatePresence mode="wait">
        {hasLocation && !isEditing ? (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Your location</p>
              <p className="font-medium text-foreground truncate">{value}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setManualInput(value);
                setIsEditing(true);
              }}
              className="text-primary hover:text-primary"
            >
              Change
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            {/* Auto-locate button */}
            {isSupported && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={handleAutoLocate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium">Use my current location</p>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "Finding your location..." : "Auto-detect via GPS"}
                  </p>
                </div>
              </Button>
            )}

            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <X className="w-4 h-4" />
                {error}
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or enter manually</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Manual input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g., Brooklyn, NY or 10001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualSubmit();
                    }
                  }}
                />
              </div>
              <Button
                variant="romantic"
                size="icon"
                className="h-12 w-12"
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
