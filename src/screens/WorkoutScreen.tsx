import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, TextInput, Divider, Chip, useTheme } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";
import { calculateWarmupSets, calculateWorkSetWeight, calculateEstimated1RM } from "../utils/calculations";
import { PERCENTAGE_SCHEMES } from "../types";

type WorkoutScreenRouteProp = RouteProp<DashboardStackParamList, "Workout">;
type WorkoutScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

// Assistance work suggestions from 5/3/1 book (Triumvirate + Periodization Bible templates)
const ASSISTANCE_BY_CATEGORY: Record<string, { label: string; exercises: { name: string; prescription: string }[] }[]> =
    {
        press: [
            {
                label: "Push (shoulders/chest/triceps)",
                exercises: [
                    { name: "Dips", prescription: "5 sets × 15 reps" },
                    { name: "DB Bench Press", prescription: "5 sets × 15 reps" },
                    { name: "DB Military Press", prescription: "5 sets × 12 reps" },
                    { name: "Pushups", prescription: "100 total reps" },
                ],
            },
            {
                label: "Pull (lats/upper back)",
                exercises: [
                    { name: "Chin-ups", prescription: "5 sets × 10 reps" },
                    { name: "DB Rows (Kroc Rows)", prescription: "3 sets × 20–40 reps" },
                    { name: "Barbell Rows", prescription: "5 sets × 10 reps" },
                    { name: "Face Pulls", prescription: "5 sets × 15 reps" },
                ],
            },
            {
                label: "Triceps",
                exercises: [
                    { name: "Triceps Pushdowns", prescription: "5 sets × 15 reps" },
                    { name: "Triceps Extensions", prescription: "5 sets × 12 reps" },
                ],
            },
        ],
        bench: [
            {
                label: "Push (chest/shoulders)",
                exercises: [
                    { name: "DB Bench Press", prescription: "5 sets × 15 reps" },
                    { name: "DB Incline Press", prescription: "5 sets × 12 reps" },
                    { name: "Incline Barbell Press", prescription: "5 sets × 10 reps" },
                    { name: "Dips", prescription: "5 sets × 15 reps" },
                ],
            },
            {
                label: "Pull (lats/upper back)",
                exercises: [
                    { name: "DB Rows (Kroc Rows)", prescription: "3 sets × 20–40 reps" },
                    { name: "Barbell Rows", prescription: "5 sets × 10 reps" },
                    { name: "Chin-ups", prescription: "5 sets × 10 reps" },
                    { name: "Face Pulls", prescription: "5 sets × 15 reps" },
                ],
            },
            {
                label: "Triceps",
                exercises: [
                    { name: "Triceps Pushdowns", prescription: "5 sets × 15 reps" },
                    { name: "Triceps Extensions", prescription: "5 sets × 12 reps" },
                ],
            },
        ],
        deadlift: [
            {
                label: "Hamstrings / Lower back",
                exercises: [
                    { name: "Good Mornings", prescription: "5 sets × 12 reps" },
                    { name: "Glute-Ham Raise", prescription: "5 sets × 10 reps" },
                    { name: "Back Raise", prescription: "5 sets × 15 reps" },
                    { name: "Straight Leg Deadlift", prescription: "5 sets × 10 reps" },
                ],
            },
            {
                label: "Quads",
                exercises: [
                    { name: "Front Squat", prescription: "5 sets × 10 reps" },
                    { name: "Leg Press", prescription: "5 sets × 20 reps" },
                    { name: "Lunges", prescription: "3 sets × 10 reps/leg" },
                    { name: "Step-ups", prescription: "3 sets × 10 reps/leg" },
                ],
            },
            {
                label: "Abs / Core",
                exercises: [
                    { name: "Hanging Leg Raises", prescription: "5 sets × 15 reps" },
                    { name: "Ab Wheel", prescription: "3 sets × 25 reps" },
                    { name: "Weighted Sit-ups", prescription: "3 sets × 10 reps" },
                    { name: "DB Side Bends", prescription: "3 sets × 20 reps/side" },
                ],
            },
        ],
        squat: [
            {
                label: "Hamstrings",
                exercises: [
                    { name: "Leg Curls", prescription: "5 sets × 10 reps" },
                    { name: "Glute-Ham Raise", prescription: "5 sets × 10 reps" },
                    { name: "Straight Leg Deadlift", prescription: "5 sets × 10 reps" },
                    { name: "Good Mornings", prescription: "5 sets × 12 reps" },
                ],
            },
            {
                label: "Quads",
                exercises: [
                    { name: "Leg Press", prescription: "5 sets × 20 reps" },
                    { name: "Lunges", prescription: "3 sets × 10 reps/leg" },
                    { name: "Step-ups", prescription: "3 sets × 10 reps/leg" },
                ],
            },
            {
                label: "Abs / Core",
                exercises: [
                    { name: "Hanging Leg Raises", prescription: "5 sets × 15 reps" },
                    { name: "Ab Wheel", prescription: "3 sets × 25 reps" },
                    { name: "Weighted Sit-ups", prescription: "3 sets × 10 reps" },
                ],
            },
        ],
    };

