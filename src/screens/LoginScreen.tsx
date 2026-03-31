import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Layout } from '../design-system/components/Layout';
import { saveLoginState, signInAnonymously, signInWithEmail, signInWithGoogle } from '../services/auth';
import { pullFromSupabase, pushLocalDataToSupabase } from '../services/storage';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { useTheme } from '../theme';
import { SPACING } from '../design-system/tokens';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
    const { colors } = useTheme();
    const auth = useAuth();
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const { data, error: signInError } = await signInWithEmail(email, password);
            if (signInError) {
                setError(signInError.message);
            } else if (data?.session) {
                await saveLoginState();
                await pullFromSupabase();
                await pushLocalDataToSupabase();
                // State-driven transition
                await auth.refresh();
            }
        } catch (error: any) {
            setError(error.message || 'Sign in error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { data, error: googleError } = await signInWithGoogle();
            if (googleError) {
                const msg = googleError.message.toLowerCase();
                if (msg.includes('already exists') || msg.includes('already registered')) {
                    setError("Un compte existe déjà avec cet email. Connecte-toi d'abord avec ton email/mot de passe, puis lie ton compte Google dans les Paramètres.");
                } else {
                    setError(googleError.message);
                }
            } else if (data && 'session' in data && data.session) {
                await saveLoginState();
                await pullFromSupabase();
                await pushLocalDataToSupabase();
                // State-driven transition
                await auth.refresh();
            }
        } catch (error: any) {
            console.error('Sign in error:', error);
            const msg = error.message?.toLowerCase() || '';
            if (msg.includes('already exists') || msg.includes('already registered')) {
                setError("Un compte existe déjà avec cet email. Connecte-toi d'abord avec ton email/mot de passe, puis lie ton compte Google dans les Paramètres.");
            } else {
                setError(error.message || 'Google sign in error');
            }
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
                // State-driven transition
                await auth.refresh();
            }
        } catch (error) {
            console.error('Guest sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <TouchableWithoutFeedback onPress={Platform.OS !== 'web' ? Keyboard.dismiss : undefined}>
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
                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <View style={{ height: SPACING.m }} />
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        {error && (
                            <Typography variant="caption" color={colors.error} style={styles.errorText}>
                                {error}
                            </Typography>
                        )}
                    </View>

                    <Button
                        title="Sign In with Eôs"
                        onPress={handleSignIn}
                        loading={loading}
                        fullWidth
                    />

                    <View style={{ height: SPACING.m }} />

                    <Button
                        title="Don't have an account? Sign Up"
                        onPress={() => navigation.navigate('SignUp')}
                        variant="ghost"
                        fullWidth
                    />

                    <View style={styles.divider}>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                        <Typography variant="caption" color={colors.textSecondary} style={styles.dividerText}>
                            OR
                        </Typography>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <Button
                        title="Continue with Google"
                        onPress={handleGoogleSignIn}
                        loading={loading}
                        variant="secondary"
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
    form: {
        marginBottom: SPACING.l,
    },
    errorText: {
        marginTop: SPACING.s,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    line: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: SPACING.m,
    },
});
