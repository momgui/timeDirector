import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config';
import { supabase } from './supabase';
import { clearLocalData } from './storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Conditionally import Google Sign-In only on native platforms
let GoogleSignin: any = null;
let statusCodes: any = {};

if (Platform.OS !== 'web') {
    const googleSignIn = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignIn.GoogleSignin;
    statusCodes = googleSignIn.statusCodes;
}

export const configureGoogleSignIn = () => {
    if (Platform.OS !== 'web' && GoogleSignin) {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            iosClientId: GOOGLE_IOS_CLIENT_ID,
            scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks'],
        });
    }
};

/**
 * Supabase Email Sign Up
 */
export const signUp = async (email: string, password: string, name: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });
        return { data, error };
    } catch (error: any) {
        console.error('Supabase Sign Up Error:', error);
        return { data: null, error };
    }
};

/**
 * Supabase Email Sign In
 */
export const signInWithEmail = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    } catch (error: any) {
        console.error('Supabase Sign In Error:', error);
        return { data: null, error };
    }
};

/**
 * Unified Google Sign-In for Supabase
 */
export const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        return { data, error };
    }

    try {
        if (!GoogleSignin) return { data: null, error: new Error('Google Sign-In not initialized') };

        await GoogleSignin.hasPlayServices();
        const { idToken } = await GoogleSignin.signIn();

        if (!idToken) {
            throw new Error('No ID token present!');
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
        });

        return { data, error };
    } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('User cancelled the login flow');
        } else {
            console.error('Google Sign In Error:', error);
        }
        return { data: null, error };
    }
};

/**
 * Link current account with Google
 */
export const linkWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.linkIdentity({
            provider: 'google',
            options: {
                redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
            },
        });
        return { data, error };
    } catch (error: any) {
        console.error('Google Link Error:', error);
        return { data: null, error };
    }
};

/**
 * Unified Apple Sign-In for Supabase
 */
export const signInWithApple = async () => {
    if (Platform.OS === 'ios') {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });
                return { data, error };
            } else {
                throw new Error('No identityToken.');
            }
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                console.log('User cancelled Apple Sign In');
            } else {
                console.error('Apple Sign In Error:', error);
            }
            return { data: null, error };
        }
    } else {
        // Fallback for Android and Web
        try {
            const redirectUrl = Platform.OS === 'web' ? window.location.origin : makeRedirectUri();
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: Platform.OS !== 'web',
                },
            });
            
            if (error) throw error;

            if (Platform.OS !== 'web' && data?.url) {
                const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (res.type === 'success') {
                    const { url } = res;
                    // Extract fragments from URL (Supabase returns tokens in fragment by default)
                    // URL is something like eos://...#access_token=...&refresh_token=...
                    const parsedUrl = new URL(url);
                    const hash = parsedUrl.hash.substring(1);
                    const queryParams = new URLSearchParams(hash);
                    const access_token = queryParams.get('access_token');
                    const refresh_token = queryParams.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        return { data: sessionData, error: sessionError };
                    } else {
                        throw new Error('Tokens not found in redirect URL');
                    }
                }
                return { data: null, error: new Error('User cancelled auth session') };
            }
            
            return { data, error };
        } catch (error: any) {
            console.error('Apple OAuth Error:', error);
            return { data: null, error };
        }
    }
};

/**
 * Link current account with Apple
 */
export const linkWithApple = async () => {
    if (Platform.OS === 'ios') {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { data, error } = await supabase.auth.linkIdentity({
                    provider: 'apple',
                    token: credential.identityToken,
                });
                return { data, error };
            } else {
                throw new Error('No identityToken.');
            }
        } catch (error: any) {
            console.error('Apple Link Error:', error);
            return { data: null, error };
        }
    } else {
        // Fallback for Android and Web
        try {
            const redirectUrl = Platform.OS === 'web' ? window.location.origin : makeRedirectUri();
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'apple',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: Platform.OS !== 'web',
                },
            });
            
            if (error) throw error;

            if (Platform.OS !== 'web' && data?.url) {
                const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (res.type === 'success') {
                    const { url } = res;
                    const parsedUrl = new URL(url);
                    const hash = parsedUrl.hash.substring(1);
                    const queryParams = new URLSearchParams(hash);
                    const access_token = queryParams.get('access_token');
                    const refresh_token = queryParams.get('refresh_token');

                    if (access_token && refresh_token) {
                        // User is already logged in, so setting session effectively refreshes it or confirms link
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        return { data: sessionData, error: sessionError };
                    }
                }
                return { data: null, error: new Error('User cancelled auth session') };
            }
            
            return { data, error };
        } catch (error: any) {
            console.error('Apple Link OAuth Error:', error);
            return { data: null, error };
        }
    }
};

