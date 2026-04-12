import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";

interface StatsRowProps {
    totalWorkouts: number;
    cycleNumber: number;
}

export default function StatsRow({ totalWorkouts, cycleNumber }: StatsRowProps) {
    if (totalWorkouts <= 0) return null;

    return (
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
                        #{cycleNumber}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                        Current Cycle
                    </Text>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
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
});
