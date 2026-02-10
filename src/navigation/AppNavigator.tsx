import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GoalInputScreen from '../screens/GoalInputScreen';
import GoalDetailsScreen from '../screens/GoalDetailsScreen';
import { FocusSessionScreen } from '../screens/FocusSessionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import { View, ActivityIndicator } from 'react-native';
import { getLoginState } from '../services/auth';
import { useTheme } from '../theme';

const AppNavigator = () => {
    const { colors } = useTheme();
    const [isLoading, setIsLoading] = React.useState(true);
    const [initialRoute, setInitialRoute] = React.useState<keyof RootStackParamList>('Login');

    React.useEffect(() => {
        checkLoginState();
    }, []);


    const checkLoginState = async () => {
        try {
            const isLoggedIn = await getLoginState();

            if (isLoggedIn) {
                // If logged in, check if onboarding is done
                const hasOnboarded = await AsyncStorage.getItem('HAS_COMPLETED_ONBOARDING');
                if (hasOnboarded === 'true') {
                    setInitialRoute('Dashboard');
                } else {
                    setInitialRoute('Onboarding');
                }
            } else {
                setInitialRoute('Login');
            }
        } catch (e) {
            console.error(e);
            setInitialRoute('Login'); // Fallback
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute}>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
                <Stack.Screen name="GoalInput" component={GoalInputScreen} options={{ headerShown: false }} />
                <Stack.Screen name="GoalDetails" component={GoalDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="FocusSession" component={FocusSessionScreen} options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
