// SQLite Database Setup and Utilities
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'fivethreeone.db';

// Open database
export const openDatabase = () => {
  return SQLite.openDatabaseSync(DB_NAME);
};

// Initialize database with schema
export const initDatabase = async (): Promise<void> => {
  const db = openDatabase();

  // Users table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      weight_unit TEXT DEFAULT 'lbs',
      rounding_preference REAL DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Exercises table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      category TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Training Maxes table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS training_maxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      actual_1rm REAL NOT NULL,
      training_max REAL NOT NULL,
      effective_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  // Cycles table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cycle_number INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      percentage_option INTEGER DEFAULT 1,
      training_days INTEGER DEFAULT 4,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Workouts table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cycle_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      workout_date DATE,
      training_max_used REAL NOT NULL,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cycle_id) REFERENCES cycles(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  // Sets table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_type TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      prescribed_reps INTEGER,
      prescribed_weight REAL,
      prescribed_percentage REAL,
      actual_reps INTEGER,
      actual_weight REAL,
      is_amrap INTEGER DEFAULT 0,
      is_pr INTEGER DEFAULT 0,
      rpe INTEGER,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workout_id) REFERENCES workouts(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  // Personal Records table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS personal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      estimated_1rm REAL NOT NULL,
      workout_id INTEGER,
      achieved_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
  `);

  // Cycle lift config table (skip/swap lifts)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cycle_lift_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      is_skipped INTEGER DEFAULT 0,
      substitute_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cycle_id) REFERENCES cycles(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      UNIQUE(cycle_id, exercise_id)
    );
  `);

  // Migration: add substitute_name column to existing installs
  try {
    db.execSync('ALTER TABLE cycle_lift_config ADD COLUMN substitute_name TEXT');
  } catch (_) {
    // Column already exists — safe to ignore
  }

  // Migration: add use_small_increments column (stall reset option)
  try {
    db.execSync('ALTER TABLE cycle_lift_config ADD COLUMN use_small_increments INTEGER DEFAULT 0');
  } catch (_) {
    // Column already exists — safe to ignore
  }

  // Seed main exercises if they don't exist
  const mainExercises = [
    { name: 'Military Press', type: 'main', category: 'press' },
    { name: 'Deadlift', type: 'main', category: 'deadlift' },
    { name: 'Bench Press', type: 'main', category: 'bench' },
    { name: 'Squat', type: 'main', category: 'squat' },
  ];

  for (const exercise of mainExercises) {
    db.runSync(
      `INSERT OR IGNORE INTO exercises (name, type, category) VALUES (?, ?, ?)`,
      [exercise.name, exercise.type, exercise.category]
    );
  }
};

