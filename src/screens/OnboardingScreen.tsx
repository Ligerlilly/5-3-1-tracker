import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { db, initDatabase } from "../database/db";
import { calculateTrainingMax } from "../utils/calculations";
import { MAIN_EXERCISES } from "../types";

interface OnboardingScreenProps {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [name, setName] = useState("");
    const [oneRepMaxes, setOneRepMaxes] = useState({
        "Military Press": "",
        Deadlift: "",
        "Bench Press": "",
        Squat: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validate inputs
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        MAIN_EXERCISES.forEach((exercise) => {
            const value = oneRepMaxes[exercise.name as keyof typeof oneRepMaxes];
            if (!value || parseFloat(value) <= 0) {
                newErrors[exercise.name] = `Valid ${exercise.name} 1RM is required`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // Initialize database
            await initDatabase();

            // Create user
            const userId = db.createUser(name.trim(), "lbs", 5);

            // Get exercise IDs and save training maxes
            const today = new Date().toISOString().split("T")[0];

            for (const exercise of MAIN_EXERCISES) {
                const exerciseRecord = db.getExerciseByName(exercise.name) as any;
                if (exerciseRecord) {
                    const actual1RM = parseFloat(oneRepMaxes[exercise.name as keyof typeof oneRepMaxes]);
                    const trainingMax = calculateTrainingMax(actual1RM);

                    db.saveTrainingMax(userId as number, exerciseRecord.id, actual1RM, trainingMax, today);
                }
            }

            // Create first cycle
            db.createCycle(userId as number, 1, today, 1, 4);

            onComplete();
        } catch (error) {
            console.error("Error during onboarding:", error);
            setErrors({ general: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Welcome to 5-3-1 Tracker
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Let's get started by setting up your profile and training maxes.
                    </Text>

                    {/* Name Input */}
                    <TextInput
                        label="Your Name"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                        error={!!errors.name}
                    />
                    {errors.name && <HelperText type="error">{errors.name}</HelperText>}

                    {/* 1RM Inputs */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Enter Your One Rep Maxes (1RM)
                    </Text>
                    <Text variant="bodySmall" style={styles.helperText}>
                        Be conservative! The program works best when you start lighter than you think.
                    </Text>

                    {MAIN_EXERCISES.map((exercise) => (
                        <View key={exercise.name}>
                            <TextInput
                                label={`${exercise.name} 1RM (lbs)`}
                                value={oneRepMaxes[exercise.name as keyof typeof oneRepMaxes]}
                                onChangeText={(value) =>
                                    setOneRepMaxes((prev) => ({
                                        ...prev,
                                        [exercise.name]: value,
                                    }))
                                }
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                error={!!errors[exercise.name]}
                            />
                            {errors[exercise.name] && <HelperText type="error">{errors[exercise.name]}</HelperText>}
                        </View>
                    ))}

                    {errors.general && (
                        <HelperText type="error" style={styles.generalError}>
                            {errors.general}
                        </HelperText>
                    )}

                    {/* Submit Button */}
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Start Training
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        marginBottom: 30,
        textAlign: "center",
        color: "#666",
    },
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    helperText: {
        marginBottom: 15,
        color: "#666",
    },
    input: {
        marginBottom: 5,
    },
    button: {
        marginTop: 30,
        marginBottom: 40,
    },
    generalError: {
        marginTop: 10,
    },
});
