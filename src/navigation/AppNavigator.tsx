import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DashboardNavigator from "./DashboardNavigator";
import HistoryScreen from "../screens/HistoryScreen";

export type RootTabParamList = {
    Home: undefined;
    History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: "#6200ea",
                    tabBarInactiveTintColor: "gray",
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
                    component={HistoryScreen}
                    options={{
                        title: "History",
                        headerShown: true,
                        tabBarIcon: ({ focused, color, size }) => (
                            <Ionicons name={focused ? "list" : "list-outline"} size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
