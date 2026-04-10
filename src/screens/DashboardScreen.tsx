import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, Chip, Divider, useTheme } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db, openDatabase } from "../database/db";

type DashboardScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "Dashboard">;

const WEEK_LABELS: Record<number, string> = {
    1: "Week 1 (3×5)",
    2: "Week 2 (3×3)",
    3: "Week 3 (5/3/1)",
    4: "Week 4 (Deload)",
};

export default function DashboardScreen() {
    const navigation = useNavigation<DashboardScreenNavigationProp>();
    const isFocused = useIsFocused();
    const theme = useTheme();
    const [user, setUser] = useState<any>(null);
    const [trainingMaxes, setTrainingMaxes] = useState<any[]>([]);
    const [activeCycle, setActiveCycle] = useState<any>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState<any[]>([]);
    const [recentPRs, setRecentPRs] = useState<any[]>([]);
    const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
    const [nextWorkoutDate, setNextWorkoutDate] = useState<string>("");
    const [skippedExerciseIds, setSkippedExerciseIds] = useState<number[]>([]);
    // Map exerciseId → substitute name (for swapped lifts)
    const [swapMap, setSwapMap] = useState<Record<number, string>>({});
    const [nextLiftName, setNextLiftName] = useState<string | null>(null);
    // Map exerciseId → stall status
    const [stallStatus, setStallStatus] = useState<Record<number, { isStalled: boolean; isWarning: boolean }>>({});

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = () => {
        try {
            const currentUser = db.getCurrentUser();
            setUser(currentUser);

            if (currentUser && (currentUser as any).id) {
                const userId = (currentUser as any).id;

                const maxes = db.getAllCurrentTrainingMaxes(userId);
                setTrainingMaxes(maxes as any);

                const cycle = db.getActiveCycle(userId);
                setActiveCycle(cycle);

                if (cycle) {
                    // Load full lift config (skip + swap) first — needed for quota calc
                    const config = db.getLiftConfig((cycle as any).id);
                    const skipped = config.filter((c) => c.is_skipped).map((c) => c.exercise_id);
                    setSkippedExerciseIds(skipped);
                    const swaps: Record<number, string> = {};
                    config.forEach((c) => {
                        if (c.substitute_name) swaps[c.exercise_id] = c.substitute_name;
                    });
                    setSwapMap(swaps);

                    const activeLifts = Math.max(1, 4 - skipped.length);
                    const requiredPerWeek = Math.min((cycle as any).training_days, activeLifts);

                    const rawWeek = db.getCurrentWeekInCycle((cycle as any).id, userId);
                    const rawDone = db.getWorkoutsThisWeek((cycle as any).id, userId, rawWeek) as any[];
                    const weekIsFull = rawDone.length >= requiredPerWeek && rawWeek < 4;

                    const displayWeek = weekIsFull ? rawWeek + 1 : rawWeek;
                    setCurrentWeek(displayWeek);

                    // For the progress dots, show the advanced week's completions (empty if just advanced)
                    const displayDone = weekIsFull ? [] : rawDone;
                    setWorkoutsThisWeek(displayDone as any[]);
                    const doneIds = (displayDone as any[]).map((w: any) => w.exercise_id);

                    // Rotation-aware "next up" lift for display on dashboard
                    const allMain = db.getExercises("main") as any[];
                    const activeMain = allMain.filter((e: any) => !skipped.includes(e.id));
                    let nextExercise: any = null;

                    if (doneIds.length > 0) {
                        // Mid-week: first active not done this week
                        nextExercise = activeMain.find((e: any) => !doneIds.includes(e.id)) ?? null;
                    } else {
                        // Fresh week: continue rotation from last completed
                        const lastId = db.getLastCompletedExerciseId((cycle as any).id, userId);
                        if (lastId !== null) {
                            const lastIdx = activeMain.findIndex((e: any) => e.id === lastId);
                            if (lastIdx !== -1) {
                                nextExercise = activeMain[(lastIdx + 1) % activeMain.length];
                            }
                        }
                        if (!nextExercise) nextExercise = activeMain[0] ?? null;
                    }

                    setNextLiftName(nextExercise ? (swaps[nextExercise.id] ?? nextExercise.name) : null);
                }

                // Calculate next workout date from most recent completion
                const database = openDatabase();
                const lastWorkout = database.getFirstSync(
                    `SELECT completed_at FROM workouts WHERE user_id = ? AND completed = 1 ORDER BY completed_at DESC LIMIT 1`,
                    [userId],
                ) as any;
                if (lastWorkout?.completed_at) {
                    const lastDate = new Date(lastWorkout.completed_at);
                    const today = new Date();
                    lastDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSince === 0) {
                        // Worked out today — next is in 2 days (1 rest day)
                        const nextDate = new Date(today);
                        nextDate.setDate(nextDate.getDate() + 2);
                        setNextWorkoutDate(
                            nextDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
                        );
                    } else if (daysSince === 1) {
                        // Worked out yesterday — next is today (rest day taken)
                        setNextWorkoutDate("Today");
                    } else {
                        // Been 2+ days — overdue, next is today
                        setNextWorkoutDate("Today");
                    }
                } else {
                    setNextWorkoutDate("Today");
                }

                const prs = db.getRecentPRs(userId, 3);
                setRecentPRs(prs as any[]);

                const count = db.getTotalWorkoutCount(userId);
                setTotalWorkouts(count);

                // Stall status for each active main exercise
                const allMain = db.getExercises("main") as any[];
                const stallMap: Record<number, { isStalled: boolean; isWarning: boolean }> = {};
                allMain.forEach((e: any) => {
                    stallMap[e.id] = db.getStallStatus(userId, e.id);
                });
                setStallStatus(stallMap);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    // Workouts per week = min(training_days, active_lifts)
    // e.g. 3-day split with 1 skipped → min(3, 3) = 3  ✓
    //      3-day split with 0 skipped → min(3, 4) = 3  ✓
    //      4-day split with 1 skipped → min(4, 3) = 3  ✓
    const getTrainingDaysForWeek = () => {
        const activeLifts = Math.max(1, 4 - skippedExerciseIds.length);
        return Math.min(activeCycle?.training_days || 4, activeLifts);
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Welcome back, {user?.name || "Lifter"}!
                    </Text>

                    {/* Current Cycle Card */}
                    {activeCycle && (
                        <Card style={styles.card}>
                            <Card.Content>
                                <View style={styles.cycleHeader}>
                                    <View>
                                        <Text variant="titleMedium">Current Cycle</Text>
                                        <Text variant="bodyLarge" style={styles.cycleNumber}>
                                            Cycle #{activeCycle.cycle_number}
                                        </Text>
                                    </View>
                                    <Chip mode="flat" style={styles.weekChip}>
                                        {WEEK_LABELS[currentWeek] || `Week ${currentWeek}`}
                                    </Chip>
                                </View>

                                <Divider style={styles.smallDivider} />

                                {/* Week Progress */}
                                <View style={styles.progressSection}>
                                    <Text variant="bodySmall" style={styles.progressLabel}>
                                        This week: {workoutsThisWeek.length}/{getTrainingDaysForWeek()} workouts done
                                    </Text>
                                    <View style={styles.progressDots}>
                                        {Array.from({ length: getTrainingDaysForWeek() }).map((_, i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.dot,
                                                    i < workoutsThisWeek.length
                                                        ? styles.dotCompleted
                                                        : styles.dotPending,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    {workoutsThisWeek.length > 0 && (
                                        <Text variant="bodySmall" style={styles.completedExercises}>
                                            Done: {workoutsThisWeek.map((w: any) => w.exercise_name).join(", ")}
                                        </Text>
                                    )}
                                </View>

                                <Text variant="bodySmall" style={styles.startDate}>
                                    Started: {new Date(activeCycle.start_date).toLocaleDateString()} •{" "}
                                    {activeCycle.training_days}-day split
                                </Text>

                                {nextWorkoutDate ? (
                                    <View style={styles.nextWorkoutRow}>
                                        <Text variant="bodySmall" style={styles.nextWorkoutLabel}>
                                            📅 Next workout:
                                        </Text>
                                        <Text variant="bodySmall" style={styles.nextWorkoutDate}>
                                            {nextWorkoutDate}
                                        </Text>
                                    </View>
                                ) : null}

                                {nextLiftName && (
                                    <View style={styles.nextLiftRow}>
                                        <Text style={styles.nextLiftLabel}>🏋️ Today's lift:</Text>
                                        <Text style={styles.nextLiftName}>{nextLiftName}</Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    )}

                    {/* Total Workouts Stat */}
                    {totalWorkouts > 0 && (
                        <View style={styles.statsRow}>
                            <Card style={styles.statCard}>
                                <Card.Content style={styles.statContent}>
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {totalWorkouts}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Total Workouts
                                    </Text>
                                </Card.Content>
                            </Card>
                            <Card style={styles.statCard}>
                                <Card.Content style={styles.statContent}>
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        #{activeCycle?.cycle_number || 1}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Current Cycle
                                    </Text>
                                </Card.Content>
                            </Card>
                        </View>
                    )}

                    {/* Recent PRs */}
                    {recentPRs.length > 0 && (
                        <>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                🏅 Recent PRs
                            </Text>
                            {recentPRs.map((pr: any, index: number) => (
                                <Card key={index} style={[styles.card, styles.prCard]}>
                                    <Card.Content>
                                        <View style={styles.prRow}>
                                            <View>
                                                <Text variant="titleMedium">{pr.exercise_name}</Text>
                                                <Text variant="bodySmall" style={styles.prDate}>
                                                    {new Date(pr.achieved_date).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <View style={styles.prStats}>
                                                <Text variant="bodySmall" style={styles.prDetail}>
                                                    {pr.weight} lbs × {pr.reps} reps
                                                </Text>
                                                <Text variant="titleMedium" style={styles.prEstimated}>
                                                    {Math.round(pr.estimated_1rm)} lbs e1RM
                                                </Text>
                                            </View>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </>
                    )}

                    {/* Training Maxes — active lifts only */}
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        Your Training Maxes
                    </Text>

                    {trainingMaxes
                        .filter((tm) => !skippedExerciseIds.includes(tm.exercise_id))
                        .map((tm) => {
                            const substitute = swapMap[tm.exercise_id];
                            const stall = stallStatus[tm.exercise_id];
                            const isStalled = stall?.isStalled ?? false;
                            const isWarning = stall?.isWarning ?? false;

                            const cardBorderStyle = isStalled
                                ? styles.stalledCard
                                : isWarning
                                  ? styles.warningCard
                                  : substitute
                                    ? styles.swappedTmCard
                                    : null;

                            return (
                                <Card key={tm.exercise_id} style={[styles.card, cardBorderStyle]}>
                                    <Card.Content>
                                        <View style={styles.tmHeader}>
                                            <Text variant="titleMedium">
                                                {substitute ? substitute : tm.exercise_name}
                                            </Text>
                                            <View style={styles.badgeRow}>
                                                {isStalled && <Text style={styles.stalledBadge}>⚠️ STALLED</Text>}
                                                {!isStalled && isWarning && (
                                                    <Text style={styles.warningBadge}>📉 WATCH</Text>
                                                )}
                                                {substitute && !isStalled && !isWarning && (
                                                    <Text style={styles.swappedTmBadge}>SWAPPED</Text>
                                                )}
                                            </View>
                                        </View>
                                        {substitute && (
                                            <Text variant="bodySmall" style={styles.swappedTmNote}>
                                                ↔ {tm.exercise_name} slot • same TM + progression
                                            </Text>
                                        )}
                                        {isStalled && (
                                            <Text variant="bodySmall" style={styles.stalledNote}>
                                                Missed prescribed reps 2× in a row. Consider a TM reset.
                                            </Text>
                                        )}
                                        {!isStalled && isWarning && (
                                            <Text variant="bodySmall" style={styles.warningNote}>
                                                Missed prescribed reps last session. One more miss = stall.
                                            </Text>
                                        )}
                                        <View style={styles.maxRow}>
                                            <View>
                                                <Text variant="bodySmall">Actual 1RM</Text>
                                                <Text variant="headlineSmall">{tm.actual_1rm} lbs</Text>
                                            </View>
                                            <View>
                                                <Text variant="bodySmall">Training Max</Text>
                                                <Text variant="headlineSmall">{tm.training_max} lbs</Text>
                                            </View>
                                        </View>
                                    </Card.Content>
                                </Card>
                            );
                        })}

                    {/* Skipped lifts — shown collapsed with frozen TM */}
                    {skippedExerciseIds.length > 0 && (
                        <>
                            <Text variant="bodySmall" style={styles.skippedHeader}>
                                SKIPPED THIS CYCLE (TM frozen)
                            </Text>
                            {trainingMaxes
                                .filter((tm) => skippedExerciseIds.includes(tm.exercise_id))
                                .map((tm) => (
                                    <Card key={`skipped-${tm.exercise_id}`} style={[styles.card, styles.skippedCard]}>
                                        <Card.Content>
                                            <View style={styles.skippedRow}>
                                                <Text variant="titleSmall" style={styles.skippedText}>
                                                    {tm.exercise_name}
                                                </Text>
                                                <Text variant="bodySmall" style={styles.skippedText}>
                                                    TM: {tm.training_max} lbs
                                                </Text>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                ))}
                        </>
                    )}

                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate("WorkoutSelection")}
                        style={styles.button}
                    >
                        Start Today's Workout
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: "center",
    },
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        marginBottom: 15,
    },
    cycleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    cycleNumber: {
        fontWeight: "bold",
        marginTop: 2,
    },
    weekChip: {},
    smallDivider: {
        marginVertical: 10,
    },
    progressSection: {
        marginBottom: 10,
    },
    progressLabel: {
        color: "#666",
        marginBottom: 6,
    },
    progressDots: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 6,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    dotCompleted: {
        backgroundColor: "#6200ea",
    },
    dotPending: {
        backgroundColor: "#ddd",
    },
    completedExercises: {
        color: "#4CAF50",
        fontStyle: "italic",
    },
    startDate: {
        color: "#999",
        marginTop: 4,
    },
    nextWorkoutRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 6,
    },
    nextWorkoutLabel: {
        color: "#666",
    },
    nextWorkoutDate: {
        color: "#6200ea",
        fontWeight: "bold",
    },
    nextLiftRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        backgroundColor: "#f3eeff",
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    nextLiftLabel: {
        color: "#666",
        fontSize: 13,
    },
    nextLiftName: {
        color: "#6200ea",
        fontWeight: "bold",
        fontSize: 15,
        flex: 1,
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 5,
    },
    statCard: {
        flex: 1,
    },
    statContent: {
        alignItems: "center",
    },
    statNumber: {
        fontWeight: "bold",
        color: "#6200ea",
    },
    statLabel: {
        color: "#666",
        textAlign: "center",
    },
    prCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFD700",
    },
    prRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    prDate: {
        color: "#999",
        marginTop: 2,
    },
    prStats: {
        alignItems: "flex-end",
    },
    prDetail: {
        color: "#666",
    },
    prEstimated: {
        color: "#6200ea",
        fontWeight: "bold",
    },
    maxRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 15,
    },
    button: {
        marginTop: 30,
        marginBottom: 40,
    },
    skippedHeader: {
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 1,
        marginTop: 4,
        marginBottom: 8,
    },
    skippedCard: {
        opacity: 0.5,
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 8,
    },
    skippedRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    skippedText: {
        color: "#999",
    },
    // Swap TM card styles
    swappedTmCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FF9800",
    },
    tmHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    swappedTmBadge: {
        backgroundColor: "#FF9800",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "bold",
    },
    swappedTmNote: {
        color: "#FF9800",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 4,
    },
    // Stall / warning styles
    stalledCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#D32F2F",
    },
    warningCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFC107",
    },
    badgeRow: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
    },
    stalledBadge: {
        backgroundColor: "#D32F2F",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "bold",
    },
    warningBadge: {
        backgroundColor: "#FFC107",
        color: "#333",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "bold",
    },
    stalledNote: {
        color: "#D32F2F",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 4,
    },
    warningNote: {
        color: "#E65100",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 4,
    },
});
