import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, IconButton } from "react-native-paper";

interface ExerciseCardProps {
    exercise: any;
    isNextUp: boolean;
    isCompleted: boolean;
    isSwapped: boolean;
    substituteName: string | null;
    onPress: () => void;
    onMenuPress: () => void;
}

export default function ExerciseCard({
    exercise,
    isNextUp,
    isCompleted,
    isSwapped,
    substituteName,
    onPress,
    onMenuPress,
}: ExerciseCardProps) {
    const displayName = substituteName ?? exercise.name;

    return (
        <Card
            style={[
                styles.card,
                isNextUp && styles.nextUpCard,
                isSwapped && !isNextUp && styles.swappedCard,
                isCompleted && styles.completedCard,
            ]}
            onPress={onPress}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={styles.exerciseInfo}>
                        <Text variant="titleLarge">{displayName}</Text>
                        {isSwapped ? (
                            <Text variant="bodySmall" style={styles.swapSubtitle}>
                                ↔ {exercise.name} slot • {exercise.category.toUpperCase()} TM
                            </Text>
                        ) : (
                            <Text variant="bodyMedium" style={styles.category}>
                                {exercise.category.toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.badges}>
                        {isSwapped && <Text style={styles.swappedBadge}>SWAPPED</Text>}
                        {isCompleted && <Text style={styles.completedBadge}>✓ DONE</Text>}
                        <IconButton icon="dots-vertical" size={18} onPress={onMenuPress} style={styles.menuButton} />
                    </View>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 10 },
    nextUpCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#6200ea",
        elevation: 3,
    },
    swappedCard: { borderLeftWidth: 4, borderLeftColor: "#FF9800" },
    completedCard: { opacity: 0.6 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    exerciseInfo: { flex: 1 },
    category: { marginTop: 5, color: "#666" },
    swapSubtitle: { marginTop: 3, color: "#FF9800", fontStyle: "italic" },
    badges: { flexDirection: "row", alignItems: "center", gap: 4 },
    completedBadge: {
        backgroundColor: "#9E9E9E",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
    },
    swappedBadge: {
        backgroundColor: "#FF9800",
        color: "#fff",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
    },
    menuButton: { margin: 0, padding: 0 },
});
