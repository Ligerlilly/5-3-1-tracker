// 5-3-1 Calculation Utilities

/**
 * Calculate Training Max (90% of actual 1RM)
 */
export const calculateTrainingMax = (actual1RM: number): number => {
  return actual1RM * 0.9;
};

/**
 * Calculate estimated 1RM from weight and reps
 * Formula: Weight × Reps × 0.0333 + Weight
 */
export const calculateEstimated1RM = (weight: number, reps: number): number => {
  return weight * reps * 0.0333 + weight;
};

/**
 * Round weight to nearest increment (2.5 or 5 lbs)
 */
export const roundWeight = (weight: number, increment: 2.5 | 5 = 5): number => {
  return Math.round(weight / increment) * increment;
};

/**
 * Calculate work set weight based on training max and percentage
 */
export const calculateWorkSetWeight = (
  trainingMax: number,
  percentage: number,
  roundingPreference: 2.5 | 5 = 5
): number => {
  const rawWeight = trainingMax * percentage;
  return roundWeight(rawWeight, roundingPreference);
};

/**
 * Calculate warmup sets
 */
export const calculateWarmupSets = (
  trainingMax: number,
  roundingPreference: 2.5 | 5 = 5
): Array<{ weight: number; reps: number; percentage: number }> => {
  return [
    {
      percentage: 0.4,
      reps: 5,
      weight: roundWeight(trainingMax * 0.4, roundingPreference),
    },
    {
      percentage: 0.5,
      reps: 5,
      weight: roundWeight(trainingMax * 0.5, roundingPreference),
    },
    {
      percentage: 0.6,
      reps: 3,
      weight: roundWeight(trainingMax * 0.6, roundingPreference),
    },
  ];
};

/**
 * Get progression increment based on exercise type
 */
export const getProgressionIncrement = (
  exerciseCategory: 'press' | 'bench' | 'deadlift' | 'squat'
): number => {
  // Upper body: +5 lbs, Lower body: +10 lbs
  return exerciseCategory === 'press' || exerciseCategory === 'bench' ? 5 : 10;
};

/**
 * Calculate new training max for next cycle
 */
export const calculateNextCycleTrainingMax = (
  currentTrainingMax: number,
  exerciseCategory: 'press' | 'bench' | 'deadlift' | 'squat'
): number => {
  const increment = getProgressionIncrement(exerciseCategory);
  return currentTrainingMax + increment;
};

/**
 * Check if a new PR was achieved
 */
export const isPR = (
  currentEstimated1RM: number,
  previousBestEstimated1RM: number | null
): boolean => {
  if (previousBestEstimated1RM === null) return true;
  return currentEstimated1RM > previousBestEstimated1RM;
};

/**
 * Calculate plate loading for barbell
 * Assumes standard 45 lb barbell
 */
export const calculatePlateLoading = (
  totalWeight: number,
  barWeight: number = 45
): Array<{ weight: number; count: number }> => {
  const weightPerSide = (totalWeight - barWeight) / 2;

  if (weightPerSide <= 0) {
    return [];
  }

  const availablePlates = [45, 35, 25, 10, 5, 2.5];
  const plates: Array<{ weight: number; count: number }> = [];
  let remaining = weightPerSide;

  for (const plate of availablePlates) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      plates.push({ weight: plate, count });
      remaining -= count * plate;
    }
  }

  return plates;
};
