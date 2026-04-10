import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { db, initDatabase } from "./src/database/db";

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Initialize database
            await initDatabase();

            // Check if user exists
            const user = db.getCurrentUser();
            setHasUser(!!user);
        } catch (error) {
            console.error("Error initializing app:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnboardingComplete = () => {
        setHasUser(true);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <PaperProvider>
                <StatusBar style="auto" />
                {!hasUser ? <OnboardingScreen onComplete={handleOnboardingComplete} /> : <AppNavigator />}
            </PaperProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
