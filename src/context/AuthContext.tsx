import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { getLoginState, getCurrentUser } from '../services/auth';
import { pullFromSupabase } from '../services/storage';

export interface AuthContextType {
    isLoggedIn: boolean;
    user: any | null;
    hasOnboarded: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [hasOnboarded, setHasOnboarded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isLoggedInRef = useRef(false);

    // Sync ref with state
    useEffect(() => {
        isLoggedInRef.current = isLoggedIn;
    }, [isLoggedIn]);

    const refresh = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            console.log('[AuthContext] Refreshing state...');
            const loggedIn = await getLoginState();
            
            let userResult = null;
            let onboardedResult = false;

            if (loggedIn) {
                // Fetch user data
                const currentUser = await getCurrentUser();
                userResult = currentUser?.user || null;

                // Check onboarding state
                const onboarded = await AsyncStorage.getItem('HAS_COMPLETED_ONBOARDING');
                onboardedResult = onboarded === 'true';

                // Sync data if possible
                await pullFromSupabase();
            }

            // Update all auth-related states together
            setIsLoggedIn(loggedIn);
            setUser(userResult);
            setHasOnboarded(onboardedResult);
        } catch (error) {
            console.error('[AuthContext] Refresh error:', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                if (Platform.OS === 'web') {
                    // On web, if we are in the middle of a redirect flow, keep loading
                    if (window.location.hash || window.location.search.includes('code=')) {
                        console.log('[AuthContext] OAuth redirect detected, waiting for session...');
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    } else {
                        // Very brief delay just to ensure stable mount
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                await refresh(false);
            } finally {
                setIsLoading(false);
            }
        };

        init();

        // Global listener for Supabase auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Event:', event);
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
                // Only show loading if we are NOT already logged in (initial transition)
                const shouldShowLoading = event === 'SIGNED_IN' && !isLoggedInRef.current;
                await refresh(shouldShowLoading);
            } else if (event === 'SIGNED_OUT') {
                setIsLoggedIn(false);
                setUser(null);
                setHasOnboarded(false);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [refresh]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, hasOnboarded, isLoading, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
