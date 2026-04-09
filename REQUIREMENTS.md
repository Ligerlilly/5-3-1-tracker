# 5-3-1 Workout Tracker - Requirements Document

## Executive Summary

A React Native Expo mobile application using SQLite to track Jim Wendler's 5-3-1 strength training program. The app will help users manage their workout cycles, track progress, calculate percentages, and maintain personal records.

---

## 1. Program Overview

### 1.1 Core 5-3-1 Philosophy

- **Four Main Lifts**: Military Press, Deadlift, Bench Press, Squat
- **Progressive Overload**: Slow, steady progression over time
- **Start Light**: Begin with 90% of actual 1RM (Training Max)
- **Break PRs**: Focus on rep maxes, not just 1RM
- **Deload**: Every 4th week for recovery

### 1.2 Training Cycle Structure

Each cycle consists of 4 weeks:

- **Week 1 (3x5)**: 65%×5, 75%×5, 85%×5+
- **Week 2 (3x3)**: 70%×3, 80%×3, 90%×3+
- **Week 3 (5/3/1)**: 75%×5, 85%×3, 95%×1+
- **Week 4 (Deload)**: 40%×5, 50%×5, 60%×5

_Note: The "+" indicates AMRAP (as many reps as possible) on the final set_

---

## 2. Application Requirements

### 2.1 User Management

- [ ] User profile creation and management
- [ ] Single user per device (can be expanded later for multi-user)
- [ ] User preferences and settings storage

### 2.2 Exercise Management

#### 2.2.1 Core Lifts

The app must support the four main lifts:

1. **Military Press (Overhead Press)**
2. **Deadlift**
3. **Bench Press**
4. **Squat**

#### 2.2.2 One Rep Max (1RM) Management

- [ ] Input actual 1RM for each lift
- [ ] Calculate estimated 1RM from rep maxes using formula: `Weight × Reps × 0.0333 + Weight`
- [ ] Automatic calculation of Training Max (90% of 1RM)
- [ ] Manual override option for Training Max
- [ ] History of 1RM changes over time

### 2.3 Cycle Management

#### 2.3.1 Cycle Creation

- [ ] Create new training cycles
- [ ] Set start date for cycle
- [ ] Automatic 4-week cycle generation
- [ ] Option to choose between 3-day and 4-day training splits

#### 2.3.2 Cycle Progression

- [ ] Automatic progression after cycle completion:
    - Upper body (Press, Bench): +5 lbs
    - Lower body (Squat, Deadlift): +10 lbs
- [ ] Option for smaller increments (+2.5 lbs / +5 lbs)
- [ ] Manual adjustment capability

#### 2.3.3 Training Schedule Templates

**4-Day Split** (Default):

- Day 1: Military Press
- Day 2: Deadlift
- Day 3: Bench Press
- Day 4: Squat

**3-Day Split**:

- Configurable based on user preference

### 2.4 Workout Session Features

#### 2.4.1 Warm-up Sets

Calculate and display warm-up sets:

- 1×5 @ 40% of Training Max
- 1×5 @ 50% of Training Max
- 1×3 @ 60% of Training Max

#### 2.4.2 Work Sets

- [ ] Display prescribed sets, reps, and weights for the day
- [ ] Calculate exact weights based on Training Max and week percentages
- [ ] Round weights to nearest 2.5 or 5 lbs (user preference)
- [ ] Track completion of each set
- [ ] Record actual reps performed on AMRAP sets
- [ ] Timer between sets (optional)

#### 2.4.3 Assistance Work Tracking

Support for multiple assistance templates:

1. **Boring But Big**: Same lift 5×10 @ 40-60%
2. **Triumvirate**: 3 total exercises including main lift
3. **I'm Not Doing Jack Shit**: Main lift only
4. **Periodization Bible**: Multiple assistance exercises
5. **Bodyweight**: Bodyweight assistance work
6. **Custom**: User-defined assistance work

Assistance exercise features:

- [ ] Pre-defined exercise library
- [ ] Custom exercise creation
- [ ] Track sets, reps, and weights
- [ ] Notes per exercise

### 2.5 Progress Tracking & Analytics

#### 2.5.1 Personal Records (PRs)

- [ ] Track rep maxes for all main lifts
- [ ] Highlight when new PR is achieved
- [ ] PR history and timeline
- [ ] Compare rep maxes using estimated 1RM formula
- [ ] Visual indicators for PR achievements

