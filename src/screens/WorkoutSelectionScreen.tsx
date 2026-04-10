import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, SegmentedButtons, useTheme, IconButton } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";

type WorkoutSelectionNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "WorkoutSelection">;

// Substitute options shown when user picks "Swap Lift"
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
    // Map of exerciseId → { is_skipped, substitute_name }
    const [liftConfig, setLiftConfig] = useState<Record<number, LiftState>>({});
    // Last exercise completed (for cross-week rotation)
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

                // Build skip/swap config map from DB first (needed for quota calc)
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

                // Auto-select week: if the current week is full, advance to next
                const rawWeek = db.getCurrentWeekInCycle(cycle.id, (user as any).id);
                const rawDone = db.getWorkoutsThisWeek(cycle.id, (user as any).id, rawWeek) as any[];
                const weekIsFull = rawDone.length >= requiredPerWeek && rawWeek < 4;
                const displayWeek = weekIsFull ? rawWeek + 1 : rawWeek;
                setWeekNumber(String(displayWeek) as "1" | "2" | "3" | "4");

                // Completions for the display week (empty when just advanced)
                const doneThisWeek = weekIsFull ? [] : rawDone;
                setCompletedThisWeek(doneThisWeek.map((w: any) => w.exercise_id));

                // Track last completed exercise for rotation-aware "next up"
                const lastId = db.getLastCompletedExerciseId(cycle.id, (user as any).id);
                setLastCompletedExerciseId(lastId);
            }
        }
    }, []);

    const getLiftState = (exerciseId: number): LiftState =>
        liftConfig[exerciseId] ?? { is_skipped: false, substitute_name: null };

    // --- action handlers ---

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
            // Can skip (only if not already swapped — skip and swap are mutually exclusive)
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

            // Swap
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

    // --- derived lists ---

    const activeExercises = exercises.filter((e) => !getLiftState(e.id).is_skipped);
    const skippedExercises = exercises.filter((e) => getLiftState(e.id).is_skipped);

    // Rotation-aware "next up":
    // Mid-week  → first active exercise not yet done this week
    // Fresh week → exercise AFTER the last completed one in the rotation order,
    //              so consecutive weeks never repeat the same first exercise
    const getNextUpId = (): number | null => {
        if (activeExercises.length === 0) return null;

        if (completedThisWeek.length > 0) {
            // Mid-week: first not done this week
            return activeExercises.find((e) => !completedThisWeek.includes(e.id))?.id ?? null;
        }

        // Fresh week: continue rotation from where we left off
        if (lastCompletedExerciseId !== null) {
            const lastIdx = activeExercises.findIndex((e) => e.id === lastCompletedExerciseId);
            if (lastIdx !== -1) {
                return activeExercises[(lastIdx + 1) % activeExercises.length].id;
            }
        }

        // No history yet → default to first in list
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

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Week
                    </Text>
                    <SegmentedButtons
                        value={weekNumber}
                        onValueChange={(value) => setWeekNumber(value as any)}
                        buttons={[
                            { value: "1", label: "Week 1" },
                            { value: "2", label: "Week 2" },
                            { value: "3", label: "Week 3" },
                            { value: "4", label: "Week 4" },
                        ]}
                        style={styles.segmented}
                    />

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Exercise
                    </Text>

                    <Text variant="bodySmall" style={styles.helperText}>
                        {activeExercises.length}-lift split this cycle • Tap ⋮ to skip or swap a lift
                    </Text>

                    {/* Today's lift banner */}
                    {nextUpExerciseId !== null && (
                        <View style={styles.todayBanner}>
                            <Text style={styles.todayBannerText}>
                                🏋️ Today's lift:{" "}
                                {getLiftState(nextUpExerciseId).substitute_name ??
                                    activeExercises.find((e) => e.id === nextUpExerciseId)?.name}
                            </Text>
                        </View>
                    )}

                    {/* Active exercises */}
                    {activeExercises.map((exercise) => {
                        const state = getLiftState(exercise.id);
                        const isCompleted = completedThisWeek.includes(exercise.id);
                        const isNextUp = exercise.id === nextUpExerciseId;
                        const isSwapped = !!state.substitute_name;
                        const displayName = state.substitute_name ?? exercise.name;

                        return (
                            <Card
                                key={exercise.id}
                                style={[
                                    styles.card,
                                    isNextUp && styles.nextUpCard,
                                    isSwapped && !isNextUp && styles.swappedCard,
                                    isCompleted && styles.completedCard,
                                ]}
                                onPress={() =>
                                    navigation.navigate("Workout", {
                                        exerciseId: exercise.id,
                                        weekNumber: parseInt(weekNumber) as 1 | 2 | 3 | 4,
                                        substituteName: state.substitute_name ?? undefined,
                                    })
                                }
                            >
                                <Card.Content>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.exerciseInfo}>
                                            <Text variant="titleLarge">{displayName}</Text>
                                            {isSwapped ? (
                                                <Text variant="bodySmall" style={styles.swapSubtitle}>
                                                    ↔ {exercise.name} slot • {exercise.category.toUpperCase()} TM
                                                </Text>
                                            ) : (
                                                <Text variant="bodyMedium" style={styles.category}>
                                                    {exercise.category.toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.badges}>
                                            {isSwapped && <Text style={styles.swappedBadge}>SWAPPED</Text>}
                                            {isCompleted && <Text style={styles.completedBadge}>✓ DONE</Text>}
                                            <IconButton
                                                icon="dots-vertical"
                                                size={18}
                                                onPress={() => handleMenuPress(exercise)}
                                                style={styles.menuButton}
                                            />
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        );
                    })}

                    {/* Skipped exercises */}
                    {skippedExercises.length > 0 && (
                        <>
                            <Text variant="bodySmall" style={styles.skippedHeader}>
                                SKIPPED THIS CYCLE
                            </Text>
                            {skippedExercises.map((exercise) => (
                                <Card
                                    key={exercise.id}
                                    style={[styles.card, styles.skippedCard]}
                                    onPress={() => handleMenuPress(exercise)}
                                >
                                    <Card.Content>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.exerciseInfo}>
                                                <Text variant="titleLarge" style={styles.skippedText}>
                                                    {exercise.name}
                                                </Text>
                                                <Text variant="bodyMedium" style={styles.skippedText}>
                                                    {exercise.category.toUpperCase()} • TM frozen this cycle
                                                </Text>
                                            </View>
                                            <Text style={styles.skippedBadge}>SKIPPED</Text>
                                        </View>
                                    </Card.Content>
                                </Card>
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
    segmented: { marginBottom: 10 },
    helperText: { marginBottom: 15, color: "#666", fontStyle: "italic" },
    card: { marginBottom: 10 },
    category: { marginTop: 5, color: "#666" },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    exerciseInfo: { flex: 1 },
    badges: { flexDirection: "row", alignItems: "center", gap: 4 },
    completedCard: { opacity: 0.6 },
    completedBadge: {
        backgroundColor: "#9E9E9E",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
    },
    menuButton: { margin: 0, padding: 0 },
    // Next up styles
    todayBanner: {
        backgroundColor: "#6200ea",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    todayBannerText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
    nextUpCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#6200ea",
        elevation: 3,
    },
    // Swap styles
    swappedCard: { borderLeftWidth: 4, borderLeftColor: "#FF9800" },
    swapSubtitle: { marginTop: 3, color: "#FF9800", fontStyle: "italic" },
    swappedBadge: {
        backgroundColor: "#FF9800",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
    },
    // Skip styles
    skippedHeader: {
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 1,
        marginTop: 10,
        marginBottom: 8,
    },
    skippedCard: {
        opacity: 0.5,
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#ccc",
    },
    skippedText: { color: "#999" },
    skippedBadge: {
        backgroundColor: "#e0e0e0",
        color: "#666",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
    },
});
