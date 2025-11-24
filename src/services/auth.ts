import {
    GoogleSignin,
    User,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config';

export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/calendar'], // Request calendar access
    });
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

export const signOut = async () => {
    try {
        await GoogleSignin.signOut();
        await clearLoginState();
    } catch (error) {
        console.error(error);
    }
};

export const getCurrentUser = async () => {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGIN_STATE_KEY = 'is_logged_in';

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
    } catch (error) {
        console.error('Error clearing login state:', error);
    }
};
