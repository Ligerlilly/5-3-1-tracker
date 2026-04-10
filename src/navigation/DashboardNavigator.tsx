import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/DashboardScreen";
import WorkoutSelectionScreen from "../screens/WorkoutSelectionScreen";
import WorkoutScreen from "../screens/WorkoutScreen";
import CycleCompleteScreen from "../screens/CycleCompleteScreen";

export type DashboardStackParamList = {
    Dashboard: undefined;
    WorkoutSelection: undefined;
    Workout: {
        exerciseId: number;
        weekNumber: 1 | 2 | 3 | 4;
        /** Display name override when a lift has been swapped (e.g. "Romanian Deadlift") */
        substituteName?: string;
    };
    CycleComplete: {
        cycleId: number;
        cycleNumber: number;
        trainingDays: number;
    };
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen
                name="WorkoutSelection"
                component={WorkoutSelectionScreen}
                options={{ title: "Select Workout", headerBackTitle: "Back" }}
            />
            <Stack.Screen
                name="Workout"
                component={WorkoutScreen}
                options={{ title: "Workout", headerBackTitle: "Back" }}
            />
            <Stack.Screen
                name="CycleComplete"
                component={CycleCompleteScreen}
                options={{ title: "Cycle Complete! 🏆", headerBackVisible: false }}
            />
        </Stack.Navigator>
    );
}
