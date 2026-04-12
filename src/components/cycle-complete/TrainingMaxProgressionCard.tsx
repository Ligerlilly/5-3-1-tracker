import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Divider } from "react-native-paper";

interface TrainingMaxChange {
    exercise_name: string;
    exercise_id: number;
    category: string;
    old_training_max: number;
    new_training_max: number;
    increment: number;
    skipped: boolean;
    substitute_name: string | null;
}

interface TrainingMaxProgressionCardProps {
    activeChanges: TrainingMaxChange[];
    skippedChanges: TrainingMaxChange[];
}

export default function TrainingMaxProgressionCard({ activeChanges, skippedChanges }: TrainingMaxProgressionCardProps) {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    Training Max Progression
                </Text>
                <Text variant="bodySmall" style={styles.note}>
                    Your training maxes will be updated automatically:
                </Text>

                <Divider style={styles.divider} />

                {activeChanges.map((change, index) => {
                    const isLower = change.category === "squat" || change.category === "deadlift";
                    const displayName = change.substitute_name ?? change.exercise_name;
                    return (
                        <View key={index} style={styles.maxRow}>
                            <View style={styles.exerciseInfo}>
                                <Text variant="titleMedium">{displayName}</Text>
                                {change.substitute_name ? (
                                    <Text variant="bodySmall" style={styles.swapNote}>
                                        ↔ {change.exercise_name} slot • {isLower ? "+10 lbs" : "+5 lbs"}
                                    </Text>
                                ) : (
                                    <Text variant="bodySmall" style={styles.categoryText}>
                                        {isLower ? "Lower body +10 lbs" : "Upper body +5 lbs"}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.maxValues}>
                                <Text variant="bodySmall" style={styles.oldMax}>
                                    {change.old_training_max} lbs
                                </Text>
                                <Text style={styles.arrow}>→</Text>
                                <Text variant="titleMedium" style={styles.newMax}>
                                    {change.new_training_max} lbs
                                </Text>
                            </View>
                        </View>
                    );
                })}

                {skippedChanges.length > 0 && (
                    <>
                        <Divider style={styles.divider} />
                        <Text variant="bodySmall" style={styles.skippedSectionLabel}>
                            SKIPPED THIS CYCLE — NO CHANGE
                        </Text>
                        {skippedChanges.map((change, index) => (
                            <View key={`skipped-${index}`} style={[styles.maxRow, styles.skippedRow]}>
                                <View style={styles.exerciseInfo}>
                                    <Text variant="titleMedium" style={styles.skippedText}>
                                        {change.exercise_name}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.skippedText}>
                                        TM frozen — 0 lbs added
                                    </Text>
                                </View>
                                <Text variant="bodySmall" style={styles.skippedMax}>
                                    {change.old_training_max} lbs
                                </Text>
                            </View>
                        ))}
                    </>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        marginBottom: 20,
    },
    sectionTitle: {
        marginBottom: 8,
        fontWeight: "bold",
    },
    note: {
        color: "#666",
        marginBottom: 15,
    },
    divider: {
        marginBottom: 15,
    },
    maxRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    exerciseInfo: {
        flex: 1,
    },
    categoryText: {
        color: "#4CAF50",
        marginTop: 2,
    },
    swapNote: {
        color: "#FF9800",
        fontStyle: "italic",
        marginTop: 2,
    },
    maxValues: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    oldMax: {
        color: "#999",
        textDecorationLine: "line-through",
    },
    arrow: {
        color: "#6200ea",
        fontWeight: "bold",
    },
    newMax: {
        color: "#6200ea",
        fontWeight: "bold",
    },
    skippedSectionLabel: {
        color: "#999",
        fontWeight: "bold",
        letterSpacing: 1,
        marginBottom: 12,
    },
    skippedRow: {
        opacity: 0.6,
    },
    skippedText: {
        color: "#999",
    },
    skippedMax: {
        color: "#999",
    },
});
