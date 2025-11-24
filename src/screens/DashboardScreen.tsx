import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, LayoutAnimation, Platform, UIManager, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { signOut } from '../services/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Goal, Step } from '../types';
import { getGoals, getSteps, updateStep, deleteGoal, deleteStep, updateGoal } from '../services/storage';
import { useIsFocused } from '@react-navigation/native';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { ProgressBar } from '../design-system/components/ProgressBar';
import { Checkbox } from '../design-system/components/Checkbox';
import { EmptyState } from '../design-system/components/EmptyState';
import { FadeIn } from '../design-system/components/FadeIn';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { COLORS, SPACING } from '../design-system/tokens';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type DashboardScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectionType, setSelectionType] = useState<'GOAL' | 'STEP' | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        const loadedGoals = await getGoals();
        const loadedSteps = await getSteps();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setGoals(loadedGoals);
        setSteps(loadedSteps);
    };

    const handleSignOut = async () => {
        await signOut();
        navigation.replace('Login');
    };

    const toggleStep = async (step: Step) => {
        if (selectionMode) return;
        const updatedStep = { ...step, isCompleted: !step.isCompleted };
        await updateStep(updatedStep);
        loadData();
    };

    const handleLongPress = (id: string, type: 'GOAL' | 'STEP') => {
        if (selectionMode) return;
        setSelectionMode(true);
        setSelectionType(type);
        setSelectedItems(new Set([id]));
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const handlePress = (id: string, type: 'GOAL' | 'STEP') => {
        if (selectionMode) {
            if (type !== selectionType) {
                // Optional: Alert user they can't mix types or just ignore
                return;
            }
            const newSelected = new Set(selectedItems);
            if (newSelected.has(id)) {
                newSelected.delete(id);
                if (newSelected.size === 0) {
                    setSelectionMode(false);
                    setSelectionType(null);
                }
            } else {
                newSelected.add(id);
            }
            setSelectedItems(newSelected);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Selected?",
            `Are you sure you want to delete ${selectedItems.size} item(s)? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (selectionType === 'GOAL') {
                            for (const id of selectedItems) {
                                await deleteGoal(id);
                            }
                        } else {
                            for (const id of selectedItems) {
                                await deleteStep(id);
                            }
                        }
                        setSelectionMode(false);
                        setSelectedItems(new Set());
                        setSelectionType(null);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleReschedule = () => {
        setShowDatePicker(true);
    };

    const onDateChange = async (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || rescheduleDate;
        setShowDatePicker(Platform.OS === 'ios');

        if (selectedDate) {
            if (selectionType === 'GOAL') {
                for (const id of selectedItems) {
                    const goal = goals.find(g => g.id === id);
                    if (goal) {
                        await updateGoal({ ...goal, deadline: currentDate });
                    }
                }
            } else {
                for (const id of selectedItems) {
                    const step = steps.find(s => s.id === id);
                    if (step) {
                        await updateStep({ ...step, date: currentDate });
                    }
                }
            }
            setSelectionMode(false);
            setSelectedItems(new Set());
            setSelectionType(null);
            loadData();
        }
    };

    const renderStep = ({ item, index }: { item: Step; index: number }) => {
        const isSelected = selectedItems.has(item.id);
        return (
            <FadeIn delay={index * 50}>
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item.id, 'STEP')}
                    onPress={() => selectionMode ? handlePress(item.id, 'STEP') : toggleStep(item)}
                    activeOpacity={0.9}
                >
                    <Card
                        variant="solid"
                        padding="m"
                        style={[
                            styles.stepItem,
                            isSelected && styles.selectedItem
                        ]}
                    >
                        <View style={styles.stepRow}>
                            {selectionMode ? (
                                <View style={[styles.selectionCircle, isSelected && styles.selectionCircleActive]} />
                            ) : (
                                <Checkbox
                                    checked={item.isCompleted}
                                    onPress={() => toggleStep(item)}
                                    style={styles.checkbox}
                                />
                            )}
                            <View style={styles.stepContent}>
                                <Typography
                                    variant="body"
                                    color={item.isCompleted && !selectionMode ? COLORS.textSecondary : COLORS.textPrimary}
                                    style={item.isCompleted && !selectionMode ? styles.completedText : undefined}
                                >
                                    {item.title}
                                </Typography>
                                <Typography variant="caption" color={COLORS.textSecondary}>
                                    {new Date(item.date).toLocaleDateString()}
                                </Typography>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>
            </FadeIn>
        );
    };

    const renderGoal = ({ item, index }: { item: Goal; index: number }) => {
        const goalSteps = steps.filter(s => s.goalId === item.id);
        const completedSteps = goalSteps.filter(s => s.isCompleted).length;
        const progress = goalSteps.length > 0 ? completedSteps / goalSteps.length : 0;
        const isSelected = selectedItems.has(item.id);

        return (
            <FadeIn delay={index * 100}>
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item.id, 'GOAL')}
                    onPress={() => selectionMode ? handlePress(item.id, 'GOAL') : navigation.navigate('GoalInput')} // Assuming we might want to edit goal later, but for now just nav or select
                    activeOpacity={0.9}
                >
                    <Card
                        variant="glass"
                        padding="l"
                        style={[
                            styles.goalItem,
                            isSelected && styles.selectedItem
                        ]}
                    >
                        <View style={styles.goalHeader}>
                            <View style={{ flex: 1 }}>
                                <Typography variant="h3" weight="semibold" style={styles.goalTitle}>
                                    {item.title}
                                </Typography>
                                <Typography variant="caption" color={COLORS.textSecondary}>
                                    {new Date(item.deadline).toLocaleDateString()}
                                </Typography>
                            </View>
                            {selectionMode && (
                                <View style={[styles.selectionCircle, isSelected && styles.selectionCircleActive]} />
                            )}
                        </View>
                        <ProgressBar progress={progress} style={styles.progressBar} />
                        <Typography variant="caption" color={COLORS.textSecondary} align="right">
                            {Math.round(progress * 100)}% Complete
                        </Typography>
                    </Card>
                </TouchableOpacity>
            </FadeIn>
        );
    };

    return (
        <Layout>
            <View style={styles.header}>
                <View>
                    <Typography variant="h1" color={COLORS.textPrimary}>
                        Hello, Creator
                    </Typography>
                    <Typography variant="body" color={COLORS.textSecondary}>
                        Your vision awaits.
                    </Typography>
                </View>
                <Button
                    title="+"
                    onPress={() => navigation.navigate('GoalInput')}
                    size="s"
                    style={styles.addButton}
                />
            </View>

            <WeeklyCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                steps={steps}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.sectionTitle}>
                    ACTIVE GOALS
                </Typography>

                {goals.length === 0 ? (
                    <EmptyState
                        title="No active goals"
                        description="Start your journey by creating your first goal."
                        action={{ label: "Create Goal", onPress: () => navigation.navigate('GoalInput') }}
                    />
                ) : (
                    <FlatList
                        data={goals}
                        keyExtractor={item => item.id}
                        renderItem={renderGoal}
                        scrollEnabled={false}
                    />
                )}

                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.sectionTitle}>
                    {selectedDate.toDateString() === new Date().toDateString() ? "TODAY'S FOCUS" : `TASKS FOR ${selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}`}
                </Typography>

                {steps.filter(s => {
                    const sDate = new Date(s.date);
                    return sDate.getDate() === selectedDate.getDate() &&
                        sDate.getMonth() === selectedDate.getMonth() &&
                        sDate.getFullYear() === selectedDate.getFullYear();
                }).length === 0 ? (
                    <EmptyState
                        title="No tasks for this day"
                        description="Enjoy your free time!"
                        style={{ marginTop: SPACING.m }}
                    />
                ) : (
                    <FlatList
                        data={steps.filter(s => {
                            const sDate = new Date(s.date);
                            return sDate.getDate() === selectedDate.getDate() &&
                                sDate.getMonth() === selectedDate.getMonth() &&
                                sDate.getFullYear() === selectedDate.getFullYear();
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                        keyExtractor={item => item.id}
                        renderItem={renderStep}
                        scrollEnabled={false}
                        contentContainerStyle={styles.stepList}
                    />
                )}

                <Button
                    title="Sign Out"
                    variant="ghost"
                    onPress={handleSignOut}
                    style={styles.logoutButton}
                />

                <View style={{ height: 100 }} />
            </ScrollView>

            {selectionMode && (
                <View style={styles.actionBar}>
                    <Button
                        title="Delete"
                        variant="secondary"
                        onPress={handleDelete}
                        style={{ backgroundColor: COLORS.error, flex: 1, marginRight: SPACING.s }}
                    />
                    <Button
                        title="Reschedule"
                        variant="primary"
                        onPress={handleReschedule}
                        style={{ flex: 1, marginLeft: SPACING.s }}
                    />
                </View>
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={rescheduleDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant="dark"
                />
            )}
        </Layout>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
        marginTop: SPACING.m,
    },
    addButton: {
        width: 40,
        height: 40,
        paddingHorizontal: 0,
    },
    scrollView: {
        flex: 1,
    },
    sectionTitle: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.m,
        letterSpacing: 1,
    },
    goalItem: {
        marginBottom: SPACING.m,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    goalTitle: {
        flex: 1,
        marginRight: SPACING.m,
    },
    progressBar: {
        marginBottom: SPACING.xs,
    },
    stepItem: {
        marginBottom: SPACING.s,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginRight: SPACING.m,
    },
    stepContent: {
        flex: 1,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    stepList: {
        gap: SPACING.s,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
    },
    logoutButton: {
        marginTop: SPACING.xl,
        alignSelf: 'center',
    },
    selectedItem: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    selectionCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        marginRight: SPACING.m,
    },
    selectionCircleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    actionBar: {
        position: 'absolute',
        bottom: SPACING.xl,
        left: SPACING.l,
        right: SPACING.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surfaceHighlight,
        padding: SPACING.m,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
});

export default DashboardScreen;
