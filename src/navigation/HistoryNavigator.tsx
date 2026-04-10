import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryScreen from "../screens/HistoryScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";

export type HistoryStackParamList = {
    HistoryList: undefined;
    WorkoutDetail: {
        workoutId: number;
        exerciseName: string;
        weekNumber: number;
        completedAt: string;
        trainingMax: number;
        isPr: boolean;
    };
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="HistoryList"
                component={HistoryScreen}
                options={{ title: "History", headerShown: false }}
            />
            <Stack.Screen
                name="WorkoutDetail"
                component={WorkoutDetailScreen}
                options={({ route }) => ({
                    title: route.params.exerciseName,
                    headerBackTitle: "History",
                })}
            />
        </Stack.Navigator>
    );
}
