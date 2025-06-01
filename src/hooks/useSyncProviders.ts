import { useSyncExternalStore } from 'react';
import { store } from '@/types/store';

export const useSyncProviders = () =>
  useSyncExternalStore(store.subscribe, store.value, store.value);
