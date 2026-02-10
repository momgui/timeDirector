import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, PanResponder, Animated, LayoutChangeEvent } from 'react-native';
import { Typography } from '../design-system/components/Typography';
import { SPACING, RADIUS } from '../design-system/tokens';
import { Step } from '../types';
import { useTheme } from '../theme';

interface WeeklyCalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    steps: Step[];
}

const DAYS_TO_RENDER_WEEK = 30;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = (SCREEN_WIDTH - (SPACING.l * 2) - (SPACING.s * 6)) / 7;

// Estimated heights for animation
const WEEK_HEIGHT = 110;
const MONTH_HEIGHT = 400;

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, onDateSelect, steps }) => {
    const { colors } = useTheme();
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
    const flatListRef = useRef<FlatList>(null);

    // Animation State
    const heightAnim = useRef(new Animated.Value(WEEK_HEIGHT)).current;

    // PanResponder for drag gestures
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only capture vertical gestures that are significant
                return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dx) < 10;
            },
            onPanResponderMove: (_, gestureState) => {
                const currentHeight = viewMode === 'week' ? WEEK_HEIGHT : MONTH_HEIGHT;
                let newHeight = currentHeight + gestureState.dy;

                // Limit the drag range
                if (newHeight < WEEK_HEIGHT) newHeight = WEEK_HEIGHT + (newHeight - WEEK_HEIGHT) * 0.2; // Resistance
                if (newHeight > MONTH_HEIGHT) newHeight = MONTH_HEIGHT + (newHeight - MONTH_HEIGHT) * 0.2; // Resistance

                heightAnim.setValue(newHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentHeight = viewMode === 'week' ? WEEK_HEIGHT : MONTH_HEIGHT;
                const targetHeight = currentHeight + gestureState.dy;

                // Determine snap target based on drag distance and velocity
                const shouldToggle =
                    (viewMode === 'week' && (gestureState.dy > 50 || gestureState.vy > 0.5)) ||
                    (viewMode === 'month' && (gestureState.dy < -50 || gestureState.vy < -0.5));

                if (shouldToggle) {
                    toggleView();
                } else {
                    // Snap back
                    Animated.spring(heightAnim, {
                        toValue: currentHeight,
                        useNativeDriver: false,
                        bounciness: 4
                    }).start();
                }
            }
        })
    ).current;

    useEffect(() => {
        setCurrentMonth(new Date(selectedDate));
    }, [selectedDate]);

    const toggleView = () => {
        const targetMode = viewMode === 'week' ? 'month' : 'week';
        const targetHeight = targetMode === 'week' ? WEEK_HEIGHT : MONTH_HEIGHT;

        // Animate height
        Animated.spring(heightAnim, {
            toValue: targetHeight,
            useNativeDriver: false,
            bounciness: 6
        }).start();

        // Update state
        setViewMode(targetMode);
    };

    // --- Helper Functions ---

    const hasTasks = (date: Date) => {
        return steps.some(step => {
            if (!step.date) return false;
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

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = startDayOfWeek; i > 0; i--) {
            const d = new Date(year, month, 1 - i);
            days.push({ date: d, isCurrentMonth: false });
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push({ date: d, isCurrentMonth: true });
        }

        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            const d = new Date(year, month + 1, i);
            days.push({ date: d, isCurrentMonth: false });
        }

        return days;
    };

    const changeMonth = (increment: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + increment);
        setCurrentMonth(newMonth);
    };

    // --- Renderers ---

    const renderWeekItem = ({ item }: { item: Date }) => {
        const isSelected = isSameDate(item, selectedDate);
        const hasTask = hasTasks(item);
        const dayName = item.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = item.getDate();

        return (
            <TouchableOpacity
                onPress={() => onDateSelect(item)}
                style={[
                    styles.dayContainer,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                activeOpacity={0.7}
            >
                <Typography
                    variant="caption"
                    color={isSelected ? colors.textInverse : colors.textSecondary}
                    style={styles.dayName}
                >
                    {dayName}
                </Typography>
                <Typography
                    variant="h3"
                    weight="bold"
                    color={isSelected ? colors.textInverse : colors.textPrimary}
                >
                    {dayNumber}
                </Typography>
                {hasTask && (
                    <View style={[
                        styles.dot,
                        isSelected ? { backgroundColor: colors.textInverse } : { backgroundColor: colors.primary }
                    ]} />
                )}
            </TouchableOpacity>
        );
    };

    const renderMonthDay = (item: { date: Date; isCurrentMonth: boolean }, index: number) => {
        const isSelected = isSameDate(item.date, selectedDate);
        const hasTask = hasTasks(item.date);

        return (
            <TouchableOpacity
                key={index}
                onPress={() => {
                    onDateSelect(item.date);
                    if (!item.isCurrentMonth) {
                        setCurrentMonth(new Date(item.date));
                    }
                }}
                style={[
                    styles.monthDayContainer,
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    !item.isCurrentMonth && styles.otherMonthDay
                ]}
                activeOpacity={0.7}
            >
                <Typography
                    variant="body"
                    weight={isSelected ? "bold" : "regular"}
                    color={isSelected ? colors.textInverse : item.isCurrentMonth ? colors.textPrimary : colors.textTertiary}
                >
                    {item.date.getDate()}
                </Typography>
                {hasTask && (
                    <View style={[
                        styles.dot,
                        isSelected ? { backgroundColor: colors.textInverse } : { backgroundColor: colors.primary }
                    ]} />
                )}
            </TouchableOpacity>
        );
    };

    const weekDates = Array.from({ length: DAYS_TO_RENDER_WEEK }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        return date;
    });

    return (
        <Animated.View
            style={[styles.container, { height: heightAnim }]}
            {...panResponder.panHandlers}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleView}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Typography variant="caption" weight="bold" color={colors.primary}>
                            {viewMode === 'week' ? 'WEEK VIEW' : 'MONTH VIEW'}
                        </Typography>
                    </View>
                </TouchableOpacity>

                {viewMode === 'month' && (
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                            <Typography variant="h3" color={colors.textSecondary}>{"<"}</Typography>
                        </TouchableOpacity>
                        <Typography variant="body" weight="bold" style={styles.monthTitle}>
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                            <Typography variant="h3" color={colors.textSecondary}>{">"}</Typography>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {viewMode === 'week' ? (
                <FlatList
                    ref={flatListRef}
                    data={weekDates}
                    renderItem={renderWeekItem}
                    keyExtractor={(item) => item.toISOString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.monthGrid}>
                    <View style={styles.weekDaysHeader}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <View key={day} style={styles.weekDayHeaderCell}>
                                <Typography variant="caption" color={colors.textTertiary}>{day}</Typography>
                            </View>
                        ))}
                    </View>
                    <View style={styles.daysGrid}>
                        {getDaysInMonth(currentMonth).map((day, index) => renderMonthDay(day, index))}
                    </View>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        // marginBottom removed to let parent handle spacing via sectionTitle
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navButton: {
        paddingHorizontal: SPACING.s,
    },
    monthTitle: {
        minWidth: 120,
        textAlign: 'center',
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
        borderWidth: 1,
        // backgroundColor & borderColor handled inline
    },
    selectedDayContainer: {
        // backgroundColor & borderColor handled inline
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
        // backgroundColor handled inline
    },
    selectedDot: {
        // backgroundColor handled inline
    },
    // Month View Styles
    monthGrid: {
        paddingHorizontal: SPACING.l,
    },
    weekDaysHeader: {
        flexDirection: 'row',
        marginBottom: SPACING.s,
    },
    weekDayHeaderCell: {
        width: DAY_WIDTH,
        alignItems: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    monthDayContainer: {
        width: DAY_WIDTH,
        height: DAY_WIDTH, // Square
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
        borderRadius: RADIUS.s,
    },
    otherMonthDay: {
        opacity: 0.3,
    },
});
