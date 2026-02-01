import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Layout } from '../design-system/components/Layout';
import { saveLoginState, signIn } from '../services/auth';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { Card } from '../design-system/components/Card';
import { COLORS, SPACING } from '../design-system/tokens';
import { useNavigation } from '@react-navigation/native';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../config';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/tasks'],
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            // Here you would typically use the token to fetch user details or just consider them logged in
            // For now, we'll just save the login state
            saveLoginState().then(() => {
                navigation.navigate('Dashboard' as never);
            });
        }
    }, [response]);

    const handleLogin = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(async () => {
            await saveLoginState();
            setLoading(false);
            navigation.navigate('Dashboard' as never);
        }, 1500);
    };

    return (
        <Layout>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.header}>
                        <Typography variant="hero" color={COLORS.primary} align="center" style={styles.title}>
                            Eôs
                        </Typography>
                        <Typography variant="body" color={COLORS.textSecondary} align="center">
                            Master your time, master your life.
                        </Typography>
                    </View>
                    <Button
                        title="Sign In with Google"
                        onPress={async () => {
                            setLoading(true);
                            if (Platform.OS === 'web') {
                                await promptAsync();
                            } else {
                                const userInfo = await signIn();
                                if (userInfo) {
                                    await saveLoginState();
                                    navigation.navigate('Dashboard' as never);
                                }
                            }
                            setLoading(false);
                        }}
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
    formCard: {
        width: '100%',
    },
    actions: {
        marginTop: SPACING.l,
        gap: SPACING.m,
    },

});
