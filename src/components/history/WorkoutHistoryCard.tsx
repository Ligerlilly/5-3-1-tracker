import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Chip, Divider } from "react-native-paper";
import { formatDate, getWeekLabel } from "../../utils/format";

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

interface WorkoutHistoryCardProps {
    workout: WorkoutHistoryItem;
    onPress: () => void;
}

export default function WorkoutHistoryCard({ workout, onPress }: WorkoutHistoryCardProps) {
    return (
        <Card style={[styles.card, !!workout.is_pr && styles.prCard]} onPress={onPress}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={styles.info}>
                        <Text variant="titleLarge">{workout.exercise_name}</Text>
                        <Text variant="bodyMedium" style={styles.weekText}>
                            {getWeekLabel(workout.week_number)}
                        </Text>
                    </View>
                    {!!workout.is_pr && (
                        <Chip mode="flat" style={styles.prChip} textStyle={styles.prChipText}>
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
                    {workout.amrap_reps != null && (
                        <View style={styles.stat}>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                AMRAP Reps
                            </Text>
                            <Text variant="titleMedium" style={styles.amrapText}>
                                {workout.amrap_reps} reps
                            </Text>
                        </View>
                    )}
                    {workout.estimated_1rm != null && (
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
    );
}

// Re-export for use in HistoryScreen date grouping
export { formatDate };

const styles = StyleSheet.create({
    card: {
        marginBottom: 15,
    },
    prCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFD700",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    info: {
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
});
