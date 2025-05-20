import { useSyncExternalStore } from 'react';
import { store } from '@/hooks/store';

export const useSyncProviders = () =>
  useSyncExternalStore(store.subscribe, store.value, store.value);
