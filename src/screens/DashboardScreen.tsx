import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button } from "react-native-paper";
import { db } from "../database/db";

interface DashboardScreenProps {
    onStartWorkout: () => void;
}

export default function DashboardScreen({ onStartWorkout }: DashboardScreenProps) {
    const [user, setUser] = useState<any>(null);
    const [trainingMaxes, setTrainingMaxes] = useState<any[]>([]);
    const [activeCycle, setActiveCycle] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            const currentUser = db.getCurrentUser();
            setUser(currentUser);

            if (currentUser && (currentUser as any).id) {
                const maxes = db.getAllCurrentTrainingMaxes((currentUser as any).id);
                setTrainingMaxes(maxes as any);

                const cycle = db.getActiveCycle((currentUser as any).id);
                setActiveCycle(cycle);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Welcome back, {user?.name || "Lifter"}!
                    </Text>

                    {activeCycle && (
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium">Current Cycle</Text>
                                <Text variant="bodyLarge" style={styles.cycleNumber}>
                                    Cycle #{activeCycle.cycle_number}
                                </Text>
                                <Text variant="bodySmall">
                                    Started: {new Date(activeCycle.start_date).toLocaleDateString()}
                                </Text>
                            </Card.Content>
                        </Card>
                    )}

                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        Your Training Maxes
                    </Text>

                    {trainingMaxes.map((tm) => (
                        <Card key={tm.exercise_id} style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium">{tm.exercise_name}</Text>
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
                    ))}

                    <Button mode="contained" onPress={onStartWorkout} style={styles.button}>
                        Start Today's Workout
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
    card: {
        marginBottom: 15,
    },
    cycleNumber: {
        marginTop: 5,
        fontWeight: "bold",
    },
    maxRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 15,
    },
    button: {
        marginTop: 30,
        marginBottom: 20,
    },
});