#### 2.5.2 Progress Charts

- [ ] Weight progression over time (per lift)
- [ ] Volume progression (tonnage)
- [ ] Training Max progression
- [ ] Rep PR progression
- [ ] Cycle completion rate

#### 2.5.3 Statistics

- [ ] Total workouts completed
- [ ] Current cycle information
- [ ] Total cycles completed
- [ ] Strongest lifts comparison
- [ ] Estimated 1RM calculations

### 2.6 Deload Management

- [ ] Automatic deload week (Week 4)
- [ ] No AMRAP sets during deload
- [ ] Lighter percentages: 40%, 50%, 60%
- [ ] Option to extend deload or rest

### 2.7 Program Variations

#### 2.7.1 Percentage Options

Support both percentage schemes:

- **Option 1**: 65/75/85, 70/80/90, 75/85/95
- **Option 2**: 75/80/85, 80/85/90, 75/85/95

#### 2.7.2 Stalling Protocol

- [ ] Track when user cannot complete prescribed reps
- [ ] Guide user to reset: take 90% of current Training Max
- [ ] Option to reset individual lifts independently

---

## 3. Technical Requirements

### 3.1 Platform

- **Framework**: React Native with Expo
- **Database**: SQLite (expo-sqlite)
- **Platforms**: iOS and Android
- **Offline-first**: Full functionality without internet

### 3.2 Database Schema

#### 3.2.1 Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  weight_unit TEXT DEFAULT 'lbs', -- 'lbs' or 'kg'
  rounding_preference REAL DEFAULT 5, -- 2.5 or 5
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.2 Exercises Table

