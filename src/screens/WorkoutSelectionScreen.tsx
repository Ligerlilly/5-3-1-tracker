import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, SegmentedButtons } from "react-native-paper";
import { db } from "../database/db";

interface WorkoutSelectionScreenProps {
    onBack: () => void;
    onSelectWorkout: (exerciseId: number, weekNumber: number) => void;
}

export default function WorkoutSelectionScreen({ onBack, onSelectWorkout }: WorkoutSelectionScreenProps) {
    const [exercises, setExercises] = useState<any[]>([]);
    const [weekNumber, setWeekNumber] = useState<"1" | "2" | "3" | "4">("1");

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = () => {
        const mainExercises = db.getExercises("main");
        setExercises(mainExercises as any);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Select Workout
                    </Text>

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Week
                    </Text>
                    <SegmentedButtons
                        value={weekNumber}
                        onValueChange={(value) => setWeekNumber(value as any)}
                        buttons={[
                            { value: "1", label: "Week 1 (3x5)" },
                            { value: "2", label: "Week 2 (3x3)" },
                            { value: "3", label: "Week 3 (5/3/1)" },
                            { value: "4", label: "Week 4 (Deload)" },
                        ]}
                        style={styles.segmented}
                    />

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Exercise
                    </Text>

                    {exercises.map((exercise) => (
                        <Card
                            key={exercise.id}
                            style={styles.card}
                            onPress={() => onSelectWorkout(exercise.id, parseInt(weekNumber))}
                        >
                            <Card.Content>
                                <Text variant="titleLarge">{exercise.name}</Text>
                                <Text variant="bodyMedium" style={styles.category}>
                                    {exercise.category.toUpperCase()}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))}

                    <Button mode="outlined" onPress={onBack} style={styles.backButton}>
                        Back to Dashboard
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: "center",
    },
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    segmented: {
        marginBottom: 10,
    },
    card: {
        marginBottom: 10,
    },
    category: {
        marginTop: 5,
        color: "#666",
    },
    backButton: {
        marginTop: 20,
        marginBottom: 40,
    },
});
