import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { type LatLngExpression } from 'leaflet';


interface MapCompProps {
  userAccount: string;
}

const UserLocationMarker = ({
  position,
}: {
  position: LatLngExpression | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 17);
    }
  }, [position, map]);

  if (!position) {
    return null;
  }

  return <Marker position={position}></Marker>;
};

const MapComp = ({ userAccount }: MapCompProps) => {
  // State for user's current position
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(
    null,
  );
  // State for map center
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null);
  // State for error messages
  const [locationError, setLocationError] = useState<string | null>(null);
  // State for loading indicator
  const [isLocating, setIsLocating] = useState<boolean>(false);

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
      } catch (error) {
        console.error('Permissions API error:', error);
        setLocationError('Unable to check location permissions. Proceeding with location request.');
      }
    }
    return true;
  };

  // Function to fetch user's location
  const getUserLocation = async () => {
    setIsLocating(true); // Set loading state
    const hasPermission = await checkGeolocationPermission();
    if (!hasPermission) {
      setIsLocating(false);
      return;
    }

    const slowFetchTimeout = setTimeout(() => {
      setLocationError(
        'Still fetching your location... Please wait or check your browser settings.',
      );
    }, 5000); // 5 seconds
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(slowFetchTimeout);
        const newPos: LatLngExpression = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserPosition(newPos);
        setMapCenter(newPos); // Center map on user location
        setIsLocating(false); // Done loading
      },
      (error) => {
        clearTimeout(slowFetchTimeout);
        console.error('Error getting user location:', error);
        const errorMessage =
          'Error getting your location. Please ensure location services are enabled and permissions are granted.';
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }, // High accuracy, 10s timeout
    );
  };

  // Fetch location on mount
  useEffect(() => {
    getUserLocation();
  });

  return (
    <div className="flex flex-col h-screen w-full p-5 box-border bg-gray-50">
      <div className="mb-5 p-4 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Map Explorer</h1>
        <p className="text-sm text-gray-600 mb-3">Connected wallet: {userAccount}</p>
        {/* Button to manually re-fetch location */}
        <button
          onClick={getUserLocation}
          className="my-2.5 py-2.5 px-4 cursor-pointer bg-blue-600 text-white border-none rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLocating}
        >
          {isLocating ? 'Locating...' : 'Get My Location'}
        </button>
      </div>
      <div className="w-full h-[70vh] md:h-[80vh] relative">
        {mapCenter ? (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="flex-1 min-h-[400px] rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <UserLocationMarker position={userPosition} />
          </MapContainer>
        ) : (
          <div className="flex justify-center items-center h-full bg-gray-100 text-gray-700 rounded-lg">
            <p className="p-5 text-center text-base">
              {/* Show loading, error, or fallback message */}
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
