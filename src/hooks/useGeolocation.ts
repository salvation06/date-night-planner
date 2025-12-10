import { useState, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<void>;
  isSupported: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    isLoading: false,
    error: null,
  });

  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Use free Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
      );
      const data = await response.json();
      
      if (data.address) {
        const { city, town, village, suburb, neighbourhood, county, state } = data.address;
        const locality = city || town || village || suburb || neighbourhood || county;
        return locality && state ? `${locality}, ${state}` : data.display_name.split(",").slice(0, 2).join(",");
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const getCurrentLocation = useCallback(async () => {
    if (!isSupported) {
      setState((prev) => ({ ...prev, error: "Geolocation is not supported" }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Helper to get position with specific options
    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      let position: GeolocationPosition;

      try {
        // First try: high accuracy with short timeout (for GPS)
        position = await getPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000, // 1 minute cache
        });
      } catch {
        // Fallback: low accuracy (network-based) with longer timeout
        position = await getPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      }

      const { latitude, longitude } = position.coords;
      const address = await reverseGeocode(latitude, longitude);

      setState({
        latitude,
        longitude,
        address,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      let errorMessage = "Failed to get location";
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
      }
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, [isSupported]);

  return {
    ...state,
    getCurrentLocation,
    isSupported,
  };
}
