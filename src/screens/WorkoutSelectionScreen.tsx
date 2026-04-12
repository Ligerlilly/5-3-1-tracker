import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";
import WeekPicker from "../components/workout-selection/WeekPicker";
import TodayBanner from "../components/workout-selection/TodayBanner";
import ExerciseCard from "../components/workout-selection/ExerciseCard";
import SkippedExerciseCard from "../components/workout-selection/SkippedExerciseCard";

type WorkoutSelectionNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "WorkoutSelection">;

const SUBSTITUTE_OPTIONS: Record<string, string[]> = {
    press: ["DB Overhead Press", "Seated DB Press", "Landmine Press", "Push Press", "Arnold Press"],
    deadlift: ["Romanian Deadlift", "Sumo Deadlift", "Trap Bar Deadlift", "Rack Pull", "Second Squat (High Bar)"],
    bench: ["Incline Bench Press", "Close Grip Bench Press", "Floor Press", "Pause Bench Press", "DB Bench Press"],
    squat: ["Box Squat", "Front Squat", "Bulgarian Split Squat", "Hack Squat", "Second Deadlift"],
};

interface LiftState {
    is_skipped: boolean;
    substitute_name: string | null;
}

export default function WorkoutSelectionScreen() {
    const navigation = useNavigation<WorkoutSelectionNavigationProp>();
    const isFocused = useIsFocused();
    const theme = useTheme();
    const [exercises, setExercises] = useState<any[]>([]);
    const [weekNumber, setWeekNumber] = useState<"1" | "2" | "3" | "4">("1");
    const [completedThisWeek, setCompletedThisWeek] = useState<number[]>([]);
    const [activeCycleId, setActiveCycleId] = useState<number | null>(null);
    const [liftConfig, setLiftConfig] = useState<Record<number, LiftState>>({});
    const [lastCompletedExerciseId, setLastCompletedExerciseId] = useState<number | null>(null);

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = useCallback(() => {
        const mainExercises = db.getExercises("main") as any[];
        setExercises(mainExercises);

        const user = db.getCurrentUser();
        if (user) {
            const cycle: any = db.getActiveCycle((user as any).id);
            if (cycle) {
                setActiveCycleId(cycle.id);

                const configRows = db.getLiftConfig(cycle.id);
                const configMap: Record<number, LiftState> = {};
                for (const row of configRows) {
                    configMap[row.exercise_id] = {
                        is_skipped: row.is_skipped,
                        substitute_name: row.substitute_name,
                    };
                }
                setLiftConfig(configMap);

                const skippedCount = configRows.filter((r) => r.is_skipped).length;
                const activeLifts = Math.max(1, 4 - skippedCount);
                const requiredPerWeek = Math.min(cycle.training_days, activeLifts);

                const rawWeek = db.getCurrentWeekInCycle(cycle.id, (user as any).id);
                const rawDone = db.getWorkoutsThisWeek(cycle.id, (user as any).id, rawWeek) as any[];
                const weekIsFull = rawDone.length >= requiredPerWeek && rawWeek < 4;
                const displayWeek = weekIsFull ? rawWeek + 1 : rawWeek;
                setWeekNumber(String(displayWeek) as "1" | "2" | "3" | "4");

                const doneThisWeek = weekIsFull ? [] : rawDone;
                setCompletedThisWeek(doneThisWeek.map((w: any) => w.exercise_id));

                const lastId = db.getLastCompletedExerciseId(cycle.id, (user as any).id);
                setLastCompletedExerciseId(lastId);
            }
        }
    }, []);

    const getLiftState = (exerciseId: number): LiftState =>
        liftConfig[exerciseId] ?? { is_skipped: false, substitute_name: null };

    const handleMenuPress = (exercise: any) => {
        if (!activeCycleId) return;
        const state = getLiftState(exercise.id);
        const buttons: any[] = [];

        if (state.is_skipped) {
            buttons.push({
                text: "▶ Resume Lift",
                onPress: () => {
                    db.unskipLift(activeCycleId, exercise.id);
                    setLiftConfig((prev) => ({
                        ...prev,
                        [exercise.id]: { ...prev[exercise.id], is_skipped: false },
                    }));
                },
            });
        } else {
            buttons.push({
                text: "⏭ Skip This Cycle",
                style: "destructive" as const,
                onPress: () => {
                    db.skipLift(activeCycleId, exercise.id);
                    setLiftConfig((prev) => ({
                        ...prev,
                        [exercise.id]: { is_skipped: true, substitute_name: null },
                    }));
                },
            });

            if (state.substitute_name) {
                buttons.push({
                    text: "🔄 Change Substitute",
                    onPress: () => showSwapPicker(exercise),
                });
                buttons.push({
                    text: "✖ Clear Swap (back to original)",
                    onPress: () => {
                        db.clearSwap(activeCycleId, exercise.id);
                        setLiftConfig((prev) => ({
                            ...prev,
                            [exercise.id]: { ...prev[exercise.id], substitute_name: null },
                        }));
                    },
                });
            } else {
                buttons.push({
                    text: "🔄 Swap Lift",
                    onPress: () => showSwapPicker(exercise),
                });
            }
        }

        buttons.push({ text: "Cancel", style: "cancel" as const });
        Alert.alert(exercise.substitute_name ?? exercise.name, "Manage this lift for the current cycle:", buttons);
    };

    const showSwapPicker = (exercise: any) => {
        if (!activeCycleId) return;
        const options = SUBSTITUTE_OPTIONS[exercise.category] ?? [];
        const buttons: any[] = options.map((name) => ({
            text: name,
            onPress: () => {
                db.swapLift(activeCycleId, exercise.id, name);
                setLiftConfig((prev) => ({
                    ...prev,
                    [exercise.id]: { is_skipped: false, substitute_name: name },
                }));
            },
        }));
        buttons.push({ text: "Cancel", style: "cancel" as const });
        Alert.alert(`Swap ${exercise.name}`, "Choose a substitute exercise for this cycle:", buttons);
    };

    const activeExercises = exercises.filter((e) => !getLiftState(e.id).is_skipped);
    const skippedExercises = exercises.filter((e) => getLiftState(e.id).is_skipped);

    const getNextUpId = (): number | null => {
        if (activeExercises.length === 0) return null;

        if (completedThisWeek.length > 0) {
            return activeExercises.find((e) => !completedThisWeek.includes(e.id))?.id ?? null;
        }

        if (lastCompletedExerciseId !== null) {
            const lastIdx = activeExercises.findIndex((e) => e.id === lastCompletedExerciseId);
            if (lastIdx !== -1) {
                return activeExercises[(lastIdx + 1) % activeExercises.length].id;
            }
        }

        return activeExercises[0].id;
    };
    const nextUpExerciseId = getNextUpId();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Select Workout
                    </Text>

                    <WeekPicker value={weekNumber} onChange={setWeekNumber} />

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Exercise
                    </Text>
                    <Text variant="bodySmall" style={styles.helperText}>
                        {activeExercises.length}-lift split this cycle • Tap ⋮ to skip or swap a lift
                    </Text>

                    {nextUpExerciseId !== null && (
                        <TodayBanner
                            liftName={
                                getLiftState(nextUpExerciseId).substitute_name ??
                                activeExercises.find((e) => e.id === nextUpExerciseId)?.name ??
                                ""
                            }
                        />
                    )}

                    {activeExercises.map((exercise) => {
                        const state = getLiftState(exercise.id);
                        return (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                isNextUp={exercise.id === nextUpExerciseId}
                                isCompleted={completedThisWeek.includes(exercise.id)}
                                isSwapped={!!state.substitute_name}
                                substituteName={state.substitute_name}
                                onPress={() =>
                                    navigation.navigate("Workout", {
                                        exerciseId: exercise.id,
                                        weekNumber: parseInt(weekNumber) as 1 | 2 | 3 | 4,
                                        substituteName: state.substitute_name ?? undefined,
                                    })
                                }
                                onMenuPress={() => handleMenuPress(exercise)}
                            />
                        );
                    })}

                    {skippedExercises.length > 0 && (
                        <>
                            <Text variant="bodySmall" style={styles.skippedHeader}>
                                SKIPPED THIS CYCLE
                            </Text>
                            {skippedExercises.map((exercise) => (
                                <SkippedExerciseCard
                                    key={exercise.id}
                                    exercise={exercise}
                                    onPress={() => handleMenuPress(exercise)}
                                />
                            ))}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    content: { padding: 20 },
    title: { marginBottom: 20, textAlign: "center" },
    sectionTitle: { marginTop: 20, marginBottom: 10 },
    helperText: { marginBottom: 15, color: "#666", fontStyle: "italic" },
    skippedHeader: {
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 1,
        marginTop: 10,
        marginBottom: 8,
    },
});
