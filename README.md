# 5-3-1 Workout Tracker

A React Native Expo application for tracking Jim Wendler's 5-3-1 strength training program, built with TypeScript and SQLite.

## What's Been Built (MVP - Phase 1)

### ✅ Completed Features

1. **Project Setup**
    - Expo TypeScript project initialized
    - Required dependencies installed (expo-sqlite, react-navigation, react-native-paper)
    - Proper project structure with organized folders

2. **Database Layer**
    - SQLite database schema implementation
    - 7 core tables: users, exercises, training_maxes, cycles, workouts, sets, personal_records
    - Comprehensive database utilities with CRUD operations
    - Automatic seeding of main exercises (Military Press, Deadlift, Bench Press, Squat)

3. **Core Utilities**
    - Training Max calculations (90% of 1RM)
    - Estimated 1RM calculator (Weight × Reps × 0.0333 + Weight)
    - Weight rounding functions (2.5 or 5 lbs increments)
    - Work set weight calculator
    - Warmup set calculator
    - Plate loading calculator
    - Progression increment logic (upper body +5 lbs, lower body +10 lbs)

4. **Type System**
    - Complete TypeScript interfaces for all data models
    - Percentage schemes for both 5-3-1 options
    - Exercise definitions and categories

5. **Onboarding Screen**
    - User profile creation
    - 1RM input for all four main lifts
    - Automatic Training Max calculation
    - Input validation
    - First cycle creation

6. **Dashboard Screen**
    - User greeting
    - Current cycle display
    - Training maxes overview (Actual 1RM and Training Max for each lift)
    - Clean card-based UI

## Project Structure

```
app/
├── src/
│   ├── database/
│   │   └── db.ts                 # SQLite setup and queries
│   ├── screens/
│   │   ├── OnboardingScreen.tsx  # Initial setup flow
│   │   └── DashboardScreen.tsx   # Main dashboard
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   ├── utils/
│   │   └── calculations.ts       # 5-3-1 calculations
│   ├── components/               # (Ready for components)
│   ├── navigation/               # (Ready for navigation)
│   └── constants/                # (Ready for constants)
├── App.tsx                       # Main app component
└── package.json
```

## Running the App

### Prerequisites

- Node.js (v20.9.0 or higher recommended)
- npm or yarn
- Expo Go app on your mobile device (iOS/Android)

### Installation

```bash
cd app
npm install
```

### Start Development Server

```bash
npm start
```

Then:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

## How It Works

### First Launch (Onboarding)

1. App checks if user exists in database
2. If no user, shows onboarding screen
3. User enters name and 1RM for all four main lifts
4. App calculates Training Maxes (90% of 1RM)
5. Creates first cycle automatically
6. Redirects to dashboard

### Dashboard

- Displays current cycle information
- Shows all training maxes
- Prepared for "Start Workout" functionality (coming next)

## 5-3-1 Program Implementation

### Core Philosophy (Implemented)

- ✅ Start with 90% of actual 1RM (Training Max)
- ✅ Four main lifts: Military Press, Deadlift, Bench Press, Squat
- ✅ Progressive overload built into cycle structure

### Cycle Structure (Database Ready)

Each cycle consists of 4 weeks:

- **Week 1 (3×5)**: 65%×5, 75%×5, 85%×5+
- **Week 2 (3×3)**: 70%×3, 80%×3, 90%×3+
- **Week 3 (5/3/1)**: 75%×5, 85%×3, 95%×1+
- **Week 4 (Deload)**: 40%×5, 50%×5, 60%×5

_The "+" indicates AMRAP (As Many Reps As Possible)_

### Progression Rules (Implemented in Utils)

After each 4-week cycle:

- Upper body lifts (Press, Bench): +5 lbs
- Lower body lifts (Squat, Deadlift): +10 lbs

## Next Steps (Phase 2)

To complete the MVP, the following features need to be added:

1. **Workout Screen**
    - Select exercise and week number
    - Display warmup sets with calculated weights
    - Display work sets with prescribed reps/weights
    - Input actual reps performed
    - AMRAP set tracking
    - Save workout to database

2. **PR Detection**
    - Automatic PR calculation on AMRAP sets
    - Save PRs to database
    - Visual feedback when PR is achieved

3. **Navigation**
    - Bottom tab navigation
    - Workout → Dashboard flow
    - History screen

4. **Cycle Management**
    - Automatic progression to next cycle
    - Training Max updates

## Technical Stack

- **Framework**: React Native with Expo (SDK 52)
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **UI Library**: React Native Paper
- **Navigation**: React Navigation (installed, not yet implemented)
- **State Management**: React Hooks

## Database Schema

All tables are created and seeded. Key tables:

- `users` - User profiles
- `exercises` - Exercise library (4 main lifts seeded)
- `training_maxes` - Historical training max records
- `cycles` - 4-week training cycles
- `workouts` - Individual workout sessions
- `sets` - Individual sets within workouts
- `personal_records` - PR tracking

## Key Calculations

```typescript
// Training Max = 90% of 1RM
trainingMax = actual1RM * 0.9

// Estimated 1RM from reps
estimated1RM = weight * reps * 0.0333 + weight

// Work Set Weight
workSetWeight = round(trainingMax * percentage, roundingPreference)

// Warmup Sets
40% × 5, 50% × 5, 60% × 3
```

## Development Notes

- The app uses SQLite for offline-first functionality
- All workout data is stored locally
- TypeScript provides type safety throughout
- React Native Paper provides Material Design components
- Database is initialized on first app launch

## License

This project is based on Jim Wendler's 5-3-1 training methodology. Please refer to the official 5-3-1 books for complete program details.

---

**Status**: MVP Phase 1 Complete ✅  
**Next**: Implement Workout Screen and PR Detection (Phase 2)
