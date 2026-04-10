import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { View, ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { db, initDatabase } from "./src/database/db";

// Extend themes with custom brand color
const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: "#6200ea",
        secondary: "#6200ea",
    },
};

const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: "#bb86fc",
        secondary: "#bb86fc",
    },
};

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);
    const colorScheme = useColorScheme();
    const theme = colorScheme === "dark" ? darkTheme : lightTheme;

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            await initDatabase();
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
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
