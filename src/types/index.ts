// Core Types for 5-3-1 Tracker

export interface User {
  id: number;
  name: string;
  weight_unit: 'lbs' | 'kg';
  rounding_preference: 2.5 | 5;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  type: 'main' | 'assistance';
  category: 'squat' | 'bench' | 'deadlift' | 'press' | 'other';
  created_at: string;
}

export interface TrainingMax {
  id: number;
  user_id: number;
  exercise_id: number;
  actual_1rm: number;
  training_max: number;
  effective_date: string;
  notes?: string;
  created_at: string;
}

export interface Cycle {
  id: number;
  user_id: number;
  cycle_number: number;
  start_date: string;
  end_date?: string;
  percentage_option: 1 | 2;
  training_days: 3 | 4;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
}

export interface Workout {
  id: number;
  user_id: number;
  cycle_id: number;
  exercise_id: number;
  week_number: 1 | 2 | 3 | 4;
  workout_date?: string;
  training_max_used: number;
  completed: boolean;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  set_type: 'warmup' | 'work' | 'assistance';
  set_number: number;
  prescribed_reps?: number;
  prescribed_weight?: number;
  prescribed_percentage?: number;
  actual_reps?: number;
  actual_weight?: number;
  is_amrap: boolean;
  is_pr: boolean;
  rpe?: number;
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface PersonalRecord {
  id: number;
  user_id: number;
  exercise_id: number;
  weight: number;
  reps: number;
  estimated_1rm: number;
  workout_id?: number;
  achieved_date: string;
  notes?: string;
  created_at: string;
}

// Week configuration type
export interface WeekConfig {
  week: 1 | 2 | 3 | 4;
  sets: {
    percentage: number;
    reps: number;
    isAmrap: boolean;
  }[];
}

// Percentage schemes
export const PERCENTAGE_SCHEMES = {
  1: {
    week1: [
      { percentage: 0.65, reps: 5, isAmrap: false },
      { percentage: 0.75, reps: 5, isAmrap: false },
      { percentage: 0.85, reps: 5, isAmrap: true },
    ],
    week2: [
      { percentage: 0.7, reps: 3, isAmrap: false },
      { percentage: 0.8, reps: 3, isAmrap: false },
      { percentage: 0.9, reps: 3, isAmrap: true },
    ],
    week3: [
      { percentage: 0.75, reps: 5, isAmrap: false },
      { percentage: 0.85, reps: 3, isAmrap: false },
      { percentage: 0.95, reps: 1, isAmrap: true },
    ],
    week4: [
      { percentage: 0.4, reps: 5, isAmrap: false },
      { percentage: 0.5, reps: 5, isAmrap: false },
      { percentage: 0.6, reps: 5, isAmrap: false },
    ],
  },
  2: {
    week1: [
      { percentage: 0.75, reps: 5, isAmrap: false },
      { percentage: 0.8, reps: 5, isAmrap: false },
      { percentage: 0.85, reps: 5, isAmrap: true },
    ],
    week2: [
      { percentage: 0.8, reps: 3, isAmrap: false },
      { percentage: 0.85, reps: 3, isAmrap: false },
      { percentage: 0.9, reps: 3, isAmrap: true },
    ],
    week3: [
      { percentage: 0.75, reps: 5, isAmrap: false },
      { percentage: 0.85, reps: 3, isAmrap: false },
      { percentage: 0.95, reps: 1, isAmrap: true },
    ],
    week4: [
      { percentage: 0.4, reps: 5, isAmrap: false },
      { percentage: 0.5, reps: 5, isAmrap: false },
      { percentage: 0.6, reps: 5, isAmrap: false },
    ],
  },
} as const;

// Main exercises
export const MAIN_EXERCISES = [
  { name: 'Military Press', category: 'press' as const },
  { name: 'Deadlift', category: 'deadlift' as const },
  { name: 'Bench Press', category: 'bench' as const },
  { name: 'Squat', category: 'squat' as const },
] as const;
