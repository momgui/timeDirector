import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Eôs',
    slug: 'eos',
    scheme: 'eos',
    version: '0.0.3',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    // @ts-ignore: newArchEnabled might not be in the type definition yet
    newArchEnabled: true,
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.momgui.timedirector',
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        package: 'com.momgui.timedirector',
        versionCode: 3,
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        googleServicesFile: './google-services.json',
    },
    web: {
        favicon: './assets/favicon.png',
    },
    plugins: [
        './plugins/withAndroidSigning',
        'expo-web-browser',
        'expo-font',
    ],
    extra: {
        googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
        googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
        googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
        geminiApiKey: process.env.GEMINI_API_KEY,
        eas: {
            projectId: '9d09df27-ed0f-4c40-8a21-aada22f6c961',
        },
    },
});
