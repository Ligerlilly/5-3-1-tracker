import React from "react";
import { StyleSheet } from "react-native";
import { Chip } from "react-native-paper";

interface PRChipProps {
    label?: string;
}

export default function PRChip({ label = "PR! 🏆" }: PRChipProps) {
    return (
        <Chip mode="flat" style={styles.chip} textStyle={styles.text}>
            {label}
        </Chip>
    );
}

const styles = StyleSheet.create({
    chip: {
        backgroundColor: "#FFD700",
    },
    text: {
        color: "#000",
        fontWeight: "bold",
    },
});
