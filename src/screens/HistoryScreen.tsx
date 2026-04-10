import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Chip, Divider } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";
import { db, openDatabase } from "../database/db";

interface WorkoutHistoryItem {
    id: number;
    exercise_name: string;
    week_number: number;
    workout_date: string;
    training_max_used: number;
    completed_at: string;
    total_sets: number;
    amrap_reps: number | null;
    estimated_1rm: number | null;
    is_pr: boolean;
}

export default function HistoryScreen() {
    const isFocused = useIsFocused();
    const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadWorkoutHistory();
        }
    }, [isFocused]);

    const loadWorkoutHistory = () => {
        try {
            const user = db.getCurrentUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const database = openDatabase();

            // Get all completed workouts with their details
            const history = database.getAllSync(
                `SELECT 
                    w.id,
                    w.week_number,
                    w.workout_date,
                    w.training_max_used,
                    w.completed_at,
                    e.name as exercise_name,
                    e.category,
                    COUNT(s.id) as total_sets,
                    MAX(CASE WHEN s.is_amrap = 1 THEN s.actual_reps END) as amrap_reps,
                    MAX(CASE WHEN s.is_pr = 1 THEN 1 ELSE 0 END) as is_pr
                FROM workouts w
                JOIN exercises e ON w.exercise_id = e.id
                LEFT JOIN sets s ON w.id = s.workout_id
                WHERE w.user_id = ? AND w.completed = 1
                GROUP BY w.id
                ORDER BY w.completed_at DESC
                LIMIT 50`,
                [(user as any).id],
            ) as WorkoutHistoryItem[];

            // Calculate estimated 1RM for AMRAP sets
            const enrichedHistory = history.map((workout) => {
                if (workout.amrap_reps) {
                    // Get the AMRAP set weight
                    const amrapSet = database.getFirstSync(
                        `SELECT actual_weight, actual_reps FROM sets 
                         WHERE workout_id = ? AND is_amrap = 1 LIMIT 1`,
                        [workout.id],
                    ) as any;

                    if (amrapSet && amrapSet.actual_reps) {
                        const estimated1RM =
                            amrapSet.actual_weight * amrapSet.actual_reps * 0.0333 + amrapSet.actual_weight;
                        return { ...workout, estimated_1rm: Math.round(estimated1RM) };
                    }
                }
                return workout;
            });

            setWorkouts(enrichedHistory);
        } catch (error) {
            console.error("Error loading workout history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
    };

    const getWeekLabel = (weekNumber: number) => {
        const labels = {
            1: "Week 1 (3×5)",
            2: "Week 2 (3×3)",
            3: "Week 3 (5/3/1)",
            4: "Week 4 (Deload)",
        };
        return labels[weekNumber as keyof typeof labels] || `Week ${weekNumber}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text>Loading workout history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Workout History
                    </Text>

                    {workouts.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Card.Content>
                                <Text variant="bodyLarge" style={styles.emptyText}>
                                    No workouts completed yet.
                                </Text>
                                <Text variant="bodyMedium" style={styles.emptySubtext}>
                                    Start your first workout to see your progress here!
                                </Text>
                            </Card.Content>
                        </Card>
                    ) : (
                        <>
                            <Text variant="titleMedium" style={styles.statsText}>
                                {workouts.length} workout{workouts.length !== 1 ? "s" : ""} completed
                            </Text>

                            {workouts.map((workout, index) => (
                                <React.Fragment key={workout.id}>
                                    {index === 0 ||
                                    formatDate(workout.completed_at) !==
                                        formatDate(workouts[index - 1].completed_at) ? (
                                        <Text variant="titleSmall" style={styles.dateHeader}>
                                            {formatDate(workout.completed_at)}
                                        </Text>
                                    ) : null}

                                    <Card style={[styles.workoutCard, workout.is_pr && styles.prCard]}>
                                        <Card.Content>
                                            <View style={styles.workoutHeader}>
                                                <View style={styles.workoutInfo}>
                                                    <Text variant="titleLarge">{workout.exercise_name}</Text>
                                                    <Text variant="bodyMedium" style={styles.weekText}>
                                                        {getWeekLabel(workout.week_number)}
                                                    </Text>
                                                </View>
                                                {workout.is_pr && (
                                                    <Chip
                                                        mode="flat"
                                                        style={styles.prChip}
                                                        textStyle={styles.prChipText}
                                                    >
                                                        PR!
                                                    </Chip>
                                                )}
                                            </View>

                                            <Divider style={styles.divider} />

                                            <View style={styles.statsRow}>
                                                <View style={styles.stat}>
                                                    <Text variant="bodySmall" style={styles.statLabel}>
                                                        Training Max
                                                    </Text>
                                                    <Text variant="titleMedium">{workout.training_max_used} lbs</Text>
                                                </View>

                                                {workout.amrap_reps && (
                                                    <View style={styles.stat}>
                                                        <Text variant="bodySmall" style={styles.statLabel}>
                                                            AMRAP Reps
                                                        </Text>
                                                        <Text variant="titleMedium" style={styles.amrapText}>
                                                            {workout.amrap_reps} reps
                                                        </Text>
                                                    </View>
                                                )}

                                                {workout.estimated_1rm && (
                                                    <View style={styles.stat}>
                                                        <Text variant="bodySmall" style={styles.statLabel}>
                                                            Est. 1RM
                                                        </Text>
                                                        <Text variant="titleMedium">{workout.estimated_1rm} lbs</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <Text variant="bodySmall" style={styles.timestamp}>
                                                {workout.total_sets} sets completed
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                </React.Fragment>
                            ))}
                        </>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        marginBottom: 20,
        textAlign: "center",
    },
    statsText: {
        marginBottom: 15,
        color: "#666",
    },
    dateHeader: {
        marginTop: 20,
        marginBottom: 10,
        color: "#666",
        fontWeight: "bold",
    },
    workoutCard: {
        marginBottom: 15,
    },
    prCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFD700",
        backgroundColor: "#FFFEF7",
    },
    workoutHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    workoutInfo: {
        flex: 1,
    },
    weekText: {
        marginTop: 4,
        color: "#666",
    },
    prChip: {
        backgroundColor: "#FFD700",
    },
    prChipText: {
        color: "#000",
        fontWeight: "bold",
    },
    divider: {
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        color: "#666",
        marginBottom: 4,
    },
    amrapText: {
        color: "#6200ee",
        fontWeight: "bold",
    },
    timestamp: {
        marginTop: 8,
        color: "#999",
        fontStyle: "italic",
    },
    emptyCard: {
        marginTop: 40,
    },
    emptyText: {
        textAlign: "center",
        marginBottom: 10,
    },
    emptySubtext: {
        textAlign: "center",
        color: "#666",
    },
});
