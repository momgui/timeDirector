import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { COLORS, SPACING } from '../design-system/tokens';
import Svg, { Path } from 'react-native-svg';

type PrivacyPolicyScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;
};

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
    const BackIcon = ({ color = COLORS.textPrimary, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5" />
            <Path d="M12 19l-7-7 7-7" />
        </Svg>
    );

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <Typography variant="h1">Privacy Policy</Typography>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Typography variant="body" style={styles.paragraph}>
                    Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our application.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>Information We Collect</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We only collect data that you provide to us directly during the onboarding process. This information is used solely to personalize your experience within the application.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>Data Usage</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We do not share any personally identifying information publicly or with third-parties, except when required to by law.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>Your Rights</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>Contact Us</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    If you have any questions about how we handle user data and personal information, feel free to contact us.
                </Typography>

                <View style={{ height: SPACING.xl }} />
            </ScrollView>
        </Layout>
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
    sectionTitle: {
        marginTop: SPACING.l,
        marginBottom: SPACING.s,
        color: COLORS.textPrimary,
    },
    paragraph: {
        marginBottom: SPACING.s,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
});

export default PrivacyPolicyScreen;
