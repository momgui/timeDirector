import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Layout } from '../design-system/components/Layout';
import { saveLoginState } from '../services/auth';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { Card } from '../design-system/components/Card';
import { COLORS, SPACING } from '../design-system/tokens';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

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

                    <Card variant="glass" padding="xl" style={styles.formCard}>
                        <Input
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View style={styles.actions}>
                            <Button
                                title="Sign In"
                                onPress={handleLogin}
                                loading={loading}
                                fullWidth
                            />

                        </View>
                    </Card>
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
