# Never Miss Twice

A simple habit tracker with no streaks. Missing a day doesn't reset your progress. 
Your score dips a little, and bouncing back the next day earns it back.

## Features

- Track one habit with three versions: Full, Tiny, and Micro
- A score that rewards showing up, especially on hard days
- Log your energy level each day (Low, Okay, High)
- 30-day calendar where you can tap a day to fix it
- Daily reminder notification at a time you choose
- Everything is stored on your device (via Asyncstorage). No account or internet needed.

## How to Use

1. Set up your Habit: Enter a name, plus a full, tiny, and micro version of it. For example:
   - Full: Read 10 pages
   - Tiny: Read 1 page
   - Micro: Read 1 sentence
2. Pick a reminder time in `HH:MM` format (24-hour), like `08:00`.
3. Each day, set your energy level and tap the version of the habit you did.
4. Fix mistakes by tapping a day on the calendar. Each tap cycles through: full, tiny, micro, missed, blank.

## How the Score Works

Your score is a percentage, shown for the last 30 days and for all time.
Scoring: 
Full version | 1 point 
Tiny version | 0.6 points 
Micro version | 0.4 points 
Did it the day after a miss | +0.25 bonus ("rebound") 
Did it on a low-energy day | +0.2 bonus 
Missed a day | 0 points 
Missed two days in a row | The second miss counts extra against you, so Never Miss Twice! 

Today doesn't count against you until you've had a chance to log it.

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) (LTS version)
- The [Expo Go](https://expo.dev/go) app on your phone, or an iOS/Android emulator

### Install

```bash
npm install
npx expo install @react-native-async-storage/async-storage expo-notifications
```

### Run

```bash
npx expo start
```

Then scan the QR code with Expo Go, or press `i` (iOS simulator) or `a` (Android emulator).

## Notes

- Notifications: You'll be asked for permission the first time. 
- Your data's saved locally with AsyncStorage. Deleting the app will delete your data. 

