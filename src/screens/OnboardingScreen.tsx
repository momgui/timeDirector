import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Linking, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { SPACING } from '../design-system/tokens';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Card } from '../design-system/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { syncProfileToSupabase } from '../services/storage';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
}

const STEPS = [
    {
        id: 'welcome',
        title: "Welcome to TimeDirector",
        subtitle: "Let's personalize your experience."
    },
    {
        id: 'profile',
        title: "What represents you best?",
        subtitle: "This helps us tailor the AI suggestions."
    },
    {
        id: 'goal',
        title: "What is your main focus?",
        subtitle: "What do you want to achieve this week?"
    },
    {
        id: 'community',
        title: "Join the Elite",
        subtitle: "Connect with high-achievers on our Discord."
    }
];

const PROFILES = [
    { id: 'student', label: 'Student', icon: 'school-outline' },
    { id: 'freelance', label: 'Freelancer', icon: 'laptop-outline' },
    { id: 'entrepreneur', label: 'Entrepreneur', icon: 'rocket-outline' },
    { id: 'employee', label: 'Employee', icon: 'briefcase-outline' },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const auth = useAuth();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [profile, setProfile] = useState<string | null>(null);
    const [goal, setGoal] = useState('');

    // Animation/Transition state could go here

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const finishOnboarding = async () => {
        try {
            // Save data locally for now (or send to backend later)
            await AsyncStorage.setItem('USER_PROFILE', profile || 'unknown');
            await AsyncStorage.setItem('USER_MAIN_GOAL', goal);

            // Mark onboarding as complete
            await AsyncStorage.setItem('HAS_COMPLETED_ONBOARDING', 'true');

            // Sync to cloud
            await syncProfileToSupabase({
                profile: profile || 'unknown',
                mainGoal: goal
            });

            // Trigger Refresh (Navigation will happen automatically)
            await auth.refresh();
        } catch (error) {
            console.error('Error saving onboarding data:', error);
        }
    };

    const openDiscord = () => {
        Linking.openURL('https://discord.gg/GqDgEGvhKc');
    };

    const renderStepContent = () => {
        const step = STEPS[currentStepIndex];

        switch (step.id) {
            case 'welcome':
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="time" size={80} color={colors.primary} />
                        </View>
                        <Typography variant="h1" align="center" style={styles.title}>
                            {step.title}
                        </Typography>
                        <Typography variant="body" align="center" color={colors.textSecondary} style={styles.subtitle}>
                            {step.subtitle}
                        </Typography>
                        <View style={styles.spacer} />
                        <Button title="Get Started" onPress={handleNext} fullWidth />
                    </View>
                );

            case 'profile':
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h2" align="center" style={styles.title}>
                            {step.title}
                        </Typography>
                        <Typography variant="body" align="center" color={colors.textSecondary} style={styles.subtitle}>
                            {step.subtitle}
                        </Typography>

                        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                            {PROFILES.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.optionCard,
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        profile === p.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setProfile(p.id)}
                                >
                                    <View style={styles.optionIcon}>
                                        <Ionicons name={p.icon as any} size={24} color={profile === p.id ? colors.background : colors.primary} />
                                    </View>
                                    <Typography
                                        variant="h3"
                                        color={profile === p.id ? colors.background : colors.textPrimary}
                                    >
                                        {p.label}
                                    </Typography>
                                    {profile === p.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.background} style={styles.checkIcon} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Button
                            title="Continue"
                            onPress={handleNext}
                            disabled={!profile}
                            fullWidth
                            style={styles.bottomButton}
                        />
                    </View>
                );

            case 'goal':
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h2" align="center" style={styles.title}>
                            {step.title}
                        </Typography>
                        <Typography variant="body" align="center" color={colors.textSecondary} style={styles.subtitle}>
                            {step.subtitle}
                        </Typography>

                        <View style={[styles.goalInputContainer, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                            <TextInput
                                style={[styles.goalTextInput, { color: colors.textPrimary }]}
                                placeholder="e.g. Launch my website, Learn React Native..."
                                placeholderTextColor={colors.textTertiary}
                                value={goal}
                                onChangeText={setGoal}
                                multiline
                                autoFocus
                            />
                        </View>

                        <Button
                            title="Continue"
                            onPress={handleNext}
                            disabled={goal.length < 3}
                            fullWidth
                            style={{ marginTop: SPACING.xl }}
                        />
                    </View>
                );

            case 'community':
                return (
                    <View style={styles.stepContainer}>
                        <View style={[styles.communityIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                            <Ionicons name="logo-discord" size={60} color={colors.primary} />
                        </View>
                        <Typography variant="h2" align="center" style={styles.title}>
                            {step.title}
                        </Typography>
                        <Typography variant="body" align="center" color={colors.textSecondary} style={styles.subtitle}>
                            {step.subtitle}
                        </Typography>

                        <View style={[styles.benefitsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.benefitItem}>
                                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                                <Typography variant="body" color={colors.textPrimary} style={styles.benefitText}>
                                    Exclusive productivity tips
                                </Typography>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
                                <Typography variant="body" color={colors.textPrimary} style={styles.benefitText}>
                                    Direct access to dev team
                                </Typography>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="globe-outline" size={20} color={colors.primary} />
                                <Typography variant="body" color={colors.textPrimary} style={styles.benefitText}>
                                    Network with achievers
                                </Typography>
                            </View>
                        </View>

                        <Button
                            title="Join Community"
                            onPress={openDiscord}
                            fullWidth
                            style={{ marginBottom: SPACING.m }}
                        />

                        <Button
                            title="Skip for now"
                            onPress={finishOnboarding}
                            variant="ghost"
                            fullWidth
                        />
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? [colors.background, '#1A1A1A'] : [colors.background, colors.surfaceHighlight]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header progress or back button */}
            <View style={styles.header}>
                {currentStepIndex > 0 ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                ) : <View style={{ width: 24 }} />}

                <View style={styles.progressContainer}>
                    {STEPS.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressDot,
                                { backgroundColor: colors.surface }, // inactive dot
                                index <= currentStepIndex && { backgroundColor: colors.primary, width: 20 }
                            ]}
                        />
                    ))}
                </View>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    {renderStepContent()}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
    },
    backButton: {
        padding: SPACING.xs,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    content: {
        flex: 1,
        padding: SPACING.l,
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'flex-start', // Top alignment generally better with keyboard
        paddingTop: SPACING.xl,
    },
    iconContainer: {
        alignSelf: 'center',
        marginBottom: SPACING.xl,
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        padding: SPACING.l,
        borderRadius: 40,
    },
    title: {
        marginBottom: SPACING.s,
    },
    subtitle: {
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.m,
    },
    spacer: {
        flex: 1,
    },
    optionsList: {
        flex: 1,
        marginBottom: SPACING.m,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.m,
        borderWidth: 1,
    },
    optionIcon: {
        marginRight: SPACING.m,
    },
    checkIcon: {
        marginLeft: 'auto',
    },
    bottomButton: {
        marginTop: 'auto',
    },
    inputContainer: {
        borderRadius: 12,
        padding: SPACING.m,
        borderWidth: 1,
        minHeight: 120,
    },
    goalInputContainer: {
        borderRadius: 12,
        padding: SPACING.m,
        borderWidth: 1,
        height: 100,
    },
    textInput: {
        fontSize: 18,
        fontFamily: 'Outfit-Regular',
        textAlignVertical: 'top',
        height: '100%',
    },
    goalTextInput: {
        fontSize: 18,
        fontFamily: 'Outfit-Regular',
        textAlignVertical: 'top',
        flex: 1,
    },
    communityIconContainer: {
        alignSelf: 'center',
        marginBottom: SPACING.l,
        padding: SPACING.l,
        borderRadius: 40,
    },
    benefitsList: {
        borderRadius: 12,
        padding: SPACING.m,
        borderWidth: 1,
        marginBottom: SPACING.xl,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.s,
    },
    benefitText: {
        marginLeft: SPACING.m,
    },
});
