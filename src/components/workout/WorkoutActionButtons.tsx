import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

interface WorkoutActionButtonsProps {
    onComplete: () => void;
    onCancel: () => void;
    saving: boolean;
}

export default function WorkoutActionButtons({ onComplete, onCancel, saving }: WorkoutActionButtonsProps) {
    return (
        <View style={styles.container}>
            <Button
                mode="contained"
                onPress={onComplete}
                loading={saving}
                disabled={saving}
                style={styles.completeButton}
            >
                Complete Workout
            </Button>
            <Button mode="outlined" onPress={onCancel} disabled={saving} style={styles.cancelButton}>
                Cancel
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 40,
    },
    completeButton: {
        marginBottom: 10,
    },
    cancelButton: {
        marginBottom: 10,
    },
});
