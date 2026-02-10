import {
    GoogleSignin,
    User,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config';

export const configureGoogleSignIn = () => {
    if (Platform.OS !== 'web') {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            iosClientId: GOOGLE_IOS_CLIENT_ID,
            scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks'], // Request calendar and tasks access
        });
    }
};

export const signIn = async () => {
    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        return userInfo;
    } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('User cancelled the login flow');
        } else if (error.code === statusCodes.IN_PROGRESS) {
            console.log('Signing in');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            console.log('Play services not available or outdated');
        } else {
            console.error('Some other error happened', error);
        }
        return null;
    }
};

// ... existing code ...
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
    } catch (error) {
        console.error('Error saving login state:', error);
    }
};

export const getLoginState = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(LOGIN_STATE_KEY);
        return value === 'true';
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
            await GoogleSignin.signOut();
        }
        await clearLoginState();
    } catch (error) {
        console.error(error);
    }
};

export const deleteAccount = async () => {
    try {
        const isGuest = await AsyncStorage.getItem(GUEST_FLAG_KEY);
        if (isGuest !== 'true') {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
        }
        await clearLoginState();
        // Clear onboarding flag so user sees onboarding on next login
        await AsyncStorage.removeItem('HAS_COMPLETED_ONBOARDING');
        // Clear user profile data
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
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
};
