'use client';
import { useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Props = { latitude: number; longitude: number; accuracy?: number | null; label?: string };
function Follow({ latitude, longitude }: Props) {
  const map = useMap();
  useEffect(() => { map.panTo([latitude, longitude]); }, [map, latitude, longitude]);
  useEffect(() => { const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(map.getContainer()); return () => observer.disconnect(); }, [map]);
  return null;
}
export default function LeafletMap({ latitude, longitude, accuracy, label = 'Shared location' }: Props) {
  const [tileError, setTileError] = useState(false);
  return <div style={{ height: '100%', minHeight: 230, position: 'relative', color: '#17233c' }}>
    <MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', minHeight: 230, width: '100%', zIndex: 0 }}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        eventHandlers={{ tileerror: () => setTileError(true) }} />
      {accuracy != null && <Circle center={[latitude, longitude]} radius={accuracy} pathOptions={{ color: '#ff2d78', weight: 1, fillOpacity: 0.08 }} />}
      <CircleMarker center={[latitude, longitude]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#ff2d78', fillOpacity: 1 }}><Tooltip>{label}</Tooltip></CircleMarker>
      <Follow latitude={latitude} longitude={longitude} />
    </MapContainer>
    {tileError && <p role="status" style={{ position: 'absolute', top: 8, left: 48, right: 8, zIndex: 1, background: 'white', padding: 8, borderRadius: 8, fontSize: 11 }}>Some map tiles could not load. Coordinates and the directions link are still available.</p>}
  </div>;
}
