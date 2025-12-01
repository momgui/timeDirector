import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { COLORS, SPACING } from '../design-system/tokens';

interface RenameModalProps {
    visible: boolean;
    initialValue: string;
    title: string;
    onClose: () => void;
    onSave: (newValue: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
    visible,
    initialValue,
    title,
    onClose,
    onSave,
}) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (visible) {
            setValue(initialValue);
        }
    }, [visible, initialValue]);

    const handleSave = () => {
        if (value.trim()) {
            onSave(value.trim());
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity style={styles.backdrop} onPress={handleSave} activeOpacity={1} />

                <View style={styles.contentContainer}>
                    <Card variant="solid" padding="l" style={styles.card}>
                        <Typography variant="h3" style={styles.title}>{title}</Typography>

                        <Input
                            value={value}
                            onChangeText={setValue}
                            autoFocus
                            style={styles.input}
                            placeholder="Enter new name..."
                        />

                        <View style={styles.actions}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={onClose}
                                style={styles.cancelButton}
                            />
                            <Button
                                title="Save"
                                onPress={handleSave}
                                style={styles.saveButton}
                            />
                        </View>
                    </Card>
                </View>
            </KeyboardAvoidingView>
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
    contentContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    card: {
        width: '100%',
    },
    title: {
        marginBottom: SPACING.l,
    },
    input: {
        marginBottom: SPACING.l,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.s,
    },
    cancelButton: {
        flex: 1,
    },
    saveButton: {
        flex: 1,
    },
});
