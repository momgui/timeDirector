import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';

interface DeleteConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemType?: 'GOAL' | 'TASK' | 'MILESTONE' | 'ITEMS';
}

const TrashIcon = ({ color = COLORS.textInverse, size = 32 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 6h18" />
        <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </Svg>
);

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    itemType
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <Card variant="solid" padding="l" style={styles.container}>
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconContainer}>
                            <TrashIcon color={COLORS.error} />
                        </View>
                    </View>

                    <Typography variant="h2" weight="bold" align="center" style={styles.title}>
                        {title}
                    </Typography>

                    <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.message}>
                        {message}
                    </Typography>

                    <View style={styles.actions}>
                        <View style={{ flex: 1, marginRight: SPACING.s }}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={onClose}
                                fullWidth
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: SPACING.s }}>
                            <Button
                                title="Delete"
                                variant="primary"
                                // Custom style for destructive action
                                style={{ backgroundColor: COLORS.error }}
                                onPress={onConfirm}
                                fullWidth
                            />
                        </View>
                    </View>
                </Card>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '100%',
    },
    iconWrapper: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        marginBottom: SPACING.s,
    },
    message: {
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.m,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
