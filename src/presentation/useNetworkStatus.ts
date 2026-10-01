import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Whether the device believes it can reach the internet. `null` until the first reading, so a
 * screen does not flash an offline notice at launch. `isInternetReachable` is `null` while NetInfo
 * is still probing; that counts as online, so a banner never appears on a guess.
 */
export function useNetworkStatus(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOnline(state.isConnected !== false && state.isInternetReachable !== false);
      }),
    [],
  );
  return online;
}
