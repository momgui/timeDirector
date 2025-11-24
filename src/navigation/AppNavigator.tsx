import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GoalInputScreen from '../screens/GoalInputScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import { View, ActivityIndicator } from 'react-native';
import { getLoginState } from '../services/auth';
import { COLORS } from '../design-system/tokens';

const AppNavigator = () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [initialRoute, setInitialRoute] = React.useState<keyof RootStackParamList>('Login');

    React.useEffect(() => {
        checkLoginState();
    }, []);

    const checkLoginState = async () => {
        const isLoggedIn = await getLoginState();
        setInitialRoute(isLoggedIn ? 'Dashboard' : 'Login');
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute}>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
                <Stack.Screen name="GoalInput" component={GoalInputScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
