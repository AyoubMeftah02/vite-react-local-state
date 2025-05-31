import { useState, useEffect, useRef } from 'react';

interface MapCompProps {
  userAccount: string;
}

// Use 'any' for google types to avoid TS errors if @types/google.maps is not installed
const MapComp = ({ userAccount }: MapCompProps) => {
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Helper to check geolocation permission status (if supported)
  const checkGeolocationPermission = async () => {
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({
          name: 'geolocation',
        });
        if (status.state === 'denied') {
          setLocationError(
            'Location permission denied. Please enable it in your browser settings.',
          );
          return false;
        }
      } catch {
        setLocationError(
          'Unable to check location permissions. Proceeding with location request.',
        );
      }
    }
    return true;
  };

  // Function to fetch user's location
  const getUserLocation = async () => {
    setIsLocating(true);
    const hasPermission = await checkGeolocationPermission();
    if (!hasPermission) {
      setIsLocating(false);
      return;
    }
    const slowFetchTimeout = setTimeout(() => {
      setLocationError(
        'Still fetching your location... Please wait or check your browser settings.',
      );
    }, 5000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(slowFetchTimeout);
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(newPos);
        setIsLocating(false);
      },
      () => {
        clearTimeout(slowFetchTimeout);
        setLocationError(
          'Error getting your location. Please ensure location services are enabled and permissions are granted.',
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Load Google Maps script
  useEffect(() => {
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
      script.async = true;
      script.onload = () => {
        getUserLocation();
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else {
      getUserLocation();
    }
    // eslint-disable-next-line
  }, []);

  // Initialize or update map when userPosition changes
  useEffect(() => {
    if ((window as any).google && userPosition && mapRef.current) {
      if (!googleMapRef.current) {
        googleMapRef.current = new (window as any).google.maps.Map(
          mapRef.current,
          {
            center: userPosition,
            zoom: 15,
          },
        );
      } else {
        googleMapRef.current.setCenter(userPosition);
      }
      if (!markerRef.current) {
        markerRef.current = new (window as any).google.maps.Marker({
          position: userPosition,
          map: googleMapRef.current,
        });
      } else {
        markerRef.current.setPosition(userPosition);
      }
    }
  }, [userPosition]);

  return (
    <div className="flex flex-col h-screen w-full p-5 box-border bg-gray-50">
      <div className="mb-5 p-4 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to Map Explorer
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Connected wallet: {userAccount}
        </p>
        <button
          onClick={getUserLocation}
          className="my-2.5 py-2.5 px-4 cursor-pointer bg-blue-600 text-white border-none rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLocating}
        >
          {isLocating ? 'Locating...' : 'Get My Location'}
        </button>
      </div>
      <div className="w-full h-[70vh] md:h-[80vh] relative">
        {userPosition ? (
          <div
            ref={mapRef}
            className="flex-1 min-h-[400px] rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] overflow-hidden"
            style={{ height: '100%', width: '100%' }}
          />
        ) : (
          <div className="flex justify-center items-center h-full bg-gray-100 text-gray-700 rounded-lg">
            <p className="p-5 text-center text-base">
              {isLocating
                ? 'Attempting to fetch your location...'
                : locationError
                  ? locationError
                  : 'Click "Get My Location" to try again.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComp;
