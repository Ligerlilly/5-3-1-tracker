import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { db, openDatabase } from "../database/db";
import { HistoryStackParamList } from "../navigation/HistoryNavigator";
import { formatDate } from "../utils/format";
import LoadingScreen from "../components/common/LoadingScreen";
import WorkoutHistoryCard from "../components/history/WorkoutHistoryCard";
import EmptyHistory from "../components/history/EmptyHistory";

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

type HistoryNavProp = NativeStackNavigationProp<HistoryStackParamList, "HistoryList">;

export default function HistoryScreen() {
    const isFocused = useIsFocused();
    const theme = useTheme();
    const navigation = useNavigation<HistoryNavProp>();
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

            const enrichedHistory = history.map((workout) => {
                if (workout.amrap_reps) {
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

    if (loading) {
        return <LoadingScreen message="Loading workout history..." />;
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Workout History
                    </Text>

                    {workouts.length === 0 ? (
                        <EmptyHistory />
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
                                    <WorkoutHistoryCard
                                        workout={workout}
                                        onPress={() =>
                                            navigation.navigate("WorkoutDetail", {
                                                workoutId: workout.id,
                                                exerciseName: workout.exercise_name,
                                                weekNumber: workout.week_number,
                                                completedAt: workout.completed_at,
                                                trainingMax: workout.training_max_used,
                                                isPr: !!workout.is_pr,
                                            })
                                        }
                                    />
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
});
