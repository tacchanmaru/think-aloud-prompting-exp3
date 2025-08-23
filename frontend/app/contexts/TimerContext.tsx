'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimerContextType {
    startTime: number | null;
    elapsedTime: number;
    isRunning: boolean;
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;
    formatTime: (seconds: number) => string;
    getStartTimeISO: () => string | null;
    getEndTimeISO: () => string;
    getDurationSeconds: () => number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};

interface TimerProviderProps {
    children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isRunning && startTime) {
            intervalId = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isRunning, startTime]);

    const startTimer = () => {
        const now = Date.now();
        setStartTime(now);
        setElapsedTime(0);
        setIsRunning(true);
    };

    const stopTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = () => {
        setStartTime(null);
        setElapsedTime(0);
        setIsRunning(false);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getStartTimeISO = (): string | null => {
        return startTime ? new Date(startTime).toISOString() : null;
    };

    const getEndTimeISO = (): string => {
        return new Date().toISOString();
    };

    const getDurationSeconds = (): number => {
        if (!startTime) return 0;
        return Math.floor((Date.now() - startTime) / 1000);
    };

    return (
        <TimerContext.Provider
            value={{
                startTime,
                elapsedTime,
                isRunning,
                startTimer,
                stopTimer,
                resetTimer,
                formatTime,
                getStartTimeISO,
                getEndTimeISO,
                getDurationSeconds,
            }}
        >
            {children}
        </TimerContext.Provider>
    );
};