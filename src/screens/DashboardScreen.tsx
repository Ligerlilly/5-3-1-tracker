import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, Chip, Divider } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";

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
    const [user, setUser] = useState<any>(null);
    const [trainingMaxes, setTrainingMaxes] = useState<any[]>([]);
    const [activeCycle, setActiveCycle] = useState<any>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState<any[]>([]);
    const [recentPRs, setRecentPRs] = useState<any[]>([]);
    const [totalWorkouts, setTotalWorkouts] = useState<number>(0);

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
                    const week = db.getCurrentWeekInCycle((cycle as any).id, userId);
                    setCurrentWeek(week);

                    const thisWeekWorkouts = db.getWorkoutsThisWeek((cycle as any).id, userId, week);
                    setWorkoutsThisWeek(thisWeekWorkouts as any[]);
                }

                const prs = db.getRecentPRs(userId, 3);
                setRecentPRs(prs as any[]);

                const count = db.getTotalWorkoutCount(userId);
                setTotalWorkouts(count);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    const getTrainingDaysForWeek = () => {
        return activeCycle?.training_days || 4;
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
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

                    {/* Training Maxes */}
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        Your Training Maxes
                    </Text>

                    {trainingMaxes.map((tm) => (
                        <Card key={tm.exercise_id} style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium">{tm.exercise_name}</Text>
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
                    ))}

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
        backgroundColor: "#f5f5f5",
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
    weekChip: {
        backgroundColor: "#e8e0ff",
    },
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
});
