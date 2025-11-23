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
    } catch (error) {
        console.error(error);
    }
};

export const getCurrentUser = async () => {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
};
