import React from "react";
import { StyleSheet } from "react-native";
import { Text, SegmentedButtons } from "react-native-paper";

interface WeekPickerProps {
    value: "1" | "2" | "3" | "4";
    onChange: (value: "1" | "2" | "3" | "4") => void;
}

export default function WeekPicker({ value, onChange }: WeekPickerProps) {
    return (
        <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
                Week
            </Text>
            <SegmentedButtons
                value={value}
                onValueChange={(v) => onChange(v as "1" | "2" | "3" | "4")}
                buttons={[
                    { value: "1", label: "Week 1" },
                    { value: "2", label: "Week 2" },
                    { value: "3", label: "Week 3" },
                    { value: "4", label: "Week 4" },
                ]}
                style={styles.segmented}
            />
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    segmented: {
        marginBottom: 10,
    },
});
