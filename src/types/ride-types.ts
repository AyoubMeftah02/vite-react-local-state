import { type LatLngExpression } from 'leaflet';

export interface Driver {
  id: string;
  name: string;
  position: LatLngExpression;
  rating: number;
  eta: number;
  carModel: string;
  licensePlate: string;
}

export interface RideRequest {
  id: string;
  status: 'searching' | 'matched' | 'pickup' | 'inProgress' | 'completed';
  driver?: Driver;
  estimatedFare: number;
}

export interface MapProps {
  userAccount: string;
}
