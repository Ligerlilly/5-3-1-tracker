import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Divider, useTheme } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";
import { calculateWarmupSets, calculateWorkSetWeight, calculateEstimated1RM } from "../utils/calculations";
import { PERCENTAGE_SCHEMES } from "../types";
import LoadingScreen from "../components/common/LoadingScreen";
import WarmupSetCard from "../components/workout/WarmupSetCard";
import WorkSetCard from "../components/workout/WorkSetCard";
import AssistanceSection from "../components/workout/AssistanceSection";
import WorkoutActionButtons from "../components/workout/WorkoutActionButtons";

type WorkoutScreenRouteProp = RouteProp<DashboardStackParamList, "Workout">;
type WorkoutScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

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
    const theme = useTheme();

    useEffect(() => {
        loadWorkoutData();
    }, []);

    const loadWorkoutData = () => {
        try {
            const exerciseData = db.getExercises("main").find((e: any) => e.id === exerciseId);
            setExercise(exerciseData);

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

        percentages.forEach((scheme: any, index: number) => {
            const weight = calculateWorkSetWeight(tm, scheme.percentage);
            allSets.push({
                setNumber: warmupSets.length + index + 1,
                isWarmup: false,
                weight: weight,
                prescribedReps: scheme.reps,
                actualReps: "",
                isAMRAP: scheme.isAmrap,
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

            const today = new Date().toISOString().split("T")[0];
            const workoutId = db.createWorkout((user as any).id, cycle.id, exerciseId, weekNumber, trainingMax);

            sets.forEach((set) => {
                const hasReps = set.actualReps.trim() !== "" && !isNaN(parseInt(set.actualReps));
                if (!hasReps) return;
                const setType = set.isWarmup ? "warmup" : "work";
                const actualReps = parseInt(set.actualReps);
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

            db.completeWorkout(workoutId as number);

            if (weekNumber === 4) {
                const week4Completions = db.getWeek4Completions(cycle.id, (user as any).id) as any[];
                const skippedIds = db.getSkippedExerciseIds(cycle.id);
                const activeLifts = Math.max(1, 4 - skippedIds.length);
                const requiredWorkouts = Math.min(cycle.training_days, activeLifts);
                if (week4Completions.length >= requiredWorkouts) {
                    setSaving(false);
                    navigation.navigate("CycleComplete", {
                        cycleId: cycle.id,
                        cycleNumber: cycle.cycle_number,
                        trainingDays: cycle.training_days,
                    });
                    return;
                }
            }

            const amrapSet = sets.find((s) => s.isAMRAP && s.actualReps);
            let prMessage: string | null = null;
            if (amrapSet && parseInt(amrapSet.actualReps) > 0) {
                const estimated1RM = calculateEstimated1RM(amrapSet.weight, parseInt(amrapSet.actualReps));
                const previousBest: any = db.getBestPR((user as any).id, exerciseId);
                const beatsTM = estimated1RM > trainingMax;
                const beatsPrevious = !previousBest || estimated1RM > previousBest.estimated_1rm;
                if (beatsTM && beatsPrevious) {
                    db.savePR(
                        (user as any).id,
                        exerciseId,
                        amrapSet.weight,
                        parseInt(amrapSet.actualReps),
                        estimated1RM,
                        today,
                        workoutId as number,
                    );
                    prMessage = `🎉 NEW PR! 🎉\n\nEstimated 1RM: ${Math.round(estimated1RM)} lbs\n${amrapSet.weight} lbs × ${amrapSet.actualReps} reps`;
                }
            }

            const { isStalled, isWarning } = db.getStallStatus((user as any).id, exerciseId);
            const exerciseName = substituteName ?? exercise?.name ?? "this lift";

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
        return <LoadingScreen message="Loading workout..." />;
    }

    const warmupSets = sets.filter((s) => s.isWarmup);
    const workSets = sets.filter((s) => !s.isWarmup);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
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

                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Warmup Sets
                            </Text>
                            {warmupSets.map((set, index) => (
                                <WarmupSetCard
                                    key={`warmup-${index}`}
                                    setNumber={set.setNumber}
                                    weight={set.weight}
                                    prescribedReps={set.prescribedReps}
                                />
                            ))}
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.section}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Work Sets
                            </Text>
                            {workSets.map((set, index) => {
                                const actualIndex = sets.indexOf(set);
                                return (
                                    <WorkSetCard
                                        key={`work-${index}`}
                                        setNumber={set.setNumber}
                                        weight={set.weight}
                                        prescribedReps={set.prescribedReps}
                                        isAMRAP={set.isAMRAP}
                                        actualReps={set.actualReps}
                                        onChangeReps={(value) => updateReps(actualIndex, value)}
                                    />
                                );
                            })}
                        </View>

                        {exercise?.category && <AssistanceSection category={exercise.category} />}

                        <WorkoutActionButtons
                            onComplete={handleCompleteWorkout}
                            onCancel={() => navigation.goBack()}
                            saving={saving}
                        />
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
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        padding: 20,
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
    divider: {
        marginVertical: 20,
    },
});
