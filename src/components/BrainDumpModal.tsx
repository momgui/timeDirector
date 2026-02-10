import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { SPACING, RADIUS } from '../design-system/tokens';
import { useTheme } from '../theme';

interface BrainDumpModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (titles: string[]) => void;
}

export const BrainDumpModal: React.FC<BrainDumpModalProps> = ({
    visible,
    onClose,
    onSave,
}) => {
    const { colors } = useTheme();
    const [text, setText] = useState('');

    const handleSave = () => {
        if (!text.trim()) return;

        // Split by newlines and filter out empty lines
        const titles = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (titles.length === 0) return;

        onSave(titles);
        setText('');
        onClose();
    };

    const handleClose = () => {
        setText('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

                <Card variant="solid" padding="l" style={styles.container}>
                    <View style={styles.headerRow}>
                        <View>
                            <Typography variant="h2" weight="bold" color={colors.textPrimary}>
                                Brain Dump 🧠
                            </Typography>
                            <Typography variant="caption" color={colors.textSecondary}>
                                One task per line
                            </Typography>
                        </View>
                        <Button
                            title="Add Tasks"
                            variant="primary"
                            onPress={handleSave}
                            disabled={!text.trim()}
                            size="s"
                        />
                    </View>

                    <TextInput
                        placeholder="Buy milk&#10;Call Mom&#10;Email boss"
                        value={text}
                        onChangeText={setText}
                        autoFocus
                        multiline
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: colors.surfaceHighlight,
                                color: colors.textPrimary
                            }
                        ]}
                        placeholderTextColor={colors.textTertiary}
                        textAlignVertical="top"
                    />

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={handleClose}
                            style={{ flex: 1, marginRight: SPACING.s }}
                        />
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
        maxHeight: '80%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    textArea: {
        minHeight: 200,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        fontSize: 16,
        marginBottom: SPACING.l,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
