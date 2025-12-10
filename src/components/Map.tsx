
'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, MonitoredPerson } from '@/lib/types';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet generic icon issues in Next.js
// We'll use a custom DivIcon or standard fix if we needed standard markers, 
// but let's use a custom circle marker for the person which looks more "IoT".

const PersonMarker = ({ person }: { person: MonitoredPerson }) => {
    const map = useMap();

    useEffect(() => {
        map.flyTo([person.currentLocation.lat, person.currentLocation.lng], map.getZoom());
    }, [person.currentLocation, map]);

    const color = person.status === 'safe' ? '#10b981' : person.status === 'warning' ? '#f59e0b' : '#ef4444';

    return (
        <>
            <Circle
                center={[person.currentLocation.lat, person.currentLocation.lng]}
                pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6, weight: 0 }}
                radius={50}
            />
            <Circle
                center={[person.currentLocation.lat, person.currentLocation.lng]}
                pathOptions={{ fillColor: color, color: color, fillOpacity: 0.2, weight: 1 }}
                radius={100} // Pulse effect radius (static for now)
            />
            <Marker
                position={[person.currentLocation.lat, person.currentLocation.lng]}
                icon={L.divIcon({
                    className: 'custom-icon',
                    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })}
            >
                <Popup>
                    <div className="p-2">
                        <h3 className="font-bold">{person.name}</h3>
                        <p className="text-sm">Status: <span style={{ color }}>{person.status.toUpperCase()}</span></p>
                        <p className="text-xs text-gray-500">Risk Score: {Math.round(person.riskScore)}/100</p>
                    </div>
                </Popup>
            </Marker>
        </>
    );
};

const HomeMarker = ({ location }: { location: Location }) => {
    return (
        <Circle
            center={[location.lat, location.lng]}
            pathOptions={{ fillColor: '#3b82f6', color: '#2563eb', dashArray: '5, 5', fillOpacity: 0.1 }}
            radius={500} // Safe zone
        />
    );
}

interface MapProps {
    person: MonitoredPerson;
    homeLocation: Location;
}

export default function MapComponent({ person, homeLocation }: MapProps) {
    return (
        <MapContainer
            center={[homeLocation.lat, homeLocation.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <HomeMarker location={homeLocation} />
            <PersonMarker person={person} />
        </MapContainer>
    );
}
