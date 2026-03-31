import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { processSyncQueue } from '../services/syncManager';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GoalInputScreen from '../screens/GoalInputScreen';
import GoalDetailsScreen from '../screens/GoalDetailsScreen';
import { FocusSessionScreen } from '../screens/FocusSessionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import SignUpScreen from '../screens/SignUpScreen';

import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { colors } = useTheme();
    const { isLoggedIn, hasOnboarded, isLoading } = useAuth();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable !== false) {
                processSyncQueue();
            }
        });

        // Trigger an initial process at startup
        processSyncQueue();

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isLoggedIn ? (
                    // AUTH STACK
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                    </>
                ) : !hasOnboarded ? (
                    // ONBOARDING STACK
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : (
                    // APP STACK
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="GoalInput" component={GoalInputScreen} />
                        <Stack.Screen name="GoalDetails" component={GoalDetailsScreen} />
                        <Stack.Screen name="FocusSession" component={FocusSessionScreen} options={{ animation: 'fade' }} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
