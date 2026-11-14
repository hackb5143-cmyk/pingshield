'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface MapMarker { lat: number; lng: number; label?: string; }

export default function LocationMap({ markers }: { markers: MapMarker[] }) {
  if (markers.length === 0) return <div className="flex items-center justify-center h-full text-slate-400">No locations to display</div>;

  const center: [number, number] = [markers[0].lat, markers[0].lng];
  const bounds = markers.length > 1 ? L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number])) : undefined;

  return (
    <MapContainer center={center} zoom={14} bounds={bounds} className="h-full w-full rounded-xl" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]} icon={icon}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
