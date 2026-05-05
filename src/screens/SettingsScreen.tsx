import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { SPACING } from '../design-system/tokens';
import { useTheme } from '../theme';
import { signOut, deleteAccount, signInWithGoogle, linkWithGoogle, checkNativeGoogleSignIn, signIn, linkWithApple } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import Svg, { Path } from 'react-native-svg';

type SettingsScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { theme, setTheme, colors } = useTheme();
    const { user, isLoading: authLoading } = useAuth();

    const isGuest = user?.id === 'guest';
    const userEmail = user?.email;
    const isGoogleLinked = user?.app_metadata?.providers?.includes('google') ?? false;
    const canLinkGoogle = !isGoogleLinked;
    
    const isAppleLinked = user?.app_metadata?.providers?.includes('apple') ?? false;
    const canLinkApple = !isAppleLinked;

    const [isNativeGoogleSignedIn, setIsNativeGoogleSignedIn] = React.useState(false);

    React.useEffect(() => {
        checkNativeGoogleSignIn().then(setIsNativeGoogleSignedIn);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        // Global state will catch this and redirect to Login
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            // Global state will catch this and redirect to Login
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete account. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const BackIcon = ({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5" />
            <Path d="M12 19l-7-7 7-7" />
        </Svg>
    );

    const GoogleIcon = ({ size = 20 }: { size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <Path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <Path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
            />
            <Path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </Svg>
    );

    const AppleIcon = ({ size = 20, color }: { size?: number, color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M17.05 20.28c-.98.68-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 13.25 3.51 5.96 9.05 5.68c1.3.07 2.45.82 3.12.82.69 0 1.98-.89 3.54-.76 1.48.06 2.82.68 3.65 1.83-3.13 1.87-2.65 5.99.48 7.32-.73 1.87-1.63 3.73-2.79 5.39zM12.03 1.14c-.05 1.77.7 3.39 1.86 4.47 1.25 1.15 2.92 1.63 4.48 1.42-.14-1.74-.82-3.37-1.92-4.48C15.28 1.34 13.68.83 12.03 1.14z"
                fill={color || colors.text}
            />
        </Svg>
    );

    const ThemeOption = ({ mode, label }: { mode: 'light' | 'dark' | 'system', label: string }) => {
        const isActive = theme === mode;
        return (
            <TouchableOpacity
                style={[
                    styles.themeOption,
                    isActive && { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary, borderWidth: 1 }
                ]}
                onPress={() => setTheme(mode)}
            >
                <Typography
                    variant="body"
                    color={isActive ? colors.primary : colors.textSecondary}
                    weight={isActive ? "bold" : "regular"}
                >
                    {label}
                </Typography>
                {isActive && (
                    <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <Typography variant="h1">Settings</Typography>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.section}>
                    <Typography variant="h3" style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Typography>
                    <View style={[styles.themeSelector, { backgroundColor: colors.surface }]}>
                        <ThemeOption mode="system" label="Auto" />
                        <ThemeOption mode="light" label="Light" />
                        <ThemeOption mode="dark" label="Dark" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Typography variant="h3" style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Typography>
                    
                    {authLoading ? (
                        <Typography variant="body" color={colors.textSecondary}>Loading...</Typography>
                    ) : isGuest ? (
                        <View style={[styles.authCard, { backgroundColor: colors.surface }]}>
                            <Typography variant="body" style={{ marginBottom: SPACING.m }}>
                                You are using Eôs in guest mode. Sign in to sync your data across devices.
                            </Typography>
                            <Button
                                title="Sign In to Eôs"
                                onPress={() => navigation.navigate('Login')}
                                variant="primary"
                                fullWidth
                            />
                        </View>
                    ) : (
                        <View style={[styles.authCard, { backgroundColor: colors.surface }]}>
                            {/* Header */}
                            <View style={{ marginBottom: SPACING.l }}>
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: SPACING.xs }}>
                                    Signed in as
                                </Typography>
                                <Typography variant="body" weight="bold">
                                    {userEmail}
                                </Typography>
                            </View>

                            {/* Integrations Section */}
                            <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: SPACING.s, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Integrations
                            </Typography>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.l, padding: SPACING.m, backgroundColor: colors.background, borderRadius: 8 }}>
                                <View style={{ marginRight: SPACING.m }}>
                                    <GoogleIcon size={24} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Typography variant="body" weight="bold">
                                        Google Calendar
                                    </Typography>
                                    <Typography variant="caption" color={isNativeGoogleSignedIn ? '#34A853' : colors.error}>
                                        {isNativeGoogleSignedIn ? 'Connected (Active)' : 'Not connected'}
                                    </Typography>
                                </View>
                                {!isNativeGoogleSignedIn && (
                                    <Button
                                        title="Connect"
                                        onPress={async () => {
                                            const userInfo = await signIn();
                                            if (userInfo) {
                                                const status = await checkNativeGoogleSignIn();
                                                setIsNativeGoogleSignedIn(status);
                                            }
                                        }}
                                        variant="primary"
                                    />
                                )}
                            </View>

                            {/* Social Logins Section */}
                            <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: SPACING.s, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Linked Accounts
                            </Typography>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.s, padding: SPACING.m, backgroundColor: colors.background, borderRadius: 8 }}>
                                <View style={{ marginRight: SPACING.m }}>
                                    <GoogleIcon size={24} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Typography variant="body" weight="bold">
                                        Google
                                    </Typography>
                                    <Typography variant="caption" color={isGoogleLinked ? '#34A853' : colors.textSecondary}>
                                        {isGoogleLinked ? 'Linked' : 'Not linked'}
                                    </Typography>
                                </View>
                                {canLinkGoogle && (
                                    <Button
                                        title="Link"
                                        onPress={async () => {
                                            const { error } = await linkWithGoogle();
                                            if (error) Alert.alert('Error', error.message);
                                        }}
                                        variant="secondary"
                                    />
                                )}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, padding: SPACING.m, backgroundColor: colors.background, borderRadius: 8 }}>
                                <View style={{ marginRight: SPACING.m }}>
                                    <AppleIcon size={24} color={colors.text} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Typography variant="body" weight="bold">
                                        Apple
                                    </Typography>
                                    <Typography variant="caption" color={isAppleLinked ? '#34A853' : colors.textSecondary}>
                                        {isAppleLinked ? 'Linked' : 'Not linked'}
                                    </Typography>
                                </View>
                                {canLinkApple && (
                                    <Button
                                        title="Link"
                                        onPress={async () => {
                                            const { error } = await linkWithApple();
                                            if (error) Alert.alert('Error', error.message);
                                        }}
                                        variant="secondary"
                                    />
                                )}
                            </View>

                            <Button
                                title="Sign Out"
                                onPress={handleSignOut}
                                variant="secondary"
                                fullWidth
                            />
                        </View>
                    )}

                    {!isGuest && !authLoading && (
                        <Button
                            title="Delete Account"
                            onPress={handleDeleteAccount}
                            variant="ghost"
                            style={{ marginTop: SPACING.xl }}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Typography variant="h3" style={[styles.sectionTitle, { color: colors.textSecondary }]}>Legal</Typography>
                    <Button
                        title="Privacy Policy"
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                        variant="secondary"
                        style={styles.menuButton}
                    />
                    <Button
                        title="Terms of Service"
                        onPress={() => navigation.navigate('TermsOfService')}
                        variant="secondary"
                        style={styles.menuButton}
                    />
                </View>
            </ScrollView>
        </Layout >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    backButton: {
        marginRight: SPACING.m,
        padding: SPACING.xs,
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        marginBottom: SPACING.m,
    },
    logoutButton: {
        marginTop: SPACING.s,
    },
    menuButton: {
        marginBottom: SPACING.s,
        justifyContent: 'flex-start',
    },
    authCard: {
        padding: SPACING.l,
        borderRadius: 12,
        marginBottom: SPACING.m,
    },
    themeSelector: {
        flexDirection: 'row',
        padding: SPACING.s,
        borderRadius: 12,
        gap: SPACING.s,
    },
    themeOption: {
        flex: 1,
        paddingVertical: SPACING.m,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    activeDot: {
        position: 'absolute',
        bottom: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    linkSection: {
        marginTop: SPACING.l,
        paddingTop: SPACING.l,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    }
});

export default SettingsScreen;
