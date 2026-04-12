import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

interface StallBadgeProps {
    isStalled: boolean;
    isWarning: boolean;
}

export default function StallBadge({ isStalled, isWarning }: StallBadgeProps) {
    if (!isStalled && !isWarning) return null;

    return (
        <View>
            {isStalled && <Text style={styles.stalledBadge}>⚠️ STALLED</Text>}
            {!isStalled && isWarning && <Text style={styles.warningBadge}>📉 WATCH</Text>}
        </View>
    );
}

export function StallNote({ isStalled, isWarning }: StallBadgeProps) {
    if (!isStalled && !isWarning) return null;

    return (
        <>
            {isStalled && (
                <Text variant="bodySmall" style={styles.stalledNote}>
                    Missed prescribed reps 2× in a row. Consider a TM reset.
                </Text>
            )}
            {!isStalled && isWarning && (
                <Text variant="bodySmall" style={styles.warningNote}>
                    Missed prescribed reps last session. One more miss = stall.
                </Text>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    stalledBadge: {
        backgroundColor: "#D32F2F",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "bold",
    },
    warningBadge: {
        backgroundColor: "#FFC107",
        color: "#333",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "bold",
    },
    stalledNote: {
        color: "#D32F2F",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 4,
    },
    warningNote: {
        color: "#E65100",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 4,
    },
});
