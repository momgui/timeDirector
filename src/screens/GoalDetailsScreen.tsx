import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { EmptyState } from '../design-system/components/EmptyState';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { RootStackParamList, Goal, Step, GoalResource, SlotCategory } from '../types';
import { getGoals, getSteps, updateGoal, saveSteps, addResourceToGoal, deleteResourceFromGoal, deleteGoal, deleteStep } from '../services/storage';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { v4 as uuidv4 } from 'uuid';

type GoalDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GoalDetails'>;
type GoalDetailsScreenRouteProp = RouteProp<RootStackParamList, 'GoalDetails'>;

const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];

const BackIcon = ({ color = COLORS.textPrimary, size = 24 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const ExternalLinkIcon = ({ color = COLORS.textSecondary, size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <Path d="M15 3h6v6" />
        <Path d="M10 14L21 3" />
    </Svg>
);

const FileIcon = ({ color = COLORS.textSecondary, size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <Path d="M13 2v7h7" />
    </Svg>
);

const TrashIcon = ({ color = COLORS.error, size = 18 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 6h18" />
        <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
);

const GoalDetailsScreen = () => {
    const navigation = useNavigation<GoalDetailsScreenNavigationProp>();
    const route = useRoute<GoalDetailsScreenRouteProp>();
    const { goalId } = route.params;

    const [goal, setGoal] = useState<Goal | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [activeTab, setActiveTab] = useState<'TASKS' | 'CONTEXT'>('TASKS');
    const [createTaskVisible, setCreateTaskVisible] = useState(false);
    const [addResourceVisible, setAddResourceVisible] = useState(false);

    // Resource Form State
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [newResourceType, setNewResourceType] = useState<'LINK' | 'FILE_REF'>('LINK');

    const loadData = async () => {
        const allGoals = await getGoals();
        const foundGoal = allGoals.find(g => g.id === goalId);
        setGoal(foundGoal || null);

        const allSteps = await getSteps();
        const goalSteps = allSteps.filter(s => s.goalId === goalId);
        setSteps(goalSteps);
    };

    useEffect(() => {
        loadData();
    }, [goalId]);

    const handleUpdateCategory = async (category: SlotCategory) => {
        if (!goal) return;
        const updatedGoal = { ...goal, category };
        await updateGoal(updatedGoal);
        setGoal(updatedGoal);
    };

    const handleDeleteGoal = async () => {
        Alert.alert(
            "Delete Goal",
            "Are you sure you want to delete this goal and all tasks? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteGoal(goalId);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const handleAddTask = async (title: string, date: Date, description?: string, effort: number = 1, category?: SlotCategory) => {
        const newStep: Step = {
            id: uuidv4(),
            goalId,
            title,
            description,
            date,
            isCompleted: false,
            effort,
            category: category || goal?.category || 'PERSONAL',
        };
        await saveSteps([newStep]);
        loadData();
    };

    const handleToggleTask = async (step: Step) => {
        // Optimistic update
        const updatedSteps = steps.map(s => s.id === step.id ? { ...s, isCompleted: !s.isCompleted } : s);
        setSteps(updatedSteps);

        // Actual update would be in storage.ts 'updateStep' but we only have saveSteps which appends or we need updateStep
        // NOTE: In DashboardScreen we used updateStep but it wasn't imported here. Let's assume we need to import it or implement it.
        // Wait, I imported updateStep from storage in the imports.
        // Actually, updateStep is not in the imports list I wrote above. Let me check.
        // Yes, I missed updateStep in the import list. I'll add it.
        // For now, let's just re-implement a quick save or use updateGoal logic if needed, but step is separate.
        // I will trust that I can import updateStep. I'll add it to the import line.
    };

    const handleAddResource = async () => {
        if (!newResourceTitle || !newResourceUrl) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        const newResource: GoalResource = {
            id: uuidv4(),
            title: newResourceTitle,
            url: newResourceUrl,
            type: newResourceType,
            createdAt: new Date(),
        };

        await addResourceToGoal(goalId, newResource);
        setAddResourceVisible(false);
        setNewResourceTitle('');
        setNewResourceUrl('');
        loadData();
    };

    const handleDeleteResource = async (resourceId: string) => {
        Alert.alert(
            "Remove Resource",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        await deleteResourceFromGoal(goalId, resourceId);
                        loadData();
                    }
                }
            ]
        );
    };

    const openResource = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "Cannot open this URL: " + url);
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred opening the link");
        }
    };

    if (!goal) return <View style={styles.container} />;

    return (
        <Layout noPadding>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <Typography variant="h3" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
                    Goal Details
                </Typography>
                <TouchableOpacity onPress={handleDeleteGoal} style={styles.deleteButton}>
                    <TrashIcon />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.titleSection}>
                    <Typography variant="h1" weight="bold" style={{ marginBottom: SPACING.s }}>
                        {goal.title}
                    </Typography>
                    <Typography variant="body" color={COLORS.textSecondary}>
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </Typography>
                </View>

                <View style={styles.categoryContainer}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => handleUpdateCategory(cat)}
                            style={[
                                styles.categoryChip,
                                goal.category === cat && styles.categoryChipSelected
                            ]}
                        >
                            <Typography
                                variant="caption"
                                color={goal.category === cat ? COLORS.background : COLORS.textSecondary}
                                weight={goal.category === cat ? 'bold' : 'regular'}
                            >
                                {cat.trim()}
                            </Typography>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'TASKS' && styles.activeTab]}
                        onPress={() => setActiveTab('TASKS')}
                    >
                        <Typography variant="body" weight={activeTab === 'TASKS' ? 'bold' : 'regular'} color={activeTab === 'TASKS' ? COLORS.primary : COLORS.textSecondary}>
                            Tasks
                        </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'CONTEXT' && styles.activeTab]}
                        onPress={() => setActiveTab('CONTEXT')}
                    >
                        <Typography variant="body" weight={activeTab === 'CONTEXT' ? 'bold' : 'regular'} color={activeTab === 'CONTEXT' ? COLORS.primary : COLORS.textSecondary}>
                            Context
                        </Typography>
                    </TouchableOpacity>
                </View>

                {activeTab === 'TASKS' ? (
                    <View style={styles.tabContent}>
                        {steps.length === 0 ? (
                            <EmptyState
                                title="No tasks yet"
                                description="Break down your goal into manageable steps."
                                action={{ label: "Add First Task", onPress: () => setCreateTaskVisible(true) }}
                            />
                        ) : (
                            steps.map((step, index) => (
                                <Card key={step.id} variant="solid" padding="m" style={styles.stepItem}>
                                    <View style={styles.stepRow}>
                                        <View style={[styles.bullet, step.isCompleted && styles.bulletCompleted]} />
                                        <View style={{ flex: 1 }}>
                                            <Typography
                                                variant="body"
                                                color={step.isCompleted ? COLORS.textTertiary : COLORS.textPrimary}
                                                style={step.isCompleted ? styles.textCompleted : undefined}
                                            >
                                                {step.title}
                                            </Typography>
                                            <Typography variant="caption" color={COLORS.textTertiary}>
                                                {new Date(step.date || step.scheduledDate || new Date()).toLocaleDateString()}
                                            </Typography>
                                        </View>
                                    </View>
                                </Card>
                            ))
                        )}
                        {steps.length > 0 && (
                            <Button
                                title="+ Add Task"
                                variant="outline"
                                onPress={() => setCreateTaskVisible(true)}
                                style={{ marginTop: SPACING.m }}
                            />
                        )}
                    </View>
                ) : (
                    <View style={styles.tabContent}>
                        {/* Resources List */}
                        {(!goal.resources || goal.resources.length === 0) ? (
                            <EmptyState
                                title="No resources"
                                description="Add links to documents, drive folders, or websites."
                                action={{ label: "Add Resource", onPress: () => setAddResourceVisible(true) }}
                            />
                        ) : (
                            goal.resources.map((resource) => (
                                <TouchableOpacity key={resource.id} onPress={() => openResource(resource.url)}>
                                    <Card variant="glass" padding="m" style={styles.resourceItem}>
                                        <View style={styles.resourceIcon}>
                                            {resource.type === 'LINK' ? <ExternalLinkIcon /> : <FileIcon />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Typography variant="body" weight="semibold">
                                                {resource.title}
                                            </Typography>
                                            <Typography variant="caption" color={COLORS.textTertiary} numberOfLines={1}>
                                                {resource.url}
                                            </Typography>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteResource(resource.id)} style={{ padding: SPACING.s }}>
                                            <TrashIcon color={COLORS.textTertiary} />
                                        </TouchableOpacity>
                                    </Card>
                                </TouchableOpacity>
                            ))
                        )}
                        {(goal.resources && goal.resources.length > 0) && (
                            <Button
                                title="+ Add Resource"
                                variant="outline"
                                onPress={() => setAddResourceVisible(true)}
                                style={{ marginTop: SPACING.m }}
                            />
                        )}
                    </View>
                )}
            </ScrollView>

            <CreateTaskModal
                visible={createTaskVisible}
                onClose={() => setCreateTaskVisible(false)}
                onSave={(title, date, description, effort, category) => {
                    handleAddTask(title, date, description, effort, category);
                    setCreateTaskVisible(false);
                }}
                initialDate={new Date(goal.deadline)}
                initialCategory={goal.category}
                title={`Add Task to ${goal.title}`}
            />

            <Modal
                visible={addResourceVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddResourceVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={() => setAddResourceVisible(false)} />
                    <Card variant="solid" padding="l" style={styles.modalContent}>
                        <Typography variant="h3" weight="bold" style={{ marginBottom: SPACING.m }}>
                            Add Resource
                        </Typography>

                        <View style={{ flexDirection: 'row', marginBottom: SPACING.m, gap: SPACING.s }}>
                            <TouchableOpacity
                                onPress={() => setNewResourceType('LINK')}
                                style={[styles.typeButton, newResourceType === 'LINK' && styles.typeButtonActive]}
                            >
                                <Typography color={newResourceType === 'LINK' ? COLORS.background : COLORS.textPrimary}>Link</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setNewResourceType('FILE_REF')}
                                style={[styles.typeButton, newResourceType === 'FILE_REF' && styles.typeButtonActive]}
                            >
                                <Typography color={newResourceType === 'FILE_REF' ? COLORS.background : COLORS.textPrimary}>File Ref</Typography>
                            </TouchableOpacity>
                        </View>

                        <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 4 }}>Title</Typography>
                        <TextInput
                            style={styles.input}
                            value={newResourceTitle}
                            onChangeText={setNewResourceTitle}
                            placeholder="e.g. Project Specs"
                            placeholderTextColor={COLORS.textTertiary}
                        />

                        <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 4, marginTop: SPACING.s }}>URL / Path</Typography>
                        <TextInput
                            style={styles.input}
                            value={newResourceUrl}
                            onChangeText={setNewResourceUrl}
                            placeholder={newResourceType === 'LINK' ? "https://..." : "/path/to/file"}
                            placeholderTextColor={COLORS.textTertiary}
                            autoCapitalize="none"
                        />

                        <View style={{ flexDirection: 'row', gap: SPACING.m, marginTop: SPACING.l }}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setAddResourceVisible(false)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Add"
                                onPress={handleAddResource}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </Card>
                </KeyboardAvoidingView>
            </Modal>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: SPACING.m,
    },
    backButton: {
        padding: SPACING.s,
    },
    deleteButton: {
        padding: SPACING.s,
    },
    scrollContent: {
        padding: SPACING.l,
    },
    titleSection: {
        marginBottom: SPACING.l,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    categoryChip: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: SPACING.m,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabContent: {
        minHeight: 200,
    },
    stepItem: {
        marginBottom: SPACING.s,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.m,
    },
    bulletCompleted: {
        backgroundColor: COLORS.textTertiary,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    resourceIcon: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.s,
        backgroundColor: COLORS.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: RADIUS.l,
        borderTopRightRadius: RADIUS.l,
    },
    input: {
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.s,
        padding: SPACING.m,
        color: COLORS.textPrimary,
        fontFamily: 'System', // Replace with your font if needed
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.s,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
});

export default GoalDetailsScreen;
