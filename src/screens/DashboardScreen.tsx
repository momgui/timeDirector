import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ScrollView, LayoutAnimation, Platform, UIManager, TouchableOpacity, Alert, Dimensions, Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import { signOut } from '../services/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Goal, Step, WeeklySchedule, SlotCategory } from '../types';
import { getGoals, getSteps, updateStep, deleteGoal, deleteStep, updateGoal, saveSteps, getAvailability, saveAvailability } from '../services/storage';
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
import { GoalDetailModal } from '../components/GoalDetailModal';
import { RenameModal } from '../components/RenameModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { AvailabilityModal } from '../components/AvailabilityModal';
import { MilestoneDetailModal } from '../components/MilestoneDetailModal';
import { COLORS, SPACING } from '../design-system/tokens';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { SchedulerService } from '../services/scheduler';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type DashboardScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

type EnergyMode = 'HIGH' | 'MEDIUM' | 'LOW';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectionType, setSelectionType] = useState<'GOAL' | 'STEP' | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedGoalForMenu, setSelectedGoalForMenu] = useState<Goal | null>(null);
    const [selectedMilestone, setSelectedMilestone] = useState<Step | null>(null);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [schedule, setSchedule] = useState<WeeklySchedule>({});
    const [energyMode, setEnergyMode] = useState<EnergyMode>('HIGH');
    const isFocused = useIsFocused();

    const scrollY = useRef(new Animated.Value(0)).current;
    const HEADER_HEIGHT = 132;

    // Header Animations
    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, -10],
        extrapolate: 'clamp',
    });

    const titleScale = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
    });

    const titleTranslateX = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, -20],
        extrapolate: 'clamp',
    });

    const energyOpacity = scrollY.interpolate({
        inputRange: [0, 30],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const energyHeight = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [60, 0],
        extrapolate: 'clamp',
    });

    const loadData = async () => {
        const loadedGoals = await getGoals();
        const loadedSteps = await getSteps();
        const loadedSchedule = await getAvailability();

        // Apply dynamic scheduling
        const distributedSteps = SchedulerService.distributeTasks(loadedSteps, loadedSchedule);

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setGoals(loadedGoals);
        setSteps(distributedSteps);
        setSchedule(loadedSchedule);
    };

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const handleAddPress = () => {
        Alert.alert(
            "Create New",
            "What would you like to create?",
            [
                {
                    text: "Goal",
                    onPress: () => navigation.navigate('GoalInput')
                },
                {
                    text: "Task",
                    onPress: () => setCreateTaskModalVisible(true)
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleCreateTask = async (title: string, date: Date, description?: string, effort: number = 1, category?: SlotCategory, parentId?: string) => {
        const newStep: Step = {
            id: uuidv4(),
            title,
            description,
            date,
            isCompleted: false,
            effort,
            category: category || 'PERSONAL',
            parentId,
        };
        await saveSteps([newStep]);
        loadData();
    };

    const handleAddStepToGoal = async (goalId: string, title: string, date: Date, description?: string, effort: number = 1, category?: SlotCategory) => {
        const newStep: Step = {
            id: uuidv4(),
            goalId,
            title,
            description,
            date,
            isCompleted: false,
            effort,
            category,
        };
        await saveSteps([newStep]);
        loadData();
    };

    const handleSignOut = async () => {
        await signOut();
        navigation.replace('Login');
    };

    const toggleStep = async (step: Step) => {
        if (selectionMode) return;

        const updatedSteps = steps.map(s =>
            s.id === step.id ? { ...s, isCompleted: !s.isCompleted } : s
        );
        setSteps(updatedSteps);

        setTimeout(async () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updatedStep = { ...step, isCompleted: !step.isCompleted };
            await updateStep(updatedStep);
            loadData();
        }, 500);
    };

    const handleLongPress = (id: string, type: 'GOAL' | 'STEP') => {
        if (selectionMode) return;
        setSelectionMode(true);
        setSelectionType(type);
        setSelectedItems(new Set([id]));
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const handleMilestoneDelete = async (stepId: string) => {
        Alert.alert(
            "Delete Milestone?",
            "Are you sure you want to delete this milestone?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteStep(stepId);
                        setSelectedMilestone(null);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleMilestoneReschedule = (stepId: string) => {
        setSelectedMilestone(null);
        setSelectionType('STEP');
        setSelectedItems(new Set([stepId]));
        setShowDatePicker(true);
    };

    const handleMilestoneToggle = async (step: Step) => {
        const updatedStep = { ...step, isCompleted: !step.isCompleted };
        await updateStep(updatedStep);
        if (selectedMilestone?.id === step.id) {
            setSelectedMilestone(updatedStep);
        }
        loadData();
    };

    const handleMenuDelete = async (goalId: string) => {
        Alert.alert(
            "Delete Goal?",
            "Are you sure you want to delete this goal and all its tasks?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteGoal(goalId);
                        setSelectedGoalForMenu(null);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleMenuReschedule = (goalId: string) => {
        setSelectedGoalForMenu(null);
        setSelectionType('GOAL');
        setSelectedItems(new Set([goalId]));
        setShowDatePicker(true);
    };

    const handlePress = (id: string, type: 'GOAL' | 'STEP') => {
        if (selectionMode) {
            if (type !== selectionType) return;
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

    const handleRename = () => {
        setRenameModalVisible(true);
    };

    const onRenameSave = async (newName: string) => {
        const id = Array.from(selectedItems)[0];
        if (!id) return;

        if (selectionType === 'GOAL') {
            const goal = goals.find(g => g.id === id);
            if (goal) {
                await updateGoal({ ...goal, title: newName });
            }
        } else {
            const step = steps.find(s => s.id === id);
            if (step) {
                await updateStep({ ...step, title: newName });
            }
        }

        setRenameModalVisible(false);
        setSelectionMode(false);
        setSelectedItems(new Set());
        setSelectionType(null);
        loadData();
    };

    const handleUpdateCategory = async (goalId: string, category: SlotCategory) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            const updatedGoal = { ...goal, category };
            await updateGoal(updatedGoal);
            if (selectedGoalForMenu?.id === goalId) {
                setSelectedGoalForMenu(updatedGoal);
            }
            loadData();
        }
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

    const ClockIcon = ({ color = COLORS.textSecondary, size = 16 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <Path d="M12 6v6l4 2" />
        </Svg>
    );

    const renderStep = ({ item, index }: { item: Step; index: number }) => {
        const isSelected = selectedItems.has(item.id);
        const isMilestone = item.isMilestone;

        const subtasks = steps.filter(s => s.parentId === item.id);
        const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
        const progress = subtasks.length > 0 ? completedSubtasks / subtasks.length : 0;
        const parentGoal = goals.find(g => g.id === item.goalId);

        return (
            <FadeIn delay={index * 50}>
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item.id, 'STEP')}
                    onPress={() => {
                        if (selectionMode) {
                            handlePress(item.id, 'STEP');
                        } else if (isMilestone) {
                            setSelectedMilestone(item);
                        } else {
                            toggleStep(item);
                        }
                    }}
                    activeOpacity={0.9}
                >
                    <Card
                        variant={isMilestone ? "glass" : "solid"}
                        padding="m"
                        style={[
                            styles.stepItem,
                            isSelected && styles.selectedItem,
                            isMilestone && { borderColor: COLORS.primary, borderWidth: 1 },
                            { overflow: 'hidden' }
                        ]}
                    >
                        <View style={styles.stepRow}>
                            {selectionMode ? (
                                <View style={[styles.selectionCircle, isSelected && styles.selectionCircleActive]} />
                            ) : !isMilestone ? (
                                <Checkbox
                                    checked={item.isCompleted}
                                    onPress={() => toggleStep(item)}
                                    style={styles.checkbox}
                                />
                            ) : null}

                            <View style={styles.stepContent}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography
                                        variant={isMilestone ? "h3" : "body"}
                                        color={item.isCompleted && !selectionMode ? COLORS.textSecondary : COLORS.textPrimary}
                                        style={[
                                            item.isCompleted && !selectionMode ? styles.completedText : undefined,
                                            { flex: 1, marginRight: SPACING.s }
                                        ]}
                                    >
                                        {item.title}
                                    </Typography>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: SPACING.m }}>
                                    {(item.estimatedMinutes || ((item.scheduledDate || item.date) && isMilestone)) && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ClockIcon color={COLORS.textTertiary} size={12} />
                                            <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 4 }}>
                                                {item.estimatedMinutes ? `${item.estimatedMinutes}m` : ''}
                                                {item.estimatedMinutes && (item.scheduledDate || item.date) && isMilestone ? ' • ' : ''}
                                                {(item.scheduledDate || item.date) && isMilestone ? new Date(item.scheduledDate || item.date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                            </Typography>
                                        </View>
                                    )}

                                    {parentGoal && (
                                        <Typography variant="caption" color={COLORS.textTertiary} numberOfLines={1} style={{ flex: 1 }}>
                                            {parentGoal.title}
                                        </Typography>
                                    )}
                                </View>

                                {isMilestone && subtasks.length > 0 && (
                                    <View style={{ marginTop: 8 }}>
                                        <ProgressBar progress={progress} style={{ height: 4 }} />
                                    </View>
                                )}
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

        const isSingleGoal = goals.length === 1;
        const itemWidth = isSingleGoal ? width - (SPACING.l * 2) : CARD_WIDTH;

        return (
            <FadeIn delay={index * 100}>
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item.id, 'GOAL')}
                    onPress={() => selectionMode ? handlePress(item.id, 'GOAL') : setSelectedGoalForMenu(item)}
                    activeOpacity={0.9}
                >
                    <Card
                        variant="glass"
                        padding="l"
                        style={[
                            styles.goalItem,
                            isSelected && styles.selectedItem,
                            { width: itemWidth }
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
        <Layout noPadding>
            <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
                <View>
                    <Animated.View style={{ transform: [{ scale: titleScale }, { translateX: titleTranslateX }] }}>
                        <Typography variant="h1" color={COLORS.textPrimary}>
                            Hello, Creator
                        </Typography>
                    </Animated.View>

                    <Animated.View style={{ opacity: energyOpacity, height: energyHeight, overflow: 'hidden' }}>
                        <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: SPACING.s }}>
                            What is your energy level?
                        </Typography>
                        <View style={styles.energySelector}>
                            <TouchableOpacity
                                style={[styles.energyButton, energyMode === 'HIGH' && styles.energyButtonActive]}
                                onPress={() => setEnergyMode('HIGH')}
                            >
                                <Typography variant="caption" color={energyMode === 'HIGH' ? COLORS.background : COLORS.textSecondary}>
                                    High
                                </Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.energyButton, energyMode === 'MEDIUM' && styles.energyButtonActive]}
                                onPress={() => setEnergyMode('MEDIUM')}
                            >
                                <Typography variant="caption" color={energyMode === 'MEDIUM' ? COLORS.background : COLORS.textSecondary}>
                                    Medium
                                </Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.energyButton, energyMode === 'LOW' && styles.energyButtonActive]}
                                onPress={() => setEnergyMode('LOW')}
                            >
                                <Typography variant="caption" color={energyMode === 'LOW' ? COLORS.background : COLORS.textSecondary}>
                                    Low
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                <View style={{ flexDirection: 'row', gap: SPACING.s }}>
                    <Button
                        title="📅"
                        onPress={() => setAvailabilityModalVisible(true)}
                        size="s"
                        style={styles.addButton}
                    />
                    <Button
                        title="+"
                        onPress={handleAddPress}
                        size="s"
                        style={styles.addButton}
                    />
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <WeeklyCalendar
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    steps={steps}
                />

                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.sectionTitle}>
                    ACTIVE GOALS
                </Typography>

                {goals.length === 0 ? (
                    <EmptyState
                        title="No active goals"
                        description="Start your journey by creating your first goal."
                        action={{ label: "Create Goal", onPress: () => navigation.navigate('GoalInput') }}
                        style={{ marginHorizontal: SPACING.l }}
                    />
                ) : (
                    <FlatList
                        data={goals}
                        keyExtractor={item => item.id}
                        renderItem={renderGoal}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.goalsList}
                        snapToInterval={goals.length === 1 ? width : CARD_WIDTH + SPACING.m}
                        decelerationRate="fast"
                    />
                )}

                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.sectionTitle}>
                    {selectedDate.toDateString() === new Date().toDateString() ? "TODAY'S FOCUS" : `TASKS FOR ${selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}`}
                </Typography>

                {steps.filter(s => {
                    const sDate = s.scheduledDate ? new Date(s.scheduledDate) : (s.date ? new Date(s.date) : null);
                    if (!sDate) return false;

                    return sDate.getDate() === selectedDate.getDate() &&
                        sDate.getMonth() === selectedDate.getMonth() &&
                        sDate.getFullYear() === selectedDate.getFullYear();
                }).length === 0 ? (
                    <EmptyState
                        title="No tasks for this day"
                        description="Enjoy your free time!"
                        style={{ marginTop: SPACING.m, marginHorizontal: SPACING.l }}
                    />
                ) : (
                    <FlatList
                        data={steps.filter(s => {
                            const sDate = s.scheduledDate ? new Date(s.scheduledDate) : (s.date ? new Date(s.date) : null);
                            if (!sDate) return false;

                            const isSameDay = sDate.getDate() === selectedDate.getDate() &&
                                sDate.getMonth() === selectedDate.getMonth() &&
                                sDate.getFullYear() === selectedDate.getFullYear();

                            if (!isSameDay) return false;

                            const effort = s.effort || 1;
                            if (energyMode === 'LOW' && effort > 2) return false;
                            if (energyMode === 'MEDIUM' && effort > 4) return false;

                            return true;
                        }).sort((a, b) => {
                            if (a.isCompleted !== b.isCompleted) {
                                return a.isCompleted ? -1 : 1;
                            }
                            const dateA = a.scheduledDate ? new Date(a.scheduledDate) : (a.date ? new Date(a.date) : new Date(0));
                            const dateB = b.scheduledDate ? new Date(b.scheduledDate) : (b.date ? new Date(b.date) : new Date(0));
                            return dateA.getTime() - dateB.getTime();
                        })}
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
            </Animated.ScrollView>

            {selectionMode && (
                <View style={styles.actionBar}>
                    <Button
                        title="Delete"
                        variant="secondary"
                        onPress={handleDelete}
                        style={{ backgroundColor: COLORS.error, flex: 1, marginRight: SPACING.s }}
                    />
                    {selectedItems.size === 1 && (
                        <Button
                            title="Rename"
                            variant="secondary"
                            onPress={handleRename}
                            style={{ flex: 1, marginRight: SPACING.s }}
                        />
                    )}
                    <Button
                        title="Reschedule"
                        variant="primary"
                        onPress={handleReschedule}
                        style={{ flex: 1 }}
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

            <GoalDetailModal
                visible={!!selectedGoalForMenu}
                goal={selectedGoalForMenu}
                steps={steps}
                onClose={() => setSelectedGoalForMenu(null)}
                onDelete={handleMenuDelete}
                onReschedule={handleMenuReschedule}
                onUpdateCategory={handleUpdateCategory}
                onAddStep={(title, date, description, effort, category) => {
                    if (selectedGoalForMenu) {
                        handleAddStepToGoal(selectedGoalForMenu.id, title, date, description, effort, category);
                    }
                }}
            />

            <RenameModal
                visible={renameModalVisible}
                initialValue={(() => {
                    const id = Array.from(selectedItems)[0];
                    if (!id) return '';
                    if (selectionType === 'GOAL') {
                        return goals.find(g => g.id === id)?.title || '';
                    } else {
                        return steps.find(s => s.id === id)?.title || '';
                    }
                })()}
                title={selectionType === 'GOAL' ? "Rename Goal" : "Rename Task"}
                onClose={() => setRenameModalVisible(false)}
                onSave={onRenameSave}
            />

            <CreateTaskModal
                visible={createTaskModalVisible}
                onClose={() => setCreateTaskModalVisible(false)}
                onSave={(title, date, description, effort, category) => {
                    handleCreateTask(title, date, description, effort, category, selectedMilestone?.id);
                    setCreateTaskModalVisible(false);
                }}
                initialDate={selectedDate}
            />

            <AvailabilityModal
                visible={availabilityModalVisible}
                initialSchedule={schedule}
                onClose={() => setAvailabilityModalVisible(false)}
                onSave={async (newSchedule) => {
                    await saveAvailability(newSchedule);
                    loadData();
                }}
            />

            <MilestoneDetailModal
                visible={!!selectedMilestone}
                milestone={selectedMilestone}
                subtasks={steps.filter(s => s.parentId === selectedMilestone?.id)}
                onClose={() => setSelectedMilestone(null)}
                onDelete={handleMilestoneDelete}
                onReschedule={handleMilestoneReschedule}
                onToggleComplete={handleMilestoneToggle}
                onAddSubtask={() => {
                    setCreateTaskModalVisible(true);
                }}
                onDeleteSubtask={async (subtaskId) => {
                    await deleteStep(subtaskId);
                    loadData();
                }}
                onOpenSubMilestone={(subMilestone) => {
                    setSelectedMilestone(subMilestone);
                }}
            />
        </Layout>
    );
};

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: COLORS.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: SPACING.l,
        paddingTop: SPACING.m,
        paddingHorizontal: SPACING.l,
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
        paddingHorizontal: SPACING.l,
    },
    goalItem: {
        marginRight: SPACING.m,
    },
    goalsList: {
        paddingHorizontal: SPACING.l,
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
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        paddingHorizontal: 6,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: 4,
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
        paddingHorizontal: SPACING.l,
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
    energySelector: {
        flexDirection: 'row',
        marginTop: SPACING.xs,
        gap: SPACING.s,
    },
    energyButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    energyButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
});

export default DashboardScreen;
