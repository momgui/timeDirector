import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING } from '../tokens';
import { useTheme } from '../../theme';
import { MiniPlayer } from '../../components/MiniPlayer';

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
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }, !noPadding && styles.padding, style]}>
                {children}
            </View>
            <MiniPlayer />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        // backgroundColor handled dynamically
    },
    padding: {
        paddingHorizontal: SPACING.l,
    },
});

