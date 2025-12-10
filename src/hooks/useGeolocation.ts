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

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

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
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
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
