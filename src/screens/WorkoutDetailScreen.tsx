import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Divider, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HistoryStackParamList } from "../navigation/HistoryNavigator";
import { openDatabase } from "../database/db";
import { formatDate, getWeekLabel } from "../utils/format";
import LoadingScreen from "../components/common/LoadingScreen";
import PRChip from "../components/common/PRChip";

type Props = NativeStackScreenProps<HistoryStackParamList, "WorkoutDetail">;

interface SetDetail {
    id: number;
    set_type: string;
    set_number: number;
    prescribed_reps: number | null;
    prescribed_weight: number | null;
    prescribed_percentage: number | null;
    actual_reps: number | null;
    actual_weight: number | null;
    is_amrap: boolean;
    is_pr: boolean;
    completed: boolean;
}

export default function WorkoutDetailScreen({ route }: Props) {
    const { workoutId, exerciseName, weekNumber, completedAt, trainingMax, isPr } = route.params;
    const theme = useTheme();
    const [sets, setSets] = useState<SetDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSets();
    }, []);

    const loadSets = () => {
        try {
            const database = openDatabase();
            const result = database.getAllSync(
                `SELECT 
                    id, set_type, set_number,
                    prescribed_reps, prescribed_weight, prescribed_percentage,
                    actual_reps, actual_weight,
                    is_amrap, is_pr, completed
                FROM sets
                WHERE workout_id = ?
                ORDER BY set_type DESC, set_number ASC`,
                [workoutId],
            ) as SetDetail[];
            setSets(result);
        } catch (error) {
            console.error("Error loading sets:", error);
        } finally {
            setLoading(false);
        }
    };

    const workSets = sets.filter((s) => s.set_type === "work");
    const warmupSets = sets.filter((s) => s.set_type === "warmup");

    if (loading) {
        return <LoadingScreen message="Loading workout details..." />;
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["bottom"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    {/* Header card */}
                    <Card style={[styles.headerCard, isPr && styles.prCard]}>
                        <Card.Content>
                            <View style={styles.headerRow}>
                                <Text variant="headlineSmall" style={styles.exerciseName}>
                                    {exerciseName}
                                </Text>
                                {isPr && <PRChip />}
                            </View>
                            <Text
                                variant="bodyMedium"
                                style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}
                            >
                                {getWeekLabel(weekNumber)}
                            </Text>
                            <Text
                                variant="bodySmall"
                                style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}
                            >
                                {formatDate(completedAt)}
                            </Text>
                            <Divider style={styles.divider} />
                            <View style={styles.tmRow}>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Training Max Used:
                                </Text>
                                <Text variant="titleMedium" style={styles.tmValue}>
                                    {trainingMax} lbs
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Work Sets */}
                    {workSets.length > 0 && (
                        <Card style={styles.setsCard}>
                            <Card.Content>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Work Sets
                                </Text>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderCell, styles.colWeight]}>Weight</Text>
                                    <Text style={[styles.tableHeaderCell, styles.colReps]}>Reps</Text>
                                    <Text style={[styles.tableHeaderCell, styles.colTarget]}>Target</Text>
                                </View>
                                <Divider />
                                {workSets.map((set) => (
                                    <View
                                        key={set.id}
                                        style={[styles.tableRow, !!set.is_pr ? styles.prRow : undefined]}
                                    >
                                        <Text style={[styles.tableCell, styles.colWeight]}>
                                            {set.actual_weight != null ? `${set.actual_weight} lbs` : "—"}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.tableCell,
                                                styles.colReps,
                                                !!set.is_amrap && set.actual_reps != null
                                                    ? styles.amrapReps
                                                    : undefined,
                                            ]}
                                        >
                                            {set.actual_reps != null
                                                ? `${set.actual_reps}${!!set.is_amrap ? "+" : ""}${!!set.is_pr ? " 🏆" : ""}`
                                                : "—"}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.colTarget]}>
                                            {set.prescribed_percentage != null
                                                ? `${Math.round(set.prescribed_percentage * 100)}%`
                                                : "—"}
                                        </Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    )}

                    {/* Warmup Sets */}
                    {warmupSets.length > 0 && (
                        <Card style={styles.setsCard}>
                            <Card.Content>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Warm-up Sets
                                </Text>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderCell, styles.colWeight]}>Weight</Text>
                                    <Text style={[styles.tableHeaderCell, styles.colReps]}>Reps</Text>
                                </View>
                                <Divider />
                                {warmupSets.map((set) => (
                                    <View key={set.id} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.colWeight]}>
                                            {set.actual_weight != null ? `${set.actual_weight} lbs` : "—"}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.colReps]}>{set.actual_reps ?? "—"}</Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    )}
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
        padding: 16,
        gap: 12,
    },
    headerCard: {
        marginBottom: 4,
    },
    prCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFD700",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    exerciseName: {
        flex: 1,
        fontWeight: "bold",
    },
    subText: {
        marginTop: 4,
    },
    divider: {
        marginVertical: 12,
    },
    tmRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    tmValue: {
        fontWeight: "bold",
    },
    setsCard: {
        marginBottom: 4,
    },
    sectionTitle: {
        marginBottom: 8,
        fontWeight: "600",
    },
    tableHeader: {
        flexDirection: "row",
        paddingVertical: 8,
        marginBottom: 2,
    },
    tableHeaderCell: {
        fontSize: 12,
        color: "#888",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#e0e0e0",
    },
    tableCell: {
        fontSize: 16,
    },
    colWeight: {
        flex: 1,
    },
    colReps: {
        flex: 1,
        textAlign: "center",
    },
    colTarget: {
        flex: 1,
        textAlign: "right",
    },
    prRow: {
        backgroundColor: "rgba(255, 215, 0, 0.1)",
    },
    amrapReps: {
        color: "#6200ee",
        fontWeight: "bold",
    },
});