/**
 * Legacy signIn kept for compatibility or specific native cases if needed
 */
export const signIn = async () => {
    if (Platform.OS === 'web') {
        return signInWithGoogle();
    }
    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        return userInfo;
    } catch (error: any) {
        console.error('Legacy Sign in error', error);
        return null;
    }
};

const LOGIN_STATE_KEY = 'is_logged_in';
const GUEST_FLAG_KEY = 'is_guest_user';

export const signInAnonymously = async () => {
    try {
        await AsyncStorage.setItem(GUEST_FLAG_KEY, 'true');
        return {
            user: {
                id: 'guest',
                name: 'Guest',
                email: '',
                photo: null,
                familyName: '',
                givenName: 'Guest',
            }
        };
    } catch (error) {
        console.error('Error signing in anonymously:', error);
        return null;
    }
};

export const saveLoginState = async () => {
    try {
        await AsyncStorage.setItem(LOGIN_STATE_KEY, 'true');
        await AsyncStorage.removeItem(GUEST_FLAG_KEY);
    } catch (error) {
        console.error('Error saving login state:', error);
    }
};

export const getLoginState = async (): Promise<boolean> => {
    try {
        // Check local login state first
        const value = await AsyncStorage.getItem(LOGIN_STATE_KEY);
        if (value === 'true') return true;

        // Verify with Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await saveLoginState();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error getting login state:', error);
        return false;
    }
};

export const clearLoginState = async () => {
    try {
        await AsyncStorage.removeItem(LOGIN_STATE_KEY);
        await AsyncStorage.removeItem(GUEST_FLAG_KEY);
    } catch (error) {
        console.error('Error clearing login state:', error);
    }
};

export const signOut = async () => {
    try {
        const isGuest = await AsyncStorage.getItem(GUEST_FLAG_KEY);
        if (isGuest !== 'true') {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Sign out from Google if on native
            if (Platform.OS !== 'web' && GoogleSignin) {
                await GoogleSignin.signOut();
            }
        }
        await clearLocalData();
        await clearLoginState();
    } catch (error) {
        console.error(error);
    }
};

export const deleteAccount = async () => {
    try {
        const isGuest = await AsyncStorage.getItem(GUEST_FLAG_KEY);
        if (isGuest !== 'true') {
            // For Supabase, user deletion usually requires admin privileges or a dedicated edge function.
            // We'll sign out for now, or you can implement a RPC call.
            await supabase.auth.signOut();

            if (Platform.OS !== 'web' && GoogleSignin) {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
            }
        }
        await clearLoginState();
        await clearLocalData();
        await AsyncStorage.removeItem('HAS_COMPLETED_ONBOARDING');
        await AsyncStorage.removeItem('USER_PROFILE');
        await AsyncStorage.removeItem('USER_MAIN_GOAL');
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    const isGuest = await AsyncStorage.getItem(GUEST_FLAG_KEY);
    if (isGuest === 'true') {
        return {
            user: {
                id: 'guest',
                name: 'Guest',
                email: '',
                photo: null,
                familyName: '',
                givenName: 'Guest',
            }
        };
    }

    // Try Supabase first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        return {
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.email,
                photo: null,
            }
        };
    }

    // Try Google Sign-In if on native
    if (Platform.OS !== 'web' && GoogleSignin) {
        const currentUser = await GoogleSignin.getCurrentUser();
        return currentUser;
    }

    return null;
};

// Helper to check if a native Google session is active
export const checkNativeGoogleSignIn = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !GoogleSignin) {
        return false;
    }
    try {
        const currentUser = await GoogleSignin.getCurrentUser();
        return !!currentUser;
    } catch {
        return false;
    }
};

// Helper to get Google tokens (only available on native)
export const getGoogleTokens = async () => {
    if (Platform.OS === 'web' || !GoogleSignin) {
        return null;
    }
    try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        // Restore session silently to ensure getTokens works after app restart
        try {
            await GoogleSignin.signInSilently();
        } catch (silentError) {
            console.log('Silent sign-in failed, user might not be signed in to Google:', silentError);
            return null;
        }
        
        return await GoogleSignin.getTokens();
    } catch (error) {
        console.error('Error getting Google tokens:', error);
        return null;
    }
};
