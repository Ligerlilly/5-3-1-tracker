import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import TrainingMaxCard from "./TrainingMaxCard";

interface TrainingMaxListProps {
    trainingMaxes: any[];
    skippedExerciseIds: number[];
    swapMap: Record<number, string>;
    stallStatus: Record<number, { isStalled: boolean; isWarning: boolean }>;
}

export default function TrainingMaxList({
    trainingMaxes,
    skippedExerciseIds,
    swapMap,
    stallStatus,
}: TrainingMaxListProps) {
    const activeMaxes = trainingMaxes.filter((tm) => !skippedExerciseIds.includes(tm.exercise_id));
    const skippedMaxes = trainingMaxes.filter((tm) => skippedExerciseIds.includes(tm.exercise_id));

    return (
        <>
            {activeMaxes.map((tm) => {
                const stall = stallStatus[tm.exercise_id];
                return (
                    <TrainingMaxCard
                        key={tm.exercise_id}
                        tm={tm}
                        substituteName={swapMap[tm.exercise_id] ?? null}
                        isStalled={stall?.isStalled ?? false}
                        isWarning={stall?.isWarning ?? false}
                    />
                );
            })}

            {skippedMaxes.length > 0 && (
                <>
                    <Text variant="bodySmall" style={styles.skippedHeader}>
                        SKIPPED THIS CYCLE (TM frozen)
                    </Text>
                    {skippedMaxes.map((tm) => (
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
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 15,
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
});
