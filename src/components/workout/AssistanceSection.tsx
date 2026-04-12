import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Card, Divider } from "react-native-paper";

const ASSISTANCE_BY_CATEGORY: Record<string, { label: string; exercises: { name: string; prescription: string }[] }[]> =
    {
        press: [
            {
                label: "Push (shoulders/chest/triceps)",
                exercises: [
                    { name: "Dips", prescription: "5 sets × 15 reps" },
                    { name: "DB Bench Press", prescription: "5 sets × 15 reps" },
                    { name: "DB Military Press", prescription: "5 sets × 12 reps" },
                    { name: "Pushups", prescription: "100 total reps" },
                ],
            },
            {
                label: "Pull (lats/upper back)",
                exercises: [
                    { name: "Chin-ups", prescription: "5 sets × 10 reps" },
                    { name: "DB Rows (Kroc Rows)", prescription: "3 sets × 20–40 reps" },
                    { name: "Barbell Rows", prescription: "5 sets × 10 reps" },
                    { name: "Face Pulls", prescription: "5 sets × 15 reps" },
                ],
            },
            {
                label: "Triceps",
                exercises: [
                    { name: "Triceps Pushdowns", prescription: "5 sets × 15 reps" },
                    { name: "Triceps Extensions", prescription: "5 sets × 12 reps" },
                ],
            },
        ],
        bench: [
            {
                label: "Push (chest/shoulders)",
                exercises: [
                    { name: "DB Bench Press", prescription: "5 sets × 15 reps" },
                    { name: "DB Incline Press", prescription: "5 sets × 12 reps" },
                    { name: "Incline Barbell Press", prescription: "5 sets × 10 reps" },
                    { name: "Dips", prescription: "5 sets × 15 reps" },
                ],
            },
            {
                label: "Pull (lats/upper back)",
                exercises: [
                    { name: "DB Rows (Kroc Rows)", prescription: "3 sets × 20–40 reps" },
                    { name: "Barbell Rows", prescription: "5 sets × 10 reps" },
                    { name: "Chin-ups", prescription: "5 sets × 10 reps" },
                    { name: "Face Pulls", prescription: "5 sets × 15 reps" },
                ],
            },
            {
                label: "Triceps",
                exercises: [
                    { name: "Triceps Pushdowns", prescription: "5 sets × 15 reps" },
                    { name: "Triceps Extensions", prescription: "5 sets × 12 reps" },
                ],
            },
        ],
        deadlift: [
            {
                label: "Hamstrings / Lower back",
                exercises: [
                    { name: "Good Mornings", prescription: "5 sets × 12 reps" },
                    { name: "Glute-Ham Raise", prescription: "5 sets × 10 reps" },
                    { name: "Back Raise", prescription: "5 sets × 15 reps" },
                    { name: "Straight Leg Deadlift", prescription: "5 sets × 10 reps" },
                ],
            },
            {
                label: "Quads",
                exercises: [
                    { name: "Front Squat", prescription: "5 sets × 10 reps" },
                    { name: "Leg Press", prescription: "5 sets × 20 reps" },
                    { name: "Lunges", prescription: "3 sets × 10 reps/leg" },
                    { name: "Step-ups", prescription: "3 sets × 10 reps/leg" },
                ],
            },
            {
                label: "Abs / Core",
                exercises: [
                    { name: "Hanging Leg Raises", prescription: "5 sets × 15 reps" },
                    { name: "Ab Wheel", prescription: "3 sets × 25 reps" },
                    { name: "Weighted Sit-ups", prescription: "3 sets × 10 reps" },
                    { name: "DB Side Bends", prescription: "3 sets × 20 reps/side" },
                ],
            },
        ],
        squat: [
            {
                label: "Hamstrings",
                exercises: [
                    { name: "Leg Curls", prescription: "5 sets × 10 reps" },
                    { name: "Glute-Ham Raise", prescription: "5 sets × 10 reps" },
                    { name: "Straight Leg Deadlift", prescription: "5 sets × 10 reps" },
                    { name: "Good Mornings", prescription: "5 sets × 12 reps" },
                ],
            },
            {
                label: "Quads",
                exercises: [
                    { name: "Leg Press", prescription: "5 sets × 20 reps" },
                    { name: "Lunges", prescription: "3 sets × 10 reps/leg" },
                    { name: "Step-ups", prescription: "3 sets × 10 reps/leg" },
                ],
            },
            {
                label: "Abs / Core",
                exercises: [
                    { name: "Hanging Leg Raises", prescription: "5 sets × 15 reps" },
                    { name: "Ab Wheel", prescription: "3 sets × 25 reps" },
                    { name: "Weighted Sit-ups", prescription: "3 sets × 10 reps" },
                ],
            },
        ],
    };

interface AssistanceSectionProps {
    category: string;
}

export default function AssistanceSection({ category }: AssistanceSectionProps) {
    const [expanded, setExpanded] = useState(true);
    const groups = ASSISTANCE_BY_CATEGORY[category];

    if (!groups) return null;

    return (
        <View style={styles.section}>
            <Divider style={styles.divider} />
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.header}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    💪 Assistance Work
                </Text>
                <Text style={styles.expandIcon}>{expanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            <Text variant="bodySmall" style={styles.note}>
                Pick 2 exercises
            </Text>

            {expanded &&
                groups.map((group, gIdx) => (
                    <Card key={gIdx} style={styles.groupCard}>
                        <Card.Content>
                            <Text variant="titleSmall" style={styles.groupLabel}>
                                {group.label}
                            </Text>
                            {group.exercises.map((ex, eIdx) => (
                                <View key={eIdx} style={styles.exerciseRow}>
                                    <Text variant="bodyMedium" style={styles.exerciseName}>
                                        • {ex.name}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.prescription}>
                                        {ex.prescription}
                                    </Text>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    divider: {
        marginVertical: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    sectionTitle: {
        fontWeight: "bold",
    },
    expandIcon: {
        fontSize: 14,
        color: "#6200ea",
    },
    note: {
        color: "#888",
        fontStyle: "italic",
        marginBottom: 12,
    },
    groupCard: {
        marginBottom: 10,
    },
    groupLabel: {
        color: "#6200ea",
        fontWeight: "bold",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    exerciseRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    exerciseName: {
        flex: 1,
    },
    prescription: {
        color: "#666",
        marginLeft: 8,
    },
});
