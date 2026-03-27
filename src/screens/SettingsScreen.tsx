import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { SPACING } from '../design-system/tokens';
import { useTheme } from '../theme';
import { signOut, deleteAccount, getCurrentUser, signInWithGoogle } from '../services/auth';
import Svg, { Path } from 'react-native-svg';

type SettingsScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { theme, setTheme, colors } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchUser = async () => {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
                setLoading(false);
            };
            fetchUser();
        }, [])
    );

    const isGuest = user?.user?.id === 'guest';

    const handleSignOut = async () => {
        await signOut();
        navigation.replace('Login');
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
                            navigation.replace('Login');
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
                    
                    {loading ? (
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
                            <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: SPACING.xs }}>
                                Signed in as
                            </Typography>
                            <Typography variant="body" weight="bold" style={{ marginBottom: SPACING.l }}>
                                {user?.user?.email}
                            </Typography>
                            <Button
                                title="Sign Out"
                                onPress={handleSignOut}
                                variant="secondary"
                                fullWidth
                            />
                            {user?.user?.app_metadata?.providers?.indexOf('google') === -1 && (
                                <Button
                                    title="Connect Google Account"
                                    onPress={async () => {
                                        const { error } = await signInWithGoogle();
                                        if (error) Alert.alert('Error', error.message);
                                        else {
                                            const currentUser = await getCurrentUser();
                                            setUser(currentUser);
                                        }
                                    }}
                                    variant="ghost"
                                    fullWidth
                                    style={{ marginTop: SPACING.m }}
                                />
                            )}
                        </View>
                    )}

                    {!isGuest && !loading && (
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
    }
});

export default SettingsScreen;
