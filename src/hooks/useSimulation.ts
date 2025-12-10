
import { useState, useEffect, useCallback, useRef } from 'react';
import { MonitoredPerson, Settings, Notification, Location } from '@/lib/types';
import { calculateDistance, generateRandomLocationNear } from '@/utils/geo';

const DEFAULT_HOME: Location = { lat: 25.0330, lng: 121.5654 }; // Taipei 101 approx
const SIMULATION_INTERVAL = 2000;

export function useSimulation() {
    const [person, setPerson] = useState<MonitoredPerson>({
        id: 'p1',
        name: 'Grandma Lin',
        currentLocation: DEFAULT_HOME,
        homeLocation: DEFAULT_HOME,
        status: 'safe',
        riskScore: 10,
        lastUpdate: new Date(),
        history: [DEFAULT_HOME]
    });

    const [settings, setSettings] = useState<Settings>({
        safeDistanceKm: 0.5,
        notificationThreshold: 70,
        simulationSpeed: 1,
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // Use a ref for the interval to be able to clear it easily
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const addNotification = useCallback((title: string, message: string, type: 'info' | 'warning' | 'critical') => {
        setNotifications(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            title,
            message,
            timestamp: new Date(),
            type,
            read: false
        }, ...prev]);
    }, []);

    const updateRiskScore = useCallback((currentLoc: Location, homeLoc: Location, history: Location[]) => {
        const dist = calculateDistance(currentLoc, homeLoc);

        // AI Prediction Mock:
        // If getting farther away rapidly, risk increases.
        // Base risk based on distance.
        let score = Math.min(100, (dist / settings.safeDistanceKm) * 50);

        // Add "AI Factor" - randomness + trend
        // Mock complexity
        const trend = history.length > 2 ?
            calculateDistance(currentLoc, history[history.length - 2]) > 0.001 ? 10 : -5
            : 0;

        score += trend;
        score = Math.max(0, Math.min(100, score)); // Clamp 0-100

        return score;
    }, [settings.safeDistanceKm]);

    const stepSimulation = useCallback(() => {
        setPerson(prev => {
            // Simulate movement: Random walk with drift away from home for "risk" simulation
            // or just random walk.

            // Let's make it walk in a somewhat straight line to simulate "wandering off"
            // or random around a point.

            const moveDistance = 0.0005 * settings.simulationSpeed; // approx 50m
            const randomAngle = Math.random() * 2 * Math.PI;

            const newLat = prev.currentLocation.lat + (Math.sin(randomAngle) * moveDistance);
            const newLng = prev.currentLocation.lng + (Math.cos(randomAngle) * moveDistance);

            const newLoc = { lat: newLat, lng: newLng };
            const newHistory = [...prev.history, newLoc].slice(-50); // Keep last 50 points

            const newRisk = updateRiskScore(newLoc, prev.homeLocation, newHistory);

            let newStatus: 'safe' | 'warning' | 'danger' = 'safe';
            if (newRisk > 85) newStatus = 'danger';
            else if (newRisk > 50) newStatus = 'warning';

            return {
                ...prev,
                currentLocation: newLoc,
                riskScore: newRisk,
                status: newStatus,
                history: newHistory,
                lastUpdate: new Date()
            };
        });
    }, [settings.simulationSpeed, updateRiskScore]);

    // Check for alerts
    useEffect(() => {
        if (person.riskScore > settings.notificationThreshold) {
            // Avoid spamming: check if likely already notified recently (omitted for simplicity, just notifying)
            // Ideally we'd have a debouncer or "lastNotified" state.
            // For this demo, let's just only notify if it jumped significantly or passed a threshold we haven't handled.

            // better approach: trigger on state change
        }
    }, [person.riskScore, settings.notificationThreshold]);

    // Monitor status changes for notification
    const prevStatus = useRef(person.status);
    useEffect(() => {
        if (prevStatus.current !== person.status) {
            if (person.status === 'warning') {
                addNotification('Potential Risk Detected', 'The monitored person is moving away from the safe zone.', 'warning');
            } else if (person.status === 'danger') {
                addNotification('High Risk Alert', 'Grandma Lin may be getting lost! Risk score is critical.', 'critical');
            }
            prevStatus.current = person.status;
        }
    }, [person.status, addNotification]);

    const startSimulation = () => setIsRunning(true);
    const stopSimulation = () => setIsRunning(false);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(stepSimulation, SIMULATION_INTERVAL);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, stepSimulation]);

    const setManualLocation = (lat: number, lng: number) => {
        setPerson(prev => {
            const newLoc = { lat, lng };
            const newRisk = updateRiskScore(newLoc, prev.homeLocation, prev.history);
            return {
                ...prev,
                currentLocation: newLoc,
                riskScore: newRisk,
                status: newRisk > 80 ? 'danger' : newRisk > 50 ? 'warning' : 'safe',
                history: [...prev.history, newLoc],
                lastUpdate: new Date()
            };
        });
    };

    return {
        person,
        settings,
        setSettings,
        notifications,
        isRunning,
        startSimulation,
        stopSimulation,
        setManualLocation,
        addNotification // exposed for manual testing
    };
}
