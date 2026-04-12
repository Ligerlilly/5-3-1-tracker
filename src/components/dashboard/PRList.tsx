import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";

interface PR {
    exercise_name: string;
    achieved_date: string;
    weight: number;
    reps: number;
    estimated_1rm: number;
}

interface PRListProps {
    prs: PR[];
}

export default function PRList({ prs }: PRListProps) {
    if (prs.length === 0) return null;

    return (
        <>
            <Text variant="titleLarge" style={styles.sectionTitle}>
                🏅 Recent PRs
            </Text>
            {prs.map((pr, index) => (
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
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        marginBottom: 15,
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
});
