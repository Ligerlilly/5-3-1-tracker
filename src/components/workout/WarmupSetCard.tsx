import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Chip } from "react-native-paper";

interface WarmupSetCardProps {
    setNumber: number;
    weight: number;
    prescribedReps: number;
}

export default function WarmupSetCard({ setNumber, weight, prescribedReps }: WarmupSetCardProps) {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.row}>
                    <View style={styles.info}>
                        <Text variant="titleMedium">{weight} lbs</Text>
                        <Text variant="bodySmall">{prescribedReps} reps (warmup)</Text>
                    </View>
                    <Chip mode="outlined" compact>
                        Set {setNumber}
                    </Chip>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    info: {
        flex: 1,
    },
});
