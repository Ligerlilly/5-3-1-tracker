import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import StallBadge, { StallNote } from "../common/StallBadge";

interface TM {
    exercise_id: number;
    exercise_name: string;
    actual_1rm: number;
    training_max: number;
}

interface TrainingMaxCardProps {
    tm: TM;
    substituteName: string | null;
    isStalled: boolean;
    isWarning: boolean;
}

export default function TrainingMaxCard({ tm, substituteName, isStalled, isWarning }: TrainingMaxCardProps) {
    const cardBorderStyle = isStalled
        ? styles.stalledCard
        : isWarning
          ? styles.warningCard
          : substituteName
            ? styles.swappedTmCard
            : null;

    return (
        <Card style={[styles.card, cardBorderStyle]}>
            <Card.Content>
                <View style={styles.tmHeader}>
                    <Text variant="titleMedium">{substituteName ? substituteName : tm.exercise_name}</Text>
                    <View style={styles.badgeRow}>
                        <StallBadge isStalled={isStalled} isWarning={isWarning} />
                        {substituteName && !isStalled && !isWarning && (
                            <Text style={styles.swappedTmBadge}>SWAPPED</Text>
                        )}
                    </View>
                </View>
                {substituteName && (
                    <Text variant="bodySmall" style={styles.swappedTmNote}>
                        ↔ {tm.exercise_name} slot • same TM + progression
                    </Text>
                )}
                <StallNote isStalled={isStalled} isWarning={isWarning} />
                <View style={styles.maxRow}>
                    <View>
                        <Text variant="bodySmall">Actual 1RM</Text>
                        <Text variant="headlineSmall">{tm.actual_1rm} lbs</Text>
                    </View>
                    <View>
                        <Text variant="bodySmall">Training Max</Text>
                        <Text variant="headlineSmall">{tm.training_max} lbs</Text>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 15,
    },
    stalledCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#D32F2F",
    },
    warningCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFC107",
    },
    swappedTmCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FF9800",
    },
    tmHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    badgeRow: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
    },
    swappedTmBadge: {
        backgroundColor: "#FF9800",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: "bold",
    },
    swappedTmNote: {
        color: "#FF9800",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 4,
    },
    maxRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 15,
    },
});