interface SetData {
    setNumber: number;
    isWarmup: boolean;
    weight: number;
    prescribedReps: number;
    actualReps: string;
    isAMRAP: boolean;
}

export default function WorkoutScreen() {
    const route = useRoute<WorkoutScreenRouteProp>();
    const navigation = useNavigation<WorkoutScreenNavigationProp>();
    const { exerciseId, weekNumber, substituteName } = route.params;
    const [exercise, setExercise] = useState<any>(null);
    const [trainingMax, setTrainingMax] = useState<number>(0);
    const [sets, setSets] = useState<SetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assistanceExpanded, setAssistanceExpanded] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        loadWorkoutData();
    }, []);

    const loadWorkoutData = () => {
        try {
            // Get exercise details
            const exerciseData = db.getExercises("main").find((e: any) => e.id === exerciseId);
            setExercise(exerciseData);

            // Get current user and training max
            const user = db.getCurrentUser();
            if (user && exerciseData) {
                const tmData: any = db
                    .getAllCurrentTrainingMaxes((user as any).id)
                    .find((tm: any) => tm.exercise_id === exerciseId);

                if (tmData) {
                    setTrainingMax(tmData.training_max);
                    generateSets(tmData.training_max, weekNumber);
                }
            }
        } catch (error) {
            console.error("Error loading workout data:", error);
            Alert.alert("Error", "Failed to load workout data");
        } finally {
            setLoading(false);
        }
    };

    const generateSets = (tm: number, week: 1 | 2 | 3 | 4) => {
        const warmupSets = calculateWarmupSets(tm);
        const weekKey = `week${week}` as "week1" | "week2" | "week3" | "week4";
        const percentages = PERCENTAGE_SCHEMES[1][weekKey];

        const allSets: SetData[] = [];

        // Add warmup sets
        warmupSets.forEach((warmup: any, index: number) => {
            allSets.push({
                setNumber: index + 1,
                isWarmup: true,
                weight: warmup.weight,
                prescribedReps: warmup.reps,
                actualReps: "",
                isAMRAP: false,
            });
        });

        // Add work sets
        percentages.forEach((scheme: any, index: number) => {
            const weight = calculateWorkSetWeight(tm, scheme.percentage);
            allSets.push({
                setNumber: warmupSets.length + index + 1,
                isWarmup: false,
                weight: weight,
                prescribedReps: scheme.reps,
                actualReps: "",
                isAMRAP: scheme.isAmrap, // Note: PERCENTAGE_SCHEMES uses camelCase "isAmrap"
            });
        });

        setSets(allSets);
    };

    const updateReps = (setIndex: number, reps: string) => {
        const newSets = [...sets];
        newSets[setIndex].actualReps = reps;
        setSets(newSets);
    };

    const handleCompleteWorkout = async () => {
        // Validate that all work sets have a value entered (0 is valid — means a missed lift)
        const workSets = sets.filter((s) => !s.isWarmup);
        const incomplete = workSets.some((s) => s.actualReps.trim() === "" || isNaN(parseInt(s.actualReps)));

        if (incomplete) {
            Alert.alert(
                "Incomplete Workout",
                "Please enter reps for all work sets before completing.\n\nEnter 0 if you failed a lift.",
            );
            return;
        }

        setSaving(true);

        try {
            const user = db.getCurrentUser();
            const cycle: any = db.getActiveCycle((user as any).id);

            // Create workout
            const today = new Date().toISOString().split("T")[0];
            const workoutId = db.createWorkout((user as any).id, cycle.id, exerciseId, weekNumber, trainingMax);

            // Save all sets.
            // Warmup sets that weren't filled in are skipped.
            // Work sets: 0 is valid (failed lift) — must be saved for stall detection.
            sets.forEach((set) => {
                const hasReps = set.actualReps.trim() !== "" && !isNaN(parseInt(set.actualReps));
                if (!hasReps) return; // warmup sets left blank → skip
                const setType = set.isWarmup ? "warmup" : "work";
                const actualReps = parseInt(set.actualReps); // may be 0
                const setId = db.createSet(
                    workoutId as number,
                    exerciseId,
                    setType as "warmup" | "work" | "assistance",
                    set.setNumber,
                    set.prescribedReps,
                    set.weight,
                    set.isWarmup ? 0 : set.weight / trainingMax,
                    set.isAMRAP,
                );
                db.completeSet(setId as number, actualReps, set.weight, false);
            });

            // Complete the workout
            db.completeWorkout(workoutId as number);

            // Check for cycle completion (if this was a week 4 workout)
            if (weekNumber === 4) {
                const week4Completions = db.getWeek4Completions(cycle.id, (user as any).id) as any[];
                // Required = min(training_days, active_lifts)
                // e.g. 3-day split, 1 skipped → min(3, 3) = 3
                const skippedIds = db.getSkippedExerciseIds(cycle.id);
                const activeLifts = Math.max(1, 4 - skippedIds.length);
                const requiredWorkouts = Math.min(cycle.training_days, activeLifts);
                if (week4Completions.length >= requiredWorkouts) {
                    // All week 4 workouts done - cycle is complete!
                    setSaving(false);
                    navigation.navigate("CycleComplete", {
                        cycleId: cycle.id,
                        cycleNumber: cycle.cycle_number,
                        trainingDays: cycle.training_days,
                    });
                    return;
                }
            }

            // ── Build completion alert(s) — chained so stall never gets overwritten ─────

            // Step 1: figure out PR status
            const amrapSet = sets.find((s) => s.isAMRAP && s.actualReps);
            let prMessage: string | null = null;
            if (amrapSet && parseInt(amrapSet.actualReps) > 0) {
                const estimated1RM = calculateEstimated1RM(amrapSet.weight, parseInt(amrapSet.actualReps));
                const previousBest: any = db.getBestPR((user as any).id, exerciseId);
                const isPR = !previousBest || estimated1RM > previousBest.estimated_1rm;
                if (isPR) {
                    db.savePR(
                        (user as any).id,
                        exerciseId,
                        amrapSet.weight,
                        parseInt(amrapSet.actualReps),
                        estimated1RM,
                        today,
                        workoutId as number,
                    );
                    prMessage = `🎉 NEW PR! 🎉\n\nNew estimated 1RM: ${Math.round(estimated1RM)} lbs\n${amrapSet.weight} lbs × ${amrapSet.actualReps} reps`;
                }
            }

            // Step 2: stall check — runs AFTER db.completeWorkout so the new AMRAP set is queryable
            const { isStalled, isWarning } = db.getStallStatus((user as any).id, exerciseId);
            const exerciseName = substituteName ?? exercise?.name ?? "this lift";

            // Step 3: show alerts chained so they never overlap
            const showCompletion = () => {
                if (prMessage) {
                    Alert.alert("Workout Complete!", prMessage, [
                        { text: "Awesome!", onPress: () => navigation.navigate("Dashboard") },
                    ]);
                } else {
                    Alert.alert("Workout Complete!", "Great job! Keep up the good work.", [
                        { text: "OK", onPress: () => navigation.navigate("Dashboard") },
                    ]);
                }
            };

            if (isStalled) {
                Alert.alert(
                    "⚠️ Stall Detected",
                    `You've missed the prescribed reps on ${exerciseName} twice in a row.\n\n` +
                        `Wendler's fix: reset TM to 90% and rebuild. This prevents burnout and leads to bigger long-term numbers.\n\n` +
                        `Reset Training Max now?`,
                    [
                        {
                            text: "✅ Reset TM (×0.9)",
                            style: "default",
                            onPress: () => {
                                const newTM = db.resetTrainingMax((user as any).id, exerciseId);
                                Alert.alert(
                                    "Also use smaller jumps?",
                                    `New TM: ${newTM} lbs\n\nSwitch to +2.5/+5 lb increments instead of +5/+10 for this lift going forward?`,
                                    [
                                        {
                                            text: "Yes — smaller jumps",
                                            onPress: () => {
                                                db.setSmallIncrements(cycle.id, exerciseId, true);
                                                showCompletion();
                                            },
                                        },
                                        { text: "No — keep normal", onPress: showCompletion },
                                    ],
                                );
                            },
                        },
                        { text: "Not yet", style: "cancel", onPress: showCompletion },
                    ],
                );
            } else if (isWarning) {
                Alert.alert(
                    "📉 Heads Up",
                    `${exerciseName}: you got fewer reps than prescribed on the AMRAP set.\n\nOne more miss will suggest a Training Max reset.`,
                    [{ text: "Got it", onPress: showCompletion }],
                );
            } else {
                showCompletion();
            }
        } catch (error) {
            console.error("Error saving workout:", error);
            Alert.alert("Error", "Failed to save workout. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text>Loading workout...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const warmupSets = sets.filter((s) => s.isWarmup);
    const workSets = sets.filter((s) => !s.isWarmup);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
                <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <Text variant="headlineMedium" style={styles.title}>
                            {substituteName ?? exercise?.name}
                        </Text>
                        {substituteName && (
                            <Text variant="bodySmall" style={styles.swapNote}>
                                ↔ {exercise?.name} slot
                            </Text>
                        )}
                        <Text variant="bodyLarge" style={styles.subtitle}>
                            Week {weekNumber} • Training Max: {trainingMax} lbs
                        </Text>

                        {/* Warmup Sets */}
                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Warmup Sets
                            </Text>
                            {warmupSets.map((set, index) => (
                                <Card key={`warmup-${index}`} style={styles.setCard}>
                                    <Card.Content>
                                        <View style={styles.setRow}>
                                            <View style={styles.setInfo}>
                                                <Text variant="titleMedium">{set.weight} lbs</Text>
                                                <Text variant="bodySmall">{set.prescribedReps} reps (warmup)</Text>
                                            </View>
                                            <Chip mode="outlined" compact>
                                                Set {set.setNumber}
                                            </Chip>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </View>

                        <Divider style={styles.divider} />

                        {/* Work Sets */}
                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Work Sets
                            </Text>
                            {workSets.map((set, index) => {
                                const actualIndex = sets.indexOf(set);
                                return (
                                    <Card
                                        key={`work-${index}`}
                                        style={[styles.setCard, set.isAMRAP && styles.amrapCard]}
                                    >
                                        <Card.Content>
                                            <View style={styles.workSetHeader}>
                                                <View style={styles.setInfo}>
                                                    <Text variant="titleMedium">{set.weight} lbs</Text>
                                                    <Text variant="bodySmall">
                                                        {set.prescribedReps} reps{set.isAMRAP ? "+" : ""}
                                                    </Text>
                                                </View>
                                                <View style={styles.setLabels}>
                                                    {set.isAMRAP && (
                                                        <Chip
                                                            mode="flat"
                                                            style={styles.amrapChip}
                                                            textStyle={styles.amrapChipText}
                                                        >
                                                            AMRAP
                                                        </Chip>
                                                    )}
                                                    <Chip mode="outlined" compact>
                                                        Set {set.setNumber}
                                                    </Chip>
                                                </View>
                                            </View>
                                            <TextInput
                                                label="Reps Performed"
                                                value={set.actualReps}
                                                onChangeText={(value) => updateReps(actualIndex, value)}
                                                keyboardType="numeric"
                                                mode="outlined"
                                                style={styles.repsInput}
                                                dense
                                            />
                                        </Card.Content>
                                    </Card>
                                );
                            })}
                        </View>

                        {/* Assistance Work Suggestions */}
                        {exercise?.category && ASSISTANCE_BY_CATEGORY[exercise.category] && (
                            <View style={styles.section}>
                                <Divider style={styles.divider} />
                                <TouchableOpacity
                                    onPress={() => setAssistanceExpanded(!assistanceExpanded)}
                                    style={styles.assistanceHeader}
                                >
                                    <Text variant="titleLarge" style={styles.sectionTitle}>
                                        💪 Assistance Work
                                    </Text>
                                    <Text style={styles.expandIcon}>{assistanceExpanded ? "▲" : "▼"}</Text>
                                </TouchableOpacity>
                                <Text variant="bodySmall" style={styles.assistanceNote}>
                                    Pick 2 exercises
                                </Text>

                                {assistanceExpanded &&
                                    ASSISTANCE_BY_CATEGORY[exercise.category].map((group, gIdx) => (
                                        <Card key={gIdx} style={styles.assistanceCard}>
                                            <Card.Content>
                                                <Text variant="titleSmall" style={styles.assistanceGroupLabel}>
                                                    {group.label}
                                                </Text>
                                                {group.exercises.map((ex, eIdx) => (
                                                    <View key={eIdx} style={styles.assistanceRow}>
                                                        <Text variant="bodyMedium" style={styles.assistanceName}>
                                                            • {ex.name}
                                                        </Text>
                                                        <Text variant="bodySmall" style={styles.assistancePrescription}>
                                                            {ex.prescription}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </Card.Content>
                                        </Card>
                                    ))}
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <Button
                                mode="contained"
                                onPress={handleCompleteWorkout}
                                loading={saving}
                                disabled={saving}
                                style={styles.completeButton}
                            >
                                Complete Workout
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => navigation.goBack()}
                                disabled={saving}
                                style={styles.cancelButton}
                            >
                                Cancel
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        marginBottom: 5,
        textAlign: "center",
    },
    swapNote: {
        textAlign: "center",
        color: "#FF9800",
        fontStyle: "italic",
        marginBottom: 4,
    },
    subtitle: {
        marginBottom: 20,
        textAlign: "center",
        color: "#666",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        marginBottom: 15,
        fontWeight: "bold",
    },
    setCard: {
        marginBottom: 10,
    },
    amrapCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#6200ee",
    },
    setRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    workSetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    setInfo: {
        flex: 1,
    },
    setLabels: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    amrapChip: {
        backgroundColor: "#6200ee",
    },
    amrapChipText: {
        color: "#fff",
        fontWeight: "bold",
    },
    repsInput: {
        marginTop: 8,
    },
    divider: {
        marginVertical: 20,
    },
    buttonContainer: {
        marginTop: 20,
        marginBottom: 40,
    },
    completeButton: {
        marginBottom: 10,
    },
    cancelButton: {
        marginBottom: 10,
    },
    assistanceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    expandIcon: {
        fontSize: 14,
        color: "#6200ea",
    },
    assistanceNote: {
        color: "#888",
        fontStyle: "italic",
        marginBottom: 12,
    },
    assistanceCard: {
        marginBottom: 10,
    },
    assistanceGroupLabel: {
        color: "#6200ea",
        fontWeight: "bold",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    assistanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    assistanceName: {
        flex: 1,
    },
    assistancePrescription: {
        color: "#666",
        marginLeft: 8,
    },
});
