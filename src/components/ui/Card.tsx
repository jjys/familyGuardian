
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={cn("bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6", className)}>
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle }: { title: string, subtitle?: string }) {
    return (
        <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
            {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
    );
}
