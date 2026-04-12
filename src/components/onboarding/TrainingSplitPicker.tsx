import React from "react";
import { StyleSheet } from "react-native";
import { Text, SegmentedButtons, HelperText } from "react-native-paper";

interface TrainingSplitPickerProps {
    value: "3" | "4";
    onChange: (value: "3" | "4") => void;
}

export default function TrainingSplitPicker({ value, onChange }: TrainingSplitPickerProps) {
    return (
        <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
                Training Schedule
            </Text>
            <Text variant="bodySmall" style={styles.helperText}>
                Choose how many days per week you want to train.
            </Text>
            <SegmentedButtons
                value={value}
                onValueChange={(v) => onChange(v as "3" | "4")}
                buttons={[
                    { value: "3", label: "3 Days/Week", icon: "calendar-week" },
                    { value: "4", label: "4 Days/Week", icon: "calendar" },
                ]}
                style={styles.segmented}
            />
            {value === "3" && (
                <HelperText type="info" style={styles.infoText}>
                    Alternating weeks: Squat/Bench/Deadlift, then Bench/Squat/Press
                </HelperText>
            )}
            {value === "4" && (
                <HelperText type="info" style={styles.infoText}>
                    One main lift per day: Squat, Bench, Deadlift, Press
                </HelperText>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    helperText: {
        marginBottom: 15,
        color: "#666",
    },
    segmented: {
        marginBottom: 5,
    },
    infoText: {
        marginTop: 0,
        marginBottom: 15,
    },
});
