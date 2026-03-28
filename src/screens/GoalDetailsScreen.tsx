import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { EmptyState } from '../design-system/components/EmptyState';
import { SPACING, RADIUS } from '../design-system/tokens';
import { useTheme } from '../theme';
import { RootStackParamList, Goal, Step, GoalResource, SlotCategory } from '../types';
import { getGoals, getSteps, updateGoal, saveSteps, updateStep, addResourceToGoal, deleteResourceFromGoal, deleteGoal, deleteStep } from '../services/storage';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Checkbox } from '../design-system/components/Checkbox';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { v4 as uuidv4 } from 'uuid';
import { useFocus } from '../context/FocusContext';
import * as DocumentPicker from 'expo-document-picker';

type GoalDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GoalDetails'>;
type GoalDetailsScreenRouteProp = RouteProp<RootStackParamList, 'GoalDetails'>;

const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];



const GoalDetailsScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<GoalDetailsScreenNavigationProp>();
    const route = useRoute<GoalDetailsScreenRouteProp>();
    const { goalId } = route.params;
    const { startSession } = useFocus();

    const BackIcon = ({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5" />
            <Path d="M12 19l-7-7 7-7" />
        </Svg>
    );

    const ExternalLinkIcon = ({ color = colors.textSecondary, size = 20 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <Path d="M15 3h6v6" />
            <Path d="M10 14L21 3" />
        </Svg>
    );

    const FileIcon = ({ color = colors.textSecondary, size = 20 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <Path d="M13 2v7h7" />
        </Svg>
    );

    const TrashIcon = ({ color = colors.error, size = 18 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 6h18" />
            <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </Svg>
    );

    const PlayIcon = ({ color = colors.primary, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 3l14 9-14 9V3z" />
        </Svg>
    );

    const [goal, setGoal] = useState<Goal | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [activeTab, setActiveTab] = useState<'TASKS' | 'CONTEXT'>('TASKS');
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Step | null>(null);
    const [addResourceVisible, setAddResourceVisible] = useState(false);
    const [contextText, setContextText] = useState('');

    // Resource Form State
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [newResourceType, setNewResourceType] = useState<'LINK' | 'FILE_REF'>('LINK');

    // Selection Mode State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => Promise<void>;
    } | null>(null);

    const loadData = async () => {
        const allGoals = await getGoals();
        const foundGoal = allGoals.find(g => g.id === goalId);
        setGoal(foundGoal || null);
        if (foundGoal) {
            setContextText(foundGoal.context || '');
        }

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

    const handleSaveContext = async () => {
        if (!goal) return;
        const updatedGoal = { ...goal, context: contextText };
        await updateGoal(updatedGoal);
        setGoal(updatedGoal);
    };

    const handleDeleteGoal = async () => {
        setDeleteConfig({
            title: "Delete Goal?",
            message: "Are you sure you want to delete this goal and all tasks? This cannot be undone.",
            onConfirm: async () => {
                await deleteGoal(goalId);
                navigation.goBack();
            }
        });
        setDeleteModalVisible(true);
    };

    const handleSaveTask = async (title: string, date: Date, description?: string, effort: number = 1, category?: SlotCategory) => {
        if (editingTask) {
            const updatedStep = {
                ...editingTask,
                title,
                date,
                description,
                effort,
                category: category || editingTask.category
            };
            await updateStep(updatedStep);
        } else {
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
        }
        setTaskModalVisible(false);
        setEditingTask(null);
        loadData();
    };

    const handleToggleTask = async (step: Step) => {
        if (selectionMode) return;
        // Optimistic update
        const updatedSteps = steps.map(s => s.id === step.id ? { ...s, isCompleted: !s.isCompleted } : s);
        setSteps(updatedSteps);

        const updatedStep = { ...step, isCompleted: !step.isCompleted };
        await updateStep(updatedStep);
    };

    const handleLongPress = (stepId: string) => {
        if (selectionMode) return;
        setSelectionMode(true);
        setSelectedItems(new Set([stepId]));
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const handlePress = (step: Step) => {
        if (selectionMode) {
            const newSelected = new Set(selectedItems);
            if (newSelected.has(step.id)) {
                newSelected.delete(step.id);
                if (newSelected.size === 0) {
                    setSelectionMode(false);
                }
            } else {
                newSelected.add(step.id);
            }
            setSelectedItems(newSelected);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } else {
            handleToggleTask(step);
        }
    };

    const handleDeleteSelected = () => {
        setDeleteConfig({
            title: "Delete Selected Tasks?",
            message: `Are you sure you want to delete ${selectedItems.size} task(s)? This cannot be undone.`,
            onConfirm: async () => {
                for (const id of selectedItems) {
                    await deleteStep(id);
                }
                setSelectionMode(false);
                setSelectedItems(new Set());
                loadData();
            }
        });
        setDeleteModalVisible(true);
    };

    const handleAddResource = async () => {
        if (!newResourceTitle || !newResourceUrl) {
            alert("Please fill in all fields");
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
        setDeleteConfig({
            title: "Remove Resource?",
            message: "Are you sure you want to remove this resource?",
            onConfirm: async () => {
                await deleteResourceFromGoal(goalId, resourceId);
                loadData();
            }
        });
        setDeleteModalVisible(true);
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

    const handleStartFocus = () => {
        if (goal) {
            startSession(goal);
            navigation.navigate('FocusSession');
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
                <TouchableOpacity onPress={handleStartFocus} style={{ padding: SPACING.s, marginRight: SPACING.s }}>
                    <PlayIcon />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteGoal} style={styles.deleteButton}>
                    <TrashIcon />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.titleSection}>
                    <Typography variant="h1" weight="bold" style={{ marginBottom: SPACING.s }}>
                        {goal.title}
                    </Typography>
                    <Typography variant="body" color={colors.textSecondary}>
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
                                { borderColor: colors.border },
                                goal.category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                        >
                            <Typography
                                variant="caption"
                                color={goal.category === cat ? colors.background : colors.textSecondary}
                                weight={goal.category === cat ? 'bold' : 'regular'}
                            >
                                {cat.trim()}
                            </Typography>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'TASKS' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('TASKS')}
                    >
                        <Typography variant="body" weight={activeTab === 'TASKS' ? 'bold' : 'regular'} color={activeTab === 'TASKS' ? colors.primary : colors.textSecondary}>
                            Tasks
                        </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'CONTEXT' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('CONTEXT')}
                    >
                        <Typography variant="body" weight={activeTab === 'CONTEXT' ? 'bold' : 'regular'} color={activeTab === 'CONTEXT' ? colors.primary : colors.textSecondary}>
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
                                action={{ label: "✨ Decompose with AI", onPress: () => navigation.navigate('GoalInput', { goalId }) }}
                            />
                        ) : (
                            steps.map((step, index) => {
                                const isSelected = selectedItems.has(step.id);
                                return (
                                    <TouchableOpacity
                                        key={step.id}
                                        onLongPress={() => handleLongPress(step.id)}
                                        onPress={() => {
                                            if (selectionMode) {
                                                handlePress(step);
                                            } else {
                                                setEditingTask(step);
                                                setTaskModalVisible(true);
                                            }
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        <Card
                                            variant="solid"
                                            padding="m"
                                            style={[
                                                styles.stepItem,
                                                isSelected && { borderColor: colors.primary, borderWidth: 2 }
                                            ]}
                                        >
                                            <View style={styles.stepRow}>
                                                {selectionMode ? (
                                                    <View style={[styles.selectionCircle, { borderColor: colors.textSecondary }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => handleToggleTask(step)}
                                                        style={{ padding: 4, marginRight: 8 }}
                                                        activeOpacity={0.7}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <Checkbox
                                                            checked={step.isCompleted}
                                                            onPress={() => handleToggleTask(step)}
                                                            style={{ marginRight: 0 }}
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Typography
                                                        variant="body"
                                                        color={step.isCompleted && !selectionMode ? colors.textTertiary : colors.textPrimary}
                                                        style={step.isCompleted && !selectionMode ? styles.textCompleted : undefined}
                                                    >
                                                        {step.title}
                                                    </Typography>
                                                    <Typography variant="caption" color={colors.textTertiary}>
                                                        {new Date(step.date || step.scheduledDate || new Date()).toLocaleDateString()}
                                                    </Typography>
                                                </View>
                                            </View>
                                        </Card>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                        {steps.length > 0 && (
                            <View style={{ gap: SPACING.m, marginTop: SPACING.m }}>
                                <Button
                                    title="+ Add Task"
                                    variant="outline"
                                    onPress={() => setTaskModalVisible(true)}
                                />
                                <Button
                                    title="✨ AI Plan / Optimize"
                                    variant="ghost"
                                    onPress={() => navigation.navigate('GoalInput', { goalId })}
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.tabContent}>
                        <View style={{ marginBottom: SPACING.xl }}>
                            <Typography variant="h3" weight="semibold" style={{ marginBottom: SPACING.m }}>
                                Context & Constraints
                            </Typography>
                            <Input
                                placeholder="Add context, constraints, or preferences (e.g. 'Budget $500', 'I'm a beginner'). This will be used by AI to generate better tasks."
                                value={contextText}
                                onChangeText={setContextText}
                                multiline
                                style={{ minHeight: 120, textAlignVertical: 'top', marginBottom: SPACING.m }}
                                onBlur={handleSaveContext}
                            />
                        </View>

                        <Typography variant="h3" weight="semibold" style={{ marginBottom: SPACING.m, marginTop: SPACING.xl }}>
                            Resources
                        </Typography>

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
                                        <View style={[styles.resourceIcon, { backgroundColor: colors.surfaceHighlight }]}>
                                            {resource.type === 'LINK' ? <ExternalLinkIcon /> : <FileIcon />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Typography variant="body" weight="semibold">
                                                {resource.title}
                                            </Typography>
                                            <Typography variant="caption" color={colors.textTertiary} numberOfLines={1}>
                                                {resource.url}
                                            </Typography>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteResource(resource.id)} style={{ padding: SPACING.s }}>
                                            <TrashIcon color={colors.textTertiary} />
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
                visible={taskModalVisible}
                onClose={() => {
                    setTaskModalVisible(false);
                    setEditingTask(null);
                }}
                onSave={handleSaveTask}
                initialDate={editingTask?.date ? new Date(editingTask.date) : (goal ? new Date(goal.deadline) : new Date())}
                initialCategory={editingTask?.category || goal?.category}
                initialTitle={editingTask?.title || ""}
                initialDescription={editingTask?.description || ""}
                initialEffort={editingTask?.effort || 1}
                title={editingTask ? "Edit Task" : `Add Task to ${goal.title}`}
                saveLabel={editingTask ? "Save Changes" : "Add Task"}
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
                                style={[styles.typeButton, { borderColor: colors.border }, newResourceType === 'LINK' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            >
                                <Typography color={newResourceType === 'LINK' ? colors.background : colors.textPrimary}>Link</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setNewResourceType('FILE_REF')}
                                style={[styles.typeButton, { borderColor: colors.border }, newResourceType === 'FILE_REF' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            >
                                <Typography color={newResourceType === 'FILE_REF' ? colors.background : colors.textPrimary}>File</Typography>
                            </TouchableOpacity>
                        </View>

                        {newResourceType === 'LINK' ? (
                            <>
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>Title</Typography>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceHighlight, color: colors.textPrimary }]}
                                    value={newResourceTitle}
                                    onChangeText={setNewResourceTitle}
                                    placeholder="e.g. Project Specs"
                                    placeholderTextColor={colors.textTertiary}
                                />

                                <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: 4, marginTop: SPACING.s }}>URL</Typography>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceHighlight, color: colors.textPrimary }]}
                                    value={newResourceUrl}
                                    onChangeText={setNewResourceUrl}
                                    placeholder="https://..."
                                    placeholderTextColor={colors.textTertiary}
                                    autoCapitalize="none"
                                />
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', marginVertical: SPACING.m }}>
                                {newResourceUrl ? (
                                    <View style={{ alignItems: 'center', width: '100%' }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: colors.surface,
                                            padding: SPACING.m,
                                            borderRadius: RADIUS.m,
                                            marginBottom: SPACING.m,
                                            width: '100%'
                                        }}>
                                            <FileIcon size={32} color={colors.primary} />
                                            <View style={{ marginLeft: SPACING.m, flex: 1 }}>
                                                <Typography variant="body" weight="bold" numberOfLines={1}>{newResourceTitle}</Typography>
                                                <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>{newResourceUrl}</Typography>
                                            </View>
                                        </View>
                                        <Button
                                            title="Change File"
                                            variant="outline"
                                            onPress={async () => {
                                                try {
                                                    const result = await DocumentPicker.getDocumentAsync({
                                                        copyToCacheDirectory: true
                                                    });

                                                    if (!result.canceled && result.assets && result.assets.length > 0) {
                                                        const file = result.assets[0];
                                                        setNewResourceTitle(file.name);
                                                        setNewResourceUrl(file.uri);
                                                    }
                                                } catch (err) {
                                                    Alert.alert("Error", "Failed to pick file");
                                                }
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <Button
                                        title="Select File"
                                        variant="outline"
                                        onPress={async () => {
                                            try {
                                                const result = await DocumentPicker.getDocumentAsync({
                                                    copyToCacheDirectory: true
                                                });

                                                if (!result.canceled && result.assets && result.assets.length > 0) {
                                                    const file = result.assets[0];
                                                    setNewResourceTitle(file.name);
                                                    setNewResourceUrl(file.uri);
                                                }
                                            } catch (err) {
                                                Alert.alert("Error", "Failed to pick file");
                                            }
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                )}
                            </View>
                        )}

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

            {/* Action Bar */}
            {selectionMode && (
                <View style={[styles.actionBar, { backgroundColor: colors.surfaceHighlight, shadowColor: colors.shadow }]}>
                    <Typography variant="body" weight="bold" color={colors.textPrimary}>
                        {selectedItems.size} Selected
                    </Typography>
                    <TouchableOpacity
                        onPress={handleDeleteSelected}
                        style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.error }]}
                    >
                        <TrashIcon color={colors.error} />
                    </TouchableOpacity>
                </View>
            )}

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
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: COLORS.background, // Handled by Layout
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
        paddingBottom: 100, // Add extra padding for keyboard
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
        // borderColor: COLORS.border, // Handled inline
    },
    categoryChipSelected: {
        // backgroundColor: COLORS.primary, // Handled inline
        // borderColor: COLORS.primary, // Handled inline
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        // borderBottomColor: COLORS.border, // Handled dynamically
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
        // borderBottomColor: COLORS.primary, // Handled dynamically
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
        // backgroundColor: COLORS.primary, // Handled inline if used (seems unused)
        marginRight: SPACING.m,
    },
    bulletCompleted: {
        // backgroundColor: COLORS.textTertiary,
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
        // backgroundColor: COLORS.surfaceHighlight, // Handled inline
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
        // backgroundColor: COLORS.surfaceHighlight, // Handled inline
        borderRadius: RADIUS.s,
        padding: SPACING.m,
        // color: COLORS.textPrimary, // Handled inline
        fontFamily: 'System', // Replace with your font if needed
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.s,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        // borderColor: COLORS.border, // Handled inline
    },
    typeButtonActive: {
        // backgroundColor: COLORS.primary, // Handled inline
        // borderColor: COLORS.primary, // Handled inline
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
        bottom: SPACING.l,
        left: SPACING.l,
        right: SPACING.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    actionButton: {
        // backgroundColor: COLORS.surface, // Handled inline
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        // borderColor: COLORS.error // Handled inline
    }
});

export default GoalDetailsScreen;
