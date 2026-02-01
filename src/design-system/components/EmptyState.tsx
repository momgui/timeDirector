import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { Card } from './Card';
import { COLORS, SPACING } from '../tokens';

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onPress: () => void;
    };
    icon?: React.ReactNode;
    style?: ViewStyle;
    variant?: 'solid' | 'glass' | 'outlined';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    action,
    icon,
    style,
    variant = 'solid',
}) => {
    return (
        <Card
            variant={variant}
            padding="xl"
            style={[styles.container, style]}
        >
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Typography variant="h3" weight="semibold" align="center" style={styles.title}>
                {title}
            </Typography>
            {description && (
                <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
                    {description}
                </Typography>
            )}
            {action && (
                <Button
                    title={action.label}
                    onPress={action.onPress}
                    variant="primary"
                    style={styles.button}
                />
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: SPACING.m,
    },
    title: {
        marginBottom: SPACING.s,
    },
    description: {
        marginBottom: SPACING.l,
        maxWidth: 280,
    },
    button: {
        minWidth: 160,
    },
});
