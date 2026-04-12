import React from "react";
import { StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";

interface WhatHappensNextCardProps {
    nextCycleNumber: number;
    trainingDays: number;
    hasSkippedLifts: boolean;
}

export default function WhatHappensNextCard({
    nextCycleNumber,
    trainingDays,
    hasSkippedLifts,
}: WhatHappensNextCardProps) {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.title}>
                    What happens next?
                </Text>
                <Text variant="bodyMedium" style={styles.item}>
                    • New Cycle #{nextCycleNumber} will begin
                </Text>
                <Text variant="bodyMedium" style={styles.item}>
                    • Training maxes are increased for active lifts
                </Text>
                {hasSkippedLifts && (
                    <Text variant="bodyMedium" style={styles.item}>
                        • Skipped lifts resume in the new cycle (you can re-skip if needed)
                    </Text>
                )}
                <Text variant="bodyMedium" style={styles.item}>
                    • Keep the same training split ({trainingDays}-day)
                </Text>
                <Text variant="bodyMedium" style={styles.item}>
                    • Start fresh with Week 1
                </Text>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        marginBottom: 30,
    },
    title: {
        marginBottom: 12,
        fontWeight: "bold",
    },
    item: {
        marginBottom: 6,
        color: "#444",
    },
});
