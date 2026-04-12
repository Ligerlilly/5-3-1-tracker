import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, useTheme } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";
import TrainingMaxProgressionCard from "../components/cycle-complete/TrainingMaxProgressionCard";
import WhatHappensNextCard from "../components/cycle-complete/WhatHappensNextCard";

type CycleCompleteScreenRouteProp = RouteProp<DashboardStackParamList, "CycleComplete">;
type CycleCompleteScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "CycleComplete">;

interface TrainingMaxChange {
    exercise_name: string;
    exercise_id: number;
    category: string;
    old_training_max: number;
    new_training_max: number;
    increment: number;
    skipped: boolean;
    substitute_name: string | null;
}

export default function CycleCompleteScreen() {
    const route = useRoute<CycleCompleteScreenRouteProp>();
    const navigation = useNavigation<CycleCompleteScreenNavigationProp>();
    const { cycleId, cycleNumber, trainingDays } = route.params;
    const theme = useTheme();

    const [trainingMaxChanges, setTrainingMaxChanges] = useState<TrainingMaxChange[]>([]);
    const [skippedExerciseIds, setSkippedExerciseIds] = useState<number[]>([]);
    const [progressing, setProgressing] = useState(false);

    useEffect(() => {
        loadCurrentTrainingMaxes();
    }, []);

    const loadCurrentTrainingMaxes = () => {
        const user = db.getCurrentUser() as any;
        if (!user) return;

        const skipped = db.getSkippedExerciseIds(cycleId);
        setSkippedExerciseIds(skipped);

        const fullConfig = db.getLiftConfig(cycleId);
        const swapMap: Record<number, string> = {};
        fullConfig.forEach((c) => {
            if (c.substitute_name) swapMap[c.exercise_id] = c.substitute_name;
        });

        const maxes = db.getAllCurrentTrainingMaxes(user.id) as any[];
        const changes = maxes.map((tm) => {
            const wasSkipped = skipped.includes(tm.exercise_id);
            const increment = wasSkipped ? 0 : tm.category === "squat" || tm.category === "deadlift" ? 10 : 5;
            return {
                exercise_name: tm.exercise_name,
                exercise_id: tm.exercise_id,
                category: tm.category,
                old_training_max: tm.training_max,
                new_training_max: tm.training_max + increment,
                increment,
                skipped: wasSkipped,
                substitute_name: swapMap[tm.exercise_id] ?? null,
            };
        });
        setTrainingMaxChanges(changes);
    };

    const handleCompleteCycle = () => {
        setProgressing(true);
        try {
            const user = db.getCurrentUser() as any;
            if (!user) return;
            db.progressToNextCycle(user.id, cycleId, trainingDays as 3 | 4, 1, skippedExerciseIds);
            navigation.navigate("Dashboard");
        } catch (error) {
            console.error("Error progressing cycle:", error);
        } finally {
            setProgressing(false);
        }
    };

    const activeChanges = trainingMaxChanges.filter((c) => !c.skipped);
    const skippedChanges = trainingMaxChanges.filter((c) => c.skipped);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.emoji}>🏆</Text>
                    <Text variant="headlineMedium" style={styles.title}>
                        Cycle #{cycleNumber} Complete!
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Outstanding work! You've completed all 4 weeks of training.
                    </Text>

                    <TrainingMaxProgressionCard activeChanges={activeChanges} skippedChanges={skippedChanges} />

                    <WhatHappensNextCard
                        nextCycleNumber={cycleNumber + 1}
                        trainingDays={trainingDays}
                        hasSkippedLifts={skippedChanges.length > 0}
                    />

                    <Button
                        mode="contained"
                        onPress={handleCompleteCycle}
                        loading={progressing}
                        disabled={progressing}
                        style={styles.continueButton}
                        contentStyle={styles.continueButtonContent}
                    >
                        Start Cycle #{cycleNumber + 1} 🚀
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate("Dashboard")}
                        disabled={progressing}
                        style={styles.laterButton}
                    >
                        I'll do this later
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: "center",
    },
    emoji: {
        fontSize: 64,
        marginBottom: 10,
        marginTop: 20,
    },
    title: {
        textAlign: "center",
        marginBottom: 10,
        fontWeight: "bold",
    },
    subtitle: {
        textAlign: "center",
        color: "#666",
        marginBottom: 30,
    },
    continueButton: {
        width: "100%",
        marginBottom: 12,
        backgroundColor: "#6200ea",
    },
    continueButtonContent: {
        paddingVertical: 6,
    },
    laterButton: {
        width: "100%",
        marginBottom: 40,
    },
});
