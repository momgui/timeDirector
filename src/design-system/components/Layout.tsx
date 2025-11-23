import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../tokens';

interface LayoutProps {
    children: React.ReactNode;
    style?: ViewStyle;
    noPadding?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    style,
    noPadding = false,
}) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <View style={[styles.container, !noPadding && styles.padding, style]}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    padding: {
        paddingHorizontal: SPACING.l,
    },
});
