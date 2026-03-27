import React, { useState } from 'react';
import { Platform, View, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';

interface PlatformDatePickerProps {
    value: Date;
    onChange: (event: any, selectedDate?: Date) => void;
    minimumDate?: Date;
    themeVariant?: 'dark' | 'light';
}

/**
 * Cross-platform DatePicker:
 * - iOS/Android: uses @react-native-community/datetimepicker
 * - Web: uses native <input type="date">
 */
export const PlatformDatePicker: React.FC<PlatformDatePickerProps> = ({
    value,
    onChange,
    minimumDate,
    themeVariant,
}) => {
    if (Platform.OS === 'web') {
        const formatDateForInput = (date: Date) => {
            const y = date.getFullYear();
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const d = date.getDate().toString().padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const handleChange = (e: any) => {
            const dateValue = e.target?.value || e.nativeEvent?.text;
            if (dateValue) {
                const newDate = new Date(dateValue + 'T00:00:00');
                onChange({ type: 'set' }, newDate);
            }
        };

        return (
            <View style={webStyles.container}>
                <TextInput
                    // @ts-ignore — web-only props
                    type="date"
                    value={formatDateForInput(value)}
                    onChange={handleChange}
                    style={[webStyles.input, { color: COLORS.textPrimary }]}
                    min={minimumDate ? formatDateForInput(minimumDate) : undefined}
                />
            </View>
        );
    }

    // Native: use the community DateTimePicker
    const DateTimePicker = require('@react-native-community/datetimepicker').default;
    return (
        <DateTimePicker
            value={value}
            mode="date"
            display="default"
            onChange={onChange}
            minimumDate={minimumDate}
            themeVariant={themeVariant}
        />
    );
};

interface PlatformTimePickerProps {
    value: Date;
    onChange: (event: any, selectedDate?: Date) => void;
    display?: string;
    textColor?: string;
    themeVariant?: 'dark' | 'light';
}

/**
 * Cross-platform TimePicker:
 * - iOS/Android: uses @react-native-community/datetimepicker
 * - Web: uses native <input type="time">
 */
export const PlatformTimePicker: React.FC<PlatformTimePickerProps> = ({
    value,
    onChange,
    display,
    textColor,
    themeVariant,
}) => {
    if (Platform.OS === 'web') {
        const formatTimeForInput = (date: Date) => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        const handleChange = (e: any) => {
            const timeValue = e.target?.value || e.nativeEvent?.text;
            if (timeValue) {
                const [hours, minutes] = timeValue.split(':').map(Number);
                const newDate = new Date(value);
                newDate.setHours(hours);
                newDate.setMinutes(minutes);
                onChange({ type: 'set' }, newDate);
            }
        };

        return (
            <View style={webStyles.container}>
                <TextInput
                    // @ts-ignore — web-only props
                    type="time"
                    value={formatTimeForInput(value)}
                    onChange={handleChange}
                    style={[webStyles.input, { color: COLORS.textPrimary }]}
                />
            </View>
        );
    }

    // Native: use the community DateTimePicker
    const DateTimePicker = require('@react-native-community/datetimepicker').default;
    return (
        <DateTimePicker
            value={value}
            mode="time"
            display={display || 'default'}
            onChange={onChange}
            textColor={textColor}
            themeVariant={themeVariant}
        />
    );
};

const webStyles = StyleSheet.create({
    container: {
        padding: SPACING.m,
    },
    input: {
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 200,
    },
});
