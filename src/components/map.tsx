import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';

// Fix for default icon issue with webpack

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
      map.flyTo(position, 16);
    }
  }, [position, map]);

  if (!position) {
    return null;
  }

  return (
    <Marker position={position}>
      <Popup>You are here.</Popup>
    </Marker>
  );
};

const MapComp = ({ userAccount }: MapCompProps) => {
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null); // Initialize to null
  const [locationError, setLocationError] = useState<string | null>(null); // For displaying errors or loading messages

  const getUserLocation = () => {
    setLocationError(null); // Clear previous errors/messages
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos: LatLngExpression = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserPosition(newPos);
        setMapCenter(newPos); // Center map on user location
      },
      (error) => {
        console.error('Error getting user location:', error);
        const errorMessage =
          'Error getting your location. Please ensure location services are enabled and permissions are granted.';
        setLocationError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, // Added options for better accuracy and fresh data
    );
  };

  useEffect(() => {
    getUserLocation();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="container">
      <div className="welcome-section">
        <h1>Welcome to Ride</h1>
        <p>Connected wallet: {userAccount}</p>
        <button onClick={getUserLocation} className="get-location-button">
          Get My Location
        </button>
      </div>
      <div className="map-container-wrapper">
        {mapCenter ? (
          <MapContainer
            center={mapCenter} // mapCenter is guaranteed to be LatLngExpression here
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <UserLocationMarker position={userPosition} />
          </MapContainer>
        ) : (
          <div
            className="map-fallback"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              backgroundColor: '#e9e9e9',
              color: '#333',
              borderRadius: '8px',
            }}
          >
            <p
              style={{
                padding: '20px',
                textAlign: 'center',
                fontSize: '1.1em',
              }}
            >
              {locationError
                ? locationError
                : 'Attempting to fetch your location...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComp;