// Database queries
export const db = {
  // User operations
  createUser: (name: string, weightUnit: 'lbs' | 'kg' = 'lbs', roundingPreference: 2.5 | 5 = 5) => {
    const database = openDatabase();
    const result = database.runSync(
      'INSERT INTO users (name, weight_unit, rounding_preference) VALUES (?, ?, ?)',
      [name, weightUnit, roundingPreference]
    );
    return result.lastInsertRowId;
  },

  getUser: (userId: number) => {
    const database = openDatabase();
    return database.getFirstSync('SELECT * FROM users WHERE id = ?', [userId]);
  },

  getCurrentUser: () => {
    const database = openDatabase();
    return database.getFirstSync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
  },

  // Exercise operations
  getExercises: (type?: 'main' | 'assistance') => {
    const database = openDatabase();
    // Canonical 5/3/1 day order: Squat → Bench → Deadlift → Press
    const ORDER_CLAUSE = `ORDER BY CASE category
      WHEN 'squat'    THEN 1
      WHEN 'bench'    THEN 2
      WHEN 'deadlift' THEN 3
      WHEN 'press'    THEN 4
      ELSE 5 END, id`;
    if (type) {
      return database.getAllSync(`SELECT * FROM exercises WHERE type = ? ${ORDER_CLAUSE}`, [type]);
    }
    return database.getAllSync(`SELECT * FROM exercises ${ORDER_CLAUSE}`);
  },

  getExerciseById: (exerciseId: number) => {
    const database = openDatabase();
    return database.getFirstSync('SELECT * FROM exercises WHERE id = ?', [exerciseId]);
  },

  getExerciseByName: (name: string) => {
    const database = openDatabase();
    return database.getFirstSync('SELECT * FROM exercises WHERE name = ?', [name]);
  },

  // Training Max operations
  saveTrainingMax: (
    userId: number,
    exerciseId: number,
    actual1RM: number,
    trainingMax: number,
    effectiveDate: string,
    notes?: string
  ) => {
    const database = openDatabase();
    const result = database.runSync(
      `INSERT INTO training_maxes (user_id, exercise_id, actual_1rm, training_max, effective_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, exerciseId, actual1RM, trainingMax, effectiveDate, notes || null]
    );
    return result.lastInsertRowId;
  },

  getCurrentTrainingMax: (userId: number, exerciseId: number) => {
    const database = openDatabase();
    return database.getFirstSync(
      `SELECT * FROM training_maxes 
       WHERE user_id = ? AND exercise_id = ? 
       ORDER BY effective_date DESC, id DESC LIMIT 1`,
      [userId, exerciseId]
    );
  },

  getAllCurrentTrainingMaxes: (userId: number) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT tm.*, e.name as exercise_name, e.category 
       FROM training_maxes tm
       JOIN exercises e ON tm.exercise_id = e.id
       WHERE tm.user_id = ? 
       AND tm.id IN (
         SELECT MAX(id) FROM training_maxes 
         WHERE user_id = ? 
         GROUP BY exercise_id
       )
       ORDER BY CASE e.category
         WHEN 'squat'    THEN 1
         WHEN 'bench'    THEN 2
         WHEN 'deadlift' THEN 3
         WHEN 'press'    THEN 4
         ELSE 5 END, e.id`,
      [userId, userId]
    );
  },

  // Cycle operations
  createCycle: (
    userId: number,
    cycleNumber: number,
    startDate: string,
    percentageOption: 1 | 2 = 1,
    trainingDays: 3 | 4 = 4
  ) => {
    const database = openDatabase();
    const result = database.runSync(
      `INSERT INTO cycles (user_id, cycle_number, start_date, percentage_option, training_days, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [userId, cycleNumber, startDate, percentageOption, trainingDays]
    );
    return result.lastInsertRowId;
  },

  getActiveCycle: (userId: number) => {
    const database = openDatabase();
    return database.getFirstSync(
      `SELECT * FROM cycles WHERE user_id = ? AND status = 'active' 
       ORDER BY cycle_number DESC LIMIT 1`,
      [userId]
    );
  },

  completeCycle: (cycleId: number, endDate: string) => {
    const database = openDatabase();
    database.runSync(
      `UPDATE cycles SET status = 'completed', end_date = ? WHERE id = ?`,
      [endDate, cycleId]
    );
  },

  // Workout operations
  createWorkout: (
    userId: number,
    cycleId: number,
    exerciseId: number,
    weekNumber: 1 | 2 | 3 | 4,
    trainingMaxUsed: number
  ) => {
    const database = openDatabase();
    const result = database.runSync(
      `INSERT INTO workouts (user_id, cycle_id, exercise_id, week_number, training_max_used) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, cycleId, exerciseId, weekNumber, trainingMaxUsed]
    );
    return result.lastInsertRowId;
  },

  getWorkout: (workoutId: number) => {
    const database = openDatabase();
    return database.getFirstSync(
      `SELECT w.*, e.name as exercise_name, e.category 
       FROM workouts w 
       JOIN exercises e ON w.exercise_id = e.id 
       WHERE w.id = ?`,
      [workoutId]
    );
  },

  completeWorkout: (workoutId: number) => {
    const database = openDatabase();
    const now = new Date().toISOString();
    database.runSync(
      `UPDATE workouts SET completed = 1, completed_at = ? WHERE id = ?`,
      [now, workoutId]
    );
  },

  // Set operations
  createSet: (
    workoutId: number,
    exerciseId: number,
    setType: 'warmup' | 'work' | 'assistance',
    setNumber: number,
    prescribedReps: number,
    prescribedWeight: number,
    prescribedPercentage: number,
    isAmrap: boolean = false
  ) => {
    const database = openDatabase();
    const result = database.runSync(
      `INSERT INTO sets (workout_id, exercise_id, set_type, set_number, prescribed_reps, prescribed_weight, prescribed_percentage, is_amrap) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [workoutId, exerciseId, setType, setNumber, prescribedReps, prescribedWeight, prescribedPercentage, isAmrap ? 1 : 0]
    );
    return result.lastInsertRowId;
  },

  completeSet: (setId: number, actualReps: number, actualWeight: number, isPR: boolean = false) => {
    const database = openDatabase();
    database.runSync(
      `UPDATE sets SET actual_reps = ?, actual_weight = ?, completed = 1, is_pr = ? WHERE id = ?`,
      [actualReps, actualWeight, isPR ? 1 : 0, setId]
    );
  },

  getWorkoutSets: (workoutId: number) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT * FROM sets WHERE workout_id = ? ORDER BY set_number`,
      [workoutId]
    );
  },

  // Personal Record operations
  savePR: (
    userId: number,
    exerciseId: number,
    weight: number,
    reps: number,
    estimated1RM: number,
    achievedDate: string,
    workoutId?: number
  ) => {
    const database = openDatabase();
    const result = database.runSync(
      `INSERT INTO personal_records (user_id, exercise_id, weight, reps, estimated_1rm, achieved_date, workout_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, exerciseId, weight, reps, estimated1RM, achievedDate, workoutId || null]
    );
    return result.lastInsertRowId;
  },

  getBestPR: (userId: number, exerciseId: number) => {
    const database = openDatabase();
    return database.getFirstSync(
      `SELECT * FROM personal_records 
       WHERE user_id = ? AND exercise_id = ? 
       ORDER BY estimated_1rm DESC LIMIT 1`,
      [userId, exerciseId]
    );
  },

  getAllPRs: (userId: number, exerciseId?: number) => {
    const database = openDatabase();
    if (exerciseId) {
      return database.getAllSync(
        `SELECT pr.*, e.name as exercise_name 
         FROM personal_records pr 
         JOIN exercises e ON pr.exercise_id = e.id 
         WHERE pr.user_id = ? AND pr.exercise_id = ? 
         ORDER BY pr.achieved_date DESC`,
        [userId, exerciseId]
      );
    }
    return database.getAllSync(
      `SELECT pr.*, e.name as exercise_name 
       FROM personal_records pr 
       JOIN exercises e ON pr.exercise_id = e.id 
       WHERE pr.user_id = ? 
       ORDER BY pr.achieved_date DESC`,
      [userId]
    );
  },

  getRecentPRs: (userId: number, limit: number = 3) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT pr.*, e.name as exercise_name 
       FROM personal_records pr 
       JOIN exercises e ON pr.exercise_id = e.id 
       WHERE pr.user_id = ? 
       ORDER BY pr.achieved_date DESC, pr.id DESC
       LIMIT ?`,
      [userId, limit]
    );
  },

  // Get workouts completed in a cycle grouped by week
  getCycleWorkouts: (cycleId: number, userId: number) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT w.week_number, w.exercise_id, e.name as exercise_name, e.category,
              w.completed, w.id as workout_id
       FROM workouts w
       JOIN exercises e ON w.exercise_id = e.id
       WHERE w.cycle_id = ? AND w.user_id = ? AND w.completed = 1
       ORDER BY w.week_number, w.exercise_id`,
      [cycleId, userId]
    );
  },

  // Get week 4 completion status
  getWeek4Completions: (cycleId: number, userId: number) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT DISTINCT w.exercise_id, e.name as exercise_name, e.category
       FROM workouts w
       JOIN exercises e ON w.exercise_id = e.id
       WHERE w.cycle_id = ? AND w.user_id = ? AND w.week_number = 4 AND w.completed = 1`,
      [cycleId, userId]
    );
  },

  // Get current week based on completed workouts in active cycle
  getCurrentWeekInCycle: (cycleId: number, userId: number) => {
    const database = openDatabase();
    // Find the highest week that has at least one completed workout
    const result = database.getFirstSync(
      `SELECT MAX(week_number) as current_week
       FROM workouts
       WHERE cycle_id = ? AND user_id = ? AND completed = 1`,
      [cycleId, userId]
    ) as any;
    return result?.current_week || 1;
  },

  // Get workouts completed this week (by exercise) in active cycle
  getWorkoutsThisWeek: (cycleId: number, userId: number, weekNumber: number) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT w.exercise_id, e.name as exercise_name, e.category
       FROM workouts w
       JOIN exercises e ON w.exercise_id = e.id
       WHERE w.cycle_id = ? AND w.user_id = ? AND w.week_number = ? AND w.completed = 1`,
      [cycleId, userId, weekNumber]
    );
  },

  // Create a new cycle with incremented training maxes
  // skippedExerciseIds: exercise IDs that were skipped this cycle — their TMs are NOT incremented
  progressToNextCycle: (
    userId: number,
    currentCycleId: number,
    trainingDays: 3 | 4,
    percentageOption: 1 | 2 = 1,
    skippedExerciseIds: number[] = []
  ) => {
    const database = openDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Complete current cycle
    database.runSync(
      `UPDATE cycles SET status = 'completed', end_date = ? WHERE id = ?`,
      [today, currentCycleId]
    );

    // Get current cycle number
    const currentCycle = database.getFirstSync(
      'SELECT cycle_number FROM cycles WHERE id = ?',
      [currentCycleId]
    ) as any;

    const nextCycleNumber = (currentCycle?.cycle_number || 1) + 1;

    // Create new cycle
    const result = database.runSync(
      `INSERT INTO cycles (user_id, cycle_number, start_date, percentage_option, training_days, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [userId, nextCycleNumber, today, percentageOption, trainingDays]
    );
    const newCycleId = result.lastInsertRowId;

    // Get all current training maxes
    const trainingMaxes = database.getAllSync(
      `SELECT tm.*, e.category 
       FROM training_maxes tm
       JOIN exercises e ON tm.exercise_id = e.id
       WHERE tm.user_id = ? 
       AND tm.id IN (
         SELECT MAX(id) FROM training_maxes 
         WHERE user_id = ? 
         GROUP BY exercise_id
       )`,
      [userId, userId]
    ) as any[];

    // Load per-lift small-increment flags from the cycle being completed
    const liftConfigRows = database.getAllSync(
      `SELECT exercise_id, use_small_increments FROM cycle_lift_config WHERE cycle_id = ?`,
      [currentCycleId]
    ) as any[];
    const smallIncrMap: Record<number, boolean> = {};
    liftConfigRows.forEach((r) => { smallIncrMap[r.exercise_id] = r.use_small_increments === 1; });

    // Save new training maxes — skip progression for skipped lifts, halve for small increments
    for (const tm of trainingMaxes) {
      const wasSkipped = skippedExerciseIds.includes(tm.exercise_id);
      const isLower = tm.category === 'squat' || tm.category === 'deadlift';
      const useSmall = smallIncrMap[tm.exercise_id] ?? false;

      // Default: upper +5, lower +10. Small: upper +2.5, lower +5
      const defaultIncrement = isLower ? 10 : 5;
      const smallIncrement   = isLower ? 5  : 2.5;
      const increment = wasSkipped ? 0 : (useSmall ? smallIncrement : defaultIncrement);

      const newTrainingMax = tm.training_max + increment;
      const newActual1RM   = tm.actual_1rm   + increment;
      const incrLabel = useSmall ? `+${smallIncrement} (small)` : `+${defaultIncrement}`;
      const notes = wasSkipped
        ? `Skipped — no progression (Cycle #${currentCycle?.cycle_number})`
        : `Auto-progression from Cycle #${currentCycle?.cycle_number} (${incrLabel})`;

      database.runSync(
        `INSERT INTO training_maxes (user_id, exercise_id, actual_1rm, training_max, effective_date, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, tm.exercise_id, newActual1RM, newTrainingMax, today, notes]
      );
    }

    return { newCycleId, nextCycleNumber };
  },

  /** Returns the exercise_id of the most recently completed workout in this cycle. */
  getLastCompletedExerciseId: (cycleId: number, userId: number): number | null => {
    const database = openDatabase();
    const row = database.getFirstSync(
      `SELECT exercise_id FROM workouts
       WHERE cycle_id = ? AND user_id = ? AND completed = 1
       ORDER BY completed_at DESC, id DESC LIMIT 1`,
      [cycleId, userId]
    ) as any;
    return row?.exercise_id ?? null;
  },

  // Get total workout count
  getTotalWorkoutCount: (userId: number) => {
    const database = openDatabase();
    const result = database.getFirstSync(
      `SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND completed = 1`,
      [userId]
    ) as any;
    return result?.count || 0;
  },

  // ── Skip / Swap Lift ──────────────────────────────────────────────────────

  /** Mark a lift as skipped for this cycle (upsert). */
  skipLift: (cycleId: number, exerciseId: number) => {
    const database = openDatabase();
    database.runSync(
      `INSERT INTO cycle_lift_config (cycle_id, exercise_id, is_skipped)
       VALUES (?, ?, 1)
       ON CONFLICT(cycle_id, exercise_id) DO UPDATE SET is_skipped = 1`,
      [cycleId, exerciseId]
    );
  },

  /** Un-skip a lift for this cycle. */
  unskipLift: (cycleId: number, exerciseId: number) => {
    const database = openDatabase();
    database.runSync(
      `INSERT INTO cycle_lift_config (cycle_id, exercise_id, is_skipped)
       VALUES (?, ?, 0)
       ON CONFLICT(cycle_id, exercise_id) DO UPDATE SET is_skipped = 0`,
      [cycleId, exerciseId]
    );
  },

  /** Returns an array of exercise IDs that are currently skipped for this cycle. */
  getSkippedExerciseIds: (cycleId: number): number[] => {
    const database = openDatabase();
    const rows = database.getAllSync(
      `SELECT exercise_id FROM cycle_lift_config WHERE cycle_id = ? AND is_skipped = 1`,
      [cycleId]
    ) as any[];
    return rows.map((r) => r.exercise_id);
  },

  /**
   * Swap a lift slot to a substitute exercise name (upsert).
   * The original exercise_id is kept for TM tracking and progression.
   * e.g. swapLift(cycleId, deadliftId, "Romanian Deadlift")
   */
  swapLift: (cycleId: number, exerciseId: number, substituteName: string) => {
    const database = openDatabase();
    database.runSync(
      `INSERT INTO cycle_lift_config (cycle_id, exercise_id, is_skipped, substitute_name)
       VALUES (?, ?, 0, ?)
       ON CONFLICT(cycle_id, exercise_id) DO UPDATE SET is_skipped = 0, substitute_name = ?`,
      [cycleId, exerciseId, substituteName, substituteName]
    );
  },

  /** Clear a swap — lift returns to its original name. */
  clearSwap: (cycleId: number, exerciseId: number) => {
    const database = openDatabase();
    database.runSync(
      `INSERT INTO cycle_lift_config (cycle_id, exercise_id, is_skipped, substitute_name)
       VALUES (?, ?, 0, NULL)
       ON CONFLICT(cycle_id, exercise_id) DO UPDATE SET substitute_name = NULL`,
      [cycleId, exerciseId]
    );
  },

  /**
   * Returns the full lift config for this cycle.
   * Shape: { exercise_id, is_skipped, substitute_name, use_small_increments }[]
   */
  getLiftConfig: (cycleId: number): { exercise_id: number; is_skipped: boolean; substitute_name: string | null; use_small_increments: boolean }[] => {
    const database = openDatabase();
    const rows = database.getAllSync(
      `SELECT exercise_id, is_skipped, substitute_name, use_small_increments
       FROM cycle_lift_config WHERE cycle_id = ?`,
      [cycleId]
    ) as any[];
    return rows.map((r) => ({
      exercise_id: r.exercise_id,
      is_skipped: r.is_skipped === 1,
      substitute_name: r.substitute_name ?? null,
      use_small_increments: r.use_small_increments === 1,
    }));
  },

  // ── Stalling Protocol ────────────────────────────────────────────────────

  /**
   * Returns the last `limit` AMRAP set results for a given exercise.
   * Each row: { actual_reps, prescribed_reps, cycle_id, week_number }
   */
  getAmrapHistory: (userId: number, exerciseId: number, limit: number = 5) => {
    const database = openDatabase();
    return database.getAllSync(
      `SELECT s.actual_reps, s.prescribed_reps, w.cycle_id, w.week_number
       FROM sets s
       JOIN workouts w ON s.workout_id = w.id
       WHERE s.is_amrap = 1
         AND w.exercise_id = ?
         AND w.user_id = ?
         AND s.completed = 1
       ORDER BY w.cycle_id DESC, w.id DESC
       LIMIT ?`,
      [exerciseId, userId, limit]
    ) as { actual_reps: number; prescribed_reps: number; cycle_id: number; week_number: number }[];
  },

  /**
   * Returns stall/warning status for a lift.
   * stalled  = missed prescribed minimum on the last 2 consecutive AMRAP sets
   *            (only counting sets that occurred AFTER the most recent TM reset)
   * warning  = missed prescribed minimum on the most recent AMRAP set (first miss)
   *
   * A TM reset clears the stall slate — misses before the reset are ignored.
   */
  getStallStatus: (userId: number, exerciseId: number): { isStalled: boolean; isWarning: boolean } => {
    const database = openDatabase();

    // Find the most recent stall reset date for this lift (if any)
    const lastReset = database.getFirstSync(
      `SELECT created_at FROM training_maxes
       WHERE user_id = ? AND exercise_id = ? AND notes LIKE 'Stall reset%'
       ORDER BY id DESC LIMIT 1`,
      [userId, exerciseId]
    ) as any;
    const resetCutoff: string | null = lastReset?.created_at ?? null;

    // Fetch the last 2 AMRAP sets, filtering to only those AFTER the last reset
    const rows = database.getAllSync(
      `SELECT s.actual_reps, s.prescribed_reps, w.cycle_id, w.week_number
       FROM sets s
       JOIN workouts w ON s.workout_id = w.id
       WHERE s.is_amrap = 1
         AND w.exercise_id = ?
         AND w.user_id = ?
         AND s.completed = 1
         ${resetCutoff ? "AND s.created_at > ?" : ""}
       ORDER BY w.cycle_id DESC, w.id DESC
       LIMIT 2`,
      resetCutoff ? [exerciseId, userId, resetCutoff] : [exerciseId, userId]
    ) as { actual_reps: number; prescribed_reps: number; cycle_id: number; week_number: number }[];

    if (rows.length === 0) return { isStalled: false, isWarning: false };

    const missed = (row: { actual_reps: number; prescribed_reps: number }) =>
      row.actual_reps < row.prescribed_reps;

    const isWarning = missed(rows[0]);
    const isStalled = isWarning && rows.length >= 2 && missed(rows[1]);

    return { isStalled, isWarning };
  },

  /**
   * Reset a lift's training max to 90% of current TM (Wendler "5 forward, 3 back").
   * Saves a new training_max entry.
   */
  resetTrainingMax: (userId: number, exerciseId: number): number => {
    const database = openDatabase();
    const current = database.getFirstSync(
      `SELECT training_max FROM training_maxes
       WHERE user_id = ? AND exercise_id = ?
       ORDER BY effective_date DESC, id DESC LIMIT 1`,
      [userId, exerciseId]
    ) as any;

    if (!current) return 0;

    const newTM = Math.round((current.training_max * 0.9) / 5) * 5; // round to nearest 5
    const newActual1RM = Math.round((newTM / 0.9) / 5) * 5;
    const today = new Date().toISOString().split('T')[0];

    database.runSync(
      `INSERT INTO training_maxes (user_id, exercise_id, actual_1rm, training_max, effective_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, exerciseId, newActual1RM, newTM, today, 'Stall reset — TM × 0.9 (5 forward, 3 back)']
    );
    return newTM;
  },

  /** Toggle small increments for a lift in the current cycle (+2.5/+5 instead of +5/+10). */
  setSmallIncrements: (cycleId: number, exerciseId: number, enabled: boolean) => {
    const database = openDatabase();
    database.runSync(
      `INSERT INTO cycle_lift_config (cycle_id, exercise_id, use_small_increments)
       VALUES (?, ?, ?)
       ON CONFLICT(cycle_id, exercise_id) DO UPDATE SET use_small_increments = ?`,
      [cycleId, exerciseId, enabled ? 1 : 0, enabled ? 1 : 0]
    );
  },
};
