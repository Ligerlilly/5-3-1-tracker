import React, { useState } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, HelperText, useTheme } from "react-native-paper";
import { db, initDatabase } from "../database/db";
import { calculateTrainingMax } from "../utils/calculations";
import { MAIN_EXERCISES } from "../types";
import TrainingSplitPicker from "../components/onboarding/TrainingSplitPicker";
import OneRMInputList from "../components/onboarding/OneRMInputList";
import { TextInput } from "react-native-paper";

interface OnboardingScreenProps {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const theme = useTheme();
    const [name, setName] = useState("");
    const [trainingSplit, setTrainingSplit] = useState<"3" | "4">("3");
    const [oneRepMaxes, setOneRepMaxes] = useState<Record<string, string>>(
        Object.fromEntries(MAIN_EXERCISES.map((e) => [e.name, ""])),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        MAIN_EXERCISES.forEach((exercise) => {
            const value = oneRepMaxes[exercise.name];
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
            await initDatabase();

            const userId = db.createUser(name.trim(), "lbs", 5);
            const today = new Date().toISOString().split("T")[0];

            for (const exercise of MAIN_EXERCISES) {
                const exerciseRecord = db.getExerciseByName(exercise.name) as any;
                if (exerciseRecord) {
                    const actual1RM = parseFloat(oneRepMaxes[exercise.name]);
                    const trainingMax = calculateTrainingMax(actual1RM);
                    db.saveTrainingMax(userId as number, exerciseRecord.id, actual1RM, trainingMax, today);
                }
            }

            db.createCycle(userId as number, 1, today, 1, parseInt(trainingSplit) as 3 | 4);
            onComplete();
        } catch (error) {
            console.error("Error during onboarding:", error);
            setErrors({ general: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
                <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <Text variant="headlineMedium" style={styles.title}>
                            Welcome to 5-3-1 Tracker
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Let's get started by setting up your profile and training maxes.
                        </Text>

                        <TextInput
                            label="Your Name"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.name}
                        />
                        {errors.name && <HelperText type="error">{errors.name}</HelperText>}

                        <TrainingSplitPicker value={trainingSplit} onChange={setTrainingSplit} />

                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Enter Your One Rep Maxes (1RM)
                        </Text>
                        <Text variant="bodySmall" style={styles.helperText}>
                            Be conservative! The program works best when you start lighter than you think.
                        </Text>

                        <OneRMInputList
                            values={oneRepMaxes}
                            errors={errors}
                            onChange={(exerciseName, value) =>
                                setOneRepMaxes((prev) => ({ ...prev, [exerciseName]: value }))
                            }
                        />

                        {errors.general && (
                            <HelperText type="error" style={styles.generalError}>
                                {errors.general}
                            </HelperText>
                        )}

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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
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
