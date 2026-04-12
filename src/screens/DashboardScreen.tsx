import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, useTheme } from "react-native-paper";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../navigation/DashboardNavigator";
import { db, openDatabase } from "../database/db";
import CycleCard from "../components/dashboard/CycleCard";
import StatsRow from "../components/dashboard/StatsRow";
import PRList from "../components/dashboard/PRList";
import TrainingMaxList from "../components/dashboard/TrainingMaxList";

type DashboardScreenNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "Dashboard">;

export default function DashboardScreen() {
    const navigation = useNavigation<DashboardScreenNavigationProp>();
    const isFocused = useIsFocused();
    const theme = useTheme();
    const [user, setUser] = useState<any>(null);
    const [trainingMaxes, setTrainingMaxes] = useState<any[]>([]);
    const [activeCycle, setActiveCycle] = useState<any>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState<any[]>([]);
    const [recentPRs, setRecentPRs] = useState<any[]>([]);
    const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
    const [nextWorkoutDate, setNextWorkoutDate] = useState<string>("");
    const [skippedExerciseIds, setSkippedExerciseIds] = useState<number[]>([]);
    const [swapMap, setSwapMap] = useState<Record<number, string>>({});
    const [nextLiftName, setNextLiftName] = useState<string | null>(null);
    const [stallStatus, setStallStatus] = useState<Record<number, { isStalled: boolean; isWarning: boolean }>>({});

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = () => {
        try {
            const currentUser = db.getCurrentUser();
            setUser(currentUser);

            if (currentUser && (currentUser as any).id) {
                const userId = (currentUser as any).id;

                const maxes = db.getAllCurrentTrainingMaxes(userId);
                setTrainingMaxes(maxes as any);

                const cycle = db.getActiveCycle(userId);
                setActiveCycle(cycle);

                if (cycle) {
                    const config = db.getLiftConfig((cycle as any).id);
                    const skipped = config.filter((c) => c.is_skipped).map((c) => c.exercise_id);
                    setSkippedExerciseIds(skipped);
                    const swaps: Record<number, string> = {};
                    config.forEach((c) => {
                        if (c.substitute_name) swaps[c.exercise_id] = c.substitute_name;
                    });
                    setSwapMap(swaps);

                    const activeLifts = Math.max(1, 4 - skipped.length);
                    const requiredPerWeek = Math.min((cycle as any).training_days, activeLifts);

                    const rawWeek = db.getCurrentWeekInCycle((cycle as any).id, userId);
                    const rawDone = db.getWorkoutsThisWeek((cycle as any).id, userId, rawWeek) as any[];
                    const weekIsFull = rawDone.length >= requiredPerWeek && rawWeek < 4;

                    const displayWeek = weekIsFull ? rawWeek + 1 : rawWeek;
                    setCurrentWeek(displayWeek);

                    const displayDone = weekIsFull ? [] : rawDone;
                    setWorkoutsThisWeek(displayDone as any[]);
                    const doneIds = (displayDone as any[]).map((w: any) => w.exercise_id);

                    const allMain = db.getExercises("main") as any[];
                    const activeMain = allMain.filter((e: any) => !skipped.includes(e.id));
                    let nextExercise: any = null;

                    if (doneIds.length > 0) {
                        nextExercise = activeMain.find((e: any) => !doneIds.includes(e.id)) ?? null;
                    } else {
                        const lastId = db.getLastCompletedExerciseId((cycle as any).id, userId);
                        if (lastId !== null) {
                            const lastIdx = activeMain.findIndex((e: any) => e.id === lastId);
                            if (lastIdx !== -1) {
                                nextExercise = activeMain[(lastIdx + 1) % activeMain.length];
                            }
                        }
                        if (!nextExercise) nextExercise = activeMain[0] ?? null;
                    }

                    setNextLiftName(nextExercise ? (swaps[nextExercise.id] ?? nextExercise.name) : null);
                }

                const database = openDatabase();
                const lastWorkout = database.getFirstSync(
                    `SELECT completed_at FROM workouts WHERE user_id = ? AND completed = 1 ORDER BY completed_at DESC LIMIT 1`,
                    [userId],
                ) as any;
                if (lastWorkout?.completed_at) {
                    const lastDate = new Date(lastWorkout.completed_at);
                    const today = new Date();
                    lastDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSince === 0) {
                        const nextDate = new Date(today);
                        nextDate.setDate(nextDate.getDate() + 2);
                        setNextWorkoutDate(
                            nextDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
                        );
                    } else {
                        setNextWorkoutDate("Today");
                    }
                } else {
                    setNextWorkoutDate("Today");
                }

                const prs = db.getRecentPRs(userId, 3);
                setRecentPRs(prs as any[]);

                const count = db.getTotalWorkoutCount(userId);
                setTotalWorkouts(count);

                const allMain = db.getExercises("main") as any[];
                const stallMap: Record<number, { isStalled: boolean; isWarning: boolean }> = {};
                allMain.forEach((e: any) => {
                    stallMap[e.id] = db.getStallStatus(userId, e.id);
                });
                setStallStatus(stallMap);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    const getTrainingDaysForWeek = () => {
        const activeLifts = Math.max(1, 4 - skippedExerciseIds.length);
        return Math.min(activeCycle?.training_days || 4, activeLifts);
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={["top"]}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text variant="headlineMedium" style={styles.title}>
                        Welcome back, {user?.name || "Lifter"}!
                    </Text>

                    {activeCycle && (
                        <CycleCard
                            cycleNumber={activeCycle.cycle_number}
                            currentWeek={currentWeek}
                            workoutsThisWeek={workoutsThisWeek}
                            trainingDaysForWeek={getTrainingDaysForWeek()}
                            startDate={activeCycle.start_date}
                            trainingDays={activeCycle.training_days}
                            nextWorkoutDate={nextWorkoutDate}
                            nextLiftName={nextLiftName}
                        />
                    )}

                    <StatsRow totalWorkouts={totalWorkouts} cycleNumber={activeCycle?.cycle_number || 1} />

                    <PRList prs={recentPRs} />

                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        Your Training Maxes
                    </Text>
                    <TrainingMaxList
                        trainingMaxes={trainingMaxes}
                        skippedExerciseIds={skippedExerciseIds}
                        swapMap={swapMap}
                        stallStatus={stallStatus}
                    />

                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate("WorkoutSelection")}
                        style={styles.button}
                    >
                        Start Today's Workout
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: "center",
    },
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
    },
    button: {
        marginTop: 30,
        marginBottom: 40,
    },
});
