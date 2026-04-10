import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, Divider } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db } from "../database/db";

type CycleCompleteScreenRouteProp = RouteProp<DashboardStackParamList, "CycleComplete">;
type CycleCompleteScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "CycleComplete">;

interface TrainingMaxChange {
    exercise_name: string;
    category: string;
    old_training_max: number;
    new_training_max: number;
    increment: number;
}

export default function CycleCompleteScreen() {
    const route = useRoute<CycleCompleteScreenRouteProp>();
    const navigation = useNavigation<CycleCompleteScreenNavigationProp>();
    const { cycleId, cycleNumber, trainingDays } = route.params;

    const [trainingMaxChanges, setTrainingMaxChanges] = useState<TrainingMaxChange[]>([]);
    const [progressing, setProgressing] = useState(false);

    useEffect(() => {
        loadCurrentTrainingMaxes();
    }, []);

    const loadCurrentTrainingMaxes = () => {
        const user = db.getCurrentUser() as any;
        if (!user) return;

        const maxes = db.getAllCurrentTrainingMaxes(user.id) as any[];
        const changes = maxes.map((tm) => {
            const increment = tm.category === "squat" || tm.category === "deadlift" ? 10 : 5;
            return {
                exercise_name: tm.exercise_name,
                category: tm.category,
                old_training_max: tm.training_max,
                new_training_max: tm.training_max + increment,
                increment,
            };
        });
        setTrainingMaxChanges(changes);
    };

    const handleCompleteCycle = () => {
        setProgressing(true);
        try {
            const user = db.getCurrentUser() as any;
            if (!user) return;

            db.progressToNextCycle(user.id, cycleId, trainingDays as 3 | 4);

            navigation.navigate("Dashboard");
        } catch (error) {
            console.error("Error progressing cycle:", error);
        } finally {
            setProgressing(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.emoji}>🏆</Text>
                    <Text variant="headlineMedium" style={styles.title}>
                        Cycle #{cycleNumber} Complete!
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Outstanding work! You've completed all 4 weeks of training.
                    </Text>

                    <Card style={styles.progressionCard}>
                        <Card.Content>
                            <Text variant="titleLarge" style={styles.sectionTitle}>
                                Training Max Progression
                            </Text>
                            <Text variant="bodySmall" style={styles.progressionNote}>
                                Your training maxes will be updated automatically:
                            </Text>

                            <Divider style={styles.divider} />

                            {trainingMaxChanges.map((change, index) => {
                                const isLower = change.category === "squat" || change.category === "deadlift";
                                return (
                                    <View key={index} style={styles.maxRow}>
                                        <View style={styles.exerciseInfo}>
                                            <Text variant="titleMedium">{change.exercise_name}</Text>
                                            <Text variant="bodySmall" style={styles.categoryText}>
                                                {isLower ? "Lower body +10 lbs" : "Upper body +5 lbs"}
                                            </Text>
                                        </View>
                                        <View style={styles.maxValues}>
                                            <Text variant="bodySmall" style={styles.oldMax}>
                                                {change.old_training_max} lbs
                                            </Text>
                                            <Text style={styles.arrow}>→</Text>
                                            <Text variant="titleMedium" style={styles.newMax}>
                                                {change.new_training_max} lbs
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </Card.Content>
                    </Card>

                    <Card style={styles.infoCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.infoTitle}>
                                What happens next?
                            </Text>
                            <Text variant="bodyMedium" style={styles.infoText}>
                                • New Cycle #{cycleNumber + 1} will begin
                            </Text>
                            <Text variant="bodyMedium" style={styles.infoText}>
                                • Training maxes are increased automatically
                            </Text>
                            <Text variant="bodyMedium" style={styles.infoText}>
                                • Keep the same training split ({trainingDays}-day)
                            </Text>
                            <Text variant="bodyMedium" style={styles.infoText}>
                                • Start fresh with Week 1
                            </Text>
                        </Card.Content>
                    </Card>

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
        backgroundColor: "#f5f5f5",
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
    progressionCard: {
        width: "100%",
        marginBottom: 20,
    },
    sectionTitle: {
        marginBottom: 8,
        fontWeight: "bold",
    },
    progressionNote: {
        color: "#666",
        marginBottom: 15,
    },
    divider: {
        marginBottom: 15,
    },
    maxRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    exerciseInfo: {
        flex: 1,
    },
    categoryText: {
        color: "#4CAF50",
        marginTop: 2,
    },
    maxValues: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    oldMax: {
        color: "#999",
        textDecorationLine: "line-through",
    },
    arrow: {
        color: "#6200ea",
        fontWeight: "bold",
    },
    newMax: {
        color: "#6200ea",
        fontWeight: "bold",
    },
    infoCard: {
        width: "100%",
        marginBottom: 30,
        backgroundColor: "#f0f0ff",
    },
    infoTitle: {
        marginBottom: 12,
        fontWeight: "bold",
    },
    infoText: {
        marginBottom: 6,
        color: "#444",
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
