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
    if (type) {
      return database.getAllSync('SELECT * FROM exercises WHERE type = ? ORDER BY id', [type]);
    }
    return database.getAllSync('SELECT * FROM exercises ORDER BY id');
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
       ORDER BY e.id`,
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
};
