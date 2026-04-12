import React from "react";
import { StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";

export default function EmptyHistory() {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="bodyLarge" style={styles.text}>
                    No workouts completed yet.
                </Text>
                <Text variant="bodyMedium" style={styles.subtext}>
                    Start your first workout to see your progress here!
                </Text>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 40,
    },
    text: {
        textAlign: "center",
        marginBottom: 10,
    },
    subtext: {
        textAlign: "center",
        color: "#666",
    },
});
