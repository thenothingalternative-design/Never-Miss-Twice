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

### Install

This will be a dev build. First, you need to set up both Android Studio and ADB: 
https://developer.android.com/courses/pathways/android-basics-compose-unit-1-pathway-2
https://www.howtogeek.com/125769/how-to-install-and-use-abd-the-android-debug-bridge-utility/


In your command prompt terminal: 

```bash
npm install
npx expo install @react-native-async-storage/async-storage expo-notifications
```
Then, you need to download the app to the phone. With your phone connected to your laptop via USB, run: 

```bash
cd /path/to/where/you/cloned/the/repo # <- this is the path to habit/, not the root folder
npx expo run:android
```

It should boot up with the onboarding pages the first time. As long as you don't delete the app's data, 
it'll remember you and you won't see the onboarding page again. 

### Testing different features: 

Tap on any of the options, Full, Tiny, Micro. You should see your overall percentage score at the top change. 
The lowest energy level gives a bonus score to encourage you to show up on your bad days. 

You'll see the calendar at the bottom. Note that there's only one entry (because you downloaded the app a minute ago). 
If you want to see the full calendar, you'll have to edit the code and build again: 

Inside App.tsx (as of this README version, exactly at line 159): Change startdate in save({ config, startDate: toKey(new Date()), ...}) to toKey(addDays(new Date(), -10)): 

```bash 
return <Onboarding onDone={config => save({ config, startDate: toKey(addDays(new Date(), -10)), logs: {} })} />;
```

This will make it so there's 10 unlogged past days on the calendar. To see this change, you'll have to reset the app storage. Because this is a dev build, you should be able to delete app storage and cache like you could with any other app. 
You could also delete the app entirely off your phone and rebuild it with npx expo run:android again. 

If you want to see notifications working immediately, set your notification reminder to a few minutes ahead, in 24 hour 
clock time. Make sure to allow notifications when prompted. 

## Notes


