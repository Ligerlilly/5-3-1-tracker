import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Chip, Divider } from "react-native-paper";
import { getWeekLabel } from "../../utils/format";

interface CycleCardProps {
    cycleNumber: number;
    currentWeek: number;
    workoutsThisWeek: any[];
    trainingDaysForWeek: number;
    startDate: string;
    trainingDays: number;
    nextWorkoutDate: string;
    nextLiftName: string | null;
}

export default function CycleCard({
    cycleNumber,
    currentWeek,
    workoutsThisWeek,
    trainingDaysForWeek,
    startDate,
    trainingDays,
    nextWorkoutDate,
    nextLiftName,
}: CycleCardProps) {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.cycleHeader}>
                    <View>
                        <Text variant="titleMedium">Current Cycle</Text>
                        <Text variant="bodyLarge" style={styles.cycleNumber}>
                            Cycle #{cycleNumber}
                        </Text>
                    </View>
                    <Chip mode="flat">{getWeekLabel(currentWeek)}</Chip>
                </View>

                <Divider style={styles.smallDivider} />

                <View style={styles.progressSection}>
                    <Text variant="bodySmall" style={styles.progressLabel}>
                        This week: {workoutsThisWeek.length}/{trainingDaysForWeek} workouts done
                    </Text>
                    <View style={styles.progressDots}>
                        {Array.from({ length: trainingDaysForWeek }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i < workoutsThisWeek.length ? styles.dotCompleted : styles.dotPending,
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
                    Started: {new Date(startDate).toLocaleDateString()} • {trainingDays}-day split
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
    );
}

const styles = StyleSheet.create({
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
});
