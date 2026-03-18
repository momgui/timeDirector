import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { SPACING, RADIUS } from '../design-system/tokens';
import { useTheme } from '../theme';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    initialDate?: Date;
    title?: string;
}

const ChevronLeft = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronRight = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
    visible,
    onClose,
    onSelect,
    initialDate = new Date(),
    title = "Select Date"
}) => {
    const { colors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));

    useEffect(() => {
        if (visible) {
            setSelectedDate(initialDate);
            setCurrentMonth(startOfMonth(initialDate));
        }
    }, [visible, initialDate]);

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const handleDayPress = (day: Date) => {
        setSelectedDate(day);
    };

    const handleConfirm = () => {
        onSelect(selectedDate);
        onClose();
    };

    const renderDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        return (
            <View style={styles.daysGrid}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <View key={`header-${index}`} style={styles.dayCell}>
                        <Typography variant="caption" color={colors.textTertiary} weight="bold">
                            {day}
                        </Typography>
                    </View>
                ))}

                {days.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);

                    return (
                        <TouchableOpacity
                            key={day.toISOString()}
                            style={styles.dayCell}
                            onPress={() => handleDayPress(day)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.dayInner,
                                isSelected && { backgroundColor: colors.primary },
                                !isSelected && isTodayDate && { borderWidth: 1, borderColor: colors.primary }
                            ]}>
                                <Typography
                                    variant="body"
                                    color={
                                        isSelected
                                            ? colors.textInverse
                                            : !isCurrentMonth
                                                ? colors.textTertiary
                                                : colors.textPrimary
                                    }
                                    weight={isSelected || isTodayDate ? "bold" : "regular"}
                                >
                                    {format(day, 'd')}
                                </Typography>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

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
                    <View style={styles.header}>
                        <Typography variant="h3" weight="bold" color={colors.textPrimary}>
                            {title}
                        </Typography>
                    </View>

                    <View style={styles.calendarContainer}>
                        <View style={styles.monthNavigation}>
                            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                                <ChevronLeft color={colors.textSecondary} />
                            </TouchableOpacity>

                            <Typography variant="h3" weight="medium" color={colors.textPrimary}>
                                {format(currentMonth, 'MMMM yyyy')}
                            </Typography>

                            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                                <ChevronRight color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {renderDays()}
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={onClose}
                            style={styles.button}
                        />
                        <Button
                            title="Confirm"
                            variant="primary"
                            onPress={handleConfirm}
                            style={styles.button}
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
        maxWidth: 400,
        alignSelf: 'center',
    },
    header: {
        marginBottom: SPACING.l,
        alignItems: 'center',
    },
    calendarContainer: {
        marginBottom: SPACING.xl,
    },
    monthNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
        paddingHorizontal: SPACING.s,
    },
    navButton: {
        padding: SPACING.s,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayInner: {
        width: 36,
        height: 36,
        borderRadius: 18, // Explicitly half of width/height
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure background doesn't bleed
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.s,
    },
    button: {
        minWidth: 100,
    }
});
