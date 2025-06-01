import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import { type LatLngExpression } from 'leaflet';
import type { Driver, RideRequest, MapProps } from '@/types/ride-types';
import L from 'leaflet';
import car from '@/assets/car.png';

// Custom icons for different marker types
const userIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const driverIcon = new L.Icon({
  iconUrl: car,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

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
  if (!position) return null;
  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="text-center">
          <strong>Your Location</strong>
          <br />
          <span className="text-sm text-gray-600">You are here</span>
        </div>
      </Popup>
    </Marker>
  );
};

const DriverMarker = ({
  driver,
  onSelect,
}: {
  driver: Driver;
  onSelect: (driver: Driver) => void;
}) => {
  return (
    <Marker position={driver.position} icon={driverIcon}>
      <Popup>
        <div className="text-center min-w-[200px]">
          <strong className="text-lg">{driver.name}</strong>
          <br />
          <div className="text-sm text-gray-600 mt-1">
            <div>⭐ {driver.rating}/5.0</div>
            <div>🚗 {driver.carModel}</div>
            <div>📋 {driver.licensePlate}</div>
            <div>⏱️ {driver.eta} min away</div>
          </div>
          <button
            onClick={() => onSelect(driver)}
            className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Select Driver
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

const Map = ({ userAccount }: MapProps) => {
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [showDrivers, setShowDrivers] = useState<boolean>(false);

  // Generate mock drivers around user location
  const generateMockDrivers = (userPos: LatLngExpression): Driver[] => {
    const [userLat, userLng] = Array.isArray(userPos)
      ? userPos
      : [userPos.lat, userPos.lng];
    const mockDrivers: Driver[] = [
      {
        id: '1',
        name: 'John Smith',
        position: [userLat + 0.005, userLng + 0.003],
        rating: 4.8,
        eta: 3,
        carModel: 'Toyota Camry',
        licensePlate: 'ABC-123',
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        position: [userLat - 0.003, userLng + 0.007],
        rating: 4.9,
        eta: 5,
        carModel: 'Honda Civic',
        licensePlate: 'XYZ-789',
      },
      {
        id: '3',
        name: 'Mike Davis',
        position: [userLat + 0.008, userLng - 0.002],
        rating: 4.7,
        eta: 7,
        carModel: 'Nissan Altima',
        licensePlate: 'DEF-456',
      },
      {
        id: '4',
        name: 'Emily Chen',
        position: [userLat - 0.006, userLng - 0.005],
        rating: 4.9,
        eta: 4,
        carModel: 'Hyundai Elantra',
        licensePlate: 'GHI-321',
      },
    ];
    return mockDrivers;
  };

  // Handle driver selection
  const handleDriverSelect = (driver: Driver) => {
    const newRideRequest: RideRequest = {
      id: Date.now().toString(),
      status: 'matched',
      driver,
      estimatedFare: Math.round((driver.eta * 2.5 + 8) * 100) / 100,
    };
    setRideRequest(newRideRequest);
    setShowDrivers(false);
  };

  // Request a ride
  const requestRide = () => {
    if (!userPosition) {
      alert('Please enable location first');
      return;
    }
    setShowDrivers(true);
    const mockDrivers = generateMockDrivers(userPosition);
    setDrivers(mockDrivers);
  };

  // Cancel ride
  const cancelRide = () => {
    setRideRequest(null);
    setShowDrivers(false);
    setDrivers([]);
  };

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
    setLocationError(null);
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
        const newPos: LatLngExpression = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserPosition(newPos);
        setMapCenter(newPos);
        setLocationError(null);
        setIsLocating(false);

        // Generate mock drivers around user location
        const mockDrivers = generateMockDrivers(newPos);
        setDrivers(mockDrivers);
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

  // Initial location fetch
  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen w-full p-5 box-border bg-gray-50">
      <div className="mb-5 p-4 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to Rideshare Explorer
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Connected wallet: {userAccount}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={getUserLocation}
            className="py-2.5 px-4 cursor-pointer bg-blue-600 text-white border-none rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLocating}
          >
            {isLocating ? 'Locating...' : 'Get My Location'}
          </button>

          {userPosition && !rideRequest && (
            <button
              onClick={requestRide}
              className="py-2.5 px-4 cursor-pointer bg-green-600 text-white border-none rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              🚗 Request Ride
            </button>
          )}

          {rideRequest && (
            <button
              onClick={cancelRide}
              className="py-2.5 px-4 cursor-pointer bg-red-600 text-white border-none rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              ❌ Cancel Ride
            </button>
          )}
        </div>

        {/* Ride Status Display */}
        {rideRequest && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              🎉 Ride Matched!
            </h3>
            <div className="text-sm text-green-700">
              <p>
                <strong>Driver:</strong> {rideRequest.driver?.name}
              </p>
              <p>
                <strong>Vehicle:</strong> {rideRequest.driver?.carModel} (
                {rideRequest.driver?.licensePlate})
              </p>
              <p>
                <strong>Rating:</strong> ⭐ {rideRequest.driver?.rating}/5.0
              </p>
              <p>
                <strong>ETA:</strong> {rideRequest.driver?.eta} minutes
              </p>
              <p>
                <strong>Estimated Fare:</strong> ${rideRequest.estimatedFare}
              </p>
            </div>
          </div>
        )}

        {/* Driver Search Status */}
        {showDrivers && !rideRequest && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-semibold">
              🔍 Searching for nearby drivers...
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Click on a driver marker to select them!
            </p>
          </div>
        )}
      </div>
      <div className="w-full h-[70vh] md:h-[80vh] relative">
        {mapCenter ? (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="h-full w-full rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <UserLocationMarker position={userPosition} />

            {/* Show driver markers when searching for rides or when a ride is matched */}
            {(showDrivers || rideRequest) &&
              drivers.map((driver) => (
                <DriverMarker
                  key={driver.id}
                  driver={driver}
                  onSelect={handleDriverSelect}
                />
              ))}

            {/* Highlight selected driver if ride is matched */}
            {rideRequest && rideRequest.driver && (
              <Marker position={rideRequest.driver.position} icon={driverIcon}>
                <Popup>
                  <div className="text-center min-w-[200px]">
                    <strong className="text-lg text-green-600">
                      🎉 Your Driver
                    </strong>
                    <br />
                    <strong className="text-lg">
                      {rideRequest.driver.name}
                    </strong>
                    <br />
                    <div className="text-sm text-gray-600 mt-1">
                      <div>⭐ {rideRequest.driver.rating}/5.0</div>
                      <div>🚗 {rideRequest.driver.carModel}</div>
                      <div>📋 {rideRequest.driver.licensePlate}</div>
                      <div>⏱️ {rideRequest.driver.eta} min away</div>
                      <div className="mt-2 font-semibold text-green-600">
                        💰 Fare: ${rideRequest.estimatedFare}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
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

export default Map;
