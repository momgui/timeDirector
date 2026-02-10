import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Layout } from '../design-system/components/Layout';
import { saveLoginState, signIn, signInAnonymously } from '../services/auth';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { useTheme } from '../theme';
import { SPACING } from '../design-system/tokens';
import { RootStackParamList } from '../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const userInfo = await signIn();
            if (userInfo) {
                await saveLoginState();
                // Check if user has completed onboarding
                const hasOnboarded = await AsyncStorage.getItem('HAS_COMPLETED_ONBOARDING');
                if (hasOnboarded === 'true') {
                    navigation.replace('Dashboard');
                } else {
                    navigation.replace('Onboarding');
                }
            }
        } catch (error) {
            console.error('Sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestSignIn = async () => {
        setLoading(true);
        try {
            const userInfo = await signInAnonymously();
            if (userInfo) {
                await saveLoginState();
                // Check if user has completed onboarding
                const hasOnboarded = await AsyncStorage.getItem('HAS_COMPLETED_ONBOARDING');
                if (hasOnboarded === 'true') {
                    navigation.replace('Dashboard');
                } else {
                    navigation.replace('Onboarding');
                }
            }
        } catch (error) {
            console.error('Guest sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.header}>
                        <Typography variant="hero" color={colors.primary} align="center" style={styles.title}>
                            Eôs
                        </Typography>
                        <Typography variant="body" color={colors.textSecondary} align="center">
                            Master your time, master your life.
                        </Typography>
                    </View>
                    <Button
                        title="Sign In with Google"
                        onPress={handleSignIn}
                        loading={loading}
                        fullWidth
                    />
                    <View style={{ height: SPACING.m }} />
                    <Button
                        title="Continue as Guest"
                        onPress={handleGuestSignIn}
                        variant="ghost"
                        loading={loading}
                        fullWidth
                    />
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Layout>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        marginBottom: SPACING.xxl,
    },
    title: {
        marginBottom: SPACING.s,
    },
});
