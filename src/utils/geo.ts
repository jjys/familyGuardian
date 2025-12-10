
import { Location } from '@/lib/types';

export function calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(loc2.lat - loc1.lat);
    const dLng = deg2rad(loc2.lng - loc1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(loc1.lat)) *
        Math.cos(deg2rad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export function generateRandomLocationNear(base: Location, radiusKm: number): Location {
    const r = (radiusKm / 6371) * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    const lat = Math.asin(Math.sin(deg2rad(base.lat)) * Math.cos(r) +
        Math.cos(deg2rad(base.lat)) * Math.sin(r) * Math.cos(theta));
    const lng = deg2rad(base.lng) + Math.atan2(Math.sin(theta) * Math.sin(r) * Math.cos(deg2rad(base.lat)),
        Math.cos(r) - Math.sin(deg2rad(base.lat)) * Math.sin(lat));

    return {
        lat: rad2deg(lat),
        lng: rad2deg(lng)
    };
}

function rad2deg(rad: number): number {
    return rad * (180 / Math.PI);
}
