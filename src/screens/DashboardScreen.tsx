import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ScrollView, LayoutAnimation, Platform, UIManager, TouchableOpacity, Alert, Dimensions, Animated } from 'react-native';
import { PlatformDatePicker } from '../components/PlatformPickers';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { getCurrentUser } from '../services/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Goal, Step, WeeklySchedule, SlotCategory } from '../types';
import { getGoals, getSteps, updateStep, deleteGoal, deleteStep, updateGoal, saveSteps, getAvailability, saveAvailability, saveGoal } from '../services/storage';
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
import { RenameModal } from '../components/RenameModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CreateGoalModal } from '../components/CreateGoalModal';
import { AvailabilityModal } from '../components/AvailabilityModal';
import { MilestoneDetailModal } from '../components/MilestoneDetailModal';
import { CreationMenuModal } from '../components/CreationMenuModal';
import { BrainDumpModal } from '../components/BrainDumpModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { EventDetailModal } from '../components/EventDetailModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { SmartSplitModal } from '../components/SmartSplitModal';
import { SPACING, RADIUS } from '../design-system/tokens';
import { useTheme } from '../theme';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { SchedulerService } from '../services/scheduler';
import { listEvents, listCalendars } from '../services/googleCalendar';
import { listTaskLists, listTasks } from '../services/googleTasks';
import { getGoogleTokens } from '../services/auth';

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
    const { colors, isDark } = useTheme();
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
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Step | null>(null);
    const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Step | null>(null);
    const [eventDetailModalVisible, setEventDetailModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Step | null>(null);
    const [createGoalModalVisible, setCreateGoalModalVisible] = useState(false);
    const [brainDumpModalVisible, setBrainDumpModalVisible] = useState(false);
    const [creationMenuVisible, setCreationMenuVisible] = useState(false);
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => Promise<void>;
    } | null>(null);
    const [schedule, setSchedule] = useState<WeeklySchedule>({});
    const [energyMode, setEnergyMode] = useState<EnergyMode>('HIGH');
    const [smartSplitGoalVisible, setSmartSplitGoalVisible] = useState(false);
    const [currentMilestoneForSplit, setCurrentMilestoneForSplit] = useState<Step | null>(null);
    const [previousContextForSplit, setPreviousContextForSplit] = useState<string>('');
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

        let allSteps = [...loadedSteps];

        // Google Integration
        const startOfRange = new Date();
        startOfRange.setDate(startOfRange.getDate() - 7); // Load past week
        const endOfRange = new Date();
        endOfRange.setDate(endOfRange.getDate() + 30); // Load next 30 days

        try {
            // Check if signed in silently first to get tokens if possible
            const currentUser = await getCurrentUser();

            if (currentUser) {
                const tokens = await getGoogleTokens();
                if (!tokens) throw new Error('No tokens available');
                const accessToken = tokens.accessToken;

                // 1. Calendar
                const calendarList = await listCalendars(accessToken);
                const filteredCalendars = calendarList.filter(calendar => calendar.summary.toLowerCase() !== 'numéros de semaine');
                let allEvents: any[] = [];

                // Fetch events for each calendar
                for (const calendar of filteredCalendars) {
                    const events = await listEvents(accessToken, calendar.id, startOfRange.toISOString(), endOfRange.toISOString());
                    allEvents = [...allEvents, ...events];
                }

                const calendarSteps: Step[] = allEvents.map((event) => {
                    const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date) : new Date());
                    // Check if event is in the past
                    const isPast = event.end.dateTime
                        ? new Date(event.end.dateTime) < new Date()
                        : (event.end.date ? new Date(event.end.date) < new Date() : false);

                    return {
                        id: event.id,
                        title: event.summary,
                        description: event.description || '',
                        // Start date is reliable due to 'singleEvents=true'
                        date: eventDate,
                        isCompleted: isPast, // Mark past events as completed so they don't get rescheduled
                        effort: 1, // Default effort
                        category: ' WORK ', // Default category, maybe infer?
                        googleCalendarEventId: event.id,
                        type: 'event'
                    };
                });

                // Deduplicate events just in case
                const uniqueCalendarSteps = Array.from(new Map(calendarSteps.map(item => [item.id, item])).values());

                allSteps = [...allSteps, ...uniqueCalendarSteps];

                // 2. Tasks
                const taskLists = await listTaskLists(accessToken);
                // Only fetch from the first task list for now or 'My Tasks' equivalent
                if (taskLists.length > 0) {
                    const tasks = await listTasks(accessToken, taskLists[0].id);
                    const googleTasksSteps: Step[] = tasks.map((task) => ({
                        id: task.id,
                        title: task.title,
                        description: task.notes || '',
                        date: task.due ? new Date(task.due) : undefined, // Some tasks have no due date
                        isCompleted: task.status === 'completed',
                        effort: 1,
                        category: 'PERSONAL',
                        parentId: undefined, // Flatten structure for now
                        type: 'task'
                    }));
                    allSteps = [...allSteps, ...googleTasksSteps];
                }
            }
        } catch (error) {
            console.log("Error fetching Google Data", error);
        }

        // Apply dynamic scheduling
        // Note: SchedulerService move tasks around. 
        // We want to keep fixed Google Events fixed.
        const distributedSteps = SchedulerService.distributeTasks(allSteps, loadedGoals, loadedSchedule);

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
        setCreationMenuVisible(true);
    };

    const handleSaveTask = async (title: string, date: Date, description?: string, effort: number = 1, category?: SlotCategory, parentId?: string, isHabit?: boolean, habitDaysOfWeek?: number[]) => {
        if (editingTask) {
            const updatedStep = {
                ...editingTask,
                title,
                date,
                description,
                effort,
                category: category || editingTask.category,
                isHabit: isHabit !== undefined ? isHabit : editingTask.isHabit,
                habitDaysOfWeek: habitDaysOfWeek !== undefined ? habitDaysOfWeek : editingTask.habitDaysOfWeek
            };
            await updateStep(updatedStep);
        } else {
            const newStep: Step = {
                id: uuidv4(),
                title,
                description,
                date,
                isCompleted: false,
                effort,
                category: category || 'PERSONAL',
                parentId,
                type: 'task',
                isHabit: isHabit,
                habitDaysOfWeek: habitDaysOfWeek,
                currentStreak: isHabit ? 0 : undefined
            };
            await saveSteps([newStep]);
        }
        setTaskModalVisible(false);
        setEditingTask(null);
        loadData();
    };

    const handleConvertToTask = async (event: Step) => {
        const newStep: Step = {
            id: uuidv4(),
            title: event.title,
            description: event.description,
            date: event.date,
            isCompleted: false,
            effort: 1, // Default
            category: ' WORK ', // Default for converted events
            type: 'task'
        };

        await saveSteps([newStep]);
        setEventDetailModalVisible(false);
        setSelectedEvent(null);
        loadData();
    };

    const handleBrainDumpSave = async (titles: string[]) => {
        const newSteps: Step[] = titles.map(title => ({
            id: uuidv4(),
            title,
            date: new Date(), // Default to today
            isCompleted: false,
            effort: 1, // Default effort
            category: 'PERSONAL', // Default category
        }));

        await saveSteps(newSteps);
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

    const handleCreateGoal = async (title: string, deadline: Date, category?: SlotCategory) => {
        const newGoal: Goal = {
            id: uuidv4(),
            title,
            deadline,
            createdAt: new Date(),
            isCompleted: false,
            category: category || 'PERSONAL',
            resources: []
        };
        await saveGoal(newGoal);
        setCreateGoalModalVisible(false);
        // Refresh data just in case, though navigation might trigger it via useIsFocused but let's be safe
        loadData();
        navigation.navigate('GoalDetails', { goalId: newGoal.id });
    };



    const toggleStep = async (step: Step) => {
        if (selectionMode) return;

        const isCompleting = !step.isCompleted;

        // Visual update immediately
        const updatedSteps = steps.map(s =>
            s.id === step.id ? { ...s, isCompleted: isCompleting } : s
        );
        setSteps(updatedSteps);

        setTimeout(async () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            if (step.isHabit && isCompleting) {
                // Habit validation logic
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const nextDate = SchedulerService.getNextHabitDate(today, step.habitDaysOfWeek);

                const updatedStep: Step = {
                    ...step,
                    isCompleted: false, // Keep it unchecked for the next cycle
                    currentStreak: (step.currentStreak || 0) + 1,
                    lastCompletedDate: today,
                    date: nextDate
                };
                await updateStep(updatedStep);
            } else {
                // Regular task logic
                const updatedStep = { ...step, isCompleted: isCompleting };
                await updateStep(updatedStep);

                // Auto-validate parent milestone if all subtasks are complete
                if (isCompleting && step.parentId) {
                    const parent = steps.find(s => s.id === step.parentId);
                    if (parent && parent.isMilestone && !parent.isCompleted) {
                        const siblings = updatedSteps.filter(s => s.parentId === step.parentId);
                        const allCompleted = siblings.every(s => s.isCompleted);
                        if (allCompleted) {
                            const updatedParent = { ...parent, isCompleted: true };
                            await updateStep(updatedParent);
                            
                            // If this parent is currently opened in the modal, update it immediately
                            if (selectedMilestone?.id === parent.id) {
                                setSelectedMilestone(updatedParent);
                            }
                        }
                    }
                }
            }

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
        setDeleteConfig({
            title: "Delete Milestone?",
            message: "Are you sure you want to delete this milestone?",
            onConfirm: async () => {
                await deleteStep(stepId);
                setSelectedMilestone(null);
                loadData();
            }
        });
        setDeleteModalVisible(true);
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
        setDeleteConfig({
            title: "Delete Goal?",
            message: "Are you sure you want to delete this goal and all its tasks?",
            onConfirm: async () => {
                await deleteGoal(goalId);
                setSelectedGoalForMenu(null);
                loadData();
            }
        });
        setDeleteModalVisible(true);
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
        setDeleteConfig({
            title: "Delete Selected?",
            message: `Are you sure you want to delete ${selectedItems.size} item(s)? This cannot be undone.`,
            onConfirm: async () => {
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
        });
        setDeleteModalVisible(true);
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

    const ClockIcon = ({ color = colors.textSecondary, size = 16 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <Path d="M12 6v6l4 2" />
        </Svg>
    );

    const CalendarIcon = ({ color = colors.textSecondary, size = 20 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <Line x1="16" y1="2" x2="16" y2="6" />
            <Line x1="8" y1="2" x2="8" y2="6" />
            <Line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
    );

    const TrashIcon = ({ color = colors.textInverse, size = 20 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 6h18" />
            <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </Svg>
    );

    const handleEditFromDetail = (task: Step) => {
        setTaskDetailModalVisible(false);
        setEditingTask(task);
        setTaskModalVisible(true);
    };

    const handleToggleFromDetail = async (task: Step) => {
        await toggleStep(task);
        // Update local state for the modal immediately
        if (selectedTaskForDetail && selectedTaskForDetail.id === task.id) {
            setSelectedTaskForDetail({ ...task, isCompleted: !task.isCompleted });
        }
    };


    const EditIcon = ({ color = colors.textInverse, size = 20 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </Svg>
    );

    const renderStep = ({ item, index }: { item: Step; index: number }) => {
        const isSelected = selectedItems.has(item.id);
        const isMilestone = item.isMilestone;
        const isEvent = item.type === 'event';

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
                        } else if (isEvent) {
                            setSelectedEvent(item);
                            setEventDetailModalVisible(true);
                        } else {
                            // Open Task Detail Modal instead of Edit directly
                            setSelectedTaskForDetail(item);
                            setTaskDetailModalVisible(true);
                        }
                    }}
                    activeOpacity={0.9}
                >
                    <Card
                        variant={isMilestone ? "glass" : "solid"}
                        padding="m"
                        style={[
                            styles.stepItem,
                            isSelected && { borderColor: colors.primary, borderWidth: 2 },
                            isMilestone && { borderColor: colors.primary, borderWidth: 1 },
                            isEvent && { borderLeftWidth: 3, borderLeftColor: colors.primary },
                            { overflow: 'hidden' }
                        ]}
                    >
                        <View style={styles.stepRow}>
                            {selectionMode ? (
                                <View style={[styles.selectionCircle, { borderColor: colors.textSecondary }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                            ) : !isMilestone && !isEvent ? (
                                <TouchableOpacity
                                    onPress={() => toggleStep(item)}
                                    style={{ padding: 4, marginRight: 8 }}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Checkbox
                                        checked={item.isCompleted}
                                        onPress={() => toggleStep(item)} // Keep onPress here as well for direct box check
                                        style={styles.checkbox}
                                    />
                                </TouchableOpacity>
                            ) : isEvent ? (
                                <View style={{ marginRight: SPACING.s, justifyContent: 'center' }}>
                                    <View style={{
                                        width: 4,
                                        height: 40,
                                        backgroundColor: colors.surfaceHighlight,
                                        borderRadius: 2
                                    }} />
                                </View>
                            ) : null}

                            <View style={styles.stepContent}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginRight: SPACING.s }}>
                                        {item.isHabit && (item.currentStreak || 0) > 0 && (
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: colors.surfaceHighlight,
                                                paddingHorizontal: 6,
                                                paddingVertical: 2,
                                                borderRadius: RADIUS.s,
                                                marginRight: SPACING.s,
                                                borderWidth: 1,
                                                borderColor: colors.border
                                            }}>
                                                <Typography variant="caption" color={colors.primary} weight="bold">
                                                    🔥 {item.currentStreak}
                                                </Typography>
                                            </View>
                                        )}
                                        <Typography
                                            variant={isMilestone ? "h3" : "body"}
                                            color={item.isCompleted && !selectionMode ? colors.textSecondary : colors.textPrimary}
                                            style={[
                                                item.isCompleted && !selectionMode ? styles.completedText : undefined,
                                                { flexShrink: 1 }
                                            ]}
                                        >
                                            {item.title}
                                        </Typography>
                                    </View>

                                    {isEvent && item.date && (
                                        <Typography variant="caption" color={colors.primary} weight="bold">
                                            {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: SPACING.m }}>
                                    {(item.estimatedMinutes || ((item.scheduledDate || item.date) && isMilestone)) && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ClockIcon color={colors.textTertiary} size={12} />
                                            <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }} mono>
                                                {item.estimatedMinutes ? `${item.estimatedMinutes}m` : ''}
                                                {item.estimatedMinutes && (item.scheduledDate || item.date) && isMilestone ? ' • ' : ''}
                                                {(item.scheduledDate || item.date) && isMilestone ? new Date(item.scheduledDate || item.date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                            </Typography>
                                        </View>
                                    )}

                                    {parentGoal && (
                                        <Typography variant="caption" color={colors.textTertiary} numberOfLines={1} style={{ flex: 1 }}>
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

        const goalMilestones = goalSteps.filter(s => s.isMilestone).sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
        const currentMilestoneIndex = goalMilestones.findIndex(m => !m.isCompleted);
        const currentMilestone = currentMilestoneIndex !== -1 ? goalMilestones[currentMilestoneIndex] : null;
        const previousMilestone = currentMilestoneIndex > 0 ? goalMilestones[currentMilestoneIndex - 1] : null;

        let needsNextStep = false;
        if (currentMilestone && previousMilestone && previousMilestone.isCompleted && !currentMilestone.isCompleted) {
            const currentSubtasks = goalSteps.filter(s => s.parentId === currentMilestone.id);
            if (currentSubtasks.length === 0) {
                needsNextStep = true;
            }
        }

        const handleNextStep = () => {
            if (!currentMilestone || !previousMilestone) return;
            const previousSubtasks = goalSteps.filter(s => s.parentId === previousMilestone.id && s.isHabit);
            const pastHabits = previousSubtasks.map(s => s.title).join(', ');
            const context = pastHabits ? `Habits to continue: ${pastHabits}` : '';
            setPreviousContextForSplit(context);
            setCurrentMilestoneForSplit(currentMilestone);
            setSmartSplitGoalVisible(true);
        };

        return (
            <FadeIn delay={index * 100}>
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item.id, 'GOAL')}
                    onPress={() => selectionMode ? handlePress(item.id, 'GOAL') : navigation.navigate('GoalDetails', { goalId: item.id })}
                    activeOpacity={0.9}
                >
                    <Card
                        variant="solid"
                        padding="l"
                        style={[
                            styles.goalItem,
                            isSelected && { borderColor: colors.primary, borderWidth: 2 },
                            { width: itemWidth }
                        ]}
                    >
                        <View style={styles.goalHeader}>
                            <View style={{ flex: 1 }}>
                                <Typography variant="h3" weight="semibold" style={styles.goalTitle}>
                                    {item.title}
                                </Typography>
                                <Typography variant="caption" color={colors.textSecondary} mono>
                                    {new Date(item.deadline).toLocaleDateString()}
                                </Typography>
                            </View>
                            {selectionMode && (
                                <View style={[styles.selectionCircle, { borderColor: colors.textSecondary }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                            )}
                        </View>
                        <ProgressBar progress={progress} style={styles.progressBar} />
                        <View style={{ flexDirection: 'row', justifyContent: needsNextStep ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: SPACING.s }}>
                            {needsNextStep && (
                                <View style={{ width: '45%' }}>
                                    <Button
                                        title="Next Step"
                                        size="s"
                                        onPress={handleNextStep}
                                    />
                                </View>
                            )}
                            <Typography variant="caption" color={colors.textSecondary} align="right" mono>
                                {Math.round(progress * 100)}% Complete
                            </Typography>
                        </View>
                    </Card>
                </TouchableOpacity>
            </FadeIn>
        );
    };

    return (
        <Layout noPadding>
            <Animated.View style={[styles.header, { backgroundColor: colors.background, transform: [{ translateY: headerTranslateY }] }]}>
                <View>
                    <Animated.View style={{ transform: [{ scale: titleScale }, { translateX: titleTranslateX }] }}>
                        <Typography variant="h1" color={colors.textPrimary}>
                            Hello, Creator
                        </Typography>
                    </Animated.View>

                    <Animated.View style={{ opacity: energyOpacity, height: energyHeight, overflow: 'hidden' }}>
                        <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: SPACING.s }}>
                            What is your energy level?
                        </Typography>
                        <View style={styles.energySelector}>
                            <TouchableOpacity
                                style={[styles.energyButton, { borderColor: colors.border }, energyMode === 'HIGH' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                onPress={() => setEnergyMode('HIGH')}
                            >
                                <Typography variant="caption" color={energyMode === 'HIGH' ? colors.background : colors.textSecondary}>
                                    High
                                </Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.energyButton, { borderColor: colors.border }, energyMode === 'MEDIUM' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                onPress={() => setEnergyMode('MEDIUM')}
                            >
                                <Typography variant="caption" color={energyMode === 'MEDIUM' ? colors.background : colors.textSecondary}>
                                    Medium
                                </Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.energyButton, { borderColor: colors.border }, energyMode === 'LOW' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                onPress={() => setEnergyMode('LOW')}
                            >
                                <Typography variant="caption" color={energyMode === 'LOW' ? colors.background : colors.textSecondary}>
                                    Low
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                <View style={{ flexDirection: 'row', gap: SPACING.s }}>
                    <TouchableOpacity
                        onPress={() => setAvailabilityModalVisible(true)}
                        style={[styles.addButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' }]}
                    >
                        <CalendarIcon />
                    </TouchableOpacity>
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

                <Typography variant="caption" weight="bold" color={colors.textSecondary} style={styles.sectionTitle}>
                    RECENT ACTIVITY
                </Typography>

                {goals.length === 0 ? (
                    <EmptyState
                        title="No active goals"
                        description="Start your journey by creating your first goal."
                        action={{ label: "Create Goal", onPress: () => setCreateGoalModalVisible(true) }}
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

                <Typography variant="caption" weight="bold" color={colors.textSecondary} style={styles.sectionTitle}>
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
                    title="Settings"
                    variant="ghost"
                    onPress={() => navigation.navigate('Settings')}
                    style={styles.logoutButton}
                />

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {selectionMode && (
                <View style={[styles.actionBar, { backgroundColor: colors.surfaceHighlight, shadowColor: colors.shadow }]}>
                    <TouchableOpacity
                        onPress={handleDelete}
                        style={{
                            backgroundColor: colors.surfaceHighlight,
                            width: 48,
                            height: 48,
                            borderRadius: RADIUS.full,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: colors.error
                        }}
                    >
                        <TrashIcon color={colors.error} />
                    </TouchableOpacity>

                    {selectedItems.size === 1 && (
                        <TouchableOpacity
                            onPress={handleRename}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: RADIUS.full,
                                backgroundColor: colors.surfaceHighlight,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.border
                            }}
                        >
                            <EditIcon color={colors.textPrimary} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={handleReschedule}
                        style={{
                            backgroundColor: colors.surfaceHighlight,
                            width: 48,
                            height: 48,
                            borderRadius: RADIUS.full,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: colors.primary
                        }}
                    >
                        <CalendarIcon color={colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {showDatePicker && (
                <PlatformDatePicker
                    value={rescheduleDate}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant={isDark ? "dark" : "light"}
                />
            )}



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
                visible={taskModalVisible}
                onClose={() => {
                    setTaskModalVisible(false);
                    setEditingTask(null);
                }}
                onSave={(title, date, description, effort, category) => handleSaveTask(title, date, description, effort, category, selectedMilestone?.id)}
                initialDate={editingTask?.date || selectedDate || new Date()}
                initialTitle={editingTask?.title || ""}
                initialDescription={editingTask?.description || ""}
                initialEffort={editingTask?.effort || 1}
                initialCategory={editingTask?.category}
                title={editingTask ? "Edit Task" : "New Task"}
                saveLabel={editingTask ? "Save Changes" : "Create Task"}
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
                    setTaskModalVisible(true);
                }}
                onDeleteSubtask={async (subtaskId) => {
                    await deleteStep(subtaskId);
                    loadData();
                }}
                onOpenSubMilestone={(subMilestone) => {
                    setSelectedMilestone(subMilestone);
                }}
                onToggleSubtask={async (subtask) => {
                    const isCompleting = !subtask.isCompleted;
                    const updatedSubtask = { ...subtask, isCompleted: isCompleting };
                    await updateStep(updatedSubtask);
                    
                    if (isCompleting && subtask.parentId) {
                        const parent = steps.find(s => s.id === subtask.parentId);
                        if (parent && parent.isMilestone && !parent.isCompleted) {
                            // Find siblings in current state, excluding the one we just toggled
                            const siblings = steps.filter(s => s.parentId === subtask.parentId && s.id !== subtask.id);
                            const allOthersCompleted = siblings.every(s => s.isCompleted);
                            if (allOthersCompleted) {
                                const updatedParent = { ...parent, isCompleted: true };
                                await updateStep(updatedParent);
                                
                                if (selectedMilestone?.id === parent.id) {
                                    setSelectedMilestone(updatedParent);
                                }
                            }
                        }
                    }
                    
                    loadData();
                }}
                onGenerateSubtasks={async (newSteps) => {
                    if (!selectedMilestone) return;
                    const stepsWithKeys = newSteps.map(step => ({
                        ...step,
                        goalId: selectedMilestone.goalId,
                        category: selectedMilestone.category || 'PERSONAL'
                    }));
                    await saveSteps(stepsWithKeys);
                    loadData();
                }}
                goalTitle={goals.find(g => g.id === selectedMilestone?.goalId)?.title}
                goalContext={goals.find(g => g.id === selectedMilestone?.goalId)?.context}
            />

            <CreationMenuModal
                visible={creationMenuVisible}
                onClose={() => setCreationMenuVisible(false)}
                onCreateGoal={() => {
                    setCreationMenuVisible(false);
                    setCreateGoalModalVisible(true);
                }}
                onCreateTask={() => {
                    setCreationMenuVisible(false);
                    setTaskModalVisible(true);
                }}
                onBrainDump={() => {
                    setCreationMenuVisible(false);
                    setBrainDumpModalVisible(true);
                }}
            />

            <CreateGoalModal
                visible={createGoalModalVisible}
                onClose={() => setCreateGoalModalVisible(false)}
                onSave={handleCreateGoal}
            />

            <BrainDumpModal
                visible={brainDumpModalVisible}
                onClose={() => setBrainDumpModalVisible(false)}
                onSave={handleBrainDumpSave}
            />

            <TaskDetailModal
                visible={taskDetailModalVisible}
                onClose={() => setTaskDetailModalVisible(false)}
                task={selectedTaskForDetail}
                onEdit={handleEditFromDetail}
                onToggleComplete={handleToggleFromDetail}
            />

            <EventDetailModal
                visible={eventDetailModalVisible}
                onClose={() => {
                    setEventDetailModalVisible(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
                onConvertToTask={handleConvertToTask}
            />

            {deleteConfig && (

                <DeleteConfirmationModal
                    visible={deleteModalVisible}
                    title={deleteConfig.title}
                    message={deleteConfig.message}
                    onClose={() => setDeleteModalVisible(false)}
                    onConfirm={async () => {
                        await deleteConfig.onConfirm();
                        setDeleteModalVisible(false);
                    }}
                />
            )}

            {smartSplitGoalVisible && currentMilestoneForSplit && (
                <SmartSplitModal
                    visible={smartSplitGoalVisible}
                    milestone={currentMilestoneForSplit}
                    onClose={() => setSmartSplitGoalVisible(false)}
                    onSave={async (newSteps) => {
                        await saveSteps(newSteps);
                        setSmartSplitGoalVisible(false);
                        loadData();
                    }}
                    goalTitle={goals.find(g => g.id === currentMilestoneForSplit.goalId)?.title || ''}
                    goalContext=""
                    previousMilestoneContext={previousContextForSplit}
                />
            )}
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
        // backgroundColor: COLORS.background, // Handled in component
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
        // backgroundColor: COLORS.surfaceHighlight, // Handled in component
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
        // borderColor: COLORS.primary, // Handled inline
        borderWidth: 2,
    },
    selectionCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        // borderColor: COLORS.textSecondary, // Handled inline
        marginRight: SPACING.m,
    },
    selectionCircleActive: {
        // backgroundColor: COLORS.primary, // Handled inline
        // borderColor: COLORS.primary, // Handled inline
    },
    actionBar: {
        position: 'absolute',
        bottom: SPACING.xl,
        left: SPACING.l,
        right: SPACING.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        // backgroundColor: COLORS.surfaceHighlight, // Handled inline
        padding: SPACING.m,
        borderRadius: 16,
        // shadowColor: COLORS.shadow, // Handled inline
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
        // borderColor: COLORS.border, // Handled inline
    },
    energyButtonActive: {
        // backgroundColor: COLORS.primary, // Handled inline
        // borderColor: COLORS.primary, // Handled inline
    },
});

export default DashboardScreen;