```sql
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'main' or 'assistance'
  category TEXT, -- 'squat', 'bench', 'deadlift', 'press', 'other'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.3 Training Maxes Table

```sql
CREATE TABLE training_maxes (
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
```

#### 3.2.4 Cycles Table

```sql
CREATE TABLE cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  cycle_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  percentage_option INTEGER DEFAULT 1, -- 1 or 2
  training_days INTEGER DEFAULT 4, -- 3 or 4
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3.2.5 Workouts Table

```sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  cycle_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  week_number INTEGER NOT NULL, -- 1, 2, 3, or 4
  workout_date DATE,
  training_max_used REAL NOT NULL,
  completed BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (cycle_id) REFERENCES cycles(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);
```

#### 3.2.6 Sets Table

```sql
CREATE TABLE sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  set_type TEXT NOT NULL, -- 'warmup' or 'work' or 'assistance'
  set_number INTEGER NOT NULL,
  prescribed_reps INTEGER,
  prescribed_weight REAL,
  prescribed_percentage REAL,
  actual_reps INTEGER,
  actual_weight REAL,
  is_amrap BOOLEAN DEFAULT 0,
  is_pr BOOLEAN DEFAULT 0,
  rpe INTEGER, -- Rate of Perceived Exertion (1-10)
  completed BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_id) REFERENCES workouts(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);
```

#### 3.2.7 Assistance Work Table

```sql
CREATE TABLE assistance_work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight REAL,
  notes TEXT,
  completed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_id) REFERENCES workouts(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);
```

#### 3.2.8 Personal Records Table

```sql
CREATE TABLE personal_records (
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
```

#### 3.2.9 Assistance Templates Table

```sql
CREATE TABLE assistance_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_data TEXT, -- JSON data for exercises, sets, reps
  is_active BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.3 Key Calculations & Formulas

#### 3.3.1 Training Max Calculation

```javascript
trainingMax = actual1RM * 0.9;
```

#### 3.3.2 Work Set Weight Calculation

```javascript
workSetWeight = round(trainingMax * percentage, roundingPreference);
```

#### 3.3.3 Estimated 1RM Calculation

```javascript
estimated1RM = weight * reps * 0.0333 + weight;
```

#### 3.3.4 Weight Rounding

```javascript
roundWeight(weight, increment) {
  return Math.round(weight / increment) * increment
}
```

### 3.4 UI/UX Requirements

#### 3.4.1 Navigation Structure

```
Main Navigation (Bottom Tabs):
├── Home/Dashboard
├── Current Workout
├── Progress
├── History
└── Settings
```

#### 3.4.2 Key Screens

**1. Onboarding/Setup**

- Welcome screen
- Input actual 1RMs for four main lifts
- Choose training schedule (3 or 4 days)
- Choose percentage option
- Select rounding preference

**2. Dashboard**

- Current cycle overview
- Next scheduled workout
- Recent PRs
- Quick stats
- Motivational progress indicators

**3. Workout Screen**

- Current exercise and week
- Warm-up sets with weights calculated
- Work sets with prescribed weights/reps
- Quick weight calculator
- Rest timer
- Form for logging actual reps
- Option to add assistance work
- Complete workout button

**4. Progress Screen**

- Charts for each main lift
- PR timeline
- Cycle history
- Estimated 1RM progression
- Volume/tonnage tracking

**5. History Screen**

- List of all completed workouts
- Filter by exercise, date, cycle
- Detailed view of past workouts
- Edit capability for corrections

**6. Settings Screen**

- Update 1RMs/Training Maxes
- Change rounding preference
- Edit assistance templates
- App preferences
- Data export/backup

#### 3.4.3 UX Features

- [ ] Swipe gestures for set completion
- [ ] Plate calculator (shows which plates to load)
- [ ] Dark mode support
- [ ] Haptic feedback for milestones
- [ ] Confetti/celebration animation for PRs
- [ ] Rest timer with notifications
- [ ] Quick access to previous performance on same workout

### 3.5 Performance Requirements

- [ ] App launch time < 2 seconds
- [ ] Workout screen loads instantly (< 500ms)
- [ ] Smooth 60fps scrolling
- [ ] Database queries < 100ms
- [ ] Support for 5+ years of workout data

### 3.6 Data Management

#### 3.6.1 Data Persistence

- [ ] All data stored locally in SQLite
- [ ] Automatic database backups
- [ ] Data integrity checks

#### 3.6.2 Data Export/Import

- [ ] Export to JSON
- [ ] Export to CSV (for spreadsheet analysis)
- [ ] Backup/restore functionality
- [ ] Share workout summaries

---

## 4. Feature Prioritization

### 4.1 MVP (Phase 1)

**Must Have:**

- [ ] User setup with 1RM input
- [ ] Training Max calculation
- [ ] Cycle creation and management
- [ ] Workout screen with calculated weights
- [ ] Log sets and reps
- [ ] Track AMRAP sets
- [ ] Basic PR detection
- [ ] Automatic cycle progression
- [ ] 4-day training schedule
- [ ] Main lifts only (no assistance initially)

### 4.2 Phase 2

**Should Have:**

- [ ] Assistance work tracking (Boring But Big template)
- [ ] Progress charts
- [ ] PR history
- [ ] Workout history
- [ ] 3-day training schedule
- [ ] Plate calculator
- [ ] Rest timer
- [ ] Edit past workouts

### 4.3 Phase 3

**Nice to Have:**

- [ ] Multiple assistance templates
- [ ] Custom assistance exercises
- [ ] Advanced analytics
- [ ] Data export
- [ ] Dark mode
- [ ] Widget support
- [ ] Apple Watch / Wear OS companion
- [ ] Rep max calculator tool
- [ ] Cycle comparison tools

---

## 5. Business Logic Rules

### 5.1 Cycle Progression Rules

1. After completing Week 4 (Deload), automatically create new cycle
2. Increase Training Max by:
    - Press & Bench: +5 lbs
    - Squat & Deadlift: +10 lbs
3. Minimum 3 workouts per week to complete cycle
4. Can extend deload week if needed

### 5.2 PR Detection Rules

1. PR is achieved when estimated 1RM exceeds previous best for that weight/rep combo
2. Only AMRAP sets count for PRs
3. Compare using formula: `Weight × Reps × 0.0333 + Weight`
4. Track separate PRs for each rep range (e.g., 5RM, 3RM, 1RM)

### 5.3 Stalling Rules

1. If user fails to get prescribed minimum reps on AMRAP set twice in a row
2. Recommend reset: New Training Max = Current Training Max × 0.9
3. Can reset individual lifts independently
4. Option to switch to smaller increments (+2.5/+5 instead of +5/+10)

### 5.4 Deload Rules

1. Week 4 is always deload
2. No AMRAP on deload week - only prescribed reps
3. Can manually trigger deload if feeling overtrained
4. Can extend deload to 2 weeks if needed

---

## 6. Validation Rules

### 6.1 Input Validation

- [ ] 1RM must be positive number > 0
- [ ] Weight inputs must be valid numbers
- [ ] Rep counts must be integers ≥ 0
- [ ] Dates must be valid
- [ ] Training Max cannot exceed actual 1RM

### 6.2 Data Integrity

- [ ] Cannot delete exercise with existing workout history
- [ ] Cannot delete cycle with logged workouts
- [ ] Training Max history maintained (never deleted)
- [ ] PR history immutable (can add, not delete)

---

## 7. Future Enhancements (Post-MVP)

### 7.1 Advanced Features

- [ ] Cloud sync (optional)
- [ ] Social features (share PRs)
- [ ] Custom program builder
- [ ] Video form checks
- [ ] AI-powered form analysis
- [ ] Integration with fitness wearables
- [ ] Nutrition tracking
- [ ] Body weight tracking correlation
- [ ] Multiple program support (Beyond 5-3-1, BBB, etc.)

### 7.2 Premium Features

- [ ] Advanced analytics
- [ ] Custom programming
- [ ] Coach/trainer portal
- [ ] Video library
- [ ] Community features

---

## 8. Success Metrics

### 8.1 User Engagement

- Daily active users
- Workout completion rate
- Cycle completion rate
- Average workouts per week

### 8.2 App Performance

- Crash rate < 0.1%
- Average session duration
- User retention (1 week, 1 month, 3 months)

### 8.3 Feature Usage

- Most used assistance templates
- Average time to log workout
- PR achievement rate

---

## 9. Technical Stack

### 9.1 Core Technologies

- **React Native**: Latest stable version
- **Expo**: Managed workflow
- **TypeScript**: For type safety
- **expo-sqlite**: Local database
- **React Navigation**: Navigation
- **React Native Paper** or **NativeBase**: UI components
- **Victory Native** or **react-native-chart-kit**: Charts
- **AsyncStorage**: User preferences

### 9.2 Development Tools

- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Expo Go**: Development testing
- **EAS Build**: Production builds

---

## 10. Accessibility Requirements

- [ ] Screen reader support
- [ ] Large text support
- [ ] High contrast mode
- [ ] Voice input for rep counting
- [ ] Simple, clear navigation
- [ ] Color blind friendly design

---

## 11. Security & Privacy

- [ ] All data stored locally
- [ ] No mandatory account creation
- [ ] Optional cloud backup with encryption
- [ ] No tracking or analytics without consent
- [ ] Secure data export

---

## 12. Testing Requirements

### 12.1 Unit Tests

- [ ] Calculation functions (1RM, Training Max, percentages)
- [ ] Weight rounding logic
- [ ] PR detection logic
- [ ] Cycle progression logic

### 12.2 Integration Tests

- [ ] Database operations
- [ ] Workout flow end-to-end
- [ ] Cycle creation and progression
- [ ] Data export/import

### 12.3 User Testing

- [ ] Onboarding flow
- [ ] Workout logging experience
- [ ] Navigation usability
- [ ] Performance on various devices

---

## Appendix A: 5-3-1 Quick Reference

### Week 1 (3x5)

- Set 1: 65% × 5 reps
- Set 2: 75% × 5 reps
- Set 3: 85% × 5+ reps (AMRAP)

### Week 2 (3x3)

- Set 1: 70% × 3 reps
- Set 2: 80% × 3 reps
- Set 3: 90% × 3+ reps (AMRAP)

### Week 3 (5/3/1)

- Set 1: 75% × 5 reps
- Set 2: 85% × 3 reps
- Set 3: 95% × 1+ reps (AMRAP)

### Week 4 (Deload)

- Set 1: 40% × 5 reps
- Set 2: 50% × 5 reps
- Set 3: 60% × 5 reps

### Warm-up Sets (Before Work Sets)

- Set 1: 40% × 5 reps
- Set 2: 50% × 5 reps
- Set 3: 60% × 3 reps

---

## Appendix B: Glossary

- **1RM**: One Rep Max - the maximum weight you can lift for one repetition
- **Training Max**: 90% of actual 1RM, used for calculating work sets
- **AMRAP**: As Many Reps As Possible
- **PR**: Personal Record
- **Deload**: Reduced intensity week for recovery
- **Cycle**: 4-week training period
- **Work Sets**: The prescribed sets after warm-up
- **Assistance Work**: Supplemental exercises after main lift

---

## Document Version

- **Version**: 1.0
- **Date**: April 9, 2026
- **Author**: Requirements for 5-3-1 Tracker App
- **Based On**: Jim Wendler's 5-3-1: The Simplest and Most Effective Training System (2nd Edition)
