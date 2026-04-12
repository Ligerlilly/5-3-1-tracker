import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

interface TodayBannerProps {
    liftName: string;
}

export default function TodayBanner({ liftName }: TodayBannerProps) {
    return (
        <View style={styles.banner}>
            <Text style={styles.text}>🏋️ Today's lift: {liftName}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: "#6200ea",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    text: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
});
