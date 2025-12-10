
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimulation } from '@/hooks/useSimulation';

import { Card, CardHeader } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';
import {
    Bell,
    Settings as SettingsIcon,
    MapPin,
    Shield,
    Activity,
    Navigation,
    User,
    AlertTriangle,
    Play,
    Pause,
    RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-100 flex items-center justify-center animate-pulse rounded-2xl">Loading Map...</div>
});

export default function Dashboard() {
    const {
        person,
        settings,
        setSettings,
        notifications,
        isRunning,
        startSimulation,
        stopSimulation,
        setManualLocation
    } = useSimulation();

    const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

    return (
        <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
            {/* Header */}
            <header className="flex-none h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        FamilyGuardian AI
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Bell className="w-5 h-5 text-zinc-500" />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
                        )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-500" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden p-6 gap-6 relative">

                {/* Left Column - Stats & Controls */}
                <div className="w-96 flex flex-col gap-6 overflow-y-auto pb-20 no-scrollbar">

                    {/* Status Card */}
                    <Card className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/50">
                        <CardHeader title="Monitored Status" />
                        <div className="flex items-center gap-4 mb-6">
                            <div className={clsx(
                                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                                person.status === 'safe' ? "bg-emerald-100 text-emerald-600" :
                                    person.status === 'warning' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600 animate-pulse"
                            )}>
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {person.status === 'safe' ? 'Safe' : person.status === 'warning' ? 'Caution' : 'DANGER'}
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                    {person.status === 'safe' ? 'Within safe zone' : 'Abnormal behavior detected'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-500">AI Risk Score</span>
                                    <span className={clsx("font-bold",
                                        person.riskScore > 70 ? "text-red-500" : person.riskScore > 40 ? "text-amber-500" : "text-emerald-500"
                                    )}>{Math.round(person.riskScore)}/100</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${person.riskScore}%` }}
                                        className={clsx("h-full rounded-full transition-all duration-500",
                                            person.riskScore > 70 ? "bg-red-500" : person.riskScore > 40 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Notifications */}
                    <Card className="flex-1 min-h-[300px]">
                        <CardHeader title="Recent Alerts" />
                        <div className="space-y-3">
                            <AnimatePresence>
                                {notifications.length === 0 ? (
                                    <div className="text-center py-10 text-zinc-400 text-sm">No recent notifications</div>
                                ) : (
                                    notifications.slice(0, 5).map(notif => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={clsx(
                                                "p-3 rounded-lg border text-sm flex gap-3 items-start",
                                                notif.type === 'critical' ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30" :
                                                    notif.type === 'warning' ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" :
                                                        "bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800"
                                            )}
                                        >
                                            {notif.type === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> :
                                                notif.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /> :
                                                    <Bell className="w-5 h-5 text-zinc-400 shrink-0" />}
                                            <div>
                                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{notif.title}</p>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{notif.message}</p>
                                                <p className="text-zinc-400 text-[10px] mt-1">{notif.timestamp.toLocaleTimeString()}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>

                </div>

                {/* Center - Map */}
                <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                    <Map person={person} homeLocation={person.homeLocation} />

                    {/* Floating Simulation Controls */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between z-[1000]">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Simulation Mode</span>
                                <span className="text-sm font-medium flex items-center gap-2">
                                    {isRunning ? <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> : <span className="w-2 h-2 rounded-full bg-zinc-300" />}
                                    {isRunning ? 'Running Real-time' : 'Paused'}
                                </span>
                            </div>
                            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
                            <Button size="sm" variant={isRunning ? "secondary" : "primary"} onClick={isRunning ? stopSimulation : startSimulation}>
                                {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                                {isRunning ? 'Pause' : 'Start Simulation'}
                            </Button>

                            <Button size="sm" variant="ghost" onClick={() => {
                                const random = () => (Math.random() - 0.5) * 0.01;
                                setManualLocation(person.homeLocation.lat + 0.006 + random(), person.homeLocation.lng + 0.006 + random());
                            }}>
                                <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
                                Simulate Wandering
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-right mr-2 hidden xl:block">
                                <p className="text-xs text-zinc-500">Current Coords</p>
                                <p className="text-xs font-mono">{person.currentLocation.lat.toFixed(4)}, {person.currentLocation.lng.toFixed(4)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Settings (Collapsible or visible) */}
                {/* For simplicity in this layout, I'll put settings in a modal or just a toggleable panel if requested, but let's stick to a clean 2-column + floating controls for now. 
            However, user asked for settings. Let's add a small settings panel on the right or make the left column specific to tabs.
        */}
                <div className="w-80 flex flex-col gap-4">
                    <Card className="h-full">
                        <CardHeader title="Configuration" subtitle="Thresholds & Alerts" />

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Safe Distance (km)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="2"
                                        step="0.1"
                                        value={settings.safeDistanceKm}
                                        onChange={(e) => setSettings({ ...settings, safeDistanceKm: parseFloat(e.target.value) })}
                                        className="w-full accent-blue-600"
                                    />
                                    <span className="text-sm w-12 text-right">{settings.safeDistanceKm}km</span>
                                </div>
                                <p className="text-xs text-zinc-500">Radius around home considered safe.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Risk Threshold</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="10"
                                        max="90"
                                        step="5"
                                        value={settings.notificationThreshold}
                                        onChange={(e) => setSettings({ ...settings, notificationThreshold: parseInt(e.target.value) })}
                                        className="w-full accent-blue-600"
                                    />
                                    <span className="text-sm w-12 text-right">{settings.notificationThreshold}%</span>
                                </div>
                                <p className="text-xs text-zinc-500">Alert triggers when risk score exceeds this value.</p>
                            </div>

                            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-sm font-semibold mb-3">Manual Override</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setManualLocation(person.homeLocation.lat, person.homeLocation.lng)}>
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Reset Home
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => {
                                        // Force critical
                                        setManualLocation(person.homeLocation.lat + 0.015, person.homeLocation.lng + 0.015);
                                    }}>
                                        Force Alert
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}
