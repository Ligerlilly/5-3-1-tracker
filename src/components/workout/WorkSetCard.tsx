import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Chip, TextInput } from "react-native-paper";

interface WorkSetCardProps {
    setNumber: number;
    weight: number;
    prescribedReps: number;
    isAMRAP: boolean;
    actualReps: string;
    onChangeReps: (value: string) => void;
}

export default function WorkSetCard({
    setNumber,
    weight,
    prescribedReps,
    isAMRAP,
    actualReps,
    onChangeReps,
}: WorkSetCardProps) {
    return (
        <Card style={[styles.card, isAMRAP && styles.amrapCard]}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={styles.info}>
                        <Text variant="titleMedium">{weight} lbs</Text>
                        <Text variant="bodySmall">
                            {prescribedReps} reps{isAMRAP ? "+" : ""}
                        </Text>
                    </View>
                    <View style={styles.labels}>
                        {isAMRAP && (
                            <Chip mode="flat" style={styles.amrapChip} textStyle={styles.amrapChipText}>
                                AMRAP
                            </Chip>
                        )}
                        <Chip mode="outlined" compact>
                            Set {setNumber}
                        </Chip>
                    </View>
                </View>
                <TextInput
                    label="Reps Performed"
                    value={actualReps}
                    onChangeText={onChangeReps}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    dense
                />
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 10,
    },
    amrapCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#6200ee",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    info: {
        flex: 1,
    },
    labels: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    amrapChip: {
        backgroundColor: "#6200ee",
    },
    amrapChipText: {
        color: "#fff",
        fontWeight: "bold",
    },
    input: {
        marginTop: 8,
    },
});
