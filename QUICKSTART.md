# 5-3-1 Tracker - Quick Start Guide

## Getting Started

### 1. Start the App

The development server should already be running. If not:

```bash
cd /Users/jasonlane/js/5-3-1-tracker/app
npm start
```

### 2. First Time Setup

When you first launch the app, you'll see the **Onboarding Screen**:

1. Enter your name
2. Enter your current 1RM (One Rep Max) for each lift:
    - Military Press
    - Deadlift
    - Bench Press
    - Squat

**Important**: Be conservative with your numbers! The 5-3-1 program works best when you start lighter than you think you should.

Example values:

- Military Press: 135 lbs
- Deadlift: 315 lbs
- Bench Press: 225 lbs
- Squat: 275 lbs

3. Tap "Start Training"

### 3. Dashboard

After setup, you'll see:

- Your name and current cycle number
- Your Training Max for each lift (automatically calculated as 90% of your 1RM)
- "Start Today's Workout" button

### 4. Start a Workout

1. Tap "Start Today's Workout"
2. Select which week you're on (Week 1, 2, 3, or 4)
3. Select which exercise you want to do
4. (Currently shows alert - full workout screen coming next!)

## Current Features ✅

- ✅ User onboarding with 1RM input
- ✅ Automatic Training Max calculation (90% of 1RM)
- ✅ First cycle creation
- ✅ Dashboard with cycle and training max display
- ✅ Workout selection (exercise + week)
- ✅ All data saved in SQLite database

## Coming Next 🚧

- Workout screen with calculated weights for warmup and work sets
- AMRAP set tracking
- Personal Record detection
- Complete navigation flow
- Workout history

## Testing the Database

All your data is stored locally in SQLite. You can:

- Close and reopen the app - your data persists
- Enter different 1RMs - Training Maxes update automatically
- View your current cycle information

## Understanding the Numbers

### Training Max

- Your Training Max = Your 1RM × 0.9
- Example: If your Deadlift 1RM is 315 lbs, Training Max = 283.5 lbs (rounded to 285 lbs)

### Why 90%?

Jim Wendler recommends using 90% of your actual max to:

- Allow for consistent progress over time
- Prevent burnout
- Ensure you can complete your prescribed reps
- Leave room for PR attempts on AMRAP sets

### The Four Week Cycle

**Week 1 (3×5)**: Sets of 5 reps

- 65% × 5, 75% × 5, 85% × 5+

**Week 2 (3×3)**: Sets of 3 reps

- 70% × 3, 80% × 3, 90% × 3+

**Week 3 (5/3/1)**: Mixed reps

- 75% × 5, 85% × 3, 95% × 1+

**Week 4 (Deload)**: Recovery week

- 40% × 5, 50% × 5, 60% × 5

The "+" means "or more" - go for as many reps as possible (AMRAP) on the final set!

## Need Help?

Check the REQUIREMENTS.md file for complete technical details and the full 5-3-1 program reference.

---

**Happy Lifting! 💪**
