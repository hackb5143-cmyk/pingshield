'use client';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => <div style={{ padding: 24, color: '#64748b' }}>Loading map…</div> });
export default Map;
