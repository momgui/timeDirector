import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Step, Session, Goal } from '../types';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FocusContextType {
    isSessionActive: boolean;
    isPaused: boolean;
    isMinimized: boolean;
    currentSession: Session | null;
    activeGoal: Goal | null; // Or Step if we focus on a step
    activeStep: Step | null;
    elapsedTime: number; // In seconds
    startSession: (goal?: Goal, step?: Step) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => Promise<void>;
    minimizeSession: () => void;
    maximizeSession: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const useFocus = () => {
    const context = useContext(FocusContext);
    if (!context) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
};

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
    const [activeStep, setActiveStep] = useState<Step | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const backgroundTimeRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // Initial load from storage if needed (persistence restoration)
    // For now, we start fresh or simple persistence can be added later

    const tick = useCallback(() => {
        setElapsedTime(prev => prev + 1);
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(tick, 1000);
    }, [tick]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Handle App State Logic (Background/Foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [isSessionActive, isPaused]);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (isSessionActive && !isPaused) {
            if (nextAppState.match(/inactive|background/)) {
                // Going to background
                backgroundTimeRef.current = Date.now();
                stopTimer(); // Stop interval to save battery, rely on check update
            } else if (nextAppState === 'active') {
                // Coming back
                if (backgroundTimeRef.current) {
                    const now = Date.now();
                    const diffSeconds = Math.floor((now - backgroundTimeRef.current) / 1000);
                    setElapsedTime(prev => prev + diffSeconds);
                    backgroundTimeRef.current = null;
                    startTimer();
                }
            }
        }
    };

    const startSession = (goal?: Goal, step?: Step) => {
        if (isSessionActive) return; // Already active

        const newSession: Session = {
            id: Date.now().toString(), // Simple ID for now
            goalId: goal?.id,
            taskId: step?.id,
            startTime: Date.now(),
            duration: 0,
            status: 'ACTIVE',
            createdAt: new Date(),
        };

        setCurrentSession(newSession);
        setActiveGoal(goal || null);
        setActiveStep(step || null);
        setIsSessionActive(true);
        setIsPaused(false);
        setIsMinimized(false);
        setElapsedTime(0);
        startTimeRef.current = Date.now();

        startTimer();
    };

    const pauseSession = () => {
        if (!isSessionActive || isPaused) return;
        setIsPaused(true);
        stopTimer();
        // Update status in currentSession object locally if needed
    };

    const resumeSession = () => {
        if (!isSessionActive || !isPaused) return;
        setIsPaused(false);
        startTimer();
    };

    const stopSession = async () => {
        if (!isSessionActive) return;

        stopTimer();

        // Finalize Session Data
        const completedSession: Session = {
            ...currentSession!,
            endTime: Date.now(),
            duration: elapsedTime,
            status: 'COMPLETED'
        };

        // TODO: Save to Storage (AsyncStorage or generic storage service)
        // await saveSessionToStorage(completedSession);
        console.log("Session Completed:", completedSession);

        // Reset State
        setIsSessionActive(false);
        setIsPaused(false);
        setIsMinimized(false);
        setCurrentSession(null);
        setActiveGoal(null);
        setActiveStep(null);
        setElapsedTime(0);
        backgroundTimeRef.current = null;
    };

    const minimizeSession = () => {
        setIsMinimized(true);
    };

    const maximizeSession = () => {
        setIsMinimized(false);
    };

    return (
        <FocusContext.Provider value={{
            isSessionActive,
            isPaused,
            isMinimized,
            currentSession,
            activeGoal,
            activeStep,
            elapsedTime,
            startSession,
            pauseSession,
            resumeSession,
            stopSession,
            minimizeSession,
            maximizeSession
        }}>
            {children}
        </FocusContext.Provider>
    );
};
