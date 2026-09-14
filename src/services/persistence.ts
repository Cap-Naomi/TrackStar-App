import AsyncStorage from '@react-native-async-storage/async-storage';

export const trackStarStorage = AsyncStorage;

export const storageKeys = {
  profile: 'trackstar.profile.v1',
  workout: 'trackstar.workout.v1',
  runs: 'trackstar.runs.v1',
} as const;
