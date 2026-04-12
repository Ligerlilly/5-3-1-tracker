import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";

interface SkippedExerciseCardProps {
    exercise: any;
    onPress: () => void;
}

export default function SkippedExerciseCard({ exercise, onPress }: SkippedExerciseCardProps) {
    return (
        <Card style={[styles.card, styles.skippedCard]} onPress={onPress}>
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
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 10 },
    skippedCard: {
        opacity: 0.5,
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#ccc",
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    exerciseInfo: { flex: 1 },
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
