import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { COLORS, SPACING } from '../design-system/tokens';
import Svg, { Path } from 'react-native-svg';

type TermsOfServiceScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'TermsOfService'>;
};

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
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
                <Typography variant="h1">Terms of Service</Typography>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Typography variant="h3" style={styles.sectionTitle}>1. Terms</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    By accessing our app, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>2. Use License</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Permission is granted to temporarily download one copy of the materials (information or software) on our app for personal, non-commercial transitory viewing only.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>3. Disclaimer</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    The materials on our app are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </Typography>

                <Typography variant="h3" style={styles.sectionTitle}>4. Limitations</Typography>
                <Typography variant="body" style={styles.paragraph}>
                    In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our app.
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

export default TermsOfServiceScreen;
