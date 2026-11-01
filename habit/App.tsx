import React, { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Types 
type Status = 'full' | 'tiny' | 'micro' | 'miss';
type Energy = 0 | 1 | 2; // low, okay, high
interface DayEntry { status?: Status; energy?: Energy }
type Logs = Record<string, DayEntry>; // YYYY-MM-DD
interface Config { name: string; full: string; tiny: string; micro: string; time: string }
interface Data { config: Config; startDate: string; logs: Logs }

// Dates 
const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const startOfToday = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };

// Scoring 
const POINTS = { full: 1, tiny: 0.6, micro: 0.4 };
const REBOUND_BONUS = 0.25;     
const LOW_ENERGY_BONUS = 0.2;   
const DOUBLE_MISS_PENALTY = 0.5; 


function score(startDate: string, logs: Logs, windowStart: Date): number {
  const today = startOfToday();
  let earned = 0, expected = 0, previousMissed = false;
  for (let date = fromKey(startDate); date <= today; date = addDays(date, 1)) {
    const key = toKey(date);
    const { status, energy } = logs[key] ?? {};
    if (!status && key === toKey(today)) continue; 
    const counts = date >= windowStart;
    if (!status || status === 'miss') {
      if (counts) expected += previousMissed ? 1 + DOUBLE_MISS_PENALTY : 1;
      previousMissed = true;
      continue;
    }
    if (counts) {
      earned += POINTS[status] + (previousMissed ? REBOUND_BONUS : 0) + (energy === 0 ? LOW_ENERGY_BONUS : 0);
      expected += 1;
    }
    previousMissed = false;
  }
  return expected === 0 ? 100 : Math.min(100, Math.round((earned / expected) * 100));
}

// Notifications 
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

async function scheduleDailyReminder(time: string) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Good Morning', body: 'Time for your habit. Even the tiny version counts.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hour || 8, minute: minute || 0 },
    });
  } catch (error) {
    console.warn('Could not schedule reminder', error);
  }
}

// Small UI 
const Button = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && { opacity: 0.4 }]}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
    <Text style={{ color: selected ? '#fff' : '#1b5e20' }}>{label}</Text>
  </Pressable>
);

// Onboarding 
function Onboarding({ onDone }: { onDone: (config: Config) => void }) {
  const [page, setPage] = useState(0);
  const [config, setConfig] = useState<Config>({ name: '', full: '', tiny: '', micro: '', time: '08:00' });

  const field = (key: keyof Config, label: string) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={config[key]} onChangeText={text => setConfig({ ...config, [key]: text })} />
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {page === 0 ? (
          <>
            <Text style={styles.title}> NO MORE HABIT STREAKS.</Text>
            <Text style={styles.body}>
              Missing a day doesn't reset your progress. Instead, your score just dips a little, and bouncing back tomorrow earns it back.
            </Text>
            <Button label="Continue" onPress={() => setPage(1)} />
          </>
        ) : (
          <>
            <Text style={styles.title}>Set up your habit</Text>
            {field('name', 'Habit name')}
            {field('full', 'Full version (e.g. Read 10 pages)')}
            {field('tiny', 'Tiny version (e.g. Read 1 page)')}
            {field('micro', 'Micro version (e.g. Open the book)')}
            {field('time', 'Daily reminder time (HH:MM)')}
            <Button label="Start" disabled={!config.name || !config.full || !config.tiny || !config.micro} onPress={() => onDone(config)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------- Main -------------------
//
//
//
//------------------------------------------
const STORAGE_KEY = 'habit-minimal-1';
const ENERGY_LABELS = ['Low', 'Okay', 'High'];
const STATUS_CYCLE: (Status | undefined)[] = [undefined, 'full', 'tiny', 'micro', 'miss'];
const STATUS_COLORS: Record<Status, string> = { full: '#2e7d32', tiny: '#81c784', micro: '#c8e6c9', miss: '#eef6ee' };
const CALENDAR_DAYS = 30;

export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) setData(JSON.parse(stored) as Data);
      setIsLoaded(true);
    });
  }, []);

  const reminderTime = data?.config.time;
  useEffect(() => {
    if (reminderTime) scheduleDailyReminder(reminderTime);
  }, [reminderTime]);

  const save = (newData: Data) => {
    setData(newData);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  if (!isLoaded) return null;
  if (!data) {
    return <Onboarding onDone={config => save({ config, startDate: toKey(addDays(new Date(), -10)), logs: {} })} />;
  }

  const { config, startDate, logs } = data;
  const today = startOfToday();
  const todayKey = toKey(today);
  const energy: Energy = logs[todayKey]?.energy ?? 1;

  const updateDay = (key: string, changes: Partial<DayEntry>) =>
    save({ ...data, logs: { ...logs, [key]: { ...logs[key], ...changes } } });

  const cycleDay = (key: string) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(logs[key]?.status) + 1) % STATUS_CYCLE.length];
    updateDay(key, { status: next });
  };

  const firstDay = addDays(today, -(CALENDAR_DAYS - 1));
  const calendarCells: (Date | null)[] = [
    ...Array<null>(firstDay.getDay()).fill(null),
    ...Array.from({ length: CALENDAR_DAYS }, (_, i) => addDays(firstDay, i)),
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{config.name}</Text>

        <View style={styles.card}>
          <Text style={styles.score}>{score(startDate, logs, addDays(today, -29))}%</Text>
          <Text style={styles.body}>Last 30 days · All-time {score(startDate, logs, fromKey(startDate))}%</Text>
        </View>

        <Text style={styles.label}>Energy today</Text>
        <View style={styles.row}>
          {ENERGY_LABELS.map((label, index) => (
            <Chip key={label} label={label} selected={energy === index} onPress={() => updateDay(todayKey, { energy: index as Energy })} />
          ))}
        </View>

        <Button label={`Full: ${config.full}`} onPress={() => updateDay(todayKey, { status: 'full', energy })} />
        <Button label={`Tiny: ${config.tiny}`} onPress={() => updateDay(todayKey, { status: 'tiny', energy })} />
        <Button label={`Micro: ${config.micro}`} onPress={() => updateDay(todayKey, { status: 'micro', energy })} />
        <Text style={styles.body}>Today: {logs[todayKey]?.status ?? 'not logged yet'}</Text>

        <View style={styles.calendar}>
          {calendarCells.map((date, index) => {
            const key = date ? toKey(date) : '';
            const isInRange = !!date && key >= startDate && date <= today;
            const status = isInRange ? logs[key]?.status : undefined;
            return (
              <Pressable
                key={index}
                disabled={!isInRange}
                onPress={() => cycleDay(key)}
                style={[styles.cell, isInRange && styles.cellOutline, { backgroundColor: status ? STATUS_COLORS[status] : 'transparent' }]}
              />
            );
          })}
        </View>
        <Text style={styles.body}>Tap a day to correct it: full, tiny, micro, missed, or blank.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6fbf6', paddingTop: Platform.OS === 'android' ? 32 : 0 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#1b5e20' },
  body: { fontSize: 15, color: '#33403a' },
  label: { fontSize: 13, color: '#5a6b60', marginTop: 4 },
  score: { fontSize: 56, fontWeight: '800', color: '#2e7d32' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#c8e6c9', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#dcedc8' },
  row: { flexDirection: 'row', gap: 8 },
  button: { backgroundColor: '#2e7d32', borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#2e7d32', backgroundColor: '#fff' },
  chipSelected: { backgroundColor: '#2e7d32' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  cell: { width: 38, height: 38, borderRadius: 8 },
  cellOutline: { borderWidth: 1, borderColor: '#c8e6c9' },
});