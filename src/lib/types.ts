
export interface Location {
    lat: number;
    lng: number;
}

export interface MonitoredPerson {
    id: string;
    name: string;
    currentLocation: Location;
    homeLocation: Location;
    status: 'safe' | 'warning' | 'danger';
    riskScore: number; // 0-100
    lastUpdate: Date;
    history: Location[];
}

export interface Settings {
    safeDistanceKm: number; // Distance in km
    notificationThreshold: number; // Risk score threshold
    simulationSpeed: number;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    type: 'info' | 'warning' | 'critical';
    read: boolean;
}
