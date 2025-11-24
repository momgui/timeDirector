import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Typography } from '../design-system/components/Typography';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { Step } from '../types';

interface WeeklyCalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    steps: Step[];
}

const DAYS_TO_RENDER = 30; // Render next 30 days

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, onDateSelect, steps }) => {
    const flatListRef = useRef<FlatList>(null);

    // Generate dates
    const dates = Array.from({ length: DAYS_TO_RENDER }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        return date;
    });

    // Check if a date has tasks
    const hasTasks = (date: Date) => {
        return steps.some(step => {
            const stepDate = new Date(step.date);
            return stepDate.getDate() === date.getDate() &&
                stepDate.getMonth() === date.getMonth() &&
                stepDate.getFullYear() === date.getFullYear();
        });
    };

    const isSameDate = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const renderItem = ({ item, index }: { item: Date; index: number }) => {
        const isSelected = isSameDate(item, selectedDate);
        const hasTask = hasTasks(item);
        const dayName = item.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = item.getDate();

        return (
            <TouchableOpacity
                onPress={() => onDateSelect(item)}
                style={[
                    styles.dayContainer,
                    isSelected && styles.selectedDayContainer
                ]}
                activeOpacity={0.7}
            >
                <Typography
                    variant="caption"
                    color={isSelected ? COLORS.textInverse : COLORS.textSecondary}
                    style={styles.dayName}
                >
                    {dayName}
                </Typography>
                <Typography
                    variant="h3"
                    weight="bold"
                    color={isSelected ? COLORS.textInverse : COLORS.textPrimary}
                >
                    {dayNumber}
                </Typography>
                {hasTask && (
                    <View style={[
                        styles.dot,
                        isSelected ? styles.selectedDot : styles.defaultDot
                    ]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={dates}
                renderItem={renderItem}
                keyExtractor={(item) => item.toISOString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
    },
    listContent: {
        paddingHorizontal: SPACING.l,
        gap: SPACING.s,
    },
    dayContainer: {
        width: 56,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.m,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedDayContainer: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayName: {
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        fontSize: 10,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: SPACING.xs,
    },
    defaultDot: {
        backgroundColor: COLORS.primary,
    },
    selectedDot: {
        backgroundColor: COLORS.textInverse,
    },
});
