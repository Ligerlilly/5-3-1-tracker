import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { useTheme } from "react-native-paper";
import DashboardNavigator from "./DashboardNavigator";
import HistoryNavigator from "./HistoryNavigator";

export type RootTabParamList = {
    Home: undefined;
    History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
    const colorScheme = useColorScheme();
    const paperTheme = useTheme();
    const navTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

    // Blend React Navigation's theme with our Paper background color
    const theme = {
        ...navTheme,
        colors: {
            ...navTheme.colors,
            background: paperTheme.colors.background,
            card: paperTheme.colors.surface,
            text: paperTheme.colors.onSurface,
            border: paperTheme.colors.outlineVariant,
        },
    };

    return (
        <NavigationContainer theme={theme}>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: paperTheme.colors.primary,
                    tabBarInactiveTintColor: paperTheme.colors.onSurfaceVariant,
                    tabBarStyle: {
                        backgroundColor: paperTheme.colors.surface,
                        borderTopColor: paperTheme.colors.outlineVariant,
                    },
                    headerShown: false,
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={DashboardNavigator}
                    options={{
                        title: "Dashboard",
                        tabBarIcon: ({ focused, color, size }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="History"
                    component={HistoryNavigator}
                    options={{
                        title: "History",
                        headerShown: false,
                        tabBarIcon: ({ focused, color, size }) => (
                            <Ionicons name={focused ? "list" : "list-outline"} size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
