import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Layout } from '../design-system/components/Layout';
import { signUp, saveLoginState } from '../services/auth';
import { pullFromSupabase, pushLocalDataToSupabase } from '../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { useTheme } from '../theme';
import { SPACING } from '../design-system/tokens';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export default function SignUpScreen() {
    const { colors } = useTheme();
    const auth = useAuth();
    const navigation = useNavigation<SignUpScreenNavigationProp>();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);


    const handleSignUp = async () => {
        if (!email || !password || !name) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const { data, error: signUpError } = await signUp(email, password, name); // Destructure data
            if (signUpError) {
                setError(signUpError.message);
            } else if (data?.session) {
                await saveLoginState();
                await pullFromSupabase();
                await pushLocalDataToSupabase();
                // State-driven transition
                await auth.refresh();
            } else {
                // Handle cases where signUp is successful but no session is immediately available (e.g., email verification required)
                alert('Account created! Please check your email for verification if required.');
                navigation.navigate('Login');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign up');
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
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Typography variant="hero" color={colors.primary} align="center" style={styles.title}>
                                Create Account
                            </Typography>
                            <Typography variant="body" color={colors.textSecondary} align="center">
                                Join Eôs to sync your focus across all devices.
                            </Typography>
                        </View>

                        <View style={styles.form}>
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                            <View style={{ height: SPACING.m }} />
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
                            <View style={{ height: SPACING.m }} />
                            <Input
                                label="Confirm Password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />

                            {error && (
                                <Typography variant="caption" color={colors.error} style={styles.errorText}>
                                    {error}
                                </Typography>
                            )}
                        </View>

                        <Button
                            title="Create Eôs Account"
                            onPress={handleSignUp}
                            loading={loading}
                            fullWidth
                            variant="primary"
                        />

                        <View style={{ height: SPACING.l }} />

                        <Button
                            title="Already have an account? Sign In"
                            onPress={() => navigation.navigate('Login')}
                            variant="ghost"
                            fullWidth
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Layout>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: SPACING.xl,
    },
    header: {
        marginBottom: SPACING.xxl,
    },
    title: {
        marginBottom: SPACING.s,
    },
    form: {
        marginBottom: SPACING.xl,
    },
    errorText: {
        marginTop: SPACING.s,
        textAlign: 'center',
    },
});
